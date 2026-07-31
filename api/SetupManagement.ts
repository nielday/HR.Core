import express from "express";
import { loadDb, saveDb } from './localDb';
import { getDiscordClient, normalizeDiscordName } from './common';

const router = express.Router();

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
    const laSnowflake = (v: any) => typeof v === 'string' && /^\d{17,19}$/.test(v.trim());
    const TRAN_MOI_LUOT = 8;
    try {
      const canLay = groupMembers
        .filter((m) => !m.avatar && (laSnowflake(m.id) || laSnowflake(m.name)))
        .slice(0, TRAN_MOI_LUOT);

      if (canLay.length) {
        const client = await getDiscordClient(groupID);
        if (client) {
          let coDoi = false;
          for (const m of canLay) {
            const did = laSnowflake(m.id) ? m.id.trim() : m.name.trim();
            try {
              const u = await client.users.fetch(did);
              if (!u) continue;
              m.avatar = u.displayAvatarURL();
              if (laSnowflake(m.name)) m.name = normalizeDiscordName(u.globalName || u.username);
              // Ghi vào DB để lần sau không phải hỏi Discord nữa.
              if (localData.members[m.id]) {
                localData.members[m.id].avatar = m.avatar;
                if (m.name) localData.members[m.id].name = m.name;
                coDoi = true;
              }
            } catch { /* người này không tra được thì bỏ, đừng dừng cả vòng */ }
          }
          if (coDoi) saveDb(localData);
        }
      }
    } catch (e: any) {
      console.warn('[custom-members] Không làm tươi được avatar:', e?.message);
    }

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
      saveDb(localData);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom member:', error);
    res.status(500).json({ error: 'Failed to delete custom member' });
  }
});

export default router;
