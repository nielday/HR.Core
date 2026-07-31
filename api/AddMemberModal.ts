import express from "express";
import { normalizeDiscordName, getDiscordClient } from './common';
import { loadDb, saveDb } from './localDb';

const router = express.Router();

router.get('/discord-user/:groupID', async (req, res) => {
  const { groupID } = req.params;
  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const query = normalizeDiscordName(name).toLowerCase();
    
    const client = await getDiscordClient(groupID);
    if (!client || !client.isReady()) {
      return res.status(400).json({ error: 'Bot is not connected' });
    }

    const localData = loadDb();
    const groupObj = localData.groups[groupID];
    const data = (groupObj && groupObj.configs && groupObj.configs.discord) ? groupObj.configs.discord : {};
    
    if (!data.guildId) return res.status(404).json({ error: 'Discord config not found' });
    
    const { guildId } = data;
    const guild = await client.guilds.fetch(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    let member;
    
    if (/^\d{17,19}$/.test(name.trim())) {
      try {
        member = await guild.members.fetch(name.trim());
      } catch (e) {}
    }

    if (!member) {
      const members = await guild.members.fetch({ query: name, limit: 1 });
      member = members.first();
    }

    if (!member) {
      const allMembers = await guild.members.fetch();
      member = allMembers.find(m => 
        normalizeDiscordName(m.displayName).toLowerCase().includes(query) || 
        normalizeDiscordName(m.user.username).toLowerCase().includes(query)
      );
    }

    if (!member) return res.status(404).json({ error: 'Member not found in Discord guild' });

    const localMember = localData.members[member.id];
    
    if (localMember) {
      // ⚠️ THỨ TỰ SPREAD: `...localMember` phải nằm TRƯỚC. Trước đây nó ở cuối nên bản ghi
      // đã lưu ĐÈ LÊN dữ liệu vừa lấy từ Discord — kể cả khi trường đó rỗng. Thành viên
      // thêm tay có `avatar: ''`, thế là vừa lấy đúng ảnh xong lại bị xoá trắng ngay.
      // Ý đúng: lấy bản lưu làm nền, rồi cho mấy trường TƯƠI ghi đè lên.
      return res.json({
        ...localMember,
        id: member.id,
        // Cất RIÊNG Discord ID. `id` không giữ nổi: người thêm tay lúc bot chưa tra ra được
        // sẽ mang id 'custom_<thời điểm>', và cái id đó theo bản ghi mãi về sau.
        discordId: member.id,
        name: normalizeDiscordName(member.displayName),
        avatar: member.user.displayAvatarURL(),
        isGlobal: true,
      });
    }

    res.json({
      id: member.id,
      discordId: member.id,
      name: normalizeDiscordName(member.displayName),
      avatar: member.user.displayAvatarURL(),
      isGlobal: false
    });
  } catch (error: any) {
    console.error('Error fetching discord user:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/custom-members/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const newMember = req.body;
    
    const localData = loadDb();
    if (!localData.members[newMember.id]) {
      localData.members[newMember.id] = { id: newMember.id, name: '' };
    }
    localData.members[newMember.id] = { ...localData.members[newMember.id], ...newMember, type: 1 };
    
    if (!localData.groups[groupID]) {
      localData.groups[groupID] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {} };
    }
    const groupMembers = localData.groups[groupID].members || [];
    if (!groupMembers.includes(newMember.id)) {
      localData.groups[groupID].members = [...groupMembers, newMember.id];
    }
    
    saveDb(localData);
    
    res.json({ success: true, member: newMember });
  } catch (error) {
    console.error('Error saving custom member:', error);
    res.status(500).json({ error: 'Failed to save custom member' });
  }
});

router.post('/custom-members/:groupID/batch', async (req, res) => {
  try {
    const { groupID } = req.params;
    const newMembers = req.body;
    if (!Array.isArray(newMembers)) {
      return res.status(400).json({ error: 'Expected an array of members' });
    }
    
    const localData = loadDb();
    const newMemberIds: string[] = [];
    
    newMembers.forEach(member => {
      if (!localData.members[member.id]) {
        localData.members[member.id] = { id: member.id, name: '' };
      }
      localData.members[member.id] = { ...localData.members[member.id], ...member, type: 1 };
      newMemberIds.push(member.id);
    });
    
    if (!localData.groups[groupID]) {
      localData.groups[groupID] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {} };
    }
    
    const existingMemberIds = localData.groups[groupID].members || [];
    localData.groups[groupID].members = Array.from(new Set([...existingMemberIds, ...newMemberIds]));
    
    saveDb(localData);
    
    res.json({ success: true, addedCount: newMembers.length });
  } catch (error) {
    console.error('Error batch saving custom members:', error);
    res.status(500).json({ error: 'Failed to batch save custom members' });
  }
});

export default router;
