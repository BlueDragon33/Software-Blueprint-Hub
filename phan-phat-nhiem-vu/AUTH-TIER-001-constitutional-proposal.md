# AUTH-TIER-001 — Đề xuất sửa đổi Hiến pháp Blueprint OS về tài khoản ứng dụng

> **DRAFT / CHƯA BAN HÀNH** — Ngày 2026-11-07. Không phải Universal Constitution, machine contract, project grant, CI PASS hay Production release authority. Chỉ đội Blueprint OS được cấp quyền mới có thể đưa qua quy trình phê chuẩn.
>
> Baseline quan sát: `control/universal-constitution-version.json` và `docs/UNIVERSAL-CONSTITUTION.md` khai báo **1.3.0** trên `Software-Blueprint-Hub/main`. Các PR draft Hiến pháp đang mở và có thể ảnh hưởng tên phiên bản đích. **Không tự ấn định 1.4.0/1.5.0**, không ghi đè các candidate khác.

**Mã:** `AUTH-TIER-001`
**Đề xuất điều khoản thuộc:** Data / UI-UX / Security / Operations / Governance & Evolution (cũng liên quan QA).
**Vấn đề:** Mỗi app đang có Device Gate, session, expiry, policy và quản trị khác nhau. Không có mô hình phân phối tài khoản được phân loại chung, dẫn tới nguy cơ trộn quyền Owner với quản lý nội bộ, tăng chi phí, mất đồng bộ và vô tình ép cloud-login cho sản phẩm local-first.
**Mục tiêu:** Đưa **mô hình tham chiếu có điều kiện** vào Universal Constitution; cụ thể hóa ở từng Project Profile; phân phối theo rủi ro, không biến mẫu Bơi Ếch thành luật áp dụng nguyên xi cho mọi app.

## 1. Hai cấp độ tài khoản người dùng (taxonomy độc lập)

**`AUTH-L1` — Một cấp tài khoản người dùng ứng dụng có thời hạn.**
- Sơ đồ: `Application Management (app-scoped policy/Owner) → user account → application-owned session/data`.
- Chỉ có một tầng người dùng sử dụng. Owner/Operations quản lý cấp phép, thời hạn, thiết bị và quyền ứng dụng, **không phải** một "cấp người dùng" trung gian.
- Mỗi account có ID bền vững, trạng thái rõ (`requested/pending/active/expired/suspended/archived`), thời điểm bắt đầu/hết hạn và cơ chế gia hạn/thu hồi. Việc đổi thiết bị không tạo người dùng mới.
- Hạn mức tài khoản, thời hạn, quota thiết bị, auto-renew/auto-approval mặc định fail-closed **do Owner cấu hình trên giao diện theo hợp đồng app-scoped** và nhật ký, không hard-code chung. Nếu app chưa có managed account hoặc vận hành local-first thì để **managed-auth OPTIONAL/OFF** tới khi có requirement và evidence; không chặn core offline.
- Không phát sinh "quản lý cấp dưới" chỉ vì có roles cục bộ như editor/viewer hay cha mẹ quản lý dữ liệu của con mình. Chỉ tạo tầng quản lý khi được công nhận là authority phê duyệt account của người khác.

**`AUTH-L2` — Hai cấp tài khoản người dùng, qua quản lý trung gian.**
- Sơ đồ: `App Owner/Quản trị ứng dụng → delegated manager → learner/teacher/member`.
- Quản lý trung gian có `scope` theo lớp/đơn vị/nhóm; được xét duyệt và được cấp quyền riêng mới quản lý tài khoản cấp dưới. Không tự tạo quyền Owner, không tự cấp scope hay chạm secret/mật khẩu/host settings.
- Mặc định quá trình vào ứng dụng phải có **hai cổng nghiệp vụ tách biệt**, như Bơi Ếch: (1) xét yêu cầu cấp tài khoản/đăng nhập onboarding, (2) điền hồ sơ và xét kích hoạt chức năng. Ai duyệt từng cổng được cấu hình theo hierarchy; người yêu cầu không thể tự duyệt; quản lý trung gian không duyệt quản lý cùng/hơn cấp.
- Các quyền duyệt nhân sự, phân công, chứng nhận hoặc nghiệp vụ chỉ có ở app tương ứng. **Quyền duyệt account ≠ quyền quản lý thiết bị/tài chính/hệ thống**. Mọi mutation kiểm tra server scope và audit.
- Nếu app không có nghiệp vụ manager thực sự thì **không** chọn AUTH-L2 chỉ vì có nhiều loại người dùng.

