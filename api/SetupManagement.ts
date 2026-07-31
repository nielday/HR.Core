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
    const laSnowflake = (v: any) => typeof v === 'string' && /^\d{17,19}$/.test(v.trim());
    try {
      const client = await getDiscordClient(groupID);
      const guildId = localData.groups[groupID]?.configs?.discord?.guildId;
      if (client && guildId && groupMembers.some((m) => laSnowflake(m.id) || laSnowflake(m.name))) {
        const guild = await client.guilds.fetch(guildId);
        await guild.members.fetch();                 // nạp cache một lần cho cả vòng lặp
        for (const m of groupMembers) {
          const did = laSnowflake(m.id) ? m.id.trim() : (laSnowflake(m.name) ? m.name.trim() : null);
          if (!did) continue;
          const dm = guild.members.cache.get(did);
          if (!dm) continue;
          m.avatar = dm.user.displayAvatarURL();
          // Ô tên đang là dãy số Discord ID thì thay bằng tên thật cho dễ nhìn.
          if (laSnowflake(m.name)) m.name = normalizeDiscordName(dm.displayName || dm.user.username);
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
