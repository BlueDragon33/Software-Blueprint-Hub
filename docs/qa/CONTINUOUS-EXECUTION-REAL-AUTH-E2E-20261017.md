# Blueprint OS R15–R32: REAL authenticated browser preflight acceptance

**Scope:** optional, non-CI, localhost-only E2E against a disposable `blueprint_qa_test` PostgreSQL database. This document is an executable test procedure, **not** a Constitution amendment or quality signoff.

## Why the ordinary CI does not count as authenticated acceptance

CI runs Next.js + Chromium against a real disposable DB to prove that anonymous visitors have no approval button and untrusted HTTP Origin requests fail. Synthetic Principal fixtures validate authorization and append-only CAS. Neither substitutes for an actual external Auth.js/App-Manager SSO session for an authenticated Owner, Editor and Viewer. The pinned App-Manager SSO callback is not a local fake login endpoint.

The separate opt-in `playwright.real-auth.config.ts` **never** launches an impersonation server, issues JWTs, seals SSO cookies, grants roles, or enters Production. The suite fails before tests if an independent login, the correct Profile, or a disposable runtime is unavailable.


## Windows 11 — hướng dẫn ngắn, không cần sửa mã nguồn (17/10/2026)

**Bắt đầu từ đây, không đặt mật khẩu trong ChatGPT:** chỉ sử dụng máy Windows của bạn. Nút kiểm tra dùng lệnh **chỉ đọc** mới: `node scripts/continuous-localhost-precheck.mjs`. Lệnh này chỉ dò công cụ, HEAD cục bộ, cổng TCP của PostgreSQL, trạng thái HTTP localhost và sự tồn tại của ba tệp phiên ở **ngoài** repository; không đăng nhập hộ, không truy cập nội dung tệp phiên, không ký issuer, không tạo dự án và không sửa DB.

### Windows non-admin — xử lý pnpm EPERM mà không ghi Program Files

Nếu `corepack enable pnpm` báo `EPERM` tại `C:\\Program Files\\nodejs\\pnpx`, **không cần Administrator và không chạy lại lệnh này**. Xác minh phiên bản bằng `corepack pnpm --version` ngay trong repository; kết quả mong muốn là `12.4.0`. Lệnh tiền kiểm từ PR #147 mới sẽ xác nhận `[OK] pnpm` bằng cách kiểm tra cả `pnpm --version` lẫn phiên bản Corepack có sẵn trong cache; probe tự giới hạn `COREPACK_ENABLE_NETWORK=0` và `COREPACK_ENABLE_AUTO_PIN=0` để không tự tải gói hay chỉnh package.json. Nếu chưa được cache, chỉ bật/tải Corepack trong một bước người dùng quyết định ở shell riêng, không dùng tiền kiểm để cài đặt.

Khi `pnpm` chưa nằm trong PATH, dùng `corepack pnpm install --frozen-lockfile`, `corepack pnpm prisma:generate` và `corepack corepack pnpm --filter @blueprint-os/web dev` cho các bước vận hành tiếp theo, thay cho `pnpm ...` trực tiếp. Không cần thiết lập shim hoặc ghi `Program Files`.

### Bước 1 — Chuẩn bị bộ công cụ và mã nguồn đúng Draft PR

Cài **Git for Windows**, **Node.js 24**, **pnpm 12.4.0 qua Corepack**, và **PostgreSQL 16 hoặc Docker Desktop** từ nhà cung cấp chính thức. Nếu đã có các công cụ, không cài lại. Mở **Windows PowerShell**:

```powershell
git clone https://github.com/BlueDragon33/Software-Blueprint-Hub.git
cd Software-Blueprint-Hub
git switch feature/universal-goal-continuity-next-action-candidate
git rev-parse HEAD
node --version
corepack pnpm --version
node scripts/continuous-localhost-precheck.mjs
```

Nếu đã clone từ trước, chỉ chạy `git status` rồi `git switch feature/universal-goal-continuity-next-action-candidate`. **Không `git reset --hard`, không merge, không xóa tệp chưa commit.** Đối chiếu HEAD với checkpoint ở PR #147 (có thể tiến lên do sửa lỗi); đừng nhầm với `main`.

### Bước 2 — PostgreSQL dùng riêng, tuyệt đối không đụng dữ liệu thật

