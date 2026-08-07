import express from "express";
import fs from 'fs';
import path from 'path';
import { loadDb, saveDb } from './localDb';
import { getDiscordClient, normalizeDiscordName } from './common';
import { batBuocQuanTri } from './auth';

const router = express.Router();

const laSnowflake = (v: any) => typeof v === 'string' && /^\d{17,19}$/.test(v.trim());

/**
 * Moi Discord ID thật của một bản ghi thành viên.
 *
 * Không dùng thẳng `id` được: người thêm tay lúc bot chưa tra ra mang khoá
 * 'custom_<thời điểm>'. Thiếu Discord ID thì bản ghi đó thành người vô danh, không mention
 * được, và nguồn voice trả về cùng người đó sẽ bị hiểu thành người thứ hai.
 *
 * Dò ba nấc: id -> name (bản ghi méo cất id vào ô TÊN) -> URL avatar Discord
 * (cdn.discordapp.com/avatars/<id>/<hash>).
 * Nấc cuối là nấc CỨU: bản vá avatar trước đây ghi tên thật đè lên ô tên, xoá mất id nằm
 * trong đó, nhưng lại lưu URL avatar có kèm id.
 * Bản ghi thêm tay bằng tên tự gõ, chưa từng khớp với Discord, thì chịu, không có gì để moi.
 */
function moiDiscordId(m: any): string {
  if (laSnowflake(m?.discordId)) return String(m.discordId).trim();
  const tuAvatar = typeof m?.avatar === 'string'
    ? (m.avatar.match(/cdn\.discordapp\.com\/avatars\/(\d+)\//)?.[1] || '')
    : '';
  const tim = [m?.id, m?.name, tuAvatar].find((v) => laSnowflake(v));
  return tim ? String(tim).trim() : '';
}

router.get("/setups/:groupID", async (req, res) => {
  try {
    const { groupID } = req.params;
    const localData = loadDb();
    const groupObj = localData.groups[groupID];
    const setups = (groupObj && groupObj.setups) ? Object.values(groupObj.setups) : [];
    
    const index = setups.map(setup => ({
      id: setup.id,
      name: setup.name,
      timestamp: setup.timestamp,
      creator: setup.creator || 'Unknown'
    }));
    
    res.json(index);
  } catch (error) {
    console.error("Error loading setups index:", error);
    res.status(500).json({ error: "Failed to load setups index" });
  }
});

router.get("/setups/:groupID/:id", async (req, res) => {
  try {
    const { groupID, id } = req.params;
    const localData = loadDb();
    const setup = localData.groups[groupID]?.setups?.[id];
    
    if (!setup) return res.status(404).json({ error: "Setup not found" });
    res.json(setup);
  } catch (error) {
    console.error("Error loading setup:", error);
    res.status(500).json({ error: "Failed to load setup" });
  }
});

router.post("/setups/:groupID", async (req, res) => {
  try {
    const { groupID } = req.params;
    const setup = req.body;
    if (!setup.id) {
      return res.status(400).json({ error: "Setup ID is required" });
    }
    
    const localData = loadDb();
    if (!localData.groups[groupID]) {
      localData.groups[groupID] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {} };
    }
    if (!localData.groups[groupID].setups) {
      localData.groups[groupID].setups = {};
    }
    
    localData.groups[groupID].setups![setup.id] = setup;
    saveDb(localData);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving setup:", error);
    res.status(500).json({ error: "Failed to save setup" });
  }
});

router.delete("/setups/:groupID/:id", async (req, res) => {
  try {
    const { groupID, id } = req.params;
    const localData = loadDb();
    if (localData.groups[groupID]?.setups?.[id]) {
      delete localData.groups[groupID].setups![id];
      saveDb(localData);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting setup:", error);
    res.status(500).json({ error: "Failed to delete setup" });
  }
});

router.get('/members-config/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const localData = loadDb();

    // Vá discordId cho MỌI bản ghi, không chỉ người thuộc nhóm đang mở.
    // Đây là bảng frontend dùng để nhận ra "người vừa lấy từ voice chính là người đã lưu".
    // Bản ghi thiếu discordId là không khớp được, thành ra cùng một người mà hiện thành hai,
    // người "mới" thì trống trơn không vai trò không vũ khí.
    // Chỗ vá kia nằm trong custom-members nên chỉ chạm tới người thuộc nhóm; đo thật trên
    // máy chủ thấy 3 trong 4 bản ghi nằm ngoài nhóm nên chưa bao giờ được vá.
    // Chỉ đọc mấy trường sẵn có, không gọi Discord, nên không tốn gì.
    let coDoi = false;
    for (const [rid, m] of Object.entries<any>(localData.members || {})) {
      if (laSnowflake(m?.discordId)) continue;
      const did = moiDiscordId({ ...m, id: rid });
      if (!did) continue;
      localData.members[rid].discordId = did;
      coDoi = true;
    }
    if (coDoi) saveDb(localData);

    res.json(localData.members || {});
  } catch (error) {
    res.json({});
  }
});

