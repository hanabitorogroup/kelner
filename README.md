# kelner — Biểu mẫu tuyển dụng KING LONG

Biểu mẫu (form) khảo sát online để sàng lọc ứng viên cho vị trí **Nhân viên phục vụ
(Pracownik Obsługi)** tại nhà hàng **KING LONG – Azjatycki Smak**
(Oława / Wrocław).

- Ứng viên điền form bằng **tiếng Ba Lan** trên điện thoại/máy tính.
- Form **tự động chấm điểm** và phân loại: **Odpowiedni** (Phù hợp) /
  **Do rozważenia** (Cân nhắc) / **Nieodpowiedni** (Không phù hợp).
- Mỗi lượt nộp được gửi về **Google Sheet** của bạn để xem/lọc/xếp hạng.
- Ứng viên **không thấy điểm** — chỉ thấy màn hình cảm ơn.

---

## 1. Cấu trúc dự án

```
index.html            # Trang form (giao diện)
assets/styles.css      # Giao diện, màu thương hiệu KING LONG
assets/form.js         # Câu hỏi + logic chấm điểm + gửi kết quả
assets/config.js       # *** File DUY NHẤT bạn cần sửa: dán link Google Script ***
apps-script/Code.gs    # Code cho Google Apps Script (backend nhận dữ liệu)
.nojekyll              # Giúp GitHub Pages phục vụ đúng thư mục assets/
```

Muốn **đổi câu hỏi hoặc điểm**: sửa `FORM_CONFIG` trong `assets/form.js`.

---

## 2. Thiết lập Google Sheet (nơi nhận câu trả lời)

1. Vào https://sheets.google.com → tạo **một bảng tính mới** (ví dụ đặt tên
   "Rekrutacja KING LONG").
2. Trong bảng tính đó, mở menu **Tiện ích mở rộng (Extensions) → Apps Script**.
3. Xóa hết code mẫu, **dán toàn bộ nội dung file `apps-script/Code.gs`** vào.
4. Bấm **Lưu** (biểu tượng đĩa mềm).
5. Bấm **Triển khai (Deploy) → Bản triển khai mới (New deployment)**.
   - Ở "Chọn loại" (bánh răng) → chọn **Ứng dụng web (Web app)**.
   - **Thực thi với tư cách (Execute as):** *Tôi (Me)*.
   - **Ai có quyền truy cập (Who has access):** *Bất kỳ ai (Anyone)*.
   - Bấm **Triển khai**, cấp quyền (Authorize) cho tài khoản Google của bạn.
6. Copy đường link **Web app URL** dạng:
   `https://script.google.com/macros/s/AKfyc..../exec`

> Lưu ý: cần chọn **Anyone** thì trình duyệt của ứng viên mới gửi được dữ liệu.
> Bảng tính vẫn riêng tư — chỉ mình bạn xem được nội dung.

---

## 3. Gắn link vào form

Mở `assets/config.js`, dán link vừa copy vào giữa hai dấu nháy:

```js
window.KELNER_CONFIG = {
  endpointUrl: "https://script.google.com/macros/s/AKfyc..../exec"
};
```

Lưu lại. (Nếu để trống, form vẫn chạy và hiện màn hình cảm ơn, nhưng **không**
gửi dữ liệu về Sheet.)

---

## 4. Đưa form lên mạng (GitHub Pages — miễn phí)

1. Trên GitHub, vào repo này → **Settings → Pages**.
2. Mục **Build and deployment → Source**: chọn **Deploy from a branch**.
3. Chọn nhánh **main** (hoặc nhánh bạn đã merge vào), thư mục **/ (root)** →
   **Save**.
4. Đợi 1–2 phút. GitHub sẽ cho link dạng:
   `https://<tên-tài-khoản>.github.io/kelner/`
5. Gửi link đó cho ứng viên là xong.

---

## 5. Cách chấm điểm hoạt động

- Mỗi đáp án có điểm **0 / 1 / 2**. Câu hỏi thông tin (tên, SĐT, địa điểm) không tính điểm.
- Một số đáp án là **"knockout"** (loại thẳng) vì đi ngược yêu cầu cốt lõi của công việc,
  ví dụ: *"không muốn dọn dẹp/rửa bát"*, *"không thích tiếp xúc khách"*,
  *"không định làm sổ sức khỏe (książeczka sanepidowska)"*, *"giờ làm không phù hợp"*.
  Chọn bất kỳ đáp án knockout nào → tự động **Nieodpowiedni**.
- Nếu không dính knockout, phân loại theo **% tổng điểm**:

  | Kết quả          | Điều kiện        |
  |------------------|------------------|
  | **Odpowiedni**   | ≥ 80%            |
  | **Do rozważenia**| 55% – 79%        |
  | **Nieodpowiedni**| < 55%            |

- Muốn đổi ngưỡng: sửa `THRESHOLDS` trong `assets/form.js`.
- Trong Google Sheet, xem cột **Klasyfikacja** để lọc nhanh; cột
  **Powód odrzucenia** cho biết lý do bị loại.

Mẹo: trong Sheet dùng **Dữ liệu → Tạo bộ lọc**, lọc cột `Klasyfikacja = Odpowiedni`
để chỉ xem ứng viên phù hợp, rồi sắp xếp theo cột `Wynik %` giảm dần.

---

## 6. Kiểm tra trước khi dùng

1. Mở link GitHub Pages, điền thử một lượt và bấm **Wyślij ankietę**.
2. Mở Google Sheet → phải thấy một dòng mới với đầy đủ câu trả lời + điểm.
3. Nếu chưa thấy: kiểm tra lại `endpointUrl` trong `config.js` và quyền truy cập
   **Anyone** ở bước triển khai Apps Script.
