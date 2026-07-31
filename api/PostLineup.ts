import express from 'express';
import { EmbedBuilder } from 'discord.js';
import { getDiscordClient } from './common';
import { loadDb } from './localDb';
import { guiDoiHinh } from './botDb';

const router = express.Router();

// =====================================================================
// ĐĂNG ĐỘI HÌNH ĐÃ XẾP RA KÊNH DISCORD.
//
// Phân vai cố ý: FRONTEND dịch chữ (nó giữ i18n, biết đang hiển thị gì), BACKEND lo bố
// cục và cắt tin. Nếu để backend tự dịch thì phải chép lại toàn bộ bảng i18n, hai bên lệch
// nhau lúc nào không hay.
//
// DÙNG EMBED, KHÔNG DÙNG CHỮ THƯỜNG, CŨNG KHÔNG DÙNG COMPONENTS V2.
// Giao diện tool là LƯỚI 3 CỘT (Công 1 | Công 2 | Công 3). Field embed đặt inline xếp đúng
// 3 cột mỗi hàng, ra y hệt bản xếp trên web. Components V2 chỉ có khối xếp dọc, muốn giả
// cột phải chèn khoảng trắng và trên điện thoại là vỡ.
// Thêm nữa embed cho 6000 ký tự mỗi tin (V2 chỉ 4000), nên phần lớn đội hình gói gọn được
// trong MỘT tin thay vì bị cắt vụn như bản chữ thường cũ (cắt ở mốc 1900).
//
// Trần của Discord phải tự canh, API chỉ trả "Invalid Form Body" cụt lủn khi vượt:
//   6000 ký tự cho TOÀN BỘ embed trong một tin, 10 embed mỗi tin,
//   25 field mỗi embed, tên field 256, giá trị field 1024.
// =====================================================================

const TRAN_EMBED_TIN = 10;
const TRAN_KY_TU_TIN = 5800;   // chừa chỗ cho tiêu đề và chân trang
const TRAN_O = 1024;
const TRAN_TEN = 256;

type MemberOut = { name: string; ingameName?: string; roleIcon?: string; weapon?: string; isBackup?: boolean };
type TeamOut = { name: string; members: MemberOut[] };
type AreaOut = { name: string; teams: TeamOut[] };

const MAU_MAC_DINH = 0x5865f2;

/** Mỗi khu một màu để nhìn phát ra ngay công hay thủ, lúc đang đánh không ai đọc chữ. */
function mauKhu(ten: string): number {
  const t = (ten || '').toLowerCase();
  if (t.includes('pvp')) return 0xed4245;
  if (t.includes('trụ') || t.includes('tru')) return 0xfee75c;
  if (t.includes('công') || t.includes('cong')) return 0xeb459e;
  if (t.includes('thủ') || t.includes('thu')) return 0x57f287;
  return MAU_MAC_DINH;
}

function catVua(s: string, tran: number): string {
  return s.length <= tran ? s : s.slice(0, tran - 1) + '…';
}

function dongThanhVien(m: MemberOut): string {
  const ten = (m.ingameName || m.name || '?').trim();
  const icon = m.roleIcon ? `${m.roleIcon} ` : '• ';
  const vk = m.weapon ? ` _(${m.weapon})_` : '';
  const duBi = m.isBackup ? ' `dự bị`' : '';
  return `${icon}${ten}${vk}${duBi}`;
}

/** Cắt theo DÒNG chứ không cắt giữa tên người, và nói rõ còn sót bao nhiêu. */
export function oThanhVien(ms: MemberOut[]): string {
  const dong = (ms || []).map(dongThanhVien);
  if (!dong.length) return '_trống_';
  let s = '';
  for (let i = 0; i < dong.length; i++) {
    const them = (s ? '\n' : '') + dong[i];
    const duoi = `\n_… và ${dong.length - i} người nữa_`;
    if (s.length + them.length + duoi.length > TRAN_O) return s + duoi;
    s += them;
  }
  return s;
}

