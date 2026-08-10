'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoginModal from '@/components/modals/LoginModal';
import { useAuth } from '@/providers/AuthProvider';
import { getOrders, updateUser, uploadFile } from '@/app/actions';
import { compressImage } from '@/lib/imageCompressor';

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

interface UserOrder {
  id: string;
  username: string;
  phone?: string;
  shippingAddress: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: 'รอตรวจสอบ' | 'ชำระเงินแล้ว' | 'ล้มเหลว';
  orderStatus: 'รอดำเนินการ' | 'กำลังจัดส่ง' | 'ส่งสำเร็จ' | 'ยกเลิก';
  createdAt: string;
  slipUrl?: string;
}

export default function AccountPage() {
  const { currentUser, login: setCurrentUser } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      try {
        const data = await getOrders();
        setOrders(data as UserOrder[]);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!currentUser || !file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('ขนาดไฟล์ใหญ่เกินไปครับ (สูงสุดไม่เกิน 20MB)');
      return;
    }

    setIsUploading(true);
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
    } finally {
      setIsUploading(false);
    }
  };

  const userOrders = currentUser
    ? orders.filter(o => o.username === currentUser.username)
    : [];

  const filteredOrders = userOrders.filter(o => {
    if (statusFilter === 'paid') return o.paymentStatus === 'ชำระเงินแล้ว';
    if (statusFilter === 'pending') return o.paymentStatus === 'รอตรวจสอบ';
    if (statusFilter === 'shipped') return o.orderStatus === 'ส่งสำเร็จ';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#fafaf6] text-stone-800 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Title */}
        <div className="mb-8 border-b border-stone-200 pb-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-stone-900 flex items-center gap-3">
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-2xl">👤</span>
                บัญชีผู้ใช้และประวัติการสั่งซื้อ
              </h1>
              <p className="text-stone-500 text-sm mt-1">จัดการข้อมูลส่วนตัวและติดตามสถานะคำสั่งซื้อของคุณ</p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              🛒 เลือกซื้อสินค้าต่อ
            </Link>
          </div>
        </div>

        {!currentUser ? (
          /* Unauthenticated State */
          <div className="bg-white rounded-3xl p-8 md:p-12 text-center border border-stone-200/80 shadow-xl max-w-xl mx-auto my-12">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              🔐
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">กรุณาเข้าสู่ระบบ</h3>
            <p className="text-stone-500 text-sm mb-6">
              คุณต้องเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ ข้อมูลบัญชี และติดตามสถานะพัสดุของคุณ
            </p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/20 hover:scale-[1.02]"
            >
              เข้าสู่ระบบ / สมัครสมาชิก
            </button>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar: Profile Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-600 to-teal-700" />

                <div className="relative pt-8 text-center">
                  <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md bg-stone-100 mb-4 group">
                    {currentUser.profileImage ? (
                      <img
                        src={currentUser.profileImage}
                        alt={currentUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-emerald-50 text-emerald-700 font-bold">
                        {currentUser.username[0]?.toUpperCase()}
                      </div>
                    )}

                    <label className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span>📷 {isUploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูป'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <h2 className="text-xl font-bold text-stone-900">{currentUser.username}</h2>
                  <p className="text-xs text-stone-500 mb-3">{currentUser.email}</p>

                  <span
                    className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${currentUser.role === 'Admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : currentUser.role === 'Member'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-stone-100 text-stone-700 border-stone-300'
                      }`}
                  >
                    ระดับสมาชิก: {currentUser.role}
                  </span>
                </div>

                {/* Profile Details List */}
                <div className="mt-6 pt-6 border-t border-stone-150 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-400 font-medium">ชื่อผู้ใช้</span>
                    <span className="font-bold text-stone-800">{currentUser.username}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-400 font-medium">อีเมล</span>
                    <span className="font-bold text-stone-800">{currentUser.email}</span>
                  </div>
                  {currentUser.phone && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-stone-400 font-medium">เบอร์โทรศัพท์</span>
                      <span className="font-bold text-stone-800">{currentUser.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-400 font-medium">คำสั่งซื้อทั้งหมด</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {userOrders.length} รายการ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Order History Section */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-150">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                      <span>📦</span> ประวัติการสั่งซื้อของคุณ
                    </h3>
                    <p className="text-xs text-stone-500">ติดตามสถานะและตรวจสอบสลิปการชำระเงิน</p>
                  </div>

                  {/* Status Filters */}
                  <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'all'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                    >
                      ทั้งหมด ({userOrders.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('paid')}
                      className={`px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'paid'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                    >
                      ชำระแล้ว
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'pending'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                    >
                      รอตรวจสอบ
                    </button>
                    <button
                      onClick={() => setStatusFilter('shipped')}
                      className={`px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'shipped'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                    >
                      ส่งสำเร็จ
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-stone-500 font-semibold">กำลังโหลดข้อมูลประวัติการสั่งซื้อ...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-16 text-stone-400 font-semibold space-y-3 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                    <span className="text-5xl block">📭</span>
                    <p className="text-stone-600 text-sm">ไม่พบประวัติการสั่งซื้อในหมวดหมู่นี้</p>
                    <Link
                      href="/products"
                      className="inline-block px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-105"
                    >
                      ไปที่หน้ารายการสินค้า
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-all space-y-4 shadow-xs"
                      >
                        {/* Order Top Summary */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-stone-200">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">คำสั่งซื้อ #</span>
                              <span className="font-extrabold text-stone-900 text-base">{order.id}</span>
                            </div>
                            <p className="text-[11px] text-stone-500 font-medium">
                              สั่งซื้อเมื่อ: {new Date(order.createdAt).toLocaleString('th-TH')}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`text-[11px] font-bold px-3 py-1 rounded-full border ${order.paymentStatus === 'ชำระเงินแล้ว'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : order.paymentStatus === 'รอตรวจสอบ'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                            >
                              💳 {order.paymentStatus}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-3 py-1 rounded-full border ${order.orderStatus === 'ส่งสำเร็จ'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : order.orderStatus === 'กำลังจัดส่ง'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : order.orderStatus === 'รอดำเนินการ'
                                      ? 'bg-stone-100 text-stone-600 border-stone-200'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                            >
                              📦 {order.orderStatus}
                            </span>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="space-y-2 bg-white p-4 rounded-xl border border-stone-150">
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">รายการสินค้าที่สั่ง</h4>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-bold text-stone-800 py-1">
                              <span>
                                {item.productName} <span className="text-stone-400 font-normal">x {item.quantity} {item.unit}</span>
                              </span>
                              <span>฿{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}

                          <div className="mt-3 pt-3 border-t border-stone-150 flex justify-between items-center">
                            <span className="text-xs font-bold text-stone-900">ราคารวมทั้งสิ้น</span>
                            <span className="text-base font-black text-emerald-600">฿{order.totalPrice.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Address & Slip info */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                          {order.shippingAddress && (
                            <div className="text-stone-600">
                              <span className="font-bold text-stone-800">📍 ที่อยู่จัดส่ง: </span>
                              {order.shippingAddress}
                            </div>
                          )}

                          {order.slipUrl && (
                            <button
                              onClick={() => setSelectedSlipUrl(order.slipUrl || null)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 transition-colors"
                            >
                              <span>🧾</span> ดูสลิปการชำระเงิน
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Slip Modal Lightbox */}
      {selectedSlipUrl && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setSelectedSlipUrl(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold"
            >
              ✕
            </button>
            <h4 className="text-sm font-bold text-stone-900 mb-3 px-2">สลิปหลักฐานการชำระเงิน</h4>
            <div className="max-h-[75vh] overflow-y-auto rounded-2xl bg-stone-100 flex items-center justify-center p-2 border border-stone-200">
              <img src={selectedSlipUrl} alt="หลักฐานการชำระเงิน" className="max-w-full h-auto object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* Login Modal Popup */}
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} />}

      <Footer />
    </div>
  );
}