**Ngoại lệ phân loại:** `AUTH-PLANE` (Blueprint Hub, Application Management) có thẩm quyền governance/control-plane riêng; `NOT-APPLICABLE` cho thư viện, công cụ chưa có diện người dùng đăng nhập. Không áp đặt hai cấp người dùng cho hai nhóm này. Nhóm chưa có managed account nhưng phù hợp L1 có thể gắn `managed-optional`, giữ `offline-local` hoạt động nguyên vẹn.

> **Không nhầm:** `AUTH-L1/L2` không phải Blueprint Levels `B1–B5` hay topology level `LEVEL 0/1/2` trong Application Management.

## 2. Bất biến bảo mật và bảo toàn dữ liệu

1. **App-scoped ownership:** dữ liệu hồ sơ, tiến độ, chứng nhận, thiết bị, session và quyền của người dùng thuộc ứng dụng sở hữu. Application Management chỉ phát hành cấu hình/phê duyệt qua typed scoped contracts, không nhân bản bảng hồ sơ, mật khẩu, video, health, passport hay tài chính. Không tạo một database/tài khoản global mặc định; SSO dùng chung chỉ khi được thiết kế riêng với security review.
2. **Credential:** mật khẩu lưu salted slow hash phù hợp tài nguyên runtime, không xem lại, không được phép trả qua UI/API/log/export; chỉ reset bằng recovery/mời dùng một lần. `personId/accountId` không là bí mật. Secret từng app có owner riêng. Session short-lived, revoke ngay server, rate-limit, CSRF/same-origin; Manager/Owner step-up MFA cho quyền nhạy cảm.
3. **Time-limited entitlement:** `starts_at/expires_at`, timezone UTC, lịch sử gia hạn/revoke, chủ sở hữu quyết định default duration trong UI. `expired` chặn hoạt động managed được bảo vệ ở server; không bí mật kéo dài bằng local storage. App local-first phải có degraded/offline mode được Project Profile chấp thuận để không phá tính độc lập local.
4. **Quotas:** per-app `maxUsersByRole/maxActiveDevices/defaultDuration`, version CAS, owner authenticated, audit/readback, atomic DB guard chống concurrent overbooking. Không sao chép `5 manager/10 teacher/200 learner` của Bơi Ếch sang app khác. Không tự gia hạn, tăng quota hay chuyển sang plan trả phí.
5. **Device scope:** với managed app có multi-device, khuyến nghị khởi điểm **3 thiết bị/account** chỉ sau capacity/risk assessment từng app, có trang tự gỡ, chặn device #4 và phiên hạn chế để quản lý thiết bị sau xác thực lại. Không lầm browser fingerprint thành định danh quyền và không tự revoke một device khác.
6. **Consent-based sync:** đồng bộ thiết bị qua máy chủ sở hữu, không chuyển trực tiếp dữ liệu giữa thiết bị; user xác nhận thiết bị mới, phạm vi sync và những thay đổi nhạy cảm. Event idempotent + ACK + revision/CAS + conflict review + offline queue. Không tự động đồng bộ toàn bộ media/PII. Revoke device chặn quyền truy cập mới; không hứa xóa được dữ liệu đã tải xuống thiết bị đang offline.
7. **Data governance:** tách thông tin nhận dạng khỏi dữ liệu chuyên môn, minimization/retention/export/delete, backup và restore đã diễn tập, bảo vệ trẻ em và dữ liệu sức khỏe; không tự đưa dữ liệu vào app trung tâm.
8. **Release:** ở mỗi app bắt buộc kiểm thử sai quyền, expired access, device fourth/overbook, recovery, migration, browser/mobile, local/offline, data isolation, API origin và cost Free thực tế; nêu trạng thái `NOT_RUN/BLOCKED` đúng sự thật. Không tự merge, bật flag, publish hay sử dụng dịch vụ paid từ constitutional adoption.

