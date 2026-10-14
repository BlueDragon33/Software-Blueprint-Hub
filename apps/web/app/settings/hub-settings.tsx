"use client";

import Link from "next/link";
import { useHubPreferences } from "../_components/hub-preferences";

const ssoMessages: Readonly<Record<string, { vi: string; en: string }>> = {
  "link-required": {
    vi: "Bạn chưa liên kết tài khoản. Hãy đăng nhập GitHub vào Hub một lần bằng cùng email đang dùng ở App-Manage, sau đó chọn “Liên kết App-Manage với Hub”.",
    en: "Account not yet linked. Sign into Hub with GitHub once using the same App-Manage email, then select Link App-Manage account."
  },
  "link-requires-hub-owner": {
    vi: "Liên kết chỉ được phép khi đã đăng nhập GitHub bằng tài khoản System Owner, và email GitHub phải khớp email App-Manage. Hãy kiểm tra đúng tài khoản.",
    en: "Link requires an already signed-in GitHub Hub System Owner whose email exactly matches App-Manage."
  },
  "link-conflict": {
    vi: "Địa chỉ này đã được liên kết với tài khoản Hub khác. Hệ thống không tự chuyển quyền; cần kiểm tra liên kết hiện có.",
    en: "Identity is already linked to another Hub principal. No automatic role reassignment is allowed."
  },
  "unavailable": {
    vi: "Tính năng đăng nhập một lần chưa được kích hoạt hoặc thiếu cấu hình trong môi trường này.",
    en: "Single sign-on is not activated or configured on this deployment."
  },
  "invalid-flow": {
    vi: "Phiên xác thực đã hết hạn hoặc mã trạng thái không khớp. Hãy bấm mở lại từ App-Manage.",
    en: "The login flow expired or its state did not match. Start again from App-Manage."
  },
  "exchange-failed": {
    vi: "Không thể xác minh mã đăng nhập tại App-Manage. Mã chỉ có hiệu lực ngắn và dùng một lần; hãy thử mở lại ứng dụng.",
    en: "The one-time authorization code could not be verified. Retry from App-Manage."
  },
  "identity-invalid": {
    vi: "Thông tin xác thực từ máy chủ không đáp ứng kiểm tra an toàn.",
    en: "The identity server response failed security validation."
  },
  "missing-principal": {
    vi: "Liên kết không còn khớp hồ sơ chuẩn trong Hub; quyền truy cập đã bị chặn.",
    en: "The linked Hub principal no longer exists; access has been denied."
  },
  "server-unavailable": {
    vi: "Không thể xác minh liên kết trong cơ sở dữ liệu Hub lúc này. Đăng nhập GitHub vẫn có thể sử dụng.",
    en: "The Hub link database is unavailable. GitHub sign-in remains available."
  }
};

export function HubSettings({ ssoStatus = null }: { readonly ssoStatus?: string | null }) {
  const { language, density, setLanguage, setDensity } = useHubPreferences();
  const en = language === "en";
  return (
    <main className="hub-settings">
      <Link className="text-link" href="/">← {en ? "Home screen" : "Màn hình chính"}</Link>
      <div className="hub-settings-heading">
        <span aria-hidden="true">⚙️</span>
        <div>
          <p className="section-kicker">{en ? "Personal display options" : "Tùy chọn hiển thị cá nhân"}</p>
          <h1>{en ? "Settings" : "Cài đặt"}</h1>
          <p>{en ? "Make the Hub easier to read and use." : "Điều chỉnh cách hiển thị cho dễ đọc và dễ tìm ứng dụng."}</p>
        </div>
      </div>

      <section className="hub-settings-panel" aria-labelledby="language-settings">
        <h2 id="language-settings">{en ? "Language" : "Ngôn ngữ"}</h2>
        <p>{en ? "Vietnamese is the default for the new Hub launcher." : "Tiếng Việt mặc định cho màn hình ứng dụng và danh mục hệ sinh thái."}</p>
        <div className="hub-settings-choices" role="group" aria-label="Language">
          <button type="button" aria-pressed={language === "vi"} onClick={() => setLanguage("vi")}>🇻🇳 Tiếng Việt</button>
          <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>🇬🇧 English</button>
        </div>
      </section>
      <section className="hub-settings-panel" aria-labelledby="density-settings">
        <h2 id="density-settings">{en ? "Icon size" : "Mật độ biểu tượng"}</h2>
        <p>{en ? "Choose comfortable or compact icon spacing." : "Chọn biểu tượng thoáng, dễ chạm hoặc thu gọn để hiển thị nhiều ứng dụng."}</p>
        <div className="hub-settings-choices" role="group" aria-label={en ? "Display density" : "Mật độ hiển thị"}>
          <button type="button" aria-pressed={density === "comfortable"} onClick={() => setDensity("comfortable")}>
            {en ? "Comfortable" : "Dễ nhìn"}
          </button>
          <button type="button" aria-pressed={density === "compact"} onClick={() => setDensity("compact")}>
            {en ? "Compact" : "Thu gọn"}
          </button>
        </div>
      </section>

      {ssoStatus ? (
        <div className="hub-settings-panel" role="alert">
          <h2>{en ? "Single sign-on status" : "Trạng thái đăng nhập một lần"}</h2>
          <p>{(ssoMessages[ssoStatus] ?? ssoMessages["server-unavailable"])?.[language]}</p>
          <a href="/api/auth/signin" className="secondary-button">
            {en ? "Sign into Hub with GitHub (first link only)" : "Đăng nhập GitHub vào Hub (chỉ lần liên kết đầu)"}
          </a>
        </div>
      ) : null}

      <section className="hub-settings-panel" aria-labelledby="app-manage-sso">
        <h2 id="app-manage-sso">{en ? "Application Management single sign-on" : "Đăng nhập một lần từ App-Manage"}</h2>
        <p>{en
          ? "Link your existing Hub identity once. Future launches from Application Management can use a short-lived signed session. No owner role is granted automatically."
          : "Liên kết một lần tài khoản GitHub đã có quyền Hub với tài khoản App-Manage cùng email. Các lần mở sau dùng phiên đăng nhập một lần được xác minh, không tự cấp quyền quản trị."}</p>
        <div className="hub-settings-choices">
          <a className="primary-button" href="/api/sso/start?intent=link">
            {en ? "Link App-Manage account" : "Liên kết App-Manage với Hub"}
          </a>
          <a className="secondary-button" href="/api/sso/start">
            {en ? "Try single sign-on" : "Kiểm tra đăng nhập một lần"}
          </a>
        </div>
        <p>{en
          ? "This preview feature requires an enabled issuer, database migration, and an existing linked Hub identity. If unavailable, GitHub login remains available."
          : "Tính năng Preview chỉ hoạt động khi đã bật máy chủ cấp mã, hoàn tất migration và liên kết tài khoản. Nếu chưa sẵn sàng, đăng nhập GitHub vẫn hoạt động."}</p>
        <form method="POST" action="/api/sso/logout">
          <button type="submit" className="secondary-button">{en ? "Sign out of Hub SSO" : "Đăng xuất phiên Hub SSO"}</button>
        </form>
      </section>

      <p className="hub-settings-note">{en
        ? "Saved only in this browser. These options do not grant access, modify project truth or change the Constitution. Some advanced engineering screens still contain English technical terms."
        : "Tùy chọn chỉ lưu trong trình duyệt này, không thay đổi quyền hạn, dữ liệu chuẩn hay Hiến pháp. Một số màn hình kỹ thuật chuyên sâu vẫn có thuật ngữ tiếng Anh."}</p>
    </main>
  );
}