router.post('/members-config/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const configs = req.body;
    
    const localData = loadDb();
    for (const [id, config] of Object.entries(configs)) {
      if (!localData.members[id]) {
        localData.members[id] = { id, name: '' };
      }
      localData.members[id] = {
        ...localData.members[id],
        ...(config as any)
      };
    }
    saveDb(localData);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save members config' });
  }
});

router.get('/custom-members/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const localData = loadDb();
    const groupObj = localData.groups[groupID];
    const memberIds = groupObj?.members || [];
    
    if (memberIds.length === 0) return res.json([]);

    // Trả BẢN SAO: mấy object này lấy thẳng từ cache của loadDb, sửa vào là sửa luôn dữ
    // liệu trong bộ nhớ mà không qua saveDb.
    const groupMembers = Object.values(localData.members)
      .filter((m) => memberIds.includes(m.id))
      .map((m) => ({ ...m })) as any[];

    // Làm tươi avatar từ Discord ngay lúc đọc.
    // Ba lý do:
    //   1. Bản ghi cũ của thành viên thêm tay có avatar rỗng, không tự có ảnh bao giờ.
    //   2. URL avatar Discord CHẾT khi người ta đổi ảnh (đổi ảnh là đổi hash trong URL).
    //   3. Bản ghi MÉO: thêm người lúc bot chưa kết nối thì tra Discord hỏng, tool sinh
    //      khoá 'custom_<thời điểm>' và cất nguyên chuỗi vừa gõ vào ô TÊN. Nếu chuỗi đó
    //      chính là Discord ID thì vẫn cứu được — dò cả `id` lẫn `name`.
    // Dùng cache của discord.js nên không tốn request mỗi lần gọi. Hỏng thì trả nguyên
    // danh sách — thiếu ảnh còn hơn mất cả danh sách.
    // ⚠️ ĐỪNG DÙNG guild.members.fetch() Ở ĐÂY.
    // Bản đầu tôi gọi nó để nạp cache, nhưng đó là opcode 8 (REQUEST_GUILD_MEMBERS) tải
    // TOÀN BỘ thành viên server qua gateway, và endpoint này chạy mỗi lần mở trang / bấm
    // refresh. Log thật: "Request with opcode 8 was rate limited. Retry after 26.44s".
    // Bị chặn là hàm ném lỗi -> không làm tươi -> rơi về avatar rỗng trong DB -> bấm
    // refresh xong AVATAR BIẾN MẤT. Vá một lỗi, đẻ ra lỗi nặng hơn.
    //
    // Cách đúng, ba tầng:
    //   1. Chỉ đụng Discord với người CHƯA CÓ avatar. Có rồi thì thôi.
    //   2. Dùng client.users.fetch(id) — REST cho từng người, rẻ hơn hẳn op 8.
    //   3. LƯU LẠI vào DB. Lần sau khỏi hỏi Discord nữa. Đây là chỗ bản cũ thiếu: nó chỉ
    //      đọc, nên hễ Discord trục trặc là mất ảnh.
    // Kèm trần 8 người mỗi lượt để không bao giờ dội thành cụm lớn.
    const TRAN_MOI_LUOT = 8;
    let coDoi = false;

    for (const m of groupMembers) {
      if (laSnowflake(m.discordId)) continue;
      const did = moiDiscordId(m);
      if (!did) continue;
      m.discordId = did;
      if (localData.members[m.id]) {
        localData.members[m.id].discordId = did;   // vá một lần, lần sau khỏi dò lại
        coDoi = true;
      }
    }

    try {
      // ⚠️ ĐIỀU KIỆN PHẢI LÀ "CHƯA CÓ ẢNH THẬT", KHÔNG PHẢI "AVATAR RỖNG".
      // Bản trước tôi lọc `!m.avatar` nên không bao giờ chạy: AddMemberModal.tsx:177 đã
      // nhét sẵn ảnh GIẢ tự sinh `https://ui-avatars.com/api/?name=...` cho mọi người thêm
      // tay. Trường avatar có giá trị, chỉ là giá trị vô dụng — chữ cái trên nền màu ngẫu
      // nhiên, mà `name` lúc đó lại đang là dãy số Discord ID nên nhìn càng vô nghĩa.
      // Ảnh Discord luôn ở cdn.discordapp.com; thứ gì khác coi như chưa có ảnh thật.
      const laAnhThat = (v: any) => typeof v === 'string' && /(^|\/\/)cdn\.discordapp\.com\//.test(v);
      const client = await getDiscordClient(groupID);

      const ghiLai = (m: any, anh: string, ten?: string) => {
        if (!anh || anh === m.avatar) return;
        m.avatar = anh;
        if (ten) m.name = ten;
        if (localData.members[m.id]) {
          localData.members[m.id].avatar = anh;
          if (ten) localData.members[m.id].name = ten;
          localData.members[m.id].avatarLuc = Date.now();
          coDoi = true;
        }
      };

      // TẦNG 1: lấy từ bộ nhớ bot. Không tốn request nào.
      // discord.js tự cập nhật bộ nhớ này khi Discord báo có người đổi ảnh hay đổi tên, nên
      // phần lớn trường hợp chỉ cần đọc ra là đã tươi.
      if (client) {
        for (const m of groupMembers) {
          if (!laSnowflake(m.discordId)) continue;
          const u = client.users.cache.get(m.discordId);
          if (!u) continue;
          ghiLai(m, u.displayAvatarURL(), laSnowflake(m.name) ? normalizeDiscordName(u.globalName || u.username) : undefined);
        }
      }

      // TẦNG 2: hỏi Discord cho những người bộ nhớ không có, hoặc ảnh đã quá cũ.
      //
      // ⚠️ ĐÂY LÀ CHỖ BẢN TRƯỚC SAI. Nó chỉ lấy avatar cho người CHƯA CÓ ảnh, có rồi thì
      // không bao giờ đụng lại. Mà URL avatar Discord chứa MÃ BĂM CỦA CHÍNH TẤM ẢNH
      // (cdn.discordapp.com/avatars/<id>/<hash>), nên người ta đổi ảnh là URL cũ chết 404
      // và thẻ hiện ra ô đen. Ảnh "đã có" không đồng nghĩa với ảnh "còn đúng".
      //
      // Nên thêm mốc thời gian: quá 6 giờ thì hỏi lại. Vẫn giữ trần 8 người mỗi lượt để
      // không bao giờ dội thành cụm lớn, ai chưa tới lượt thì lượt sau.
      const HAN_LAM_TUOI = 6 * 60 * 60 * 1000;
      const canLay = groupMembers
        .filter((m) => laSnowflake(m.discordId)
          && (!laAnhThat(m.avatar) || Date.now() - (localData.members[m.id]?.avatarLuc || 0) > HAN_LAM_TUOI))
        .slice(0, TRAN_MOI_LUOT);

      if (canLay.length && client) {
        for (const m of canLay) {
          try {
            const u = await client.users.fetch(m.discordId, { force: true });
            if (!u) continue;
            ghiLai(m, u.displayAvatarURL(), laSnowflake(m.name) ? normalizeDiscordName(u.globalName || u.username) : undefined);
            // Đóng dấu thời gian kể cả khi ảnh không đổi, không thì lượt sau lại hỏi đúng
            // người này và mấy người xếp sau không bao giờ tới lượt.
            if (localData.members[m.id]) {
              localData.members[m.id].avatarLuc = Date.now();
              coDoi = true;
            }
          } catch { /* người này không tra được thì bỏ, đừng dừng cả vòng */ }
        }
      }
    } catch (e: any) {
      console.warn('[custom-members] Không làm tươi được avatar:', e?.message);
    }

    // Ghi MỘT lần cho cả vá discordId lẫn làm tươi avatar. Trước đây lệnh ghi nằm lọt trong
    // nhánh lấy avatar, nên lần vá chỉ có discordId mà không ai cần avatar là mất trắng.
    if (coDoi) saveDb(localData);

    res.json(groupMembers);
  } catch (error) {
    console.error('Error fetching custom members:', error);
    res.json([]);
  }
});

