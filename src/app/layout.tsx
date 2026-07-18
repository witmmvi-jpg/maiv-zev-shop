import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "Maiv Zev Shop",
  description: "แหล่งรวมสินค้าเกษตรจากสวนครอบครัวเรา องุ่นหวาน ปลอดสารพิษ ข้าวสารหอมมะลินุ่ม คุณภาพดี ส่งตรงถึงมือคุณ",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${kanit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
