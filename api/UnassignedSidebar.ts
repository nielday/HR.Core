import express from "express";
// Nạp ở đầu file, KHÔNG dùng require() trong thân hàm: file này là ESM, require không tồn
// tại ở đó và sẽ nổ đúng lúc gọi endpoint chứ không phải lúc biên dịch.
import v8 from 'v8';
import fs from 'fs';
import { normalizeDiscordName, getDiscordClient, membersCache, CACHE_TTL, botConfigCache, BOT_CONFIG_CACHE_TTL, discordClients } from './common';
import { loadDb } from './localDb';

const router = express.Router();

// =====================================================================
// SỐ LIỆU BỘ NHỚ THẬT.
//
// Đặt trần heap mà không biết heap đang dùng bao nhiêu là đoán mò: đặt cao thì vô dụng, đặt
// thấp thì container chết vì hết bộ nhớ. Biểu đồ của Railway chỉ cho RSS, tức tổng cả phần
// native lẫn mã máy, không tách được phần JS.
// Đường này trả về đúng mấy con số cần để chọn trần, và số lượng từng kho cache của
// discord.js để biết chỗ nào đang phình.
// =====================================================================
/**
 * Số liệu bộ nhớ của CẢ CONTAINER, đọc từ cgroup của Linux.
 *
 * `process.memoryUsage()` chỉ thấy chính tiến trình Node. Railway tính tiền theo container,
 * trong đó còn có tiến trình `npm` và `sh` bọc ngoài, và PAGE CACHE của file.
 * Đo thật thấy chênh 125 MB giữa hai con số (Railway 255, Node 130) mà không giải thích
 * được từ bên trong, nên phải đọc thẳng chỗ Railway đọc.
 *
 * `anon` là bộ nhớ thật của các tiến trình, `file` là page cache — thứ hệ điều hành THU HỒI
 * ĐƯỢC khi cần, nên nếu phần chênh nằm ở đây thì không phải rò và cũng không đáng lo.
 */
function docCgroup() {
  const doc = (p: string) => fs.readFileSync(p, 'utf8');
  const mb = (n: number) => Math.round(n / 1024 / 1024);
  try {
    // cgroup v2 trước, v1 để dự phòng.
    let tong = 0;
    let stat = '';
    try {
      tong = Number(doc('/sys/fs/cgroup/memory.current').trim());
      stat = doc('/sys/fs/cgroup/memory.stat');
    } catch {
      tong = Number(doc('/sys/fs/cgroup/memory/memory.usage_in_bytes').trim());
      stat = doc('/sys/fs/cgroup/memory/memory.stat');
    }
    const lay = (k: string) => {
      const m = stat.match(new RegExp(`^(?:total_)?${k} (\\d+)`, 'm'));
      return m ? Number(m[1]) : 0;
    };
    const file = lay('file') || lay('cache');
    return {
      tongMB: mb(tong),
      anonMB: mb(lay('anon') || lay('rss')),
      pageCacheMB: mb(file),
      fileHoatDongMB: mb(lay('active_file')),
      fileNgheMB: mb(lay('inactive_file')),
    };
  } catch (e: any) {
    return { loi: e?.message || 'không đọc được cgroup' };
  }
}

/**
 * Dung lượng từng thư mục trong ổ đĩa, và mấy file to nhất.
 *
 * Page cache đo được 102 MB trong khi ổ đĩa 94 MB, tức gần như cả ổ đĩa đang nằm trong RAM
 * và tính vào hoá đơn. 48 thành viên không thể chiếm ngần ấy, nên phải tìm xem cái gì to.
 * Nghi bảng chiến thuật vì nó lưu nguyên hình vẽ dạng chuỗi, có thể nhúng ảnh.
 *
 * Chỉ đọc kích thước, KHÔNG đọc nội dung: vừa nhanh, vừa không kéo thêm file vào page cache
 * (đọc nội dung để đo thì chính việc đo lại làm phình cái đang muốn đo).
 */
