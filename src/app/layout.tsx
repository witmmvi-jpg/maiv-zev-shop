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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import AuthProvider from "@/providers/AuthProvider";
import CartProvider from "@/providers/CartProvider";
import ModalAlertProvider from "@/providers/ModalAlertProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-stone-50">
        <AuthProvider>
          <ModalAlertProvider>
            <CartProvider>
              <Navbar />
              <main className="flex-1 flex flex-col">{children}</main>
              <Footer />
            </CartProvider>
          </ModalAlertProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
