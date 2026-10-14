import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blueprint OS",
  description: "Trung tâm quản lý hệ sinh thái ứng dụng và kỹ thuật số",
  applicationName: "Blueprint OS",
  icons: { icon: "/favicon.svg?v=site-id-1", shortcut: "/favicon.svg?v=site-id-1" }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
