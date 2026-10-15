import Link from "next/link";
import { AppShell } from "@blueprint-os/ui";

export const dynamic = "force-dynamic";

const messages: Readonly<Record<string, string>> = {
  "owner-identity-mismatch": "Hai tài khoản Google (App-Manager) và GitHub (Blueprint) đang sử dụng email khác nhau. Bạn có thể mở Blueprint bằng tài khoản GitHub đã có quyền, không cần đổi email hay vào Cài đặt. Liên kết đăng nhập một lần giữa hai danh tính này vẫn cần xác minh quyền sở hữu cả hai.",
  "link-conflict": "Tài khoản này đang có liên kết khác hoặc đã bị thu hồi. Không thể tự ghi đè quyền đã được thiết lập.",
  "link-required": "Chưa có liên kết tài khoản hợp lệ cho ứng dụng này.",
  "invalid-flow": "Phiên mở ứng dụng đã hết hạn hoặc không khớp. Hãy mở lại từ App-Manager.",
  "exchange-failed": "Mã truy cập dùng một lần đã hết hạn hoặc không xác minh được. Hãy mở lại ứng dụng.",
  "identity-invalid": "Máy chủ không thể xác minh đúng danh tính và quyền truy cập.",
  "unavailable": "Chế độ mở ứng dụng từ App-Manager chưa sẵn sàng trên môi trường này.",
  "server-unavailable": "Kết nối dữ liệu tạm gián đoạn. Vui lòng thử lại.",
  "missing-principal": "Hồ sơ chủ sở hữu Blueprint không còn hợp lệ.",
  "link-requires-hub-owner": "Danh tính App-Manager không khớp với tài khoản chủ sở hữu Blueprint."
};

export default async function SsoErrorPage({
  searchParams
}: {
  readonly searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const params = await searchParams;
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const message = reason && Object.hasOwn(messages, reason)
    ? messages[reason] : "Không thể hoàn tất mở Blueprint vào lúc này.";
  const isDifferentVerifiedIdentity = reason === "owner-identity-mismatch";
  return (
    <AppShell>
      <main className="hub-settings">
        <section className="hub-settings-panel" role="alert">
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", lineHeight: 1.15 }}>
            {isDifferentVerifiedIdentity ? "Hai tài khoản chưa liên kết" : "Chưa thể mở Blueprint"}
          </h1>
          <p>{message}</p>
          {isDifferentVerifiedIdentity ? (
            <div className="hub-settings-choices">
              <Link className="primary-button" href="/api/auth/signin?callbackUrl=%2F">
                Mở Blueprint bằng GitHub đã có quyền
              </Link>
              <Link className="secondary-button" href="https://application-management.boiech-ai.workers.dev/">
                Trở lại App-Manager
              </Link>
            </div>
          ) : (
            <>
              <p>Hãy mở lại từ App-Manager. Không cần vào Cài đặt hoặc thay đổi tài khoản.</p>
              <Link className="primary-button" href="https://application-management.boiech-ai.workers.dev/">
                ← Trở lại App-Manager
              </Link>
            </>
          )}
        </section>
      </main>
    </AppShell>
  );
}
