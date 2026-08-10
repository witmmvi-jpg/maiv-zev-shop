'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { uploadFile, updateUser } from '@/app/actions';
import { compressImage } from '@/lib/imageCompressor';
import LoginModal from '@/components/modals/LoginModal';

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, login: setCurrentUser, logout } = useAuth();
  const { cart } = useCart();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!isUserDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen]);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!currentUser || !file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('ขนาดไฟล์ใหญ่เกินไปครับ (สูงสุดไม่เกิน 20MB)');
      return;
    }
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      const { url } = await uploadFile(formData);
      await updateUser(currentUser.email, { profileImage: url });
      setCurrentUser({ ...currentUser, profileImage: url });
      alert('เปลี่ยนรูปโปรไฟล์สำเร็จแล้วครับ!');
    } catch (err) {
      console.error('Error uploading profile image:', err);
      alert('เกิดข้อผิดพลาดในการเปลี่ยนรูปโปรไฟล์ครับ');
    }
  };

  const navLinks = [
    { name: 'หน้าแรก', href: '/' },
    { name: 'สินค้า', href: '/products' },
    { name: 'วิธีสั่งซื้อ', href: '/delivery' },
    { name: 'ติดต่อเรา', href: '/contact' },
    { name: 'บทความน่ารู้', href: '/articles' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#166534] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 cursor-pointer">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-md bg-white flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="สวนครอบครัว Maiv Zev"
                  fill
                  className="object-cover scale-105"
                  sizes="48px"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide leading-tight">Maiv Zev </h1>
                <p className="text-xs text-emerald-200/90 font-light">สดจากสวน ส่งตรงถึงบ้านคุณ</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-base font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${
                    pathname === link.href ? 'text-white underline decoration-2 underline-offset-4' : 'text-emerald-100 hover:text-emerald-200'
                  } transition-colors`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-4">
              {/* User Profile Button with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-white/10 rounded-full transition-all duration-200 focus:outline-none"
                  title="ข้อมูลผู้ใช้งาน"
                >
                  {currentUser ? (
                    currentUser.profileImage ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-300 shadow-sm hover:scale-105 transition-transform duration-200">
                        <img src={currentUser.profileImage} alt={currentUser.username} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-850 font-bold border-2 border-emerald-300 shadow-sm overflow-hidden hover:scale-105 transition-transform duration-200">
                        <span className="text-lg">{currentUser.username.charAt(0)}</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-emerald-200 border-2 border-white/20 hover:scale-105 transition-transform duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-stone-100 py-3 text-stone-800 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    {currentUser ? (
                      <div>
                        {/* User Info Header */}
                        <div className="px-5 py-3 border-b border-stone-100">
                          <div className="flex items-center gap-3">
                            {currentUser.profileImage ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-200 bg-stone-50">
                                <img src={currentUser.profileImage} alt={currentUser.username} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg border border-emerald-250">
                                {currentUser.username.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-stone-900 truncate text-sm">{currentUser.username}</p>
                              <p className="text-xs text-stone-500 truncate">{currentUser.email}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-1.5">
                            <span className="text-xs text-stone-500 font-medium">ระดับ:</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentUser.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              currentUser.role === 'Member' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-stone-100 text-stone-700 border-stone-300'
                              }`}>
                              {currentUser.role}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="px-2 pt-2 space-y-1">
                          {currentUser.role !== 'Admin' && (
                            <Link
                              href="/account"
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold transition-colors flex items-center gap-2 border border-emerald-200"
                            >
                              📦 ประวัติการสั่งซื้อของฉัน
                            </Link>
                          )}

                          <label className="w-full text-left px-3 py-2 rounded-xl text-xs bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold transition-colors flex items-center gap-2 border border-stone-200 cursor-pointer">
                            📷 เปลี่ยนรูปโปรไฟล์
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfileImageChange}
                              className="hidden"
                            />
                          </label>

                          {currentUser.role === 'Admin' && (
                            <Link
                              href={pathname.startsWith('/admin') ? '/' : '/admin'}
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold transition-colors flex items-center gap-2 border border-purple-200"
                            >
                              {pathname.startsWith('/admin') ? '🛒 เข้าสู่หน้าร้านค้า' : '⚙️ ระบบดูแลระบบ (Admin Panel)'}
                            </Link>
                          )}
                          
                          <button
                            onClick={() => {
                              logout();
                              setIsUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold transition-colors flex items-center gap-2"
                          >
                            ออกจากระบบ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs text-stone-500 mb-3 font-medium">ยังไม่ได้เข้าสู่ระบบ</p>
                        <button
                          onClick={() => {
                            setIsLoginModalOpen(true);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          เข้าสู่ระบบ / สมัครสมาชิก
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shopping Cart Button */}
              {(!currentUser || currentUser.role !== 'Admin') && (
                <Link
                  href="/cart"
                  className="relative p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                  title="ตะกร้าสินค้า"
                >
                  <svg className="w-6 h-6 text-emerald-50 hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartItemsCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 border-2 border-[#166534] rounded-full animate-in zoom-in">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white hover:bg-white/10 rounded-xl focus:outline-none transition-colors cursor-pointer"
                aria-label="Toggle Mobile Menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#15803d] border-t border-emerald-700 shadow-xl px-4 pt-2 pb-4 space-y-1.5 animate-in slide-in-from-top duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  pathname === link.href ? 'bg-emerald-950/40 text-white border border-emerald-500/30' : 'text-emerald-100 hover:bg-white/10'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Login Modal Integration */}
      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </>
  );
}
