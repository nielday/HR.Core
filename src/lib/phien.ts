// =====================================================================
// GỬI KÈM PHIÊN VÀO MỌI LỜI GỌI API.
//
// Máy chủ giờ đòi phiên có ký ở header Authorization. Vấn đề: lời gọi fetch nằm rải khắp
// hơn ba chục chỗ trong mã. Sửa từng chỗ thì quên một chỗ là chỗ đó gãy, mà gãy lặng lẽ,
// và người sau thêm fetch mới cũng sẽ quên nốt.
//
// Nên bọc thẳng window.fetch một lần. Chỉ đụng vào lời gọi tới /api/ của chính trang này,
// không đụng gì tới ảnh avatar hay tài nguyên ngoài.
//
// Kèm luôn xử lý 401: phiên hết hạn hoặc chữ ký sai thì xoá phiên và về màn đăng nhập. Nếu
// không thì trang cứ báo lỗi lung tung ở từng chỗ, người dùng không hiểu vì sao mọi thứ
// hỏng cùng lúc.
// =====================================================================

const KHOA = 'phien';

export const layPhien = () => {
  try { return localStorage.getItem(KHOA) || ''; } catch { return ''; }
};

export const luuPhien = (token: string) => {
  try { localStorage.setItem(KHOA, token); } catch { /* chế độ riêng tư chặn thì thôi */ }
};

export const xoaPhien = () => {
  try {
    localStorage.removeItem(KHOA);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userGroup');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
  } catch { /* không xoá được thì cũng không làm gì hơn được */ }
};

let daBoc = false;

export function bocFetch() {
  if (daBoc) return;
  daBoc = true;

  const goc = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : (input as Request).url;
    const laApi = typeof url === 'string' && (url.startsWith('/api/') || url.includes(`${window.location.origin}/api/`));

    if (!laApi) return goc(input, init);

    const token = layPhien();
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

    const res = await goc(input, { ...init, headers });

    // Đăng nhập sai thì trả 401 là chuyện thường của chính màn đăng nhập, đừng đá người ta
    // ra khỏi trang đăng nhập.
    if (res.status === 401 && !url.includes('/api/login') && !url.includes('/api/discord-auth')) {
      xoaPhien();
      window.location.reload();
    }

    return res;
  };
}
