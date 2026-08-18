'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="contact-section" className="bg-stone-900 text-stone-400 py-12 border-t border-stone-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-4">
            <h4 className="text-white text-lg font-bold"> Maiv Zev</h4>
            <p className="text-sm font-light leading-relaxed">
              แหล่งรวบรวมสินค้าผลไม้สด และข้าวสารคุณภาพพรีเมียมจากเกษตรกรในครอบครัวของเรา ปลูกด้วยวิถีธรรมชาติ ปลอดสารพิษ ส่งตรงถึงบ้านคุณ
            </p>
          </div>
          <div>
            <h4 className="text-white text-lg font-bold mb-4">เมนูหลัก</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><Link href="/" className="hover:text-emerald-400 transition-colors">หน้าแรก</Link></li>
              <li><Link href="/products" className="hover:text-emerald-400 transition-colors">สินค้าทั้งหมด</Link></li>
              <li><Link href="/delivery" className="hover:text-emerald-400 transition-colors">วิธีสั่งซื้อ</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">ติดต่อเรา</Link></li>
              <li><Link href="/articles" className="hover:text-emerald-400 transition-colors">บทความน่ารู้</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-lg font-bold mb-4">ติดต่อเรา</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>065-469-5103</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>wit.mmvi@gmail.com</span>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/share/1DLqnxzo2t/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-4 h-4 text-[#1877f2] fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                  </svg>
                  <span>Facebook </span>
                </a>
              </li>
              <li>
                <a
                  href="https://line.me/ti/p/5w0a27CVI3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-4 h-4 text-[#06c755] fill-current" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.346 0 .63.285.63.63 0 .349-.284.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.412-.105-.531-.283l-1.745-2.607v2.263c0 .344-.28.629-.627.629-.348 0-.629-.285-.629-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.202-.033.207 0 .411.104.53.283l1.743 2.607V8.108c0-.345.283-.63.63-.63.346 0 .627.285.627.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08-.085.643-.387 2.511-.422 3.047-.058.857.443 1.04.931.57 3.963-3.805 7.696-7.397 9.873-10.45 1.572-2.146 2.487-4.475 2.487-6.945" />
                  </svg>
                  <span>Line</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-800 pt-8 text-center text-xs text-stone-500 font-medium">
          <p>&copy; {new Date().getFullYear()} Maiv Zev. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
