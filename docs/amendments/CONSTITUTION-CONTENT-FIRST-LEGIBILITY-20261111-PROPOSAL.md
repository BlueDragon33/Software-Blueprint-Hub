# Blueprint OS — CONTENT-FIRST-001 | Đọc rõ nội dung trên mọi bề mặt

**Trạng thái:** PROPOSED / NOT RATIFIED / NOT PUBLISHED / NOT ADOPTED.
**Hiến pháp đang có hiệu lực:** Blueprint OS 1.3.0, Điều 4 UI/UX và Điều 11 Computed contrast and legibility.
**Chủ sở hữu quy phạm:** `BlueDragon33/Software-Blueprint-Hub`. **Ngày dự thảo:** 2026-11-11.
**Loại thay đổi:** củng cố Điều 11 đang có hiệu lực; **không** tạo một Hiến pháp/registry/gate cạnh tranh, không tự ấn định R-number hay phiên bản 1.4.x khi #153/#155/#156/#158 chưa được hòa giải.

## 1. Mệnh lệnh thiết kế — NỘI DUNG TRƯỚC, NỀN SAU

> **Người dùng mở ứng dụng và tài liệu để đọc và thao tác với nội dung, không phải để ngắm nền.** Văn bản, số liệu, trạng thái, chỉ dẫn và hành động quan trọng phải đọc được ngay, nổi bật hơn nền; nền, hình ảnh, gradient, hiệu ứng, kính mờ và trang trí chỉ có vai trò hỗ trợ.

- **Cấm** tổ hợp chữ/nền cùng tông hoặc gần giống về độ sáng khiến nội dung chìm; không chọn màu chữ chỉ theo sở thích thẩm mỹ. Không làm chữ mờ, opacity thấp, phông quá mảnh/nhỏ hay đặt chữ ngay trên vùng ảnh nhiễu để tạo “sang trọng”.
- Ưu tiên phân cấp nội dung thật: tiêu đề, thông tin chính, số liệu, cảnh báo, nhãn trường và nút hành động dễ nhận biết; nội dung thứ cấp có phân cấp nhưng **vẫn phải đọc được**. Đừng biến toàn bộ văn bản thành màu nhạt và đừng đặt hình nền cạnh tranh thị giác với nội dung.
- Khi giao diện có ảnh/gradient/video, sử dụng **vùng nền chữ đồng nhất hoặc scrim** đủ độ tương phản, và đo trên kết quả chồng lớp thực tế; nếu không bảo đảm, chuyển về nền đơn sắc dễ đọc.
- Chế độ sáng/tối/auto, high contrast, màn hình nhỏ, zoom, in ấn, PDF hoặc tài liệu xuất ra phải giữ tính dễ đọc. Không cho một CSS global, theme token hay overlay vô tình đảo tương phản.

## 2. Mức tối thiểu — kế thừa Điều 11, không nhân đôi ngưỡng

Tham chiếu duy nhất: `control/universal-constitution.contract.json#computedContrast` và `gate:ux:commercial-quality` trên Hiến pháp đã publish.

- Chữ thông thường **>= 4.5:1**; chữ lớn **>= 3:1** (thông thường >= 24 CSS px hoặc đậm >= 18.67 CSS px); đường biên điều khiển, trạng thái và hình minh họa có ý nghĩa **>= 3:1**, theo ngoại lệ hợp lệ của WCAG 2.2 AA.
- Nội dung phải mang nghĩa không được chỉ dùng màu để phân biệt: dùng nhãn chữ, biểu tượng và trạng thái có thể hiểu độc lập.
- Không sử dụng ngoại lệ cho disabled/decoration/logo để che giấu nội dung bắt buộc, nhãn trường hay thông báo quan trọng. Placeholder dùng làm thông tin cần đọc **không được coi như decorative text**.
- Ưu tiên mức dự phòng vượt ngưỡng tại vùng chữ dài, chữ nhỏ và ảnh phức tạp, vì răng cưa/anti-aliasing có thể làm cảm nhận tương phản kém hơn tỷ lệ CSS lý thuyết.

## 3. Phạm vi bắt buộc trong các ứng dụng có giao diện

Đối chiếu từng **bề mặt và trạng thái thực sự có sử dụng**, không chỉ trang chủ:
1. Nội dung chính: heading, paragraph, hướng dẫn, nội dung học, tài liệu dài, số liệu KPI, bảng, biểu đồ, nhãn trục/legend, ô trống/zero.
2. Tương tác: nút, liên kết, tab, sidebar, menu, dropdown, ô nhập, placeholder, tooltip, toast, modal/pop-up, bảng nhân sự, màn hình đăng nhập/đăng ký.
3. Trạng thái: bình thường, hover, focus-visible, selected, active, error, warning, success, loading, disabled, empty, permission denied, offline, stale/rollback.
4. Thiết bị/chế độ: desktop, tablet, điện thoại (bao gồm 320–430px), responsive zoom, dark/light/system, high contrast khi hỗ trợ; tài liệu in/PDF/export và chế độ offline khi tính năng có hỗ trợ.
5. Theme nhiều lớp: đo màu chữ và **nền cuối cùng đã compositing** sau opacity, gradient, backdrop, image, pseudo-elements và CSS overrides; thử điểm/vùng xấu nhất, không dựa vào khai báo token đơn lẻ.

