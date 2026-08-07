import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// =====================================================================
// XÁC THỰC VÀ PHÂN QUYỀN.
//
// Ba lỗ trước khi có file này, cả ba đều ở mức "ai biết địa chỉ trang là vào được":
//
//   1. Mật khẩu lưu THÔ. Login so sánh chuỗi trực tiếp. Ai đọc được file db là đọc được
//      mật khẩu của mọi người, mà người ta hay dùng chung một mật khẩu cho nhiều nơi.
//   2. Không có phiên. Quyền quản trị đọc từ localStorage.userRole, gõ đúng một dòng
//      trong console trình duyệt là thành admin. Máy chủ không hề biết bạn là ai.
//   3. Máy chủ không kiểm nhóm. Mọi API nhận :groupID từ ĐƯỜNG DẪN rồi tin luôn. Đổi số
//      trên thanh địa chỉ là đọc và sửa được dữ liệu nhóm khác.
//
// Lỗ 2 và 3 là một: máy chủ không có cách nào biết người gọi là ai, nên buộc phải tin
// những gì trình duyệt khai. Chữa bằng phiên có KÝ: máy chủ tự phát, tự kiểm, không sửa
// được từ phía trình duyệt.
// =====================================================================

// ---------- Mật khẩu ----------

// scrypt của Node, không thêm thư viện ngoài. Chậm có chủ đích để dò từng mật khẩu tốn thời
// gian, đúng thứ cần cho việc băm mật khẩu.
const SCRYPT_N = 16384;
const DAI_KHOA = 32;

export function bamMatKhau(matKhau: string): string {
  const muoi = crypto.randomBytes(16);
  const bam = crypto.scryptSync(matKhau, muoi, DAI_KHOA, { N: SCRYPT_N });
  return `scrypt$${muoi.toString('hex')}$${bam.toString('hex')}`;
}

/**
 * Kiểm mật khẩu, chấp cả bản ghi CŨ còn để thô.
 *
 * Bắt buộc phải chấp bản cũ: đổi thẳng sang băm là khoá cửa toàn bộ tài khoản đang có, kể
 * cả tài khoản quản trị duy nhất, và không còn đường vào để sửa. Nên nhận đúng mật khẩu thô
 * một lần cuối rồi báo cho chỗ gọi băm lại và ghi đè.
 */
export function kiemMatKhau(matKhau: string, luuTru: string): { dung: boolean; canNangCap: boolean } {
  if (typeof luuTru !== 'string' || !luuTru) return { dung: false, canNangCap: false };

  if (!luuTru.startsWith('scrypt$')) {
    return { dung: bangNhau(matKhau, luuTru), canNangCap: true };
  }

  const [, muoiHex, bamHex] = luuTru.split('$');
  if (!muoiHex || !bamHex) return { dung: false, canNangCap: false };
  try {
    const bam = crypto.scryptSync(matKhau, Buffer.from(muoiHex, 'hex'), DAI_KHOA, { N: SCRYPT_N });
    const luu = Buffer.from(bamHex, 'hex');
    // timingSafeEqual ném lỗi nếu khác độ dài, nên phải chặn trước.
    return { dung: luu.length === bam.length && crypto.timingSafeEqual(luu, bam), canNangCap: false };
  } catch {
    return { dung: false, canNangCap: false };
  }
}

