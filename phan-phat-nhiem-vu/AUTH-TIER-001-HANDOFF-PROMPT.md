# PHÂN PHÁT NHIỆM VỤ — Blueprint OS | AUTH-TIER-001

## Prompt bàn giao vào ChatGPT Project: Software Blueprint Hub OS

**ACTIVE NEXT ACTION — BLUEPRINT OS | AUTH-TIER-001 | CONSTITUTION AMENDMENT INTAKE, REVIEW AND DISTRIBUTION.**

Người sở hữu yêu cầu áp dụng chính sách tài khoản cho toàn hệ sinh thái theo 2 mô hình **AUTH-L1** (một tầng tài khoản người dùng ứng dụng, có thời hạn) và **AUTH-L2** (quản lý trung gian được ủy quyền phê duyệt tài khoản cấp dưới kiểu Bơi Ếch), với ngoại lệ `AUTH-PLANE` cho control/governance plane và `NOT-APPLICABLE` cho repo không có người dùng đăng nhập. `AUTH-L1/L2` là taxonomy mới, **không** phải Blueprint Level B1–B5 hoặc topology Level 0/1/2.

**Nguồn đã lưu tại repository:**
- `BlueDragon33/Software-Blueprint-Hub`, nhánh `proposal/auth-tiers-task-dispatch-20261107`
- `phan-phat-nhiem-vu/AUTH-TIER-001-constitutional-proposal.md` — normative draft, thẩm quyền, QA/gates, tác động.
- `phan-phat-nhiem-vu/AUTH-TIER-001-app-classification.draft.json` — đề xuất phân loại 15 governed repositories và rationale.
- `phan-phat-nhiem-vu/README.md` — mục lục gói giao nhiệm vụ và nguồn đối chiếu.

**Yêu cầu thực thi trong dự án Blueprint OS:**

1. Đọc lại HEAD `main` và bản Hiến pháp thực sự đang ACTIVE trong `Software-Blueprint-Hub`, cùng tất cả amendment/PR draft liên quan; không lấy giả định version từ chat. Tại lần rà soát 2026-11-07, `control/universal-constitution-version.json` khai báo **1.3.0** và PR #152–#156 còn draft/open; cần kiểm tra lại trước khi tiếp tục. Tách proposal này khỏi các thay đổi Next Action/reviewer đang chờ.
2. Tiếp nhận `AUTH-TIER-001` như **DRAFT** vào governance amendment lifecycle: DRAFT → impact reviewed → migration ready → ratification ready → human ratified → published → propagating → verified. Không sửa trực tiếp Hiến pháp active; không tự phê chuẩn bằng AI, nhãn CI hay chat.
3. Kiểm tra đủ 15 governed repos và danh mục `Application-Management/app/project-registry.ts`, so lại trạng thái sản phẩm, lập risk matrix. Không ép auth lên lib/engine/local core. Xác nhận candidate **AUTH-L2 duy nhất hiện tại: Bơi Ếch**; candidate **AUTH-L1** cho Bauman, Math, RU_LIFE, Health, GrowUP, PriceReport, PC Manager, NC03, MPC, Hardware Simulation, CAD. **Blueprint Hub/Application Management** thuộc AUTH-PLANE; **ROS** N/A. Mọi phân loại cần Project Owner validation, chưa ban hành từ JSON draft.
4. Rà soát các ràng buộc bất biến của đề xuất: quyền Owner ≠ delegated manager ≠ learner; account expiry/renewal per app; configurable role quotas/devices; mật khẩu salted slow hash không thể xem lại; MFA cho privileged mutations; app-owned D1/session/PII; consent-based cross-device sync với ACK/conflict/revoke; offline-first fail-safe; Cloudflare FREE nếu đã yêu cầu, không tự phát sinh dịch vụ trả phí.
5. Đặc biệt **không biến pilot Bơi Ếch thành luật cứng cho mọi app**. Bơi Ếch hiện yêu cầu **5 manager, 10 teacher, 200 learner, 3 devices/account, two approvals, verified sync** tại Issue #108; tất cả vẫn là tính năng ứng dụng chưa nghiệm thu/PUBLISH. Những app khác có quota, gia hạn, privacy và device constraints riêng.
6. Soạn amendment normative và machine-readable contract, template/project-profile fields, compatibility/deprecation, per-app migration work packages, automated tests + independent review. Trình **Human Constitutional Authority** phê chuẩn bản nguồn & chứng cứ chính xác. Chỉ sau phê chuẩn mới xuất bản version set và phát tán project-local execution prompts theo contract đã ký. Không thay đổi account/prod ngay do "adoption".
7. Chọn pilot AUTH-L1 (ưu tiên Bauman vì đã có device gate) và AUTH-L2 (Bơi Ếch #108) **sau khi** phân tích tác động; mỗi app cần Owner riêng, source PR riêng, Preview/QA thật, rollback, không merge/Production thiếu quyền.

**Quyền và giới hạn:** Bản ghi nhánh đề xuất này KHÔNG phải luật đã ban hành, production authorization, approval, hoặc QA PASS. Không chạy GitHub-hosted Actions, merge, publish, mua dịch vụ hoặc tạo website mới khi chưa có quyền và gate. Không dùng một database identity chung ép mọi app; Application Management chỉ cung cấp policy/control contract app-scoped và không thu dữ liệu chuyên môn.

**Kết thúc phiên Blueprint:** Báo cáo những gì đã đọc/sửa/kiểm thử thật, amendment revision, review/migration blockers và đúng **một Active Next Action**. Nếu chưa có nguồn hoặc chưa đủ human ratification, giữ trạng thái `DRAFT/BLOCKED` và bản Hiến pháp active hiện hành không đổi.
