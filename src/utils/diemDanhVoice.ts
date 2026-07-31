import { Member } from '../models';

/**
 * ĐIỂM DANH THEO VOICE.
 *
 * Đội hình xếp sẵn 15 công 15 thủ, đến giờ đánh mỗi người phải ngồi đúng kênh voice của khu
 * mình. Ba trạng thái, và chỉ ba:
 *   dung  người này đang ở đúng kênh voice của khu mình
 *   lac   đang trong voice, nhưng là kênh khác
 *   vang  không ở kênh voice nào
 *
 * Trạng thái thứ tư là KHÔNG BIẾT, và nó quan trọng không kém: người không có Discord ID thì
 * không tra được, phải để trung tính. Tô đỏ họ là vu oan, leader đi gọi một người vốn đang
 * ngồi ngay trong voice.
 */
export type TrangThaiVoice = 'dung' | 'lac' | 'vang' | 'khongro';

export type VoiceState = Record<string, { id: string; name: string }>;

/**
 * Kênh voice nào ứng với khu này.
 *
 * Ưu tiên BẢNG GÁN người dùng đã khai (kênh -> khu). Đó là lời khai rõ ràng, đừng đoán khi
 * đã có nó.
 * Chưa gán thì mới đoán theo tên: tên khu và tên kênh cùng chứa "công" hay "thủ". Cách này
 * gãy với kênh đặt tên "Voice 1" hay "Atk/Def", nên chỉ dùng làm lưới đỡ.
 */
function kenhCuaKhu(areaId: string, areaName: string, gan: Record<string, string>, tenKenh: Record<string, string>): string[] {
  const theoGan = Object.keys(gan || {}).filter((cid) => gan[cid] === areaId);
  if (theoGan.length) return theoGan;

  const bo = (s: string) => (s || '').toLowerCase();
  const khu = bo(areaName);
  const tuKhoa = khu.includes('công') || khu.includes('cong') ? ['công', 'cong']
    : khu.includes('thủ') || khu.includes('thu') ? ['thủ', 'thu']
    : [];
  if (!tuKhoa.length) return [];
  return Object.keys(tenKenh).filter((cid) => tuKhoa.some((t) => bo(tenKenh[cid]).includes(t)));
}

export function trangThaiVoice(
  m: Member,
  areaId: string,
  areaName: string,
  states: VoiceState,
  gan: Record<string, string>,
  tenKenh: Record<string, string>,
): { trangThai: TrangThaiVoice; tenKenhDangO?: string } {
  const did = m.discordId || (/^\d{17,19}$/.test(m.id) ? m.id : '');
  if (!did) return { trangThai: 'khongro' };

  const vs = states[did];
  if (!vs) return { trangThai: 'vang' };

  const dung = kenhCuaKhu(areaId, areaName, gan, tenKenh);
  // Khu chưa gán kênh nào và tên cũng không gợi ý gì thì không có cơ sở để nói họ lạc.
  // Người đang trong voice, chỉ là ta không biết voice nào mới là đúng.
  if (!dung.length) return { trangThai: 'khongro', tenKenhDangO: vs.name };

  return dung.includes(vs.id)
    ? { trangThai: 'dung', tenKenhDangO: vs.name }
    : { trangThai: 'lac', tenKenhDangO: vs.name };
}

/** Đếm cho tiêu đề khu. Quét mắt qua 30 thẻ tìm màu đỏ thì chậm, con số mới trả lời nhanh. */
export function demDiemDanh(
  members: Member[],
  areaId: string,
  areaName: string,
  states: VoiceState,
  gan: Record<string, string>,
  tenKenh: Record<string, string>,
) {
  const dem = { dung: 0, lac: 0, vang: 0, khongro: 0, tong: members.length };
  for (const m of members) {
    dem[trangThaiVoice(m, areaId, areaName, states, gan, tenKenh).trangThai]++;
  }
  return dem;
}