/** Một khu là một embed. Khu không có ai thì bỏ hẳn, đăng ra chỉ tổ rối. */
export function embedKhu(area: AreaOut): EmbedBuilder | null {
  const doi = (area.teams || []).slice(0, 25);
  if (!doi.some((t) => (t.members || []).length > 0)) return null;

  const e = new EmbedBuilder().setColor(mauKhu(area.name)).setTitle(catVua(area.name, TRAN_TEN));
  // GIỮ cả đội trống của khu đã có người. Field inline xếp 3 cột mỗi hàng, bỏ đội ở giữa là
  // lệch cả lưới, nhìn không ra ai đang đứng chỗ nào.
  for (const t of doi) {
    e.addFields({
      name: catVua(`${t.name} (${(t.members || []).length})`, TRAN_TEN),
      value: oThanhVien(t.members || []),
      inline: true,
    });
  }
  return e;
}

function doDaiEmbed(e: EmbedBuilder): number {
  const d = e.toJSON();
  let n = (d.title || '').length + (d.description || '').length
    + (d.footer?.text || '').length + (d.author?.name || '').length;
  for (const f of d.fields || []) n += f.name.length + f.value.length;
  return n;
}

/** Gom embed thành các tin dưới trần 10 embed và 6000 ký tự. */
export function gomTin(embeds: EmbedBuilder[]): EmbedBuilder[][] {
  const tin: EmbedBuilder[][] = [];
  let hienTai: EmbedBuilder[] = [];
  let dem = 0;
  for (const e of embeds) {
    const co = doDaiEmbed(e);
    if (hienTai.length && (hienTai.length >= TRAN_EMBED_TIN || dem + co > TRAN_KY_TU_TIN)) {
      tin.push(hienTai);
      hienTai = [];
      dem = 0;
    }
    hienTai.push(e);
    dem += co;
  }
  if (hienTai.length) tin.push(hienTai);
  return tin;
}

router.post('/post-lineup', async (req, res) => {
  try {
    const { groupID, title, areas, channelId, nguoiXep } = req.body as {
      groupID: string; title?: string; areas: AreaOut[]; channelId?: string; nguoiXep?: string;
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

    const embeds = (areas || []).map(embedKhu).filter((e): e is EmbedBuilder => e !== null);
    if (!embeds.length) return res.status(400).json({ error: 'Chưa xếp ai vào đội nào.' });

    const soNguoi = areas.reduce(
      (n, a) => n + (a.teams || []).reduce((m, t) => m + (t.members || []).length, 0), 0);
    const nhom = gomTin(embeds);
    const tieuDe = catVua(`⚔️ ${title || 'Đội hình bang chiến'}`, TRAN_TEN);

    const ids: string[] = [];
    for (let i = 0; i < nhom.length; i++) {
      // Tiêu đề gắn lên embed ĐẦU của mỗi tin, để tin thứ hai trở đi không mồ côi.
      const dau = nhom[i][0];
      dau.setAuthor({ name: nhom.length > 1 ? `${tieuDe} (${i + 1}/${nhom.length})` : tieuDe });
      if (i === nhom.length - 1) {
        const cuoi = nhom[i][nhom[i].length - 1];
        cuoi.setFooter({ text: catVua(nguoiXep ? `${soNguoi} người • Xếp bởi ${nguoiXep}` : `${soNguoi} người`, 2048) });
        cuoi.setTimestamp();   // Discord tự hiện giờ theo múi giờ của NGƯỜI XEM
      }
      // allowedMentions rỗng: tên trong game trùng tên role/người là bot hú cả server.
      const msg = await channel.send({ embeds: nhom[i], allowedMentions: { parse: [] } });
      ids.push(msg.id);
    }

    // Gửi kèm sang bot CoHonCave để trong Discord gõ /doihinh xem lại được, và xem được
    // cả những lần xếp trước. Việc PHỤ: hỏng thì thôi, đã đăng lên Discord rồi là xong
    // phần chính, không được để nó kéo cả nút Đăng thành lỗi.
    const guildId = loadDb().groups[groupID]?.configs?.discord?.guildId;
    const daGui = await guiDoiHinh({ guildId, ten: title, nguoiXep, areas });

    res.json({ success: true, messageIds: ids, soTin: nhom.length, daGuiSangBot: daGui });
  } catch (error: any) {
    console.error('Post lineup error:', error);
    res.status(500).json({ error: error.message || 'Không đăng được đội hình' });
  }
});

export default router;