router.delete('/custom-members/:groupID/:memberId', async (req, res) => {
  try {
    const { groupID, memberId } = req.params;
    const localData = loadDb();
    if (localData.groups[groupID]?.members) {
      localData.groups[groupID].members = localData.groups[groupID].members.filter(id => id !== memberId);
    }

    // XOÁ HẲN bản ghi gốc, không chỉ gỡ khỏi danh sách nhóm.
    // Bản cũ chỉ gỡ khỏi nhóm nên bản ghi nằm lại trong DB mãi mãi: người dùng bấm xoá,
    // thấy thẻ biến mất, tưởng xong, nhưng dữ liệu vẫn còn và vẫn chui ra ở chỗ khác.
    // Vẫn giữ nếu NHÓM KHÁC còn dùng, vì bảng members dùng chung giữa các nhóm, xoá bừa là
    // đục thủng đội hình của nhóm không liên quan.
    const nhomKhacConDung = Object.entries(localData.groups)
      .some(([gid, g]) => gid !== groupID && (g.members || []).includes(memberId));
    if (!nhomKhacConDung && localData.members[memberId]) {
      delete localData.members[memberId];
    }

    saveDb(localData);
    res.json({ success: true, xoaHan: !nhomKhacConDung });
  } catch (error) {
    console.error('Error deleting custom member:', error);
    res.status(500).json({ error: 'Failed to delete custom member' });
  }
});