Cách dễ cho người mới: trong **pgAdmin 4** hoặc công cụ quản trị PostgreSQL đang có, dùng server **local** `127.0.0.1:5432`; tạo một database mới tên **`blueprint_qa_test`**. Không đổi tên DB Production, không chạy migrate trên DB khác. Hãy đảm bảo database này **đã trống hoặc dùng riêng cho kiểm thử**, chứ không chứa hồ sơ đang sử dụng. Dùng tài khoản PostgreSQL thử nghiệm, không dùng mật khẩu DB Production.

Trong PowerShell tại thư mục repo, tạo biến môi trường ở **phiên shell hiện tại** (thay bằng thông tin tự bạn biết; không dán giá trị vào chat/Git):

```powershell
$env:DATABASE_URL = 'postgresql://<local-qa-user>:<private-password>@127.0.0.1:5432/blueprint_qa_test'
corepack pnpm install --frozen-lockfile
corepack pnpm prisma:generate
corepack pnpm db:migrate:status
corepack pnpm db:migrate:deploy
```

Dấu `<...>` là chỗ bạn tự điền **trên máy**; không được sao chép nguyên dấu này vào cấu hình thật. Migration chỉ được phép chạy khi đã kiểm tra URL đúng `blueprint_qa_test`. `db:migrate:deploy` thay đổi database thử nghiệm, không phải lệnh kiểm tra chỉ đọc.

### Bước 3 — Khởi chạy ứng dụng và đăng nhập **thật**

Trong môi trường localhost này, ứng dụng dùng **GitHub OAuth qua Auth.js**: `apps/web/src/auth/authjs-config.ts` yêu cầu **`AUTH_SECRET`, `GITHUB_ID` và `GITHUB_SECRET`**. GitHub OAuth App cho localhost cần redirect/callback được chủ sở hữu đăng ký hợp lệ tại **`http://127.0.0.1:3000/api/auth/callback/github`**; không tự lấy secret của Preview hoặc sửa callback online. Nếu chưa có OAuth App riêng cho localhost, bước đăng nhập vẫn **BLOCKED** và phải nhờ Owner cấu hình. Tuyệt đối không khởi tạo ba cookie JWT giả.

**App-Manager SSO hiện ghim callback vào HTTPS Preview** trong `apps/web/src/auth/appmanage-sso.ts`, do đó **không thể dùng App-Manager SSO Preview làm phiên localhost thật**. Không tùy tiện sửa chính sách issuer; dùng GitHub Auth.js có quyền hợp lệ hoặc triển khai một đăng ký SSO localhost riêng đã được review trước.

Khi chủ sở hữu cung cấp cấu hình OAuth localhost thật cho môi trường QA, đặt các biến bảo mật riêng trên máy (không commit `.env`, không đưa vào chat), bật HTTP localhost chỉ dành riêng cho QA, rồi chạy:

```powershell
$env:BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH = 'true'
pnpm --filter @blueprint-os/web dev
```

Sau đó mở **`http://127.0.0.1:3000/api/auth/signin`** trên chính PC và đăng nhập bằng GitHub thật. `AUTH_SECRET/GITHUB_ID/GITHUB_SECRET` và `DATABASE_URL` phải được cấu hình **trong tiến trình chạy server**; nếu đăng nhập không hoạt động hoặc bị từ chối, dừng và đọc thông báo, không tự cấp quyền.

### Bước 4 — Ba tài khoản và hồ sơ QA

Cần **ba Principal thật khác nhau**, đã được Owner cấp quyền **OWNER, EDITOR, VIEWER** theo cơ chế Authority của Blueprint OS cho *một* dự án QA có mã bắt đầu `project:qa-`. Vai trò phải tồn tại trong PostgreSQL thật và khớp với tài khoản đăng nhập. Không tự bootstrap Owner cho dữ liệu đang sử dụng, không gán `OWNER` cho Reviewer/Viewer và không viết trực tiếp SQL để lách kiểm duyệt. Hồ sơ QA cần có Work Package `READY`, đủ Quality Gate theo chính sách, một repository đã đăng ký thực, HEAD được đọc thật và không có Risk/Technical Debt nghiêm trọng còn mở.

Từng người đăng nhập trong **trình duyệt riêng**, xuất Playwright `storageState` qua quy trình lấy trạng thái Playwright được phê duyệt, lưu ở thư mục riêng bên ngoài checkout. Các tệp này là **bí mật phiên đăng nhập**: không gửi qua chat, GitHub, Zalo hay CI artifacts. Nếu chưa có ba phiên thật hoặc chưa có cách an toàn lấy trạng thái, nghiệm thu E2E = **BLOCKED**.

