'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="contact-section" className="bg-stone-900 text-stone-400 py-12 border-t border-stone-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-4">
            <h4 className="text-white text-lg font-bold">สวนครอบครัว Maiv Zev</h4>
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
                <span>089-123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>contact@maivzev.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-800 pt-8 text-center text-xs text-stone-500 font-medium">
          <p>&copy; {new Date().getFullYear()} สวนครอบครัว Maiv Zev. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
