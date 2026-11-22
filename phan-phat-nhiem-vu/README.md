# PHÂN PHÁT NHIỆM VỤ — Blueprint OS

**Vai trò của thư mục:** vùng tiếp nhận và bàn giao các đề xuất liên-dự-án cho dự án Blueprint OS. **Không** phải nơi ban hành Hiến pháp hoặc một "quyền ký" mới; chỉ lưu nguồn đề xuất, ma trận tác động và prompt handoff. Không tạo dashboard/scheduler/lớp điều phối mới.

## Gói đang có

| Mã | Chủ đề | Trạng thái | Tài liệu |
|---|---|---|---|
| `AUTH-TIER-001` | Mô hình tài khoản AUTH-L1/L2 cho hệ sinh thái | **DRAFT — chưa phê chuẩn / chưa phân phối áp dụng** | [Đề xuất sửa Hiến pháp](AUTH-TIER-001-constitutional-proposal.md) · [Ma trận phân loại 15 repository](AUTH-TIER-001-app-classification.draft.json) · [Prompt bàn giao Blueprint OS](AUTH-TIER-001-HANDOFF-PROMPT.md) |

## Cách chuyển sang dự án Blueprint OS

1. Mở `AUTH-TIER-001-HANDOFF-PROMPT.md`, sao chép nguyên prompt sang ChatGPT Project **Software Blueprint Hub OS**, hoặc gửi đường dẫn của nhánh này.
2. Blueprint OS đọc lại HEAD + Constitution ACTIVE/other drafts, xác định amendment hợp lệ; điều chỉnh matrix theo Project Profile + Owner, review độc lập.
3. Chỉ sau phê chuẩn và publication mới tạo project-local work packages/propagation và cập nhật app runtime từng repo dưới quyền cấp tương ứng.

## Phân cấp nguồn sự thật

- **Normative active:** `docs/UNIVERSAL-CONSTITUTION.md` + `control/universal-constitution.contract.json` + version/template set đã được xuất bản hợp lệ, không phải các file trong thư mục này.
- **Amendment authority:** `docs/CONSTITUTION-AUTHORITY-PROTOCOL.v1.md`. Không tự phát hành dựa trên prompt hoặc commit.
- **Repo registry:** `control/constitution-governed-repositories.json` và `Application-Management/app/project-registry.ts`; 15 repo là một snapshot tại 2026-11-07, không phải danh sách vĩnh viễn.
- **Pilot AUTH-L2:** `BlueDragon33/BOIECH_AI` Issue [#108](https://github.com/BlueDragon33/BOIECH_AI/issues/108), chưa nghiệm thu và chưa phát hành Account-first V2.

**Tránh lẫn namespace:** AUTH-L1/L2 (mô hình tài khoản) khác Blueprint B1–B5 (mức kỹ thuật) và topology Level 0–2 (sơ đồ ứng dụng). Trong hệ local-first/ROS core, không bắt buộc cloud account chỉ để đạt compliance.

## Nguyên tắc thực thi

- Không chiếm quyền của Project, Production, Constitutional Human Approval.
- Không tự chạy hosted Actions, merge, ratify, deploy hoặc dịch vụ trả phí.
- Không khai báo PASS nếu thiếu Preview/runtime/migration/UX/Reviewer; giữ draft hoặc BLOCKED trung thực.
- Mỗi gói giao nhiệm vụ có một mã ổn định, owner/scope/impact và một Next Action rõ; không phát tán prompt thành luật.