// =====================================================================
// DỌN BẢN GHI TRÙNG NGƯỜI.
//
// Hai lần thêm tay cùng một người là hai khoá 'custom_<thời điểm>' khác nhau, vì lúc tra
// Discord hụt thì frontend lấy mốc thời gian làm id. Mốc thời gian thì không bao giờ trùng,
// nên hệ thống không có cách nào biết hai bản ghi là một người.
//
// GỘP chứ không xoá thẳng: lấy một bản làm gốc rồi điền vào những ô đang trống bằng dữ liệu
// của mấy bản kia. Không bản nào mất thông tin, chỉ mất cái vỏ rỗng.
// =====================================================================
router.post('/custom-members/:groupID/don-trung', async (req, res) => {
  try {
    const { groupID } = req.params;
    const localData = loadDb();
    const tatCa = Object.entries<any>(localData.members || {});

    const theoNguoi = new Map<string, string[]>();
    for (const [rid, m] of tatCa) {
      const did = moiDiscordId({ ...m, id: rid });
      if (!did) continue;   // không moi ra Discord ID thì không dám nói hai bản là một người
      if (!theoNguoi.has(did)) theoNguoi.set(did, []);
      theoNguoi.get(did)!.push(rid);
    }

    const dayDu = (m: any) =>
      ['ingameName', 'ingameId', 'role', 'position', 'note', 'avatar', 'rankId', 'primaryWeapon1Id']
        .filter((k) => m?.[k]).length;

    const bienBan: { giu: string; xoa: string[] }[] = [];
    for (const [, ids] of theoNguoi) {
      if (ids.length < 2) continue;

      // Ưu tiên bản ĐANG NẰM TRONG nhóm này, rồi mới tới bản nhiều dữ liệu nhất. Giữ đúng
      // bản đang được dùng thì đội hình đã xếp không phải sửa gì.
      const trongNhom = new Set(localData.groups[groupID]?.members || []);
      const giu = [...ids].sort((a, b) => {
        const ta = trongNhom.has(a) ? 1 : 0;
        const tb = trongNhom.has(b) ? 1 : 0;
        if (ta !== tb) return tb - ta;
        return dayDu(localData.members[b]) - dayDu(localData.members[a]);
      })[0];
      const xoa = ids.filter((id) => id !== giu);

      for (const id of xoa) {
        const nguon = localData.members[id] || {};
        for (const [k, v] of Object.entries(nguon)) {
          if (k === 'id') continue;
          const dangCo = (localData.members[giu] as any)[k];
          const rong = dangCo === undefined || dangCo === null || dangCo === ''
            || (Array.isArray(dangCo) && !dangCo.length);
          if (rong && v !== undefined && v !== null && v !== '') (localData.members[giu] as any)[k] = v;
        }
        delete localData.members[id];
      }

      // Trỏ lại mọi chỗ đang nhắc tới id vừa xoá: danh sách nhóm và các bài xếp đã lưu.
      // Bỏ bước này là bài xếp cũ trỏ vào bản ghi không còn tồn tại.
      for (const g of Object.values(localData.groups)) {
        if (g.members) g.members = Array.from(new Set(g.members.map((id) => (xoa.includes(id) ? giu : id))));
        for (const st of Object.values<any>(g.setups || {})) {
          for (const area of st.areas || []) {
            for (const team of area.teams || []) {
              team.members = (team.members || []).map((m: any) => (xoa.includes(m.id) ? { ...m, id: giu } : m));
            }
          }
        }
      }

      bienBan.push({ giu, xoa });
    }

    if (bienBan.length) saveDb(localData);
    res.json({ success: true, soNguoi: bienBan.length, soBanXoa: bienBan.reduce((n, b) => n + b.xoa.length, 0) });
  } catch (error: any) {
    console.error('Error deduping members:', error);
    res.status(500).json({ error: error.message || 'Không dọn được bản ghi trùng' });
  }
});

