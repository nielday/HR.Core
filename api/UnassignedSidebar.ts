import express from "express";
import { normalizeDiscordName, getDiscordClient, membersCache, CACHE_TTL, botConfigCache, BOT_CONFIG_CACHE_TTL, discordClients } from './common';
import { loadDb } from './localDb';

const router = express.Router();

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
    // Không truyền kênh nào thì lấy theo cấu hình đã lưu: trước hết là danh sách nguồn voice
    // đã tick, sau mới tới kênh mặc định cũ.
    const dsKenh = dsKenhVao.length
      ? dsKenhVao
      : (data.voiceNguon?.chon?.length ? data.voiceNguon.chon : (data.channelId ? [data.channelId] : []));

    if (!guildId || !dsKenh.length) {
      console.error(`[Members API] Missing config for group ${groupID}: guildId=${guildId}, so kenh=${dsKenh.length}`);
      return res.status(400).json({ error: 'Thiếu cấu hình Guild ID hoặc chưa chọn kênh voice nào.' });
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