/** So chuỗi theo thời gian cố định. Dùng cho mật khẩu thô còn sót lại. */
function bangNhau(a: string, b: string): boolean {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

// ---------- Phiên ----------

// Khoá ký. KHÔNG được ghi cứng trong mã: khoá nằm trong repo thì ai đọc được repo là tự ký
// được phiên quản trị cho mình.
// Chạy thật mà thiếu khoá thì CHẾT HẲN thay vì lặng lẽ dùng khoá mặc định. Sập lúc khởi
// động thì thấy ngay; chạy tiếp với khoá ai cũng đoán được thì không ai thấy gì cả.
function layKhoaKy(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;

  // Chưa đặt riêng thì DẪN XUẤT từ ENCRYPTION_KEY, không dùng thẳng.
  // Một khoá không nên gánh hai việc: lỡ khoá ký phiên rò ra thì token bot vẫn an toàn.
  // Băm ra cũng gỡ luôn chuyện độ dài, khoá ngắn vẫn dùng được.
  //
  // CỐ Ý KHÔNG tắt máy chủ ở đây dù đang chạy thật. common.ts đã chặn trường hợp thiếu
  // ENCRYPTION_KEY từ trước rồi, nên tới đây là chắc chắn có khoá. Thêm một chỗ tự tắt nữa
  // chỉ tổ hạ cả trang vì một biến môi trường đặt hơi ngắn.
  const goc = process.env.ENCRYPTION_KEY;
  if (goc) {
    console.warn('[auth] Chưa đặt SESSION_SECRET, đang dẫn xuất khoá ký từ ENCRYPTION_KEY. '
      + 'Nên đặt riêng SESSION_SECRET (openssl rand -hex 32) để hai khoá độc lập.');
    return crypto.createHash('sha256').update(`phien:${goc}`).digest('hex');
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('='.repeat(70));
    console.error('[auth] THIẾU cả SESSION_SECRET lẫn ENCRYPTION_KEY. Không ký phiên an toàn được.');
    console.error('[auth] Đặt SESSION_SECRET rồi khởi động lại: openssl rand -hex 32');
    console.error('='.repeat(70));
    process.exit(1);
  }

  // Máy cá nhân: khoá ngẫu nhiên mỗi lần chạy. Khởi động lại là phải đăng nhập lại, hơi
  // phiền nhưng không bao giờ có khoá mặc định lọt lên môi trường thật.
  console.warn('[auth] Chưa đặt SESSION_SECRET, dùng khoá ngẫu nhiên cho lần chạy này.');
  return crypto.randomBytes(32).toString('hex');
}

const KHOA_KY = layKhoaKy();
const HAN_PHIEN_MS = 7 * 24 * 60 * 60 * 1000;

export type Phien = { username: string; groupID: string; rule: number; het: number };

const b64 = (b: Buffer) => b.toString('base64url');
const ky = (data: string) => b64(crypto.createHmac('sha256', KHOA_KY).update(data).digest());

export function taoPhien(p: Omit<Phien, 'het'>): string {
  const than = { ...p, het: Date.now() + HAN_PHIEN_MS };
  const thanB64 = b64(Buffer.from(JSON.stringify(than)));
  return `${thanB64}.${ky(thanB64)}`;
}

/** Đọc và KIỂM CHỮ KÝ. Sai chữ ký hoặc hết hạn thì coi như không có phiên. */
export function docPhien(token?: string): Phien | null {
  if (!token || typeof token !== 'string') return null;
  const [thanB64, chuKy] = token.split('.');
  if (!thanB64 || !chuKy) return null;

  const dung = ky(thanB64);
  const a = Buffer.from(chuKy);
  const b = Buffer.from(dung);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const p = JSON.parse(Buffer.from(thanB64, 'base64url').toString()) as Phien;
    if (!p?.username || !p?.groupID || typeof p.het !== 'number') return null;
    if (Date.now() > p.het) return null;
    return p;
  } catch {
    return null;
  }
}

// ---------- Chốt chặn ----------

/**
 * Đường công khai, KHÔNG cần đăng nhập. Danh sách đóng: thứ gì không có tên ở đây thì phải
 * có phiên hợp lệ mới đi qua. Mặc định là CẤM, vì thêm nhầm một đường vào danh sách này thì
 * lộ dữ liệu, còn quên một đường thì chỉ là báo lỗi và ta sửa.
 */