Chỉ đánh dấu **NOT_APPLICABLE có lý do** với dịch vụ thực sự headless hoặc bề mặt không tồn tại; không giả vờ rằng mọi repo cần một UI riêng. Không được kết luận toàn bộ ứng dụng PASS từ một trang hoặc một ảnh chụp.

## 4. Quy trình QA, phát hiện lỗi và nghiệm thu

- Tái hiện lỗi bằng nội dung thực tế và screenshot được **che thông tin riêng tư**, ghi route/component, viewport, theme/state, foreground, background cuối cùng, tỷ lệ đã đo và exact source SHA.
- Test tự động phải đo `getComputedStyle`, phát hiện độ trong suốt và nền ghép lớp, và kiểm tra vùng ảnh/gradient; không tự “PASS” khi không xác minh được màu nền cuối. Kết hợp screenshot diff và kiểm tra bởi người sử dụng, vì toán học đúng chưa bảo đảm nội dung ưu tiên/nhìn dễ đọc.
- Thử nghiệm âm tính: dark-on-dark, light-on-light, opacity thấp, bảng chọn dòng bị chìm, modal overlay, disabled không được dùng để giấu thông tin quan trọng, tooltip bị override, dark/light chuyển theme và nền hình ảnh.
- **Release-blocking UX** cho giao diện mới hoặc vừa thay đổi: thiếu kiểm thử hoặc không đủ tương phản => FAIL/UNVERIFIED và không tự phát hành; sửa tối thiểu tại token/component sở hữu, không đắp hàng loạt `!important`.
- Các ứng dụng cũ: tạo Work Package theo mức độ ảnh hưởng P0/P1 trước; sửa theo từng lát cắt, bảo toàn dữ liệu, phân quyền, CSS, layout và trạng thái offline; chỉ quảng bá đã sửa sau khi QA đúng SHA và Owner nhìn thấy, dùng được.

## 5. Machine contract, migration và cổng quyền

- Candidate machine contract: `control/content-first-legibility.candidate.v1.json`. Đây chỉ là phần **mở rộng yêu cầu đánh giá** của Điều 11, không thêm một Quality Gate, reviewer, role, ProjectProfile hay database.
- Dùng Hub làm nguồn luật duy nhất. Ứng dụng **kế thừa** quy tắc sau ratification/publication theo quy trình hiện hữu; repo ứng dụng chỉ giữ code, theme tokens, test và bằng chứng theo đúng sản phẩm.
- Mỗi ứng dụng có GUI phải nộp ma trận các route/state/device/theme quan trọng: số lượng bề mặt thực kiểm, FAIL, UNVERIFIED, PASS tại SHA; headless được N/A có giải thích. Không giả mạo 18/18 hoặc chi phí FREE nếu chưa kiểm chứng từng ứng dụng.
- Đối chiếu cùng gói sửa đổi Hiến pháp đang mở (#153/#155/#156/#158) về version/ID trước ratification; **không tự sửa** `docs/UNIVERSAL-CONSTITUTION.md`, `control/universal-constitution.contract.json`, `control/universal-constitution-version.json`, locked template, Production hoặc adoption ledger trong đề xuất này.
- Cổng trước khi có hiệu lực: impact review → machine-contract/test review → reviewer A/B độc lập trên exact SHA → QA người dùng và khả năng hoàn nguyên → Human Constitutional Authority phê chuẩn exact revision → xuất bản version set có thẩm quyền → adoption theo từng app. Không tự phê chuẩn.

**Văn bản đề xuất chèn vào Điều 11 sau ratification:**

> **Content-first legibility.** On every user-facing screen and controlled document export, the content is primary and the background is subordinate. Render all meaningful text, numbers, messages, controls and states with measured, readable foreground-to-final-background contrast and clear information hierarchy. Dark-on-dark, light-on-light, low-opacity essential content, unreadable modal/table/form labels, and decorative media that obscure reading are forbidden. Verify actual rendered surface and critical states across supported themes, devices and outputs; treat insufficient or unverified contrast as a UX release blocker. Inherit the existing WCAG 2.2 AA ratios and the existing `gate:ux:commercial-quality`, with no duplicate authority or inferred portfolio compliance.
