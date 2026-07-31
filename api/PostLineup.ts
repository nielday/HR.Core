import express from 'express';
import { getDiscordClient } from './common';
import { loadDb } from './localDb';

const router = express.Router();

// =====================================================================
// ĐĂNG ĐỘI HÌNH ĐÃ XẾP RA KÊNH DISCORD.
//
// Phân vai cố ý: FRONTEND dịch chữ (nó giữ i18n, biết đang hiển thị gì), BACKEND lo bố
// cục và cắt tin. Nếu để backend tự dịch thì phải chép lại toàn bộ bảng i18n, hai bên lệch
// nhau lúc nào không hay.
//
// Discord chặn 2000 ký tự MỖI TIN. Đội hình đông là vượt, mà API chỉ trả lỗi cụt lủn
// "Invalid Form Body" nên rất khó đoán. Vì vậy phải tự cắt, và cắt theo RANH GIỚI ĐỘI
// chứ không cắt giữa chừng.
// =====================================================================

const TRAN_KY_TU = 1900;   // chừa chỗ cho tiêu đề phần và số trang

type MemberOut = { name: string; ingameName?: string; roleIcon?: string; weapon?: string; isBackup?: boolean };
type TeamOut = { name: string; members: MemberOut[] };
type AreaOut = { name: string; teams: TeamOut[] };

function dongThanhVien(m: MemberOut): string {
  const ten = (m.ingameName || m.name || '?').trim();
  const icon = m.roleIcon ? `${m.roleIcon} ` : '• ';
  const vk = m.weapon ? ` _(${m.weapon})_` : '';
  const duBi = m.isBackup ? ' `dự bị`' : '';
  return `${icon}${ten}${vk}${duBi}`;
}

/** Dựng các khối chữ, mỗi khối là một ĐỘI trọn vẹn để không bị cắt ngang. */
export function dungKhoi(areas: AreaOut[]): string[] {
  const khoi: string[] = [];
  for (const area of areas || []) {
    const doiCoNguoi = (area.teams || []).filter((t) => (t.members || []).length > 0);
    if (!doiCoNguoi.length) continue;               // khu rỗng thì bỏ, đăng ra chỉ tổ rối
    khoi.push(`\n## ${area.name}`);
    for (const t of doiCoNguoi) {
      const dong = t.members.map(dongThanhVien).join('\n');
      khoi.push(`**${t.name}** _(${t.members.length})_\n${dong}`);
    }
  }
  return khoi;
}

/** Gom khối thành các tin dưới trần ký tự. Khối nào tự nó đã quá dài thì đành để riêng. */
export function gomTin(khoi: string[], tieuDe: string): string[] {
  const tin: string[] = [];
  let hienTai = tieuDe;
  for (const k of khoi) {
    if (hienTai.length + k.length + 2 > TRAN_KY_TU && hienTai.trim()) {
      tin.push(hienTai);
      hienTai = '';
    }
    hienTai += (hienTai ? '\n\n' : '') + k;
  }
  if (hienTai.trim()) tin.push(hienTai);
  return tin;
}

router.post('/post-lineup', async (req, res) => {
  try {
    const { groupID, title, areas, channelId } = req.body as {
      groupID: string; title?: string; areas: AreaOut[]; channelId?: string;
    };
    if (!groupID) return res.status(400).json({ error: 'Thiếu groupID' });
    if (!Array.isArray(areas) || !areas.length) return res.status(400).json({ error: 'Đội hình rỗng' });

    const client = await getDiscordClient(groupID);
    if (!client) return res.status(400).json({ error: 'Bot Discord của nhóm này chưa kết nối. Kiểm tra lại cấu hình bot.' });

    const kenh = channelId || loadDb().groups[groupID]?.configs?.discord?.channelId;
    if (!kenh) return res.status(400).json({ error: 'Chưa chọn kênh để đăng. Vào cấu hình Discord chọn kênh.' });

    const channel: any = await client.channels.fetch(kenh).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return res.status(400).json({ error: 'Không mở được kênh, hoặc kênh không nhận tin nhắn.' });
    }

    const khoi = dungKhoi(areas);
    if (!khoi.length) return res.status(400).json({ error: 'Chưa xếp ai vào đội nào.' });

    const gio = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const tieuDe = `# ⚔️ ${title || 'Đội hình bang chiến'}\n_Cập nhật ${gio}_`;
    const tin = gomTin(khoi, tieuDe);

    const ids: string[] = [];
    for (let i = 0; i < tin.length; i++) {
      const duoi = tin.length > 1 ? `\n\n_(${i + 1}/${tin.length})_` : '';
      // allowedMentions rỗng: tên trong game trùng tên role/người là bot hú cả server.
      const msg = await channel.send({ content: tin[i] + duoi, allowedMentions: { parse: [] } });
      ids.push(msg.id);
    }
    res.json({ success: true, messageIds: ids, soTin: tin.length });
  } catch (error: any) {
    console.error('Post lineup error:', error);
    res.status(500).json({ error: error.message || 'Không đăng được đội hình' });
  }
});

export default router;
