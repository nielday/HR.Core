import pg from 'pg';

// =====================================================================
// NỐI SANG POSTGRES CỦA BOT CoHonCave — chỉ dùng làm HÒM THƯ.
//
// Tool vẫn giữ dữ liệu riêng (đội hình, chiến thuật, tài khoản) ở file JSON trên Volume.
// Postgres bên bot chỉ dùng để GỬI đội hình sang cho bot đọc, không phải kho chứa.
//
// VÌ SAO CHIA VẬY: Postgres đó đang giữ SỐ DƯ TIỀN của người chơi trong bot. Nếu tool
// cũng lưu dữ liệu ở đấy thì lúc tool hỏng phải khôi phục database là cuốn theo cả kinh
// tế của bot, mà tiền thì không dựng lại được. Tách ra thì tool hỏng chỉ cần khôi phục
// Volume, không đụng gì tới bot.
//
// max: 3 — bot đang mở tới 10, gói Postgres nhỏ thường trần 20-25 kết nối. Để mặc định
// (10) là hai bên cộng lại chạm trần lúc đông người.
//
// KHÔNG có DATABASE_URL thì im lặng bỏ qua: chạy máy nhà vẫn phải dùng được tool.
// =====================================================================

let pool: pg.Pool | null = null;
let daBao = false;

function getPool(): pg.Pool | null {
  if (!process.env.DATABASE_URL) {
    if (!daBao) {
      daBao = true;
      console.warn('[botDb] Chưa có DATABASE_URL — bỏ qua phần gửi đội hình sang bot.');
    }
    return null;
  }
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    });
    pool.on('error', (err) => console.error('[botDb] Lỗi pool:', err.message));
  }
  return pool;
}

/** Có nối được sang bot không (dùng cho thông báo trên giao diện). */
export const coNoiBot = () => Boolean(process.env.DATABASE_URL);

/**
 * Gửi đội hình sang bot. TRẢ VỀ true/false chứ KHÔNG ném lỗi: đây là việc phụ, hỏng thì
 * vẫn phải đăng được lên Discord như thường. Ném lỗi ở đây là kéo sập cả nút Đăng.
 */
export async function guiDoiHinh(opts: {
  guildId: string; ten?: string; nguoiXep?: string; areas: any[];
}): Promise<boolean> {
  const p = getPool();
  if (!p || !opts.guildId) return false;
  try {
    await p.query(
      `INSERT INTO wwm_lineup (guild_id, ten, nguoi_xep, data) VALUES ($1, $2, $3, $4::jsonb)`,
      [opts.guildId, opts.ten || null, opts.nguoiXep || null, JSON.stringify(opts.areas ?? [])],
    );
    return true;
  } catch (e: any) {
    // Bảng chưa có (bot chưa deploy bản mới) là lỗi hay gặp nhất, nói rõ ra.
    const thieuBang = /relation .*wwm_lineup.* does not exist/i.test(e?.message || '');
    console.error(`[botDb] Không gửi được đội hình sang bot: ${e.message}`
      + (thieuBang ? ' (bot chưa tạo bảng wwm_lineup — deploy lại bot là có)' : ''));
    return false;
  }
}