## 3. Project Profile/contract đề xuất (không phải schema đã được ban hành)

```json
{
  "accountModel": "AUTH-L1 | AUTH-L2 | AUTH-PLANE | NOT-APPLICABLE",
  "managedMode": "required | optional | not-applicable",
  "accountAuthority": "app-owned",
  "ownerPolicyBoundary": "application-management:app-scoped",
  "userEntitlement": { "expiryPolicy": "app-configured", "renewalPolicy": "owner-approved" },
  "deviceLimit": { "max": "app-configured", "firstLinkApproval": true },
  "sync": { "enabled": "app-specific", "consent": "required-when-applicable" },
  "managerDelegation": { "enabled": "AUTH-L2 only", "scope": "explicit", "onboardingReview": "two-stage" },
  "localCore": { "mustRemainUsableIfRequiredByExistingProfile": true },
  "rollout": { "defaultFlag": "OFF", "requiredEvidence": ["security", "migration", "ux", "runtime", "cost"] }
}
```

Không áp schema này lên Production trước khi Blueprint review + machine contract migration được thông qua. Nếu thiết bị không hỗ trợ multi-device, trường deviceLimit được giải thích trong Project Profile; không giả định có cloud sync.

## 4. Ma trận các repository hiện trong phạm vi quản trị

Nguồn: `control/constitution-governed-repositories.json` (15 repositories) và `Application-Management/app/project-registry.ts`; bổ sung mô tả README theo repository. Bản máy đọc kèm theo ở `AUTH-TIER-001-app-classification.draft.json`.

| Repo/app | Đề xuất | Lý do / Điều kiện |
|---|---|---|
| `BOIECH_AI` | **AUTH-L2** | Có cán bộ duyệt học viên/giảng viên và điều phối lớp; #108 đang là pilot chưa nghiệm thu |
| `Bauman-master-ai-system` | AUTH-L1 | Học tập cá nhân; có thể lên L2 nếu bổ sung lớp/giảng viên quản lý account thực |
| `RU_LIFE` | AUTH-L1 tùy chọn | PWA hỗ trợ cá nhân, hiện không có form login trực tiếp; không phá offline |
| `Math_Bauman` | AUTH-L1 tùy chọn | Môn học độc lập, không có middle manager |
| `Health_Care` | AUTH-L1 tùy chọn, bảo mật cao | Sức khỏe trẻ em, guardian/consent không đồng nhất manager học vụ |
| `GrowUP_MyChildren` | AUTH-L1 tùy chọn, bảo mật cao | Nhiều hồ sơ trẻ trong gia đình vẫn là 1 phạm vi gia đình, không tự phát tán |
| `PriceReport_Tunggiabao` | AUTH-L1 tùy chọn | Standalone local-first; cân nhắc L2 nếu có trưởng bộ phận duyệt nhân viên thật |
| `pc-manager-desktop` | AUTH-L1 tùy chọn | Device entitlement + agent outbound-only; không remote shell |
| `NC03_Modem` | AUTH-L1 tùy chọn | Không lẫn account app với credential của modem thực |
| `MPC_PID_System` | AUTH-L1 tùy chọn | Workbench cá nhân; chỉ cần login khi có hosted workspace |
| `Hardware_Simulation` | AUTH-L1 tùy chọn | Prototype/engine mô phỏng vẫn offline |
| `CAD_CAM_3D` | AUTH-L1 tùy chọn | Managed entitlement không lấy quyền với file CAD local |
| `ROS-1-2` | NOT-APPLICABLE | Thư viện ROS, chưa có tầng người dùng cần login |
| `Application-Management` | AUTH-PLANE | Trung tâm điều phối policy/Owner, không là user app |
| `Software-Blueprint-Hub` | AUTH-PLANE | Thẩm quyền hiến pháp/QA/publication không được suy ra từ cấp tài khoản |

