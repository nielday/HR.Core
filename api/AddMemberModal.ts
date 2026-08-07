import express from "express";
import { normalizeDiscordName, getDiscordClient } from './common';
import { loadDb, saveDb } from './localDb';

const router = express.Router();

/**
 * Ghi vũ khí và cấp bậc ở CẢ HAI DẠNG.
 *
 * Bản ghi trong DB tồn tại hai dạng tuỳ đường nào tạo ra nó: nút "Thêm thành viên" gửi
 * nguyên object (primaryWeapon1.id), còn thẻ thành viên bấm Lưu thì ghi dạng id rời
 * (primaryWeapon1Id). Chỗ đọc lại chỉ tra dạng id rời, nên người thêm bằng nút kia mở thẻ
 * ra thấy trống vũ khí và cấp bậc Tân Binh, tưởng mất dữ liệu.
 * Phía đọc đã sửa để chấp cả hai, nhưng vẫn phải chuẩn hoá lúc ghi, không thì bản ghi lệch
 * cứ đẻ tiếp và lần sau lại có người mất công dò.
 */
const laSnowflake = (v: any) => typeof v === 'string' && /^\d{17,19}$/.test(v.trim());

/**
 * Khoá bản ghi BẮT BUỘC là Discord ID.
 *
 * Bản cũ nhận bất cứ thứ gì trình duyệt gửi lên làm khoá, nên khi tra Discord không ra thì
 * frontend lấy 'custom_<mốc thời gian>'. Mốc thời gian duy nhất theo GIÂY PHÚT BẤM chứ
 * không duy nhất theo NGƯỜI: thêm cùng một người hai lần là hai bản ghi, và Discord không
 * biết dãy số đó là gì.
 * Cả loạt lỗi đã sửa đều mọc ra từ đây. Đã dọn sạch dữ liệu cũ rồi thì phải bịt luôn chỗ đẻ.
 *
 * Chặn ở MÁY CHỦ chứ không chỉ ở giao diện: frontend sửa được, máy chủ thì không.
 */
function kiemKhoa(m: any): string {
  if (!m || typeof m !== 'object') return 'Dữ liệu thành viên không hợp lệ.';
  const id = String(m.discordId || m.id || '').trim();
  if (!laSnowflake(id)) {
    return 'Thiếu Discord ID. Mỗi thành viên phải gắn với một tài khoản Discord thật, '
      + 'không thì hệ thống không nhận ra đây là ai: mất ảnh đại diện, không bấm được vào tên, '
      + 'không điểm danh voice được, và thêm hai lần sẽ thành hai người.';
  }
  return '';
}

function chuanHoaVuKhi(m: any) {
  if (!m || typeof m !== 'object') return m;
  const phu = (m.secondaryWeaponIds?.length ? m.secondaryWeaponIds : (m.secondaryWeapons || []).map((w: any) => w?.id));
  return {
    ...m,
    primaryWeapon1Id: m.primaryWeapon1Id || m.primaryWeapon1?.id || '',
    primaryWeapon2Id: m.primaryWeapon2Id || m.primaryWeapon2?.id || '',
    secondaryWeaponIds: (phu || []).filter(Boolean),
    rankId: m.rankId || m.rank?.id || '',
  };
}

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
    const loi = kiemKhoa(req.body);
    if (loi) return res.status(400).json({ error: loi });

    const newMember = chuanHoaVuKhi(req.body);
    // Khoá LUÔN là Discord ID, kể cả khi trình duyệt gửi lên một khoá khác.
    newMember.id = String(newMember.discordId || newMember.id).trim();
    newMember.discordId = newMember.id;

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
    
    const loiDs = newMembers.map((m, i) => ({ i, loi: kiemKhoa(m) })).filter((x) => x.loi);
    if (loiDs.length) {
      return res.status(400).json({ error: `${loiDs.length} thành viên thiếu Discord ID. ${loiDs[0].loi}` });
    }

    newMembers.forEach(raw => {
      const member = chuanHoaVuKhi(raw);
      member.id = String(member.discordId || member.id).trim();
      member.discordId = member.id;
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