function laDuongMo(method: string, duong: string): boolean {
  const p = duong.split('?')[0].replace(/\/+$/, '');

  if (method === 'POST' && (p === '/login' || p === '/discord-auth')) return true;

  // Trang xem công khai (/view?id=...): chỉ đọc ĐÚNG MỘT bài xếp theo id. Danh sách bài thì
  // không mở, vì đó là liệt kê toàn bộ hoạt động của nhóm.
  if (method === 'GET' && /^\/setups\/[^/]+\/[^/]+$/.test(p)) return true;
  if (method === 'GET' && /^\/tactics\/[^/]+\/[^/]+$/.test(p)) return true;

  // Trang thành viên tự cập nhật hồ sơ, mở từ link Discord. Người dùng thường không có tài
  // khoản nên không thể bắt đăng nhập.
  // ⚠️ CÒN YẾU: chỉ cần biết discordId là sửa được hồ sơ người đó. Giữ nguyên như cũ vì
  // khoá lại là gãy tính năng đang chạy, nhưng đây là chỗ tiếp theo cần vá.
  if (/^\/member-config-by-discord\/[^/]+\/[^/]+$/.test(p)) return true;
  if (method === 'GET' && /^\/discord-profile\/[^/]+$/.test(p)) return true;

  return false;
}

export function batBuocDangNhap(req: Request, res: Response, next: NextFunction) {
  if (laDuongMo(req.method, req.path)) return next();

  const header = req.headers.authorization || '';
  const phien = docPhien(header.startsWith('Bearer ') ? header.slice(7) : '');
  if (!phien) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Đăng nhập lại.' });
  }

  (req as any).phien = phien;

  // KIỂM NHÓM. Trước đây :groupID lấy thẳng từ đường dẫn rồi tin luôn, nên đổi số trên thanh
  // địa chỉ là đọc và sửa được dữ liệu nhóm khác. Giờ nhóm trong đường dẫn phải khớp nhóm
  // ghi trong phiên, mà phiên thì có chữ ký nên trình duyệt không sửa được.
  const nhom = nhomTrenDuong(req.path);
  if (nhom && nhom !== phien.groupID) {
    return res.status(403).json({ error: 'Bạn không có quyền với nhóm này.' });
  }

  next();
}

/**
 * Id nhóm nằm ở đoạn nào của đường dẫn.
 *
 * Phải khai TỪNG DẠNG chứ không đếm đoạn cho nhanh. Bản đầu tôi lấy cứng đoạn thứ hai, thế
 * là /poll/results/1 bị đọc thành nhóm "results", không khớp nhóm nào nên chặn luôn chính
 * người dùng hợp lệ: bảng kết quả bình chọn trả 403 và danh sách người đăng ký trống trơn.
 *
 * Không có dạng nào khớp thì trả rỗng, tức là đường này không mang id nhóm (ví dụ
 * /discord-profile/<discordId>) và không có gì để so.
 */
const DANG_CO_NHOM: RegExp[] = [
  // Nhóm nằm ở đoạn THỨ BA.
  /^\/poll\/results\/([^/]+)/,
  // Nhóm nằm ở đoạn thứ hai.
  /^\/(?:setups|members-config|custom-members|members|voice-channels|voice-state|bot-config|status|connect|disconnect|poll|discord|member-profiles|discord-user|tactics)\/([^/]+)/,
];

function nhomTrenDuong(duong: string): string {
  const p = duong.split('?')[0];
  for (const dang of DANG_CO_NHOM) {
    const m = p.match(dang);
    if (m?.[1] && /^[\w-]+$/.test(m[1])) return m[1];
  }
  return '';
}

/** Việc chỉ quản trị được làm: cấu hình bot (đọc ra là thấy TOKEN BOT), bật tắt kết nối. */
export function batBuocQuanTri(req: Request, res: Response, next: NextFunction) {
  const phien = (req as any).phien as Phien | undefined;
  if (!phien || phien.rule < 2) {
    return res.status(403).json({ error: 'Việc này chỉ quản trị viên làm được.' });
  }
  next();
}