function doDia(goc: string, sau = 0): any {
  try {
    const ds = fs.readdirSync(goc, { withFileTypes: true });
    let tong = 0;
    let soFile = 0;
    const con: any[] = [];
    const to: { ten: string; kb: number }[] = [];

    for (const e of ds) {
      const p = `${goc}/${e.name}`;
      if (e.isDirectory()) {
        const c = doDia(p, sau + 1);
        tong += c.byte;
        soFile += c.soFile;
        if (sau < 1) con.push({ ten: e.name, MB: Math.round(c.byte / 1024 / 1024 * 10) / 10, soFile: c.soFile });
      } else {
        const st = fs.statSync(p);
        tong += st.size;
        soFile++;
        if (st.size > 512 * 1024) to.push({ ten: p.replace(goc, ''), kb: Math.round(st.size / 1024) });
      }
    }
    if (sau > 0) return { byte: tong, soFile };
    return {
      byte: tong,
      soFile,
      tongMB: Math.round(tong / 1024 / 1024 * 10) / 10,
      thuMuc: con.sort((a, b) => b.MB - a.MB),
      fileTo: to.sort((a, b) => b.kb - a.kb).slice(0, 10),
    };
  } catch (e: any) {
    return { loi: e?.message, byte: 0, soFile: 0 };
  }
}

router.get('/dung-luong/:groupID', async (req, res) => {
  res.json(doDia(`${process.cwd()}/db`));
});

router.get('/suc-khoe/:groupID', async (req, res) => {
  const m = process.memoryUsage();
  const mb = (n: number) => Math.round(n / 1024 / 1024);

  const kho: any[] = [];
  for (const [gid, c] of discordClients.entries()) {
    if (!c) continue;
    kho.push({
      nhom: gid,
      users: c.users?.cache?.size ?? 0,
      guilds: c.guilds?.cache?.size ?? 0,
      members: [...(c.guilds?.cache?.values() || [])].reduce((n: number, g: any) => n + (g.members?.cache?.size || 0), 0),
      channels: c.channels?.cache?.size ?? 0,
    });
  }

  res.json({
    rssMB: mb(m.rss),
    heapDungMB: mb(m.heapUsed),
    heapCapPhatMB: mb(m.heapTotal),
    ngoaiHeapMB: mb(m.external),
    tranHeapMB: Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024),
    chayDuocGiay: Math.round(process.uptime()),
    container: docCgroup(),
    khoDiscord: kho,
  });
});

// =====================================================================
// LIỆT KÊ KÊNH VOICE CỦA SERVER.
//
// Trước đây muốn thêm kênh phải vào Cấu hình Discord GÕ TAY id kênh rồi tự đặt tên. Bot
// đang online thì hỏi Discord một câu là ra hết, kèm tên thật và số người đang ngồi trong
// đó. Không ai phải đi copy id nữa, và tên hiện ra luôn đúng với tên kênh thật.
//
// Trả lỗi trong THÂN phản hồi chứ không dùng mã lỗi HTTP: ô chọn kênh cần hiện được lý do
// trống ("bot chưa kết nối") thay vì im lặng, mà đây cũng không phải hỏng hóc gì.
// =====================================================================
router.get('/voice-channels/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const client = await getDiscordClient(groupID);
    if (!client || !client.isReady()) {
      return res.json({ channels: [], error: 'Bot chưa kết nối. Bấm Kết nối ở thanh trên rồi thử lại.' });
    }

    const guildId = loadDb().groups[groupID]?.configs?.discord?.guildId;
    if (!guildId) return res.json({ channels: [], error: 'Chưa có Guild ID trong cấu hình Discord.' });

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return res.json({ channels: [], error: `Bot không có trong server (Guild ID: ${guildId}).` });

    // Không có id thì channels.fetch() trả về COLLECTION mọi kênh, đúng ý ở đây.
    const tatCa = await guild.channels.fetch().catch(() => null);
    if (!tatCa) return res.json({ channels: [], error: 'Không đọc được danh sách kênh. Kiểm tra quyền Xem kênh của bot.' });

    const channels = [...tatCa.values()]
      .filter((c: any) => c && typeof c.isVoiceBased === 'function' && c.isVoiceBased())
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        thuMuc: c.parent?.name || '',
        // Đếm người thật, bỏ bot. Cần intent GuildVoiceStates, bot đã bật sẵn.
        soNguoi: c.members ? c.members.filter((m: any) => m?.user && !m.user.bot).size : 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    res.json({ channels });
  } catch (error: any) {
    console.error('[voice-channels] Lỗi:', error);
    res.json({ channels: [], error: error.message });
  }
});