### Bước 5 — Tiền kiểm và chỉ khởi chạy E2E khi sẵn sàng

Trong một cửa sổ PowerShell khác, ở thư mục repo, khai báo biến (chỉ tên minh họa, điền giá trị riêng tại PC):

```powershell
$env:BLUEPRINT_REAL_AUTH_E2E = 'true'
$env:BLUEPRINT_REAL_AUTH_E2E_BASE_URL = 'http://127.0.0.1:3000/'
$env:BLUEPRINT_REAL_AUTH_E2E_PROJECT = 'project:qa-<id-du-an-dung>'
$env:BLUEPRINT_REAL_AUTH_E2E_OWNER_PRINCIPAL = 'principal:<uuid-owner>'
$env:BLUEPRINT_REAL_AUTH_E2E_EDITOR_PRINCIPAL = 'principal:<uuid-editor>'
$env:BLUEPRINT_REAL_AUTH_E2E_VIEWER_PRINCIPAL = 'principal:<uuid-viewer>'
$env:BLUEPRINT_REAL_AUTH_E2E_OWNER_STATE = '<private-absolute-path>\\owner.json'
$env:BLUEPRINT_REAL_AUTH_E2E_EDITOR_STATE = '<private-absolute-path>\\editor.json'
$env:BLUEPRINT_REAL_AUTH_E2E_VIEWER_STATE = '<private-absolute-path>\\viewer.json'
$env:BLUEPRINT_REAL_AUTH_E2E_ALLOW_OWNER_WRITES = 'false'
$env:BLUEPRINT_REAL_AUTH_E2E_EXPECT_SIGNED_GRANT = 'false'
node scripts/continuous-localhost-precheck.mjs
```

Chỉ khi tự kiểm tra báo đủ điều kiện và **chủ sở hữu thực sự cấp phép**, chạy `corepack pnpm exec playwright test --config=playwright.real-auth.config.ts`. Đây là **bước kiểm thử có thể phát sinh POST đọc và ghi**; muốn chạy phần xác nhận/thu hồi biên bản trên DB QA riêng cần Owner đồng ý và đổi `BLUEPRINT_REAL_AUTH_E2E_ALLOW_OWNER_WRITES=true` trong đúng phiên máy thử nghiệm. Không bật nếu đang dùng dự án không thể thay đổi hoặc DB có giá trị thực tế.

Khi lệnh báo `BLOCKED`: thực hiện đúng **một** điểm thiếu đầu tiên rồi chạy lại. Đầu ra chỉ chứa **tên hạng mục**, không hiện token hoặc mật khẩu. Không đánh giá E2E PASS chỉ vì TCP 5432 mở hoặc URL có HTTP 200; những kiểm tra đó chỉ chứng minh **có thể kết nối**.

### Ranh giới nghiệm thu

- `node scripts/continuous-localhost-precheck.mjs` là **precheck read-only**; không thể chứng minh ba phiên là của ai hoặc grant hợp lệ.
- `corepack pnpm exec playwright test --config=playwright.real-auth.config.ts` là **E2E có xác thực nếu và chỉ nếu** các phiên/thẩm quyền thực được đưa vào từ bên ngoài. Mọi thiếu sót phải báo **BLOCKED**, không cấp lại session tự động.
- Phần `EXPECTED_SIGNED_GRANT=true` chỉ dùng khi tổ chức đã cấp **grant chữ ký issuer hợp lệ + workflow adoption thật**. Không tạo grant để chạy qua kiểm thử. Nút RUN phải giữ khóa khi thiếu bất kỳ điều kiện nào.


## Prerequisites and external authorization

1. Run **the real compiled Blueprint OS application**, with independently configured authentication provider, at `http://127.0.0.1:3000` or approved HTTPS loopback; its `DATABASE_URL` must point only at **localhost database `blueprint_qa_test`** with actual migrations. Use a disposable project with ID beginning `project:qa-`, a canonical Profile, an actual governed HEAD and required gates/work. Do not bypass `PROJECT_READ` or `PROJECT_ADMIN`. Any valid signed `inspect-scoped` grant must be provided independently by the authorized issuer; the tests do not create it.
2. A real human uses the configured Auth.js or pinned App-Manager identity provider to sign in as three **different real Principal records**, already assigned Project Owner (or genuine System Owner), Editor and Viewer respectively. Do not manually invent JWT, SSO, Owner or consent.
3. In three separate **authenticated browser contexts**, save Playwright `storageState` files **outside** the Git checkout in a private directory. Never paste or commit those files, put them in Actions secrets, or upload screenshot/trace/HAR. State files contain bearer session material. Ensure each state uses the same actual local host as the configured base URL. Destroy them securely after acceptance. On platforms without a browser-assisted storageState capture, this E2E remains BLOCKED rather than simulating credentials.
4. Pass absolute, private storageState paths for each role, and the actual matching `principal:<uuid>` identifiers from the already-populated disposable DB. No role is assigned or upgraded by the suite. Owner mutations additionally require explicit operator authorization and `BLUEPRINT_REAL_AUTH_E2E_ALLOW_OWNER_WRITES=true`.

