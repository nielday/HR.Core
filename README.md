# ⚔️ Hệ Thống Quản Lý Đội Hình & Thành Viên (Roster Management System)

Ứng dụng web chuyên dụng để quản lý, sắp xếp và tối ưu hóa đội hình cho các trận đấu/giải đấu (đặc biệt phù hợp với các tựa game có hệ thống vũ khí, vai trò và tổ đội như Naraka: Bladepoint).

---

## 🛠️ PHẦN 1: TÀI LIỆU KỸ THUẬT (TECHNICAL DOCUMENTATION)

### 1. Công nghệ sử dụng
*   **Framework:** React 18 (khởi tạo qua Vite)
*   **Ngôn ngữ:** TypeScript (đảm bảo Type Safety cho các cấu trúc dữ liệu phức tạp)
*   **Styling:** Tailwind CSS (thiết kế giao diện Dark Mode phong cách Discord)
*   **Icons:** Lucide-React
*   **Lưu trữ:** Trình duyệt Local Storage (lưu các thiết lập đội hình)

### 2. Cấu trúc dữ liệu cốt lõi (Core Data Structures)
*   **`Member`**: Đại diện cho một thành viên. Chứa các thông tin: ID, Tên, Avatar, Vũ khí chính/phụ, Vai trò (Role), Rank, Chỉ số thống kê (Stats), Trạng thái Online/Offline, Trạng thái tham gia (Confirmed/Backup).
*   **`Team`**: Đại diện cho một đội. Chứa danh sách `Member` và các yêu cầu về đội hình (`requirements` - ví dụ: cần 1 Tank, 2 DPS).
*   **`Area`**: Đại diện cho một khu vực chiến thuật (ví dụ: Team Trụ, Team Thủ, Team Công). Chứa danh sách các `Team`.
*   **`Weapon` & `Role`**: Hệ thống phân loại vũ khí và vai trò tương ứng (Tank, DPS, Support, Control, Flex, IGL).

### 3. Luồng xử lý chính (Main Workflows)
*   **Drag & Drop (Kéo thả):** Sử dụng HTML5 Drag & Drop API (`onDragStart`, `onDragOver`, `onDrop`). Dữ liệu truyền đi là chuỗi JSON chứa `memberId` và `sourceId` để xác định nguồn và đích đến.
*   **Filtering & Sorting:** 
    *   Sử dụng `useMemo` để tối ưu hóa việc tính toán danh sách thành viên hiển thị.
    *   Logic sắp xếp ưu tiên: Trạng thái tham gia (Confirmed lên đầu, Backup xuống cuối) -> Vai trò (Role) -> Tên (Alphabetical).
*   **Cảnh báo thời gian thực (Real-time Warnings):** Các hàm `hasMissingRequirements` và `hasOfflineMembers` liên tục kiểm tra state của `Team` để hiển thị cảnh báo (viền đỏ/cam) nếu đội hình không đạt yêu cầu hoặc có người offline.

---

## 📖 PHẦN 2: HƯỚNG DẪN SỬ DỤNG (USER MANUAL)

### 1. Tổng quan giao diện
Giao diện được chia làm 3 phần chính:
*   **Bảng điều khiển & Thống kê (Top/Left):** Chứa thanh tìm kiếm, bộ lọc tổng và bảng thống kê toàn cục.
*   **Danh sách chờ (Left Panel):** Hiển thị các thành viên chưa được xếp vào đội nào.
*   **Khu vực Đội hình (Right Panel):** Hiển thị các Khu vực (Area) và Đội (Team) để bạn sắp xếp.

### 2. Quản lý thành viên
*   **Xem thông tin:** Click vào biểu tượng bánh răng (Settings) trên thẻ thành viên để mở Modal chi tiết.
*   **Chỉnh sửa:** Trong Modal, bạn có thể thay đổi Rank, Vũ khí, và **Trạng thái tham gia (Chắc chắn / Dự bị)**.
*   **Nhận diện trực quan:**
    *   *Thành viên Offline:* Tên và icon vũ khí chuyển sang màu xám, nền có sọc chéo.
    *   *Thành viên Dự bị (Backup):* Viền thẻ thành viên là **nét đứt (dashed)** dày và đậm, luôn được xếp ở cuối danh sách.
    *   *Thành viên đã xếp nhóm (trong danh sách chờ):* Có thêm badge màu xanh lá hiển thị tên đội đang tham gia.

### 3. Sắp xếp đội hình (Xếp Team)
*   **Kéo thả (Drag & Drop):** Click giữ thẻ thành viên từ Danh sách chờ và kéo thả vào các ô trống trong Đội (Team) ở bên phải. Bạn cũng có thể kéo thả thành viên giữa các đội với nhau.
*   **Thêm nhanh:** Click chọn một Đội (viền đội sẽ sáng lên), sau đó bấm dấu `+` màu xanh trên thẻ thành viên ở Danh sách chờ để thêm nhanh vào đội đang chọn.
*   **Xóa khỏi đội:** Bấm biểu tượng thùng rác màu đỏ trên thẻ thành viên (khi ở trong đội) để đưa họ trở lại danh sách chờ.

### 4. Bộ lọc và Tìm kiếm (Filtering)
*   **Tìm kiếm:** Nhập tên vào ô tìm kiếm ở góc trái.
*   **Bộ lọc chi tiết:** Bấm vào biểu tượng Phễu (Filter) cạnh ô tìm kiếm để lọc theo: Vai trò, Vũ khí, Mức Rank, và Trạng thái tham gia (Confirmed/Backup).
*   **Lọc nhanh danh sách chờ:** Sử dụng các tab "Tất cả", "Đang Online", "Trận 1", "Trận 2" để lọc nhanh những người chưa có nhóm.

### 5. Lưu và Tải thiết lập (Save/Load)
*   **Lưu thiết lập:** Bấm nút "Lưu thiết lập nhóm" ở góc trên bên phải. Nhập tên cho thiết lập (ví dụ: "Đội hình giải mùa xuân").
*   **Tải thiết lập:** Bấm vào mũi tên trỏ xuống cạnh nút Lưu để xem danh sách các thiết lập đã lưu. Click vào một thiết lập để tải lại toàn bộ đội hình.
*   **Xóa thiết lập:** Bấm biểu tượng thùng rác cạnh tên thiết lập trong danh sách xổ xuống.

### 6. Quản lý Khu vực và Đội (Area & Team)
*   **Thêm Khu vực/Đội:** Bấm nút "Thêm nhóm mới" ở dưới cùng hoặc dấu `+` trên thanh tiêu đề của Khu vực.
*   **Đổi tên/Xóa:** Hover chuột vào tên Đội để hiện ra các nút Đổi tên (Cây bút) hoặc Xóa (Thùng rác).
*   **Xóa nhanh thành viên:** Bấm nút chổi quét (màu cam) trên thanh tiêu đề của Đội hoặc Khu vực để đưa toàn bộ thành viên trong đó về lại danh sách chờ.

---
*Tài liệu được cập nhật lần cuối: Tháng 03/2026*
