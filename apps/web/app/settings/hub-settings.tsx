"use client";

import Link from "next/link";
import { useHubPreferences } from "../_components/hub-preferences";

export function HubSettings() {
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

      <p className="hub-settings-note">{en
        ? "Saved only in this browser. These options do not grant access, modify project truth or change the Constitution. Some advanced engineering screens still contain English technical terms."
        : "Tùy chọn chỉ lưu trong trình duyệt này, không thay đổi quyền hạn, dữ liệu chuẩn hay Hiến pháp. Một số màn hình kỹ thuật chuyên sâu vẫn có thuật ngữ tiếng Anh."}</p>
    </main>
  );
}
