import express from "express";
import { loadDb, saveDb } from './localDb';
import { getDiscordClient, normalizeDiscordName } from './common';

const router = express.Router();

router.get('/member-profiles/:groupID', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.json({});
    
    const localData = loadDb();
    const allMembers = Object.values(localData.members);
    
    const member = allMembers.find((m: any) => m.name && m.name.toLowerCase() === (name as string).toLowerCase());
    
    if (!member) return res.json({});
    res.json(member);
  } catch (error) {
    res.json({});
  }
});

router.post('/member-profiles/:groupID', async (req, res) => {
  try {
    const { name } = req.query;
    const profile = req.body;
    if (!profile) return res.status(400).json({ error: 'Missing profile' });
    
    const docId = profile.id || profile.discordId;
    if (!docId) {
      return res.status(400).json({ error: 'Member ID is required to save profile' });
    }

    const localData = loadDb();
    if (!localData.members[docId]) {
      localData.members[docId] = { id: docId, name: '' };
    }
    localData.members[docId] = { ...localData.members[docId], ...profile };
    saveDb(localData);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving member profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

router.post('/member-profiles/:groupID/batch', async (req, res) => {
  try {
    const { names } = req.body;
    if (!names || !Array.isArray(names)) return res.json([]);
    
    const localData = loadDb();
    const allMembers = Object.values(localData.members);
    
    const lowerNames = names.map(n => n.toLowerCase());
    const matchedMembers = allMembers.filter((m: any) => m.name && lowerNames.includes(m.name.toLowerCase()));
    
    res.json(matchedMembers);
  } catch (error) {
    console.error('Error in batch profiles:', error);
    res.json([]);
  }
});

router.get('/member-config-by-discord/:groupID/:discordId', async (req, res) => {
  try {
    const { groupID, discordId } = req.params;
    const localData = loadDb();
    const config = localData.members[discordId] || {};
    res.json(config);
  } catch (error) {
    res.json({});
  }
});

router.post('/member-config-by-discord/:groupID/:discordId', async (req, res) => {
  try {
    const { groupID, discordId } = req.params;
    const newConfig = req.body;
    
    const localData = loadDb();
    if (!localData.members[discordId]) {
      localData.members[discordId] = { id: discordId, name: '' };
    }
    if (newConfig.type === undefined) {
      newConfig.type = 0;
    }

    // Thành viên thêm TAY được lưu với khoá 'custom_<thời điểm>' và avatar rỗng, vì lúc đó
    // chưa có Discord. Sau này gắn Discord ID vào thì KHÔNG chỗ nào đi lấy lại ảnh, nên
    // người đó vĩnh viễn không có avatar dù đã có ID. Lấy luôn ở đây.
    // Best-effort: bot chưa kết nối hoặc người đó rời server thì bỏ qua, đừng để hỏng
    // cả việc lưu cấu hình chỉ vì thiếu cái ảnh.
    if (!newConfig.avatar) {
      try {
        const client = await getDiscordClient(groupID);
        const guildId = localData.groups[groupID]?.configs?.discord?.guildId;
        if (client && guildId) {
          const guild = await client.guilds.fetch(guildId);
          const m = await guild.members.fetch(discordId);
          if (m) {
            newConfig.avatar = m.user.displayAvatarURL();
            if (!newConfig.name && !localData.members[discordId].name) {
              newConfig.name = normalizeDiscordName(m.displayName || m.user.username);
            }
          }
        }
      } catch { /* không lấy được ảnh thì thôi, cấu hình vẫn phải lưu được */ }
    }

    localData.members[discordId] = { ...localData.members[discordId], ...newConfig };

    if (!localData.groups[groupID]) {
      localData.groups[groupID] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {} };
    }
    const groupMembers = localData.groups[groupID].members || [];
    if (!groupMembers.includes(discordId)) {
      localData.groups[groupID].members = [...groupMembers, discordId];
    }

    saveDb(localData);

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving member config:', error);
    res.status(500).json({ error: 'Failed to save member config' });
  }
});

export default router;