// =====================================================================
// ĐỔI KHOÁ BẢN GHI SANG DISCORD ID.
//
// Khoá hiện tại của người thêm tay là 'custom_<mốc thời gian>', tức đồng hồ máy lúc bấm nút.
// Nó duy nhất theo THỜI ĐIỂM BẤM, không duy nhất theo NGƯỜI: thêm cùng một người hai lần là
// ra hai bản ghi. Và Discord không biết dãy số đó là gì, nên mọi việc cần nói chuyện với
// Discord đều trượt.
// Đây là gốc của: avatar không lên, mention không gắn được, vũ khí trống, người nhân đôi,
// nguồn bình chọn lọc mất người nhà. Năm triệu chứng, một bệnh.
//
// AN TOÀN:
//   - Có chế độ XEM TRƯỚC (?thu=1): tính toán và báo cáo, không đụng vào dữ liệu.
//   - Chạy thật thì SAO LƯU nguyên trạng vào db/sao-luu/ trước khi ghi. Thư mục đó nằm
//     ngoài mấy thư mục loadDb đọc nên không ảnh hưởng gì.
//   - Sửa luôn mọi chỗ đang trỏ tới khoá cũ: danh sách nhóm và các bài xếp đã lưu. Bỏ bước
//     này là đội hình đã xếp trỏ vào bản ghi không còn tồn tại.
//   - Bản ghi không moi ra được Discord ID thì ĐỂ NGUYÊN, không đụng, không xoá.
//
// KHÔNG chạm vào poll: bảng bình chọn định danh người bằng Discord ID của chính Discord,
// không liên quan gì tới khoá bản ghi. Đăng ký đang mở vẫn chạy bình thường.
// =====================================================================
router.post('/custom-members/:groupID/doi-khoa', batBuocQuanTri, async (req, res) => {
  try {
    const xemTruoc = req.query.thu === '1';
    const localData = loadDb();

    type Viec = { tu: string; den: string; gop: boolean };
    const viec: Viec[] = [];
    const khongMoiDuoc: string[] = [];

    for (const [rid, m] of Object.entries<any>(localData.members || {})) {
      if (laSnowflake(rid)) continue;                 // đã đúng khoá rồi
      const did = moiDiscordId({ ...m, id: rid });
      if (!did) { khongMoiDuoc.push(rid); continue; } // không có gì để moi, để nguyên
      viec.push({ tu: rid, den: did, gop: !!localData.members[did] });
    }

    // Đếm trước xem sẽ phải sửa bao nhiêu chỗ đang trỏ tới khoá cũ.
    const doi = new Map(viec.map((v) => [v.tu, v.den]));
    let thamChieuNhom = 0;
    let thamChieuBaiXep = 0;
    for (const g of Object.values(localData.groups)) {
      for (const id of g.members || []) if (doi.has(id)) thamChieuNhom++;
      for (const st of Object.values<any>(g.setups || {})) {
        for (const area of st.areas || []) {
          for (const team of area.teams || []) {
            for (const mem of team.members || []) if (doi.has(mem.id)) thamChieuBaiXep++;
          }
        }
      }
    }

    const bao = {
      xemTruoc,
      soDoiKhoa: viec.length,
      soGopVaoBanDaCo: viec.filter((v) => v.gop).length,
      soDeNguyen: khongMoiDuoc.length,
      thamChieuNhom,
      thamChieuBaiXep,
      // Che bớt id trong phản hồi, bản đầy đủ chỉ ghi vào log máy chủ.
      chiTiet: viec.map((v) => ({ tu: v.tu, den: `...${v.den.slice(-4)}`, gop: v.gop })),
    };

    if (xemTruoc || !viec.length) return res.json({ success: true, ...bao });

    // SAO LƯU trước khi đụng vào bất cứ thứ gì.
    const thuMuc = path.join(process.cwd(), 'db', 'sao-luu');
    if (!fs.existsSync(thuMuc)) fs.mkdirSync(thuMuc, { recursive: true });
    const fileSaoLuu = path.join(thuMuc, `db-${Date.now()}.json`);
    fs.writeFileSync(fileSaoLuu, JSON.stringify(localData, null, 2), 'utf8');
    console.log(`[doi-khoa] Đã sao lưu vào ${fileSaoLuu}`);

    for (const v of viec) {
      const nguon = localData.members[v.tu];
      if (!nguon) continue;

      if (v.gop) {
        // Đích đã tồn tại: điền vào những ô ĐANG TRỐNG của đích, không ghi đè thứ đã có.
        const dich = localData.members[v.den] as any;
        for (const [k, gt] of Object.entries(nguon)) {
          if (k === 'id') continue;
          const dangCo = dich[k];
          const rong = dangCo === undefined || dangCo === null || dangCo === ''
            || (Array.isArray(dangCo) && !dangCo.length);
          if (rong && gt !== undefined && gt !== null && gt !== '') dich[k] = gt;
        }
      } else {
        localData.members[v.den] = { ...nguon, id: v.den, discordId: v.den };
      }
      delete localData.members[v.tu];
    }

    // Trỏ lại mọi chỗ đang nhắc tới khoá cũ.
    for (const g of Object.values(localData.groups)) {
      if (g.members) g.members = Array.from(new Set(g.members.map((id) => doi.get(id) || id)));
      for (const st of Object.values<any>(g.setups || {})) {
        for (const area of st.areas || []) {
          for (const team of area.teams || []) {
            team.members = (team.members || []).map((mem: any) => {
              const den = doi.get(mem.id);
              return den ? { ...mem, id: den, discordId: den } : mem;
            });
          }
        }
      }
    }

    saveDb(localData);
    console.log(`[doi-khoa] Xong: đổi ${viec.length} khoá, để nguyên ${khongMoiDuoc.length}.`);
    res.json({ success: true, ...bao, daSaoLuu: path.basename(fileSaoLuu) });
  } catch (error: any) {
    console.error('Error re-keying members:', error);
    res.status(500).json({ error: error.message || 'Không đổi khoá được' });
  }
});

export default router;
