import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blueprint OS",
  description: "Universal Software Engineering & Product Construction System",
  applicationName: "Blueprint OS",
  icons: { icon: "/favicon.svg?v=site-id-1", shortcut: "/favicon.svg?v=site-id-1" }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