Set these environment variable names in the local shell **without placing secrets in the repository**:

```text
BLUEPRINT_REAL_AUTH_E2E=true
BLUEPRINT_REAL_AUTH_E2E_BASE_URL=http://127.0.0.1:3000/
DATABASE_URL=postgresql://<disposable-credentials>@127.0.0.1:5432/blueprint_qa_test
BLUEPRINT_REAL_AUTH_E2E_PROJECT=project:qa-<verified-canonical-id>
BLUEPRINT_REAL_AUTH_E2E_OWNER_PRINCIPAL=principal:<uuid>
BLUEPRINT_REAL_AUTH_E2E_OWNER_STATE=<absolute-private-path>/owner.json
BLUEPRINT_REAL_AUTH_E2E_EDITOR_PRINCIPAL=principal:<uuid>
BLUEPRINT_REAL_AUTH_E2E_EDITOR_STATE=<absolute-private-path>/editor.json
BLUEPRINT_REAL_AUTH_E2E_VIEWER_PRINCIPAL=principal:<uuid>
BLUEPRINT_REAL_AUTH_E2E_VIEWER_STATE=<absolute-private-path>/viewer.json
BLUEPRINT_REAL_AUTH_E2E_ALLOW_OWNER_WRITES=false
BLUEPRINT_REAL_AUTH_E2E_EXPECT_SIGNED_GRANT=false
```

Run:

```sh
corepack pnpm exec playwright test --config=playwright.real-auth.config.ts
```

Playwright session and request contents are intentionally **not** retained in HTML report, trace, screenshot or video. Do not change the default to upload authenticated recordings to CI.

## Acceptance sequence and evidence boundary

- Precheck: ensure signed-in browser actually renders the project, the three stored Principal IDs are distinct and corresponding OWNER/EDITOR/VIEWER roles exist in the **disposable** PostgreSQL; missing permissions are a BLOCKER, not a PASS.
- Owner: real GET and a **valid** Server Action POST with matching Origin (read-only source recheck), then intercept the same real action POST and supply a hostile Origin. The latter must receive an HTTP rejection. This is stronger than posting an invented action ID.
- Owner/Editor/Viewer: Owner controls appear to Owner only, Editor can work only within `PROJECT_MUTATE` and Viewer has no mutating controls. For a verified READY work, an Owner confirmation form must exist.
- Signed execution control: `BLUEPRINT_REAL_AUTH_E2E_EXPECT_SIGNED_GRANT=false` requires it **absent**. Set to `true` only after real Owner attestation, approved adoption, trusted issuer, valid source-bound grant, and real runtime prerequisites are installed. The suite asserts it **visible** but does not click to dispatch.
- Optional destructive-to-disposable test: set `BLUEPRINT_REAL_AUTH_E2E_ALLOW_OWNER_WRITES=true` **only** after authorizing changes to this isolated project. The suite checks actual OWNER attestation and canonical PostgreSQL readback, then replays the exact already-used Owner Form Action payload with the **same real session and valid Origin**; CAS must reject it and the durable sequence must remain unchanged. Finally it explicitly revokes the receipt and verifies the execution control hides again. A previously attested project is rejected to avoid overwriting someone else's approval. Real DB CAS/replay/head/gate/risk source drift regressions continue independently in isolated PostgreSQL CI.
- Results do **not** prove release/RU03/independent QA authority; user-hosted localhost and **real actor** E2E are UNVERIFIED until this controlled run genuinely passes.

**Stop** if real roles, SSO, verified governed HEAD, local service, storageState, proper risk remediation, or separately approved signed grants are missing. Do not fabricate their absence away.

**One next action:** execute the opt-in suite against the genuine disposable localhost runtime with existing authenticated role states and record its exact HEAD, replay/CSRF observations, and project-scoped attestation readback. Keep PR Draft.