// =====================================================================
// AI ĐANG Ở KÊNH VOICE NÀO, CHO CẢ SERVER.
//
// Dùng để ĐIỂM DANH: đội hình đã xếp sẵn 15 công 15 thủ, đến giờ đánh nhìn phát biết ai đã
// vào đúng kênh, ai lạc sang kênh khác, ai chưa vào.
//
// Đọc thẳng guild.voiceStates.cache, KHÔNG gọi API Discord lần nào. Discord đẩy sẵn trạng
// thái voice vào bộ nhớ bot qua intent GuildVoiceStates và cập nhật theo sự kiện, nên gọi
// mấy giây một lần cũng không tốn gì. Đây là lý do không đụng tới guild.members.fetch(),
// thứ từng làm rate limit opcode 8 và thổi bay avatar cả danh sách.
// =====================================================================
router.get('/voice-state/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const client = await getDiscordClient(groupID);
    if (!client || !client.isReady()) return res.json({ states: {}, error: 'Bot chưa kết nối' });

    const guildId = loadDb().groups[groupID]?.configs?.discord?.guildId;
    if (!guildId) return res.json({ states: {}, error: 'Chưa có Guild ID' });

    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return res.json({ states: {}, error: 'Bot không có trong server' });

    const states: Record<string, { id: string; name: string }> = {};
    for (const vs of guild.voiceStates.cache.values()) {
      if (!vs.channelId || !vs.id) continue;
      const ch: any = guild.channels.cache.get(vs.channelId);
      if (ch?.members && ch.members.get(vs.id)?.user?.bot) continue;
      states[vs.id] = { id: vs.channelId, name: ch?.name || '' };
    }

    res.json({ states });
  } catch (error: any) {
    console.error('[voice-state] Lỗi:', error);
    res.json({ states: {}, error: error.message });
  }
});

