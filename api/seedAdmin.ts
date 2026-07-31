import { loadDb, saveDb } from './localDb';

// =====================================================================
// TẠO TÀI KHOẢN QUẢN TRỊ LÚC KHỞI ĐỘNG, NẾU CHƯA CÓ AI.
//
// VÌ SAO CẦN: repo có sẵn db/groups/1/accounts.json với tài khoản mẫu, nhưng khi deploy
// mà GẮN VOLUME vào /app/db thì Volume (rỗng) CHE MẤT thư mục db/ của repo. Kết quả:
// không còn tài khoản nào, không đăng nhập được, mà tool lại không có màn tạo tài khoản.
// Đã thử tại chỗ: giả lập db/ rỗng -> loadDb trả 2 nhóm, accounts rỗng cả hai.
//
// Tiện thể bỏ luôn mật khẩu ghi cứng trong git ('riku@123' nằm trong repo, ai đọc được
// repo là đăng nhập được trang đang chạy).
//
// ⚠️ Mật khẩu vẫn lưu THÔ (Login.ts so sánh chuỗi trực tiếp). Đây chỉ vá chỗ bị khoá
// ngoài, chưa phải sửa phần xác thực.
// =====================================================================

export function seedAdmin(): void {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  const groupID = process.env.ADMIN_GROUP || '1';

  const db = loadDb();
  const coAi = Object.values(db.groups || {}).some((g: any) => Object.keys(g?.accounts || {}).length > 0);
  if (coAi) return;                       // đã có người dùng thật -> không đụng vào

  if (!user || !pass) {
    console.error('='.repeat(70));
    console.error('[seedAdmin] CHƯA CÓ TÀI KHOẢN NÀO và cũng chưa đặt ADMIN_USER / ADMIN_PASS.');
    console.error('[seedAdmin] Sẽ KHÔNG đăng nhập được. Thường gặp khi gắn Volume vào /app/db:');
    console.error('[seedAdmin] Volume rỗng che mất db/ có sẵn trong repo.');
    console.error('[seedAdmin] Khắc phục: đặt ADMIN_USER và ADMIN_PASS rồi khởi động lại.');
    console.error('='.repeat(70));
    return;
  }

  if (!db.groups[groupID]) {
    db.groups[groupID] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {}, tactics: {} } as any;
  }
  (db.groups[groupID] as any).accounts = { ...(db.groups[groupID] as any).accounts, [user]: { password: pass, rule: 2 } };
  saveDb(db);
  console.log(`[seedAdmin] Đã tạo tài khoản quản trị "${user}" cho nhóm ${groupID}.`);
}