**Phân loại là kiến nghị, chưa phải assigned law.** Mọi repo/module được thêm sau ngày kiểm kê phải tham gia onboarding và xác nhận case-by-case. Các module `subjects/*` trong Bauman không tự tạo người dùng quản lý độc lập.

## 5. Quy trình phân phối nhiệm vụ và chứng cứ bắt buộc

| Thứ tự | Nơi/cấp chủ trì | Đầu ra |
|---|---|---|
| P0 | Blueprint Hub Constitutional Authority | Đọc HEAD, reconcile PR v1.4/draft mở, phân tích hiện trạng; xác nhận amendment identity, phạm vi và version class |
| P1 | Blueprint Hub | Draft văn bản normative + machine contract + Project Profile account-model field + threat-model/impact matrix |
| P2 | Independent reviewers / Owner | Security + privacy + offline + cost + migrations + cross-project impact review; không fake acceptance |
| P3 | Human Constitutional Authority | Phê chuẩn chính xác revision/evidence; sau đó publish bộ version thống nhất và propagate |
| P4 | Application-Management | UI config account model, time limit, quota, issuer/scope, approval delegation app-scoped, audit + CAS; không đọc nghiệp vụ |
| P5 | AUTH-L2 pilot: BOIECH_AI | Hoàn tất #108, two-review, confirmed-sync, 3 devices, 5/10/200; review độc lập và Cloudflare Preview Free QA |
| P6 | AUTH-L1 pilot: Bauman | Pilot tài khoản đơn cấp có thời hạn, kiểm chứng device/expiry/local mode; không lẫn role AI/học tập |
| P7 | Các governed repo còn lại | Mỗi project nhận projection riêng từ contract và profile, áp dụng sau review; giữ local-first/security gates |
| P8 | Blueprint Hub governance/QA | Version adoption readback, tests, audit, evidence; Production release khác biệt và cần quyền riêng |

### Chốt các câu hỏi cần Human Review
- Có app nào thực sự cần lớp manager trung gian nhưng chưa xuất hiện trong inventory? Nếu không, mặc định L1/optional.
- Time limit mặc định từng app là gì, ai quyết định thời hạn, gia hạn ở UI nào? Không ép một số ngày chung.
- Device cap 3 là recommended baseline hay bắt buộc cho từng managed client? Cần xem loại app, offline impact, resource budget.
- Liệu AUTH-L2 cần luôn 2 bước phê duyệt như Bơi Ếch hay có profile đã xác minh bằng nguồn uy tín khác? Nếu ngoại lệ, phải có human-reviewed equivalence và audit.
- Ranh giới app owner / Application Management / SSO cần giữ độc lập thế nào khi một người dùng đăng nhập nhiều apps?

## 6. Không được làm trong giai đoạn này
- Không ghi đè `docs/UNIVERSAL-CONSTITUTION.md`, `control/universal-constitution.contract.json`, `control/universal-constitution-version.json`, generated template.
- Không tự chọn số phiên bản kế tiếp, ratify, tạo fake review, merge/publish hoặc chạy hosted Actions tốn phí.
- Không tạo database/website mới hoặc thay slug; không bật giao diện login mới vào các app offline-only.
- Không đổi Production, subscription, paywall, session, device grant, canonical schema của bất kỳ app nào từ gói đề xuất này.