router.get('/members/:groupID', async (req, res) => {
  const { groupID } = req.params;
  
  if (!groupID || groupID === 'undefined' || groupID === 'null') {
    return res.status(400).json({ error: 'Invalid groupID' });
  }

  const client = await getDiscordClient(groupID);
  if (!client || !client.isReady()) {
    return res.status(400).json({ error: 'Bot is not connected' });
  }

  // NHẬN NHIỀU KÊNH. Bang chiến chia sẵn voice công và voice thủ, đọc đúng một kênh thì
  // nguồn này vô dụng với họ. Vẫn nhận channelID cũ để không gãy chỗ nào đang gọi.
  const dsKenhVao = String((req.query.channelIDs ?? req.query.channelID ?? '') as string)
    .split(',').map((s) => s.trim()).filter(Boolean);
  const cacheKey = `${groupID}:${[...dsKenhVao].sort().join('|') || 'default'}`;

  if (membersCache[cacheKey] && Date.now() - membersCache[cacheKey].timestamp < CACHE_TTL) {
    return res.json(membersCache[cacheKey].data);
  }

  try {
    let guildId;

    let botConfig = botConfigCache.get(groupID);
    if (!botConfig || Date.now() - botConfig.timestamp > BOT_CONFIG_CACHE_TTL) {
      const localData = loadDb();
      const data = localData.groups[groupID]?.configs?.discord || {};
      botConfig = { data, timestamp: Date.now() };
      botConfigCache.set(groupID, botConfig);
    }

    const data = botConfig.data;
    guildId = data.guildId;
    // Không truyền kênh nào thì lấy danh sách kênh voice ĐÃ TICK trong cấu hình.
    // KHÔNG rơi về data.channelId nữa: ô đó nay là kênh ĐĂNG ĐỘI HÌNH, gần như luôn là kênh
    // chữ. Rơi về nó là chắc chắn ra lỗi "kênh chữ, không phải kênh voice" trong khi người
    // dùng chẳng làm gì sai, mà lỗi lại chỉ vào một ô chẳng liên quan.
    const dsKenh = dsKenhVao.length ? dsKenhVao : (data.voiceNguon?.chon || []);

    if (!guildId) {
      console.error(`[Members API] Missing guildId for group ${groupID}`);
      return res.status(400).json({ error: 'Thiếu Guild ID trong cấu hình Discord.' });
    }
    if (!dsKenh.length) {
      return res.status(400).json({
        error: 'Chưa chọn kênh voice nào. Mở khung "Kênh voice lấy người" ở cột trái rồi tick kênh cần lấy người.',
      });
    }

    const guild = await client.guilds.fetch(guildId).catch(err => {
      console.error(`[Members API] Failed to fetch guild ${guildId}:`, err);
      return null;
    });
    
    if (!guild) {
      console.error(`[Members API] Guild not found or bot not in guild: ${guildId}`);
      return res.status(404).json({ error: `Không tìm thấy Server Discord (ID: ${guildId}). Hãy đảm bảo Bot đã tham gia Server.` });
    }

    // Gộp người từ NHIỀU kênh. Một kênh hỏng không được làm sập cả lượt: kênh chữ, kênh đã
    // xoá, kênh bot không thấy đều chỉ ghi vào cảnh báo rồi đi tiếp. Trước đây đọc một kênh
    // nên hỏng là hỏng hết, mà thông báo lại chỉ nói được một nguyên nhân.
    const members: any[] = [];
    const daCo = new Set<string>();
    const canhBao: string[] = [];

    for (const id of dsKenh) {
      const channel: any = await guild.channels.fetch(id).catch(() => null);
      if (!channel) {
        canhBao.push(`Không mở được kênh ID ${id} (đã xoá, hoặc bot không có quyền xem).`);
        continue;
      }
      const ten = channel.name ? `#${channel.name}` : `ID ${id}`;
      if (typeof channel.isVoiceBased !== 'function' || !channel.isVoiceBased()) {
        canhBao.push(`${ten} là kênh chữ, không phải kênh voice, nên bỏ qua.`);
        continue;
      }
      if (!channel.members) {
        canhBao.push(`${ten} không đọc được danh sách người trong kênh.`);
        continue;
      }
      for (const m of channel.members.values()) {
        // Một người chỉ ngồi được một kênh, nhưng vẫn chặn trùng cho chắc.
        if (!m?.user || m.user.bot || daCo.has(m.id)) continue;
        daCo.add(m.id);
        members.push({
          id: m.id,
          discordId: m.id,
          name: normalizeDiscordName(m.displayName || m.user.username),
          avatar: m.user.displayAvatarURL(),
          voiceChannelId: channel.id,
          voiceChannelName: channel.name,
        });
      }
    }

    // Tất cả kênh đều hỏng thì mới coi là lỗi thật, và nói rõ từng kênh hỏng vì sao.
    if (!members.length && canhBao.length === dsKenh.length) {
      return res.status(400).json({ error: canhBao.join(' ') });
    }

    const result = { members, canhBao: canhBao.length ? canhBao.join(' ') : undefined };
    membersCache[cacheKey] = { data: result, timestamp: Date.now() };
    res.json(result);
  } catch (error: any) {
    console.error(`[Members API] Error fetching members for group ${groupID}:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/discord-profile/:discordId', async (req, res) => {
  try {
    const { discordId } = req.params;
    
    let clientToUse = null;
    for (const client of discordClients.values()) {
      if (client && client.isReady()) {
        clientToUse = client;
        break;
      }
    }
    
    if (!clientToUse) {
      return res.status(500).json({ error: 'No Discord bot connected' });
    }
    
    let member = null;
    for (const guild of clientToUse.guilds.cache.values()) {
      try {
        member = await guild.members.fetch(discordId);
        if (member) break;
      } catch (e) {}
    }

    if (!member) {
      const user = await clientToUse.users.fetch(discordId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({
        id: user.id,
        nickname: normalizeDiscordName(user.username),
        avatar: user.displayAvatarURL()
      });
    }
    
    res.json({
      id: member.id,
      nickname: normalizeDiscordName(member.displayName),
      avatar: member.user.displayAvatarURL()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
