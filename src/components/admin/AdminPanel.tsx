// @ts-nocheck


"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRef } from 'react';
import { Product, Order, UserProfile, Category, ProductReview, OrderItem } from '@/types';
import { getDashboardStats, getProducts, createProduct, updateProduct, deleteProduct, getCategories, createCategory, updateCategory, deleteCategory, getOrders, updateOrderStatus, getUsers, updateUserRole, deleteUser, createUser, updateUser } from '@/app/admin/actions';
import { uploadFile, getChats, sendMessage, markChatRead, sendEmail } from '@/app/actions';
import LoginModal from '@/components/modals/LoginModal';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { compressImage } from '@/lib/imageCompressor';

export default function AdminPanel() {
  const { currentUser, isLoaded } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const [adminTab, setAdminTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'members' | 'payments' | 'chats' | 'emails'>('dashboard');
  
  const getLocalYearMonthDynamic = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  const initialProductsFallback = [
    { id: 1, name: 'องุ่นไร้เมล็ดแดง', description: 'องุ่นไร้เมล็ดแดง หวาน กรอบ สดใหม่จากสวน', price: 120, originalPrice: 150, promotionText: 'ลดราคาพิเศษ', stock: 50, image: '/images/red_grapes.png', unit: 'กก.', category: 'ผลไม้สด' },
    { id: 2, name: 'องุ่นเขียวไซมัสแคท', description: 'องุ่นเขียวไซมัสแคท หวานหอม มีกลิ่นหอมเฉพาะตัว', price: 250, originalPrice: 300, promotionText: 'สินค้าขายดี', stock: 35, image: '/images/green_grapes.png', unit: 'กก.', category: 'ผลไม้สด' },
    { id: 3, name: 'ข้าวหอมมะลิสุรินทร์แท้', description: 'ข้าวหอมมะลิแท้ 100% หอม นุ่ม อร่อย คัดเกรดพรีเมียม', price: 40, originalPrice: 45, promotionText: '', stock: 100, image: '/images/jasmine_rice.png', unit: 'กก.', category: 'ข้าวสาร' }
  ];

  const initialCategoriesFallback = [
    { id: 1, name: 'ผลไม้สด', description: 'องุ่นสดจากสวน ปลอดสารพิษ หวาน กรอบ อร่อย', image: '/images/red_grapes.png' },
    { id: 2, name: 'ข้าวสาร', description: 'ข้าวหอมมะลิ ข้าวเหนียว ข้าวกล้อง คุณภาพระดับพรีเมียม', image: '/images/jasmine_rice.png' }
  ];

  const initialOrdersFallback = [
    { id: 'ORD-001', username: 'somchai_member', phone: '0898765432', shippingAddress: '123/45 ถนนเจริญนคร กรุงเทพฯ', items: [{ productName: 'องุ่นไร้เมล็ดแดง', quantity: 5, price: 120, unit: 'กก.' }], totalPrice: 600, paymentMethod: 'พร้อมเพย์ (PromptPay)', paymentStatus: 'ชำระเงินแล้ว', orderStatus: 'ส่งสำเร็จ', createdAt: new Date().toISOString(), slipUrl: '/images/slip_demo.png' },
    { id: 'ORD-002', username: 'sodsai_customer', phone: '0812345678', shippingAddress: '456/78 ถนนสุขุมวิท กรุงเทพฯ', items: [{ productName: 'องุ่นเขียวไซมัสแคท', quantity: 2, price: 250, unit: 'กก.' }], totalPrice: 500, paymentMethod: 'พร้อมเพย์ (PromptPay)', paymentStatus: 'รอตรวจสอบ', orderStatus: 'รอดำเนินการ', createdAt: new Date().toISOString(), slipUrl: '/images/slip_demo.png' }
  ];

  const initialUsersFallback = [
    { id: 1, username: 'ยายมี (ผู้ดูแลระบบ)', email: 'admin@maivzev.com', phone: '0654695103', role: 'Admin', profileImage: '/images/logo.png' },
    { id: 2, username: 'somchai_member', email: 'somchai@example.com', phone: '0898765432', role: 'Member', profileImage: '' },
    { id: 3, username: 'sodsai_customer', email: 'customer@example.com', phone: '0812345678', role: 'User', profileImage: '' }
  ];

  // Dashboard states
  const [dashboardPeriod, setDashboardPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [bestSellerMonth, setBestSellerMonth] = useState<string>(getLocalYearMonthDynamic());
  const [dashboardFilterMode, setDashboardFilterMode] = useState<'month' | 'year' | 'range' | 'all'>('month');
  const [selectedDashboardMonth, setSelectedDashboardMonth] = useState<string>(getLocalYearMonthDynamic());
  const [selectedDashboardYear, setSelectedDashboardYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedDashboardStartDate, setSelectedDashboardStartDate] = useState<string>('');
  const [selectedDashboardEndDate, setSelectedDashboardEndDate] = useState<string>('');
  
  // Breakdown Graph Filter states
  const [breakdownSubMode, setBreakdownSubMode] = useState<'all' | 'single' | 'range'>('all');
  const [singleDate, setSingleDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [singleMonthFilter, setSingleMonthFilter] = useState<string>('');
  const [startMonthFilter, setStartMonthFilter] = useState<string>('');
  const [endMonthFilter, setEndMonthFilter] = useState<string>('');

  const [singleYearFilter, setSingleYearFilter] = useState<string>('');
  const [startYearFilter, setStartYearFilter] = useState<string>('');
  const [endYearFilter, setEndYearFilter] = useState<string>('');
  
  // Best Sellers Card Filter states
  const [bestSellerMode, setBestSellerMode] = useState<'month' | 'year' | 'range' | 'all'>('month');
  const [bestSellerSelectedMonth, setBestSellerSelectedMonth] = useState<string>(getLocalYearMonthDynamic());
  const [bestSellerSelectedYear, setBestSellerSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [bestSellerStartDate, setBestSellerStartDate] = useState<string>('');
  const [bestSellerEndDate, setBestSellerEndDate] = useState<string>('');
  
  // Saving loading states
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);
  
  // DB States
  const [isAdminDataLoading, setIsAdminDataLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  
  // Modals & Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState<any>({});
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState<any>({});
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('ทั้งหมด');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState<any>({
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'User',
    profileImage: '',
  });

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedMemberOrders, setSelectedMemberOrders] = useState<any | null>(null);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);
  const adminChatEndRef = useRef<HTMLDivElement>(null);

  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    html: ''
  });
  
  const emailTemplates = [
    {
      name: 'ยืนยันคำสั่งซื้อ',
      subject: 'ยืนยันการสั่งซื้อสินค้าจากสวนของเรา',
      html: `<h2>ขอบคุณที่สั่งซื้อสินค้าครับ! 🍇</h2><p>เราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้วและกำลังเตรียมการจัดส่ง</p><p>หากมีข้อสงสัยสามารถติดต่อเราได้ตลอดเวลาครับ</p><br><p>ขอบคุณครับ<br>ทีมงานสวน</p>`
    },
    {
      name: 'แจ้งการจัดส่ง',
      subject: 'สินค้าของคุณกำลังเดินทางไปหาคุณ!',
      html: `<h2>สินค้าของคุณถูกจัดส่งแล้ว 📦</h2><p>เราได้ทำการจัดส่งสินค้าให้คุณเรียบร้อยแล้ว คาดว่าจะถึงมือคุณใน 1-2 วันครับ</p><p>ขอบคุณที่อุดหนุนครับ</p>`
    },
    {
      name: 'โปรโมชั่นพิเศษ',
      subject: '🔥 โปรโมชั่นพิเศษเฉพาะคุณ!',
      html: `<h2>ห้ามพลาด! โปรโมชั่นพิเศษ 🎁</h2><p>พิเศษสำหรับคุณลูกค้าคนสำคัญ รับส่วนลดในการสั่งซื้อครั้งต่อไป</p><p>รีบมาใช้สิทธิ์กันนะครับ</p>`
    }
  ];

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username || !userForm.email) {
      alert('กรุณากรอกชื่อผู้ใช้และอีเมลให้ครบถ้วนครับ');
      return;
    }
    try {
      if (editingUser) {
        await updateUser(editingUser.id, userForm);
        alert('อัปเดตข้อมูลสมาชิกสำเร็จแล้วครับ');
      } else {
        await createUser(userForm);
        alert('เพิ่มสมาชิกใหม่สำเร็จแล้วครับ');
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      setUserForm({ username: '', email: '', password: '', phone: '', role: 'User', profileImage: '' });
      loadData();
    } catch (err: any) {
      console.error('Error submitting user:', err);
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสมาชิกครับ');
    }
  };

  const handleUpdateUserRole = async (id: number, role: string) => {
    await updateUserRole(id, role);
    loadData();
  };

  const handleDeleteUser = async (id: number) => {
    await deleteUser(id);
    loadData();
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProduct(id);
      loadData();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory(id);
      loadData();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const handleUpdateOrderStatus = async (id: string, data: { paymentStatus?: string; orderStatus?: string }) => {
    try {
      await updateOrderStatus(id, data);
      loadData();
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handleImageUpload = async (file: File | undefined, onSuccess: (url: string) => void) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('ขนาดไฟล์ใหญ่เกินไปครับ (สูงสุดไม่เกิน 20MB)');
      return;
    }
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      const { url } = await uploadFile(formData);
      onSuccess(url);
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพครับ');
    }
  };

  // Chat
  const [chatThreads, setChatThreads] = useState<any>({});
  const [adminChatInput, setAdminChatInput] = useState('');
  const [selectedAdminChatKey, setSelectedAdminChatKey] = useState<string | null>(null);

  // Others
  const [customAlert, setCustomAlert] = useState<{ message: string; title?: string; type?: 'success' | 'warning' } | null>(null);

  useEffect(() => {
    loadData(true);
  }, []);

  const loadChats = async () => {
    try {
      const dbThreads = await getChats();
      const threadsObj: any = {};
      dbThreads.forEach((t: any) => {
        const key = t.username || t.user_email;
        threadsObj[key] = {
          email: t.user_email,
          username: t.username,
          unread: t.unread,
          profileImage: t.profileImage || '',
          lastUpdated: t.last_updated ? new Date(t.last_updated).toISOString() : new Date().toISOString(),
          messages: (t.messages || []).map((m: any) => ({
            sender: m.sender,
            text: m.text,
            timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''
          }))
        };
      });
      setChatThreads(threadsObj);
    } catch (e) {
      console.error('Error loading chats:', e);
    }
  };

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsAdminDataLoading(true);
    try {
      const [_products, _categories, _orders, _users] = await Promise.all([
        getProducts().catch(() => []),
        getCategories().catch(() => []),
        getOrders().catch(() => []),
        getUsers().catch(() => []),
      ]);
      setProducts(_products && _products.length > 0 ? _products : initialProductsFallback);
      setCategories(_categories && _categories.length > 0 ? _categories : initialCategoriesFallback);
      setOrders(_orders && _orders.length > 0 ? _orders : initialOrdersFallback);
      setUsers(_users && _users.length > 0 ? _users : initialUsersFallback);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdminDataLoading(false);
    }
  };

  const handleAdminSendChatMessage = async () => {
    if (!selectedAdminChatKey || !adminChatInput.trim()) return;
    const targetThread = chatThreads[selectedAdminChatKey];
    if (!targetThread) return;

    const textToSend = adminChatInput;
    setAdminChatInput('');

    try {
      await sendMessage(targetThread.email, targetThread.username, 'admin', textToSend);
      await loadChats();
    } catch (err) {
      console.error('Error sending admin chat message:', err);
    }
  };

  const setViewMode = (mode: string) => {
    if (mode === 'shop') window.location.href = '/';
  };

  const getLocalYearMonth = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  // Format currency
  const formatCurrency = (val: number) => val.toLocaleString('th-TH');

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-stone-600">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-stone-150 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner border border-red-100">
            🔒
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-stone-900">ปฏิเสธการเข้าถึง (Access Denied)</h3>
            <p className="text-xs text-stone-500 font-medium leading-relaxed">
              หน้านี้สำหรับผู้ดูแลระบบ (Admin) เท่านั้นครับ กรุณาล็อกอินด้วยบัญชีแอดมินเพื่อเข้าใช้งาน
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              🔑 เข้าสู่ระบบแอดมิน
            </button>
            <a
              href="/"
              className="w-full py-3.5 px-6 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-all cursor-pointer block text-center"
            >
              🏠 กลับหน้าหลักร้านค้า
            </a>
          </div>
        </div>
        {isLoginModalOpen && (
          <LoginModal
            onClose={() => setIsLoginModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <>
<div className="flex-1 bg-stone-50 min-h-screen pb-12 animate-in fade-in duration-300">
          {/* Admin Header Bar */}
          <div className="bg-white border-b border-stone-200 py-5 px-4 sm:px-6 lg:px-8 shadow-sm">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {currentUser?.profileImage ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-purple-300 shadow-sm bg-purple-50 flex-shrink-0">
                    <img src={currentUser.profileImage} alt={currentUser.username} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">แผงจัดการข้อมูลระบบ (Admin Panel)</h2>
                  <p className="text-xs text-stone-550 font-medium">สิทธิ์ปัจจุบัน: {currentUser?.username} ({currentUser?.role})</p>
                </div>
              </div>
              <button
                onClick={() => setViewMode('shop')}
                className="bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-2"
              >
                🛒 กลับไปหน้าร้านค้า
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Side Menu */}
              <div className="bg-white rounded-3xl p-3 sm:p-5 border border-stone-200/60 shadow-sm flex flex-row overflow-x-auto lg:flex-col gap-2 h-fit scrollbar-none">
                <p className="hidden lg:block text-xs font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">เมนูหลัก</p>

                <button
                  onClick={() => setAdminTab('dashboard')}
                  className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2.5 ${adminTab === 'dashboard' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600 shadow-sm' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>📊</span> Dashboard
                </button>

                <button
                  onClick={() => setAdminTab('products')}
                  className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2.5 ${adminTab === 'products' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600 shadow-sm' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>🏷️</span> สินค้า
                </button>

                <button
                  onClick={() => setAdminTab('categories')}
                  className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2.5 ${adminTab === 'categories' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600 shadow-sm' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>📁</span> หมวดหมู่
                </button>

                <button
                  onClick={() => setAdminTab('orders')}
                  className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2.5 ${adminTab === 'orders' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600 shadow-sm' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>📦</span> คำสั่งซื้อ
                </button>

                <button
                  onClick={() => setAdminTab('members')}
                  className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2.5 ${adminTab === 'members' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600 shadow-sm' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>👥</span> สมาชิก
                </button>

                <button
                  onClick={() => setAdminTab('payments')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${adminTab === 'payments' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>💳</span> ช่องทางชำระเงิน & ยอดขาย
                  {orders.filter(o => o.orderStatus === 'รอการตรวจสอบ').length > 0 && (
                    <span className="ml-auto bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                      {orders.filter(o => o.orderStatus === 'รอการตรวจสอบ').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminTab('chats')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${adminTab === 'chats' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>💬</span> แชทบริการลูกค้า
                  {(Object.values(chatThreads) as any[]).filter(t => t.unread).length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                      {(Object.values(chatThreads) as any[]).filter(t => t.unread).length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminTab('emails')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${adminTab === 'emails' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>📧</span> ส่งอีเมลแจ้งเตือน
                </button>
              </div>

              {/* Tab Contents */}
              <div className="lg:col-span-3 bg-white rounded-3xl p-6 md:p-8 border border-stone-200/60 shadow-sm min-h-[500px]">
                {isAdminDataLoading ? (
                  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
                    <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <div>
                      <h4 className="text-base font-bold text-stone-900">กำลังดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์...</h4>
                      <p className="text-xs text-stone-500 mt-1">กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูลแอดมิน</p>
                    </div>
                  </div>
                ) : (
                  <>
                {/* 0. SALES DASHBOARD TAB */}
                {adminTab === 'dashboard' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Header + Month & Year Filter Selector */}
                    {(() => {
                      const validOrders = orders.filter(o => o.orderStatus !== 'ยกเลิกการสั่งซื้อ' && o.orderStatus !== 'ยกเลิก');

                      // Available Months YYYY-MM
                      const availableMonths = Array.from(new Set(
                        validOrders
                          .filter(o => o.createdAt && typeof o.createdAt === 'string')
                          .map(o => o.createdAt.substring(0, 7))
                      )).sort((a, b) => b.localeCompare(a));

                      const currentMonthStr = getLocalYearMonthDynamic();
                      if (!availableMonths.includes(currentMonthStr)) {
                        availableMonths.unshift(currentMonthStr);
                      }

                      // Available Years YYYY
                      const availableYears = Array.from(new Set(
                        validOrders
                          .filter(o => o.createdAt && typeof o.createdAt === 'string')
                          .map(o => o.createdAt.substring(0, 4))
                      )).sort((a, b) => b.localeCompare(a));

                      const currentYearStr = new Date().getFullYear().toString();
                      if (!availableYears.includes(currentYearStr)) {
                        availableYears.unshift(currentYearStr);
                      }

                      // Filter orders according to dashboardFilterMode
                      const filteredOrders = validOrders.filter(o => {
                        if (!o.createdAt || typeof o.createdAt !== 'string') return true;
                        const d = o.createdAt.substring(0, 10);
                        if (dashboardFilterMode === 'month') {
                          return o.createdAt.substring(0, 7) === selectedDashboardMonth;
                        }
                        if (dashboardFilterMode === 'year') {
                          return o.createdAt.substring(0, 4) === selectedDashboardYear;
                        }
                        if (dashboardFilterMode === 'range') {
                          if (selectedDashboardStartDate && d < selectedDashboardStartDate) return false;
                          if (selectedDashboardEndDate && d > selectedDashboardEndDate) return false;
                          return true;
                        }
                        return true; // 'all'
                      });

                      const periodRevenue = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);

                      // Calculate best selling product in filtered range
                      const productSales: { [name: string]: number } = {};
                      filteredOrders.forEach(o => {
                        o.items.forEach(item => {
                          productSales[item.productName] = (productSales[item.productName] || 0) + item.quantity;
                        });
                      });
                      let bestProduct = 'ไม่มีข้อมูล';
                      let maxQty = 0;
                      Object.entries(productSales).forEach(([name, qty]) => {
                        if (qty > maxQty) {
                          maxQty = qty;
                          bestProduct = name;
                        }
                      });
                      const bestProductText = maxQty > 0 ? `${bestProduct} (${maxQty} กก.)` : 'ไม่มีข้อมูล';

                      // Format Month display text in Thai
                      const formatMonthDisplay = (ymStr: string) => {
                        const [y, m] = ymStr.split('-');
                        const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                        return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
                      };

                      // Format Year display text in Thai (BE)
                      const formatYearDisplay = (yStr: string) => {
                        const y = parseInt(yStr);
                        return `ปี พ.ศ. ${y + 543} (${yStr})`;
                      };

                      return (
                        <>
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm">
                            <div>
                              <h3 className="text-xl font-bold text-stone-900">แผงควบคุมและรายงานยอดขาย (Sales Dashboard)</h3>
                              <p className="text-sm text-stone-500 font-medium">ข้อมูลสรุปและวิเคราะห์ผลการดำเนินงานยอดขายประจำสวนของเรา</p>
                            </div>

                            {/* Month / Year / Date Range Selector Bar */}
                            <div className="flex flex-wrap items-center gap-3 bg-stone-50 p-2 rounded-2xl border border-stone-150">
                              {/* Filter Mode Toggle */}
                              <div className="flex bg-stone-200/70 p-1 rounded-xl">
                                <button
                                  onClick={() => setDashboardFilterMode('month')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${dashboardFilterMode === 'month' ? 'bg-white text-purple-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
                                >
                                  📅 รายเดือน
                                </button>
                                <button
                                  onClick={() => setDashboardFilterMode('year')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${dashboardFilterMode === 'year' ? 'bg-white text-purple-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
                                >
                                  🗓️ รายปี
                                </button>
                                <button
                                  onClick={() => setDashboardFilterMode('range')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${dashboardFilterMode === 'range' ? 'bg-white text-purple-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
                                >
                                  📆 เลือกช่วงเวลา
                                </button>
                                <button
                                  onClick={() => setDashboardFilterMode('all')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${dashboardFilterMode === 'all' ? 'bg-white text-purple-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
                                >
                                  🌐 ทั้งหมด
                                </button>
                              </div>

                              {/* Month Dropdown Select */}
                              {dashboardFilterMode === 'month' && (
                                <select
                                  value={selectedDashboardMonth}
                                  onChange={(e) => setSelectedDashboardMonth(e.target.value)}
                                  className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-purple-800 shadow-sm focus:outline-none cursor-pointer"
                                >
                                  {availableMonths.map(m => (
                                    <option key={m} value={m}>
                                      {formatMonthDisplay(m)}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* Year Dropdown Select */}
                              {dashboardFilterMode === 'year' && (
                                <select
                                  value={selectedDashboardYear}
                                  onChange={(e) => setSelectedDashboardYear(e.target.value)}
                                  className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-purple-800 shadow-sm focus:outline-none cursor-pointer"
                                >
                                  {availableYears.map(y => (
                                    <option key={y} value={y}>
                                      {formatYearDisplay(y)}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* Date Range Selectors */}
                              {dashboardFilterMode === 'range' && (
                                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-700">
                                  <span>เริ่ม:</span>
                                  <input
                                    type="date"
                                    value={selectedDashboardStartDate}
                                    onChange={(e) => setSelectedDashboardStartDate(e.target.value)}
                                    className="bg-white border border-stone-300 rounded-xl px-2 py-1 text-xs font-bold text-purple-800 shadow-sm focus:outline-none"
                                  />
                                  <span>ถึง:</span>
                                  <input
                                    type="date"
                                    value={selectedDashboardEndDate}
                                    onChange={(e) => setSelectedDashboardEndDate(e.target.value)}
                                    className="bg-white border border-stone-300 rounded-xl px-2 py-1 text-xs font-bold text-purple-800 shadow-sm focus:outline-none"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Stats summary cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Card 1: All time total revenue */}
                            <div className="p-6 rounded-3xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3">
                                <span className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 text-xl">💰</span>
                                <div>
                                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">ยอดขายรวมทั้งหมด (สะสม)</p>
                                  <p className="text-2xl font-extrabold text-stone-900 mt-1">
                                    {validOrders.reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()} บาท
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Card 2: Period Revenue */}
                            <div className="p-6 rounded-3xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3">
                                <span className="p-3 bg-purple-50 rounded-2xl text-purple-700 text-xl">
                                  {dashboardFilterMode === 'year' ? '🗓️' : dashboardFilterMode === 'range' ? '📆' : '📅'}
                                </span>
                                <div>
                                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                                    {dashboardFilterMode === 'month' ? `ยอดขาย (${formatMonthDisplay(selectedDashboardMonth)})` :
                                     dashboardFilterMode === 'year' ? `ยอดขาย (ปี ${parseInt(selectedDashboardYear) + 543})` :
                                     dashboardFilterMode === 'range' ? 'ยอดขายในช่วงวันที่เลือก' :
                                     'ยอดขายรวมสะสม'}
                                  </p>
                                  <p className="text-2xl font-extrabold text-stone-900 mt-1">
                                    {periodRevenue.toLocaleString()} บาท
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Card 3: Order count */}
                            <div className="p-6 rounded-3xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3">
                                <span className="p-3 bg-amber-50 rounded-2xl text-amber-700 text-xl">📦</span>
                                <div>
                                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                                    {dashboardFilterMode === 'month' ? 'ออเดอร์ในเดือนนี้' :
                                     dashboardFilterMode === 'year' ? 'ออเดอร์ในปีนี้' :
                                     dashboardFilterMode === 'range' ? 'ออเดอร์ในช่วงเวลานี้' :
                                     'ออเดอร์ทั้งหมดในระบบ'}
                                  </p>
                                  <p className="text-2xl font-extrabold text-stone-900 mt-1">
                                    {filteredOrders.length} รายการ
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Card 4: Best product in period */}
                            <div className="p-6 rounded-3xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3">
                                <span className="p-3 bg-red-50 rounded-2xl text-red-700 text-xl">🔥</span>
                                <div>
                                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                                    {dashboardFilterMode === 'month' ? 'สินค้าขายดีสุดเดือนนี้' :
                                     dashboardFilterMode === 'year' ? 'สินค้าขายดีสุดปีนี้' :
                                     dashboardFilterMode === 'range' ? 'สินค้าขายดีสุดช่วงนี้' :
                                     'สินค้าขายดีที่สุดสะสม'}
                                  </p>
                                  <p className="text-sm font-extrabold text-stone-900 mt-1 leading-snug break-words">
                                    {bestProductText}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* Breakdown Graphs and Best Sellers */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Sales breakdown */}
                      <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm space-y-6">
                        <div className="flex flex-col gap-4 pb-4 border-b border-stone-100">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h4 className="font-bold text-stone-900 flex items-center gap-2">
                              <span>📈</span> รายงานสถิติตามช่วงเวลา
                            </h4>
                            {/* Period Selector Tabs */}
                            <div className="flex bg-stone-100 p-1 rounded-xl">
                              <button
                                onClick={() => { setDashboardPeriod('daily'); setBreakdownSubMode('all'); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${dashboardPeriod === 'daily' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                              >
                                รายวัน
                              </button>
                              <button
                                onClick={() => { setDashboardPeriod('monthly'); setBreakdownSubMode('all'); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${dashboardPeriod === 'monthly' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                              >
                                รายเดือน
                              </button>
                              <button
                                onClick={() => { setDashboardPeriod('yearly'); setBreakdownSubMode('all'); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${dashboardPeriod === 'yearly' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                              >
                                รายปี
                              </button>
                            </div>
                          </div>

                          {/* Sub-Filter Controls for Specific Date / Date Range / Month Range / Year Range */}
                          <div className="flex flex-wrap items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-150 text-xs">
                            <div className="flex bg-stone-200/80 p-0.5 rounded-lg">
                              <button
                                onClick={() => setBreakdownSubMode('all')}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${breakdownSubMode === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'}`}
                              >
                                🌐 แสดงทั้งหมด
                              </button>
                              <button
                                onClick={() => setBreakdownSubMode('single')}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${breakdownSubMode === 'single' ? 'bg-white text-purple-700 shadow-sm' : 'text-stone-600'}`}
                              >
                                🎯 เลือกเจาะจง
                              </button>
                              <button
                                onClick={() => setBreakdownSubMode('range')}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${breakdownSubMode === 'range' ? 'bg-white text-purple-700 shadow-sm' : 'text-stone-600'}`}
                              >
                                📅 เลือกช่วงเวลา (ตั้งแต่... ถึง...)
                              </button>
                            </div>

                            {/* Sub-controls when 'single' */}
                            {breakdownSubMode === 'single' && (
                              <div className="flex items-center gap-2">
                                {dashboardPeriod === 'daily' && (
                                  <input
                                    type="date"
                                    value={singleDate}
                                    onChange={(e) => setSingleDate(e.target.value)}
                                    className="bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-800 focus:outline-none"
                                  />
                                )}
                                {dashboardPeriod === 'monthly' && (
                                  <input
                                    type="month"
                                    value={singleMonthFilter}
                                    onChange={(e) => setSingleMonthFilter(e.target.value)}
                                    className="bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-800 focus:outline-none"
                                  />
                                )}
                                {dashboardPeriod === 'yearly' && (
                                  <input
                                    type="number"
                                    placeholder="เช่น 2026"
                                    value={singleYearFilter}
                                    onChange={(e) => setSingleYearFilter(e.target.value)}
                                    className="w-24 bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-800 focus:outline-none"
                                  />
                                )}
                              </div>
                            )}

                            {/* Sub-controls when 'range' */}
                            {breakdownSubMode === 'range' && (
                              <div className="flex flex-wrap items-center gap-2 font-bold text-stone-600">
                                <span>ตั้งแต่วันที่/ช่วง:</span>
                                {dashboardPeriod === 'daily' && (
                                  <>
                                    <input
                                      type="date"
                                      value={startDate}
                                      onChange={(e) => setStartDate(e.target.value)}
                                      className="bg-white border border-stone-300 rounded-xl px-2 py-1 text-xs font-bold text-stone-800 focus:outline-none"
                                    />
                                    <span>ถึง:</span>
                                    <input
                                      type="date"
                                      value={endDate}
                                      onChange={(e) => setEndDate(e.target.value)}
                                      className="bg-white border border-stone-300 rounded-xl px-2 py-1 text-xs font-bold text-stone-800 focus:outline-none"
                                    />
                                  </>
                                )}
                                {dashboardPeriod === 'monthly' && (
                                  <>
                                    <input
                                      type="month"
                                      value={startMonthFilter}
                                      onChange={(e) => setStartMonthFilter(e.target.value)}
                                      className="bg-white border border-stone-300 rounded-xl px-2 py-1 text-xs font-bold text-stone-800 focus:outline-none"
                                    />
                                    <span>ถึง:</span>
                                    <input
                                      type="month"
                                      value={endMonthFilter}
                                      onChange={(e) => setEndMonthFilter(e.target.value)}
                                      className="bg-white border border-stone-300 rounded-xl px-2 py-1 text-xs font-bold text-stone-800 focus:outline-none"
                                    />
                                  </>
                                )}
                                {dashboardPeriod === 'yearly' && (
                                  <>
                                    <input
                                      type="number"
                                      placeholder="ปีเริ่ม"
                                      value={startYearFilter}
                                      onChange={(e) => setStartYearFilter(e.target.value)}
                                      className="w-20 bg-white border border-stone-300 rounded-xl px-2 py-1 text-xs font-bold text-stone-800 focus:outline-none"
                                    />
                                    <span>ถึง:</span>
                                    <input
                                      type="number"
                                      placeholder="ปีสิ้นสุด"
                                      value={endYearFilter}
                                      onChange={(e) => setEndYearFilter(e.target.value)}
                                      className="w-20 bg-white border border-stone-300 rounded-xl px-2 py-1 text-xs font-bold text-stone-800 focus:outline-none"
                                    />
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* List/Graph */}
                        <div className="space-y-4">
                          {(() => {
                            const paid = orders.filter(o => o.orderStatus !== 'ยกเลิกการสั่งซื้อ' && o.orderStatus !== 'ยกเลิก');
                            let salesData: [string, number][] = [];
                            if (dashboardPeriod === 'daily') {
                              const daily: { [k: string]: number } = {};
                              paid.forEach(o => {
                                const d = (o.createdAt && typeof o.createdAt === 'string') ? o.createdAt.substring(0, 10) : '2026-07-07';
                                daily[d] = (daily[d] || 0) + o.totalPrice;
                              });
                              let entries = Object.entries(daily);

                              if (breakdownSubMode === 'single' && singleDate) {
                                entries = entries.filter(([d]) => d === singleDate);
                              } else if (breakdownSubMode === 'range') {
                                if (startDate) entries = entries.filter(([d]) => d >= startDate);
                                if (endDate) entries = entries.filter(([d]) => d <= endDate);
                              }
                              salesData = entries.sort((a, b) => b[0].localeCompare(a[0]));
                            } else if (dashboardPeriod === 'monthly') {
                              const monthly: { [k: string]: number } = {};
                              paid.forEach(o => {
                                const m = (o.createdAt && typeof o.createdAt === 'string') ? o.createdAt.substring(0, 7) : '2026-07';
                                monthly[m] = (monthly[m] || 0) + o.totalPrice;
                              });
                              let entries = Object.entries(monthly);

                              if (breakdownSubMode === 'single' && singleMonthFilter) {
                                entries = entries.filter(([m]) => m === singleMonthFilter);
                              } else if (breakdownSubMode === 'range') {
                                if (startMonthFilter) entries = entries.filter(([m]) => m >= startMonthFilter);
                                if (endMonthFilter) entries = entries.filter(([m]) => m <= endMonthFilter);
                              }
                              salesData = entries.sort((a, b) => b[0].localeCompare(a[0]));
                            } else {
                              const yearly: { [k: string]: number } = {};
                              paid.forEach(o => {
                                const y = (o.createdAt && typeof o.createdAt === 'string') ? o.createdAt.substring(0, 4) : '2026';
                                yearly[y] = (yearly[y] || 0) + o.totalPrice;
                              });
                              let entries = Object.entries(yearly);

                              if (breakdownSubMode === 'single' && singleYearFilter) {
                                entries = entries.filter(([y]) => y === singleYearFilter);
                              } else if (breakdownSubMode === 'range') {
                                if (startYearFilter) entries = entries.filter(([y]) => y >= startYearFilter);
                                if (endYearFilter) entries = entries.filter(([y]) => y <= endYearFilter);
                              }
                              salesData = entries.sort((a, b) => b[0].localeCompare(a[0]));
                            }

                            if (salesData.length === 0) {
                              return (
                                <p className="text-center text-xs text-stone-400 py-10 font-medium">ไม่พบข้อมูลยอดขายในช่วงเวลาที่เลือกครับ</p>
                              );
                            }

                            const maxVal = Math.max(...salesData.map(d => d[1]), 1);
                            const totalPeriodSum = salesData.reduce((sum, d) => sum + d[1], 0);

                            return (
                              <div className="space-y-4">
                                <div className="overflow-x-auto rounded-2xl border border-stone-100">
                                  <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                      <tr className="bg-stone-50 text-stone-550 font-semibold border-b border-stone-100">
                                        <th className="p-3 pl-4">ช่วงเวลา</th>
                                        <th className="p-3">แนวโน้มยอดขาย</th>
                                        <th className="p-3 text-right pr-4">ยอดขายรวม</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 text-xs font-semibold text-stone-700">
                                      {salesData.map(([period, amt]) => {
                                        const pct = (amt / maxVal) * 100;
                                        return (
                                          <tr key={period} className="hover:bg-stone-50/50">
                                            <td className="p-3 pl-4 font-bold text-stone-900">{period}</td>
                                            <td className="p-3 w-1/2">
                                              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                                                <div
                                                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                                  style={{ width: `${pct}%` }}
                                                />
                                              </div>
                                            </td>
                                            <td className="p-3 text-right pr-4 font-extrabold text-emerald-800">{amt.toLocaleString()} บาท</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                    <tfoot className="bg-emerald-50/80 font-bold border-t border-emerald-200 text-xs">
                                      <tr>
                                        <td colSpan={2} className="p-3 pl-4 text-emerald-950 font-extrabold">
                                          💵 ยอดขายรวมทั้งหมดในช่วงที่เลือก:
                                        </td>
                                        <td className="p-3 text-right pr-4 font-black text-emerald-800 text-sm">
                                          {totalPeriodSum.toLocaleString()} บาท
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Right: Best Sellers Card with Multi-Mode Filters */}
                      <div className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm space-y-6">
                        {(() => {
                          const validOrders = orders.filter(o => o.orderStatus !== 'ยกเลิกการสั่งซื้อ' && o.orderStatus !== 'ยกเลิก');

                          // Available Months
                          const availableMonths = Array.from(new Set(
                            validOrders
                              .filter(o => o.createdAt && typeof o.createdAt === 'string')
                              .map(o => o.createdAt.substring(0, 7))
                          )).sort((a, b) => b.localeCompare(a));

                          const currentMonthStr = getLocalYearMonthDynamic();
                          if (!availableMonths.includes(currentMonthStr)) {
                            availableMonths.unshift(currentMonthStr);
                          }

                          // Available Years
                          const availableYears = Array.from(new Set(
                            validOrders
                              .filter(o => o.createdAt && typeof o.createdAt === 'string')
                              .map(o => o.createdAt.substring(0, 4))
                          )).sort((a, b) => b.localeCompare(a));

                          const currentYearStr = new Date().getFullYear().toString();
                          if (!availableYears.includes(currentYearStr)) {
                            availableYears.unshift(currentYearStr);
                          }

                          // Filter orders based on bestSellerMode
                          const filteredOrders = validOrders.filter(o => {
                            if (!o.createdAt || typeof o.createdAt !== 'string') return true;
                            const d = o.createdAt.substring(0, 10);
                            const m = o.createdAt.substring(0, 7);
                            const y = o.createdAt.substring(0, 4);

                            if (bestSellerMode === 'month') {
                              return m === bestSellerSelectedMonth;
                            }
                            if (bestSellerMode === 'year') {
                              return y === bestSellerSelectedYear;
                            }
                            if (bestSellerMode === 'range') {
                              if (bestSellerStartDate && d < bestSellerStartDate) return false;
                              if (bestSellerEndDate && d > bestSellerEndDate) return false;
                              return true;
                            }
                            return true; // 'all'
                          });

                          // Calculate product sales & revenues
                          const productSales: { [name: string]: { qty: number; rev: number } } = {};
                          filteredOrders.forEach(o => {
                            o.items.forEach(item => {
                              if (!productSales[item.productName]) {
                                productSales[item.productName] = { qty: 0, rev: 0 };
                              }
                              productSales[item.productName].qty += item.quantity;
                              productSales[item.productName].rev += item.quantity * item.price;
                            });
                          });

                          const list = Object.entries(productSales)
                            .map(([name, data]) => {
                              const prod = products.find(p => p.name === name);
                              return {
                                name,
                                qty: data.qty,
                                rev: data.rev,
                                image: prod?.image || '/images/logo.png',
                                unit: prod?.unit || 'กก.'
                              };
                            })
                            .sort((a, b) => b.qty - a.qty);

                          const formatMonthName = (ymStr: string) => {
                            const [y, m] = ymStr.split('-');
                            const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                            return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
                          };

                          return (
                            <>
                              <div className="space-y-3 pb-4 border-b border-stone-100">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-bold text-stone-900 flex items-center gap-2">
                                    <span>🍇</span> อันดับสินค้าขายดี
                                  </h4>
                                </div>

                                {/* Mode Selectors */}
                                <div className="flex bg-stone-100 p-1 rounded-xl text-xs">
                                  <button
                                    onClick={() => setBestSellerMode('month')}
                                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${bestSellerMode === 'month' ? 'bg-white text-purple-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                                  >
                                    รายเดือน
                                  </button>
                                  <button
                                    onClick={() => setBestSellerMode('year')}
                                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${bestSellerMode === 'year' ? 'bg-white text-purple-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                                  >
                                    รายปี
                                  </button>
                                  <button
                                    onClick={() => setBestSellerMode('range')}
                                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${bestSellerMode === 'range' ? 'bg-white text-purple-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                                  >
                                    ช่วงวันที่
                                  </button>
                                  <button
                                    onClick={() => setBestSellerMode('all')}
                                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${bestSellerMode === 'all' ? 'bg-white text-purple-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                                  >
                                    ทั้งหมด
                                  </button>
                                </div>

                                {/* Controls based on mode */}
                                {bestSellerMode === 'month' && (
                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs font-bold text-stone-500">เลือกเดือน:</span>
                                    <select
                                      value={bestSellerSelectedMonth}
                                      onChange={(e) => setBestSellerSelectedMonth(e.target.value)}
                                      className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
                                    >
                                      {availableMonths.map(m => (
                                        <option key={m} value={m}>
                                          {formatMonthName(m)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {bestSellerMode === 'year' && (
                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs font-bold text-stone-500">เลือกปี:</span>
                                    <select
                                      value={bestSellerSelectedYear}
                                      onChange={(e) => setBestSellerSelectedYear(e.target.value)}
                                      className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
                                    >
                                      {availableYears.map(y => (
                                        <option key={y} value={y}>
                                          ปี พ.ศ. {parseInt(y) + 543} ({y})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {bestSellerMode === 'range' && (
                                  <div className="flex flex-col gap-2 pt-1 text-xs font-bold text-stone-600">
                                    <div className="flex items-center justify-between gap-2">
                                      <span>เริ่ม:</span>
                                      <input
                                        type="date"
                                        value={bestSellerStartDate}
                                        onChange={(e) => setBestSellerStartDate(e.target.value)}
                                        className="bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 text-xs text-stone-800 focus:outline-none"
                                      />
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <span>ถึง:</span>
                                      <input
                                        type="date"
                                        value={bestSellerEndDate}
                                        onChange={(e) => setBestSellerEndDate(e.target.value)}
                                        className="bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 text-xs text-stone-800 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-4 pt-2">
                                {list.length === 0 ? (
                                  <p className="text-center text-xs text-stone-400 py-8 font-medium">ไม่พบข้อมูลสินค้าขายดีในช่วงเวลาที่เลือกครับ</p>
                                ) : (
                                  <div className="space-y-3">
                                    {list.map((item: any, idx: number) => (
                                      <div key={item.name} className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-100 rounded-2xl hover:border-purple-200 transition-all">
                                        <div className="font-bold text-stone-400 text-sm w-4 text-center">#{idx + 1}</div>
                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-stone-200 flex-shrink-0">
                                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-bold text-xs text-stone-900 truncate">{item.name}</h5>
                                          <p className="text-[10px] text-stone-500 font-semibold mt-0.5">ขายได้ {item.qty} {item.unit}</p>
                                        </div>
                                        <div className="text-right text-xs font-extrabold text-purple-700">
                                          {item.rev.toLocaleString()} บ.
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. PRODUCTS TAB */}
                {adminTab === 'products' && (
                  <div className="space-y-6">
                    {/* Category Filter Tabs for Admin */}
                    <div className="flex flex-wrap gap-2 border-b border-stone-100 pb-4">
                      <button
                        onClick={() => setAdminCategoryFilter('ทั้งหมด')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${adminCategoryFilter === 'ทั้งหมด'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                      >
                        ทั้งหมด
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setAdminCategoryFilter(cat.name)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${adminCategoryFilter === cat.name
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                          📁 {cat.name}
                        </button>
                      ))}
                    </div>

                    {/* Product List View */}
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-stone-900">
                            จัดการข้อมูลสินค้า {adminCategoryFilter !== 'ทั้งหมด' && `(${adminCategoryFilter})`}
                          </h3>
                          <p className="text-sm text-stone-500 font-medium">เพิ่ม แก้ไข หรือลบรายการสินค้าในหมวดหมู่นี้</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingProduct(null);
                            setProductForm({
                              name: '',
                              price: 0,
                              originalPrice: 0,
                              promotionText: '',
                              unit: 'กก.',
                              image: '/images/black_grapes.png',
                              category: adminCategoryFilter !== 'ทั้งหมด' ? adminCategoryFilter : (categories[0]?.name || 'ผลไม้สด'),
                              stock: 50
                            });
                            setIsProductModalOpen(true);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                          เพิ่มสินค้าใหม่
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-stone-100">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-100">
                              <th className="p-4">รูปภาพ</th>
                              <th className="p-4">ชื่อสินค้า</th>
                              <th className="p-4">หมวดหมู่</th>
                              <th className="p-4">ราคา & สต็อก</th>
                              <th className="p-4">โปรโมชั่น</th>
                              <th className="p-4">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                            {products
                              .filter(p => adminCategoryFilter === 'ทั้งหมด' || p.category === adminCategoryFilter)
                              .map((product) => (
                                <tr key={product.id} className="hover:bg-stone-50/50 transition-colors">
                                  <td className="p-4">
                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-100 bg-stone-50">
                                      <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <p className="font-bold text-stone-900">{product.name}</p>
                                    <p className="text-xs text-stone-500">รหัส: {product.id}</p>
                                  </td>
                                  <td className="p-4">
                                    <span className="text-xs px-2.5 py-1 rounded-full font-bold border bg-purple-50 text-purple-700 border-purple-200">
                                      {product.category}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="text-stone-900 font-bold">{product.price} บาท/{product.unit}</div>
                                    <div className="text-xs font-semibold text-stone-500 space-y-1">
                                      <div>
                                        คงเหลือ: <span className={product.stock > 10 ? "text-emerald-700" : "text-red-650 font-bold"}>{product.stock} {product.unit}</span>
                                      </div>
                                      {product.stock <= 10 && (
                                        <div className="text-[10px] text-red-600 font-extrabold bg-red-50 border border-red-150 rounded px-1.5 py-0.5 w-fit">
                                          ⚠️ สินค้าใกล้หมด! กรุณาเพิ่มสินค้า
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    {product.originalPrice && product.originalPrice > product.price ? (
                                      <div className="space-y-0.5">
                                        <div className="text-xs font-bold text-red-600">
                                          ลดราคา (ปกติ {product.originalPrice} บ.)
                                        </div>
                                        {product.promotionText && (
                                          <div className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 w-fit font-bold">
                                            {product.promotionText}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-stone-400 text-xs">ไม่มีโปรโมชั่น</span>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingProduct(product);
                                          setProductForm({
                                            name: product.name,
                                            price: product.price,
                                            originalPrice: product.originalPrice || 0,
                                            promotionText: product.promotionText || '',
                                            unit: product.unit,
                                            image: product.image,
                                            category: product.category,
                                            stock: product.stock
                                          });
                                          setIsProductModalOpen(true);
                                        }}
                                        className="bg-stone-100 hover:bg-purple-50 hover:text-purple-700 p-2 rounded-xl text-stone-600 transition-colors"
                                        title="แก้ไขข้อมูล"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm(`คุณแน่ใจว่าต้องการลบ ${product.name} ใช่หรือไม่?`)) {
                                            handleDeleteProduct(product.id);
                                          }
                                        }}
                                        className="bg-stone-100 hover:bg-red-50 hover:text-red-700 p-2 rounded-xl text-stone-600 transition-colors"
                                        title="ลบสินค้า"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1.5. CATEGORIES TAB */}
                {adminTab === 'categories' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-stone-900">จัดการประเภทสินค้า</h3>
                        <p className="text-sm text-stone-500 font-medium">เพิ่ม แก้ไข หรือลบประเภทสินค้าในระบบ (เช่น ข้าวสาร, ผลไม้สด, ผลไม้แปรรูป)</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryForm({ name: '', description: '', image: '/images/jasmine_rice.png' });
                          setIsCategoryModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        เพิ่มประเภทสินค้าใหม่
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-stone-100">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-150">
                            <th className="p-4">รูปภาพ</th>
                            <th className="p-4">ชื่อประเภทสินค้า</th>
                            <th className="p-4">คำอธิบาย</th>
                            <th className="p-4">จำนวนสินค้า</th>
                            <th className="p-4">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                          {categories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="p-4">
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-100 bg-stone-50">
                                  <img src={cat.image} alt={cat.name} className="object-cover w-full h-full" />
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-stone-900">{cat.name}</p>
                                <p className="text-xs text-stone-400">รหัสอ้างอิง: {cat.id}</p>
                              </td>
                              <td className="p-4 text-stone-600 text-xs max-w-xs truncate">{cat.description}</td>
                              <td className="p-4">
                                <span className="bg-stone-100 text-stone-850 text-xs px-2.5 py-1 rounded-full font-bold">
                                  {products.filter(p => p.category === cat.name).length} รายการ
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingCategory(cat);
                                      setCategoryForm({ name: cat.name, description: cat.description, image: cat.image });
                                      setIsCategoryModalOpen(true);
                                    }}
                                    className="bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 p-2 rounded-xl text-stone-600 transition-colors"
                                    title="แก้ไขข้อมูล"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => {
                                      const count = products.filter(p => p.category === cat.name).length;
                                      if (count > 0) {
                                        alert(`ไม่สามารถลบหมวดหมู่ "${cat.name}" ได้ เนื่องจากยังมีสินค้าในหมวดหมู่นี้อยู่ ${count} รายการ กรุณาย้ายหรือลบสินค้าก่อนครับ`);
                                        return;
                                      }
                                      if (confirm(`คุณแน่ใจว่าต้องการลบประเภทสินค้า ${cat.name} ใช่หรือไม่?`)) {
                                        handleDeleteCategory(cat.id);
                                      }
                                    }}
                                    className="bg-stone-100 hover:bg-red-50 hover:text-red-700 p-2 rounded-xl text-stone-600 transition-colors"
                                    title="ลบหมวดหมู่"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. ORDERS TAB */}
                {adminTab === 'orders' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">จัดการข้อมูลคำสั่งซื้อของลูกค้า</h3>
                      <p className="text-sm text-stone-500 font-medium">ดูประวัติออเดอร์ ตรวจสอบการจ่ายเงิน และแก้ไขสถานะจัดส่ง</p>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-stone-100">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-100">
                            <th className="p-4">รหัสออเดอร์</th>
                            <th className="p-4">ลูกค้า</th>
                            <th className="p-4">ยอดรวม</th>
                            <th className="p-4">สถานะคำสั่งซื้อ</th>
                            <th className="p-4">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                          {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="p-4 font-bold text-purple-700">{order.id}</td>
                              <td className="p-4">
                                <p className="font-bold text-stone-900">{order.username}</p>
                                <p className="text-xs text-stone-400">{order.createdAt}</p>
                              </td>
                              <td className="p-4 font-bold text-stone-900">{order.totalPrice} บาท</td>
                              <td className="p-4">
                                <div className="flex flex-col items-start gap-1">
                                  <select
                                    value={order.orderStatus}
                                    onChange={async (e) => {
                                      const nextStatus = e.target.value;
                                      setOrders(orders.map(o => o.id === order.id ? { ...o, orderStatus: nextStatus } : o));
                                      await handleUpdateOrderStatus(order.id, { orderStatus: nextStatus });
                                    }}
                                    className={`text-xs font-bold rounded-full px-3 py-1.5 border focus:outline-none cursor-pointer shadow-sm transition-all ${
                                      order.orderStatus === 'จัดส่งแล้ว' || order.orderStatus === 'ส่งสำเร็จ' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      order.orderStatus === 'กำลังจัดส่งไปให้ทางขนส่ง' || order.orderStatus === 'กำลังจัดส่ง' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                      order.orderStatus === 'รอดำเนินการ' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      order.orderStatus === 'รอการตรวจสอบ' || order.orderStatus === 'รอตรวจสอบ' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                      'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                  >
                                    <option value="รอการตรวจสอบ">⏳ รอการตรวจสอบ</option>
                                    <option value="รอดำเนินการ">📦 รอดำเนินการ</option>
                                    <option value="กำลังจัดส่งไปให้ทางขนส่ง">🚚 กำลังจัดส่งไปให้ทางขนส่ง</option>
                                    <option value="จัดส่งแล้ว">✅ จัดส่งแล้ว</option>
                                    <option value="ยกเลิกการสั่งซื้อ">❌ ยกเลิกการสั่งซื้อ</option>
                                  </select>

                                  {/* Delivery image upload button for admin when status is 'จัดส่งแล้ว' */}
                                  {(order.orderStatus === 'จัดส่งแล้ว' || order.orderStatus === 'ส่งสำเร็จ' || order.trackingImageUrl) && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <label className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer flex items-center gap-1 transition-all">
                                        📷 {order.trackingImageUrl ? 'แก้ไขรูปภาพจัดส่ง' : 'แนบรูปภาพจัดส่งให้ลูกค้า'}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                              const formData = new FormData();
                                              formData.append('file', file);
                                              const { url } = await uploadFile(formData);
                                              await handleUpdateOrderStatus(order.id, { orderStatus: 'จัดส่งแล้ว', trackingImageUrl: url });
                                              setOrders(orders.map(o => o.id === order.id ? { ...o, orderStatus: 'จัดส่งแล้ว', trackingImageUrl: url } : o));
                                              alert(`อัปโหลดรูปภาพหลักฐานการจัดส่งเรียบร้อยแล้วสำหรับออเดอร์ #${order.id}!`);
                                            } catch (err) {
                                              alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพจัดส่ง');
                                            }
                                          }}
                                          className="hidden"
                                        />
                                      </label>
                                      {order.trackingImageUrl && (
                                        <button
                                          onClick={() => setViewingSlipUrl(order.trackingImageUrl || null)}
                                          className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          🖼️ ดูรูปจัดส่ง
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {/* Refund slip upload button for admin when status is 'ยกเลิกการสั่งซื้อ' */}
                                  {(order.orderStatus === 'ยกเลิกการสั่งซื้อ' || order.orderStatus === 'ยกเลิก' || order.refundSlipUrl) && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <label className="text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 cursor-pointer flex items-center gap-1 transition-all">
                                        📷 {order.refundSlipUrl ? 'แก้ไขสลิปคืนเงิน' : 'แนบรูปภาพสลิปคืนเงินให้ลูกค้า'}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                              const formData = new FormData();
                                              formData.append('file', file);
                                              const { url } = await uploadFile(formData);
                                              await handleUpdateOrderStatus(order.id, { orderStatus: 'ยกเลิกการสั่งซื้อ', refundSlipUrl: url });
                                              setOrders(orders.map(o => o.id === order.id ? { ...o, orderStatus: 'ยกเลิกการสั่งซื้อ', refundSlipUrl: url } : o));
                                              alert(`อัปโหลดรูปภาพสลิปโอนเงินคืนเรียบร้อยแล้วสำหรับออเดอร์ #${order.id}!`);
                                            } catch (err) {
                                              alert('เกิดข้อผิดพลาดในการอัปโหลดสลิปคืนเงิน');
                                            }
                                          }}
                                          className="hidden"
                                        />
                                      </label>
                                      {order.refundSlipUrl && (
                                        <button
                                          onClick={() => setViewingSlipUrl(order.refundSlipUrl || null)}
                                          className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          💸 ดูสลิปคืนเงิน
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1.5 items-start">
                                  <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                                  >
                                    ดูรายละเอียด
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. MEMBERS TAB */}
                {adminTab === 'members' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-stone-900">จัดการข้อมูลสมาชิก</h3>
                        <p className="text-xs text-stone-500 font-medium">ดูรายชื่อสมาชิก เพิ่มสมาชิกใหม่ แก้ไขข้อมูลสิทธิ์ อัปโหลดรูป หรือลบบัญชีสมาชิก</p>
                      </div>

                      <button
                        onClick={() => {
                          setEditingUser(null);
                          setUserForm({ username: '', email: '', password: '', phone: '', role: 'User', profileImage: '' });
                          setIsUserModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto cursor-pointer"
                      >
                        ➕ เพิ่มสมาชิกใหม่
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-stone-100 bg-white shadow-xs">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-100">
                            <th className="p-4">ผู้ใช้งาน</th>
                            <th className="p-4">อีเมล</th>
                            <th className="p-4">เบอร์โทรศัพท์</th>
                            <th className="p-4">ระดับสิทธิ์ (Role)</th>
                            <th className="p-4">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                          {users.map((user) => (
                            <tr key={user.email || user.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  {user.profileImage ? (
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-200 bg-stone-50 flex-shrink-0 flex items-center justify-center">
                                      <img
                                        src={user.profileImage}
                                        alt={user.username}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-emerald-200">
                                      {user.username.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-bold text-stone-900 block">{user.username}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-stone-600 font-medium">{user.email}</td>
                              <td className="p-4 text-stone-500 font-medium">{user.phone || '-'}</td>
                              <td className="p-4">
                                <select
                                  value={user.role}
                                  onChange={(e) => {
                                    const nextRole = e.target.value as UserProfile['role'];
                                    setUsers(users.map(u => u.email === user.email ? { ...u, role: nextRole } : u));
                                    if (currentUser?.email === user.email) {
                                      setCurrentUser({ ...currentUser, role: nextRole });
                                    }
                                    handleUpdateUserRole(user.id, nextRole);
                                  }}
                                  className="text-xs font-bold rounded-xl border border-stone-200 px-2 py-1 focus:outline-none cursor-pointer"
                                >
                                  <option value="Admin">🛠️ Admin</option>
                                  <option value="Member">💎 Member</option>
                                  <option value="User">👤 User</option>
                                </select>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingUser(user);
                                      setUserForm({
                                        username: user.username,
                                        email: user.email,
                                        password: '',
                                        phone: user.phone || '',
                                        role: user.role,
                                        profileImage: user.profileImage || '',
                                      });
                                      setIsUserModalOpen(true);
                                    }}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-xl transition-all text-xs border border-emerald-200 flex items-center gap-1 cursor-pointer"
                                  >
                                    ✏️ แก้ไข
                                  </button>

                                  <button
                                    onClick={() => setSelectedMemberOrders(user)}
                                    className="bg-purple-50 hover:bg-purple-100 text-purple-750 font-bold px-3 py-1.5 rounded-xl transition-all text-xs border border-purple-200 flex items-center gap-1 cursor-pointer"
                                  >
                                    📦 ประวัติสั่งซื้อ ({orders.filter(o => o.username === user.username).length})
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (currentUser?.email === user.email) {
                                        alert('คุณไม่สามารถลบบัญชีตัวเองที่กำลังเข้าสู่ระบบอยู่ได้ครับ');
                                        return;
                                      }
                                      if (confirm(`คุณแน่ใจว่าต้องการลบสมาชิก ${user.username} ใช่หรือไม่?`)) {
                                        setUsers(users.filter(u => u.email !== user.email));
                                        handleDeleteUser(user.id);
                                      }
                                    }}
                                    className="bg-stone-100 hover:bg-red-50 hover:text-red-750 text-stone-600 font-bold px-3 py-1.5 rounded-xl transition-all text-xs border border-stone-200 flex items-center gap-1 cursor-pointer"
                                  >
                                    🗑️ ลบ
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. PAYMENTS TAB */}
                {adminTab === 'payments' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">ช่องทางการชำระเงิน & ภาพรวมยอดขาย</h3>
                      <p className="text-sm text-stone-500 font-medium">ภาพรวมการจำหน่ายสินค้าของร้านและการตรวจสอบอนุมัติการชำระเงิน</p>
                    </div>

                    {/* Sales Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">ยอดขายที่ยืนยันแล้ว</p>
                        <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                          {orders.filter(o => o.orderStatus === 'รอดำเนินการ' || o.orderStatus === 'กำลังจัดส่งไปให้ทางขนส่ง' || o.orderStatus === 'จัดส่งแล้ว' || o.orderStatus === 'ส่งสำเร็จ').reduce((sum, o) => sum + o.totalPrice, 0)} บาท
                        </p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">จากคำสั่งซื้อที่ได้รับการชำระเงินและอนุมัติแล้ว</p>
                      </div>

                      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">ยอดขายรออนุมัติ</p>
                        <p className="text-2xl font-extrabold text-amber-900 mt-1">
                          {orders.filter(o => o.orderStatus === 'รอการตรวจสอบ').reduce((sum, o) => sum + o.totalPrice, 0)} บาท
                        </p>
                        <p className="text-[10px] text-amber-600 mt-0.5">อยู่ระหว่างรอการอนุมัติสลิปโอนเงิน</p>
                      </div>

                      <div className="p-5 rounded-2xl bg-purple-50 border border-purple-100">
                        <p className="text-xs font-bold text-purple-800 uppercase tracking-wide">จำนวนคำสั่งซื้อทั้งหมด</p>
                        <p className="text-2xl font-extrabold text-purple-900 mt-1">{orders.length} รายการ</p>
                        <p className="text-[10px] text-purple-600 mt-0.5">คำสั่งซื้อในระบบทั้งหมด</p>
                      </div>
                    </div>

                    {/* Pending Approvals Table */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-stone-900 flex items-center gap-2">
                        <span>⏳</span> ตรวจสอบการโอนเงินที่รอการอนุมัติ
                      </h4>
                      {orders.filter(o => o.orderStatus === 'รอการตรวจสอบ').length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-stone-200 rounded-2xl text-stone-500 font-medium">
                          ไม่มีออเดอร์ที่ค้างตรวจสอบยอดชำระเงิน
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-stone-100">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-100">
                                <th className="p-4">รหัสออเดอร์</th>
                                <th className="p-4">ผู้สั่งซื้อ</th>
                                <th className="p-4">ช่องทาง</th>
                                <th className="p-4 text-center">สลิปการโอน</th>
                                <th className="p-4">ยอดเงิน</th>
                                <th className="p-4">การจัดการอนุมัติ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                              {orders.filter(o => o.orderStatus === 'รอการตรวจสอบ').map((order) => (
                                <tr key={order.id} className="hover:bg-stone-50/50">
                                  <td className="p-4 font-bold text-purple-700">{order.id}</td>
                                  <td className="p-4 text-stone-900 font-bold">{order.username}</td>
                                  <td className="p-4 text-stone-600">{order.paymentMethod}</td>
                                  <td className="p-4 text-center">
                                    {order.slipUrl ? (
                                      <button
                                        onClick={() => setViewingSlipUrl(order.slipUrl || null)}
                                        className="inline-flex items-center gap-1.5 text-xs text-purple-700 hover:text-purple-900 font-bold bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-200 hover:bg-purple-100 transition-all shadow-sm"
                                        title="คลิกเพื่อดูสลิปภาพใหญ่"
                                      >
                                        🖼️ ดูสลิป
                                      </button>
                                    ) : (
                                      <span className="text-stone-400 text-xs">ไม่ได้แนบสลิป</span>
                                    )}
                                  </td>
                                  <td className="p-4 font-extrabold text-emerald-800">{order.totalPrice} บาท</td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setOrders(orders.map(o => o.id === order.id ? { ...o, orderStatus: 'รอดำเนินการ' } : o));
                                          handleUpdateOrderStatus(order.id, { orderStatus: 'รอดำเนินการ' });
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all"
                                      >
                                        ✔️ อนุมัติสลิป
                                      </button>
                                      <button
                                        onClick={() => {
                                          setOrders(orders.map(o => o.id === order.id ? { ...o, orderStatus: 'ยกเลิกการสั่งซื้อ' } : o));
                                          handleUpdateOrderStatus(order.id, { orderStatus: 'ยกเลิกการสั่งซื้อ' });
                                        }}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-all border border-red-200"
                                      >
                                        ❌ ปฏิเสธ
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. CUSTOMER CHATS TAB */}
                {adminTab === 'chats' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">💬 แชทบริการลูกค้า (Customer Live Chat Support)</h3>
                      <p className="text-sm text-stone-500 font-medium">ตอบกลับลูกค้าและบริการปรึกษาข้อมูลแบบเรียลไทม์แทนระบบตอบคำถามอัตโนมัติ</p>
                    </div>

                    <div className="h-[600px] flex flex-col md:flex-row bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-sm">
                      {/* Left Panel: Chat List */}
                      <div className="w-full md:w-80 border-r border-stone-200 flex flex-col bg-stone-50/50">
                        <div className="p-4 border-b border-stone-200 bg-white">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">ห้องสนทนาทั้งหมด</p>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
                          {Object.keys(chatThreads).length === 0 ? (
                            <div className="p-8 text-center text-stone-400 text-xs font-bold">
                              ไม่มีประวัติการแชทในระบบ
                            </div>
                          ) : (
                            Object.entries(chatThreads)
                              .sort((a, b) => new Date(b[1].lastUpdated).getTime() - new Date(a[1].lastUpdated).getTime())
                              .map(([key, thread]) => {
                                const lastMsg = (thread as any).messages[(thread as any).messages.length - 1];
                                const isSelected = selectedAdminChatKey === key;
                                return (
                                  <div
                                    key={key}
                                    onClick={() => {
                                      setSelectedAdminChatKey(key);
                                      // Clear unread flag
                                      setChatThreads(prev => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          unread: false
                                        }
                                      }));
                                    }}
                                    className={`p-4 cursor-pointer transition-all flex items-start gap-3 select-none ${isSelected
                                      ? 'bg-purple-50/80 border-l-4 border-purple-600 font-bold'
                                      : 'hover:bg-stone-50'
                                      }`}
                                  >
                                    {(thread as any).profileImage ? (
                                      <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-200 bg-purple-50 flex-shrink-0 flex items-center justify-center shadow-xs">
                                        <img
                                          src={(thread as any).profileImage}
                                          alt={key}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {key === 'ผู้เยี่ยมชม' ? '👤' : key.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <p className={`text-xs font-bold truncate ${(thread as any).unread ? 'text-stone-900 font-black' : 'text-stone-700'}`}>
                                          {key}
                                        </p>
                                        <span className="text-[9px] text-stone-400 font-bold shrink-0">
                                          {lastMsg ? lastMsg.timestamp : ''}
                                        </span>
                                      </div>
                                      <p className={`text-[11px] truncate mt-1 ${(thread as any).unread ? 'text-purple-750 font-black' : 'text-stone-500 font-medium'}`}>
                                        {lastMsg ? lastMsg.text : 'เริ่มการสนทนา'}
                                      </p>
                                      {(thread as any).email && (
                                        <p className="text-[9px] text-stone-400 font-mono mt-0.5 truncate">{(thread as any).email}</p>
                                      )}
                                    </div>
                                    {(thread as any).unread && (
                                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 animate-pulse mt-1.5"></span>
                                    )}
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>

                      {/* Right Panel: Selected Chat Thread */}
                      <div className="flex-1 flex flex-col bg-[#fafaf8] min-w-0">
                        {selectedAdminChatKey && chatThreads[selectedAdminChatKey] ? (
                          <>
                            {/* Thread Header */}
                            <div className="p-4 bg-white border-b border-stone-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {chatThreads[selectedAdminChatKey].profileImage ? (
                                  <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-200 bg-purple-50 flex-shrink-0 flex items-center justify-center shadow-xs">
                                    <img
                                      src={chatThreads[selectedAdminChatKey].profileImage}
                                      alt={selectedAdminChatKey}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {selectedAdminChatKey === 'ผู้เยี่ยมชม' ? '👤' : selectedAdminChatKey.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-extrabold text-sm text-stone-850">{selectedAdminChatKey}</h4>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${selectedAdminChatKey === 'ผู้เยี่ยมชม'
                                      ? 'bg-stone-55 border-stone-200 text-stone-600'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      }`}>
                                      {selectedAdminChatKey === 'ผู้เยี่ยมชม' ? 'ผู้เยี่ยมชม' : 'สมาชิกในระบบ'}
                                    </span>
                                  </div>
                                  {chatThreads[selectedAdminChatKey].email && (
                                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">{chatThreads[selectedAdminChatKey].email}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Timeline Messages Feed */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                              {chatThreads[selectedAdminChatKey].messages.map((msg: any, idx: number) => {
                                const isMe = msg.sender === 'admin';
                                return (
                                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-150`}>
                                    <div className="flex items-end gap-2 max-w-[80%]">
                                      {!isMe && (
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold flex-shrink-0 border border-stone-200">
                                          {msg.sender === 'bot' ? (
                                            '👵'
                                          ) : chatThreads[selectedAdminChatKey]?.profileImage ? (
                                            <img
                                              src={chatThreads[selectedAdminChatKey].profileImage}
                                              alt="Customer"
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                              }}
                                            />
                                          ) : (
                                            '👤'
                                          )}
                                        </div>
                                      )}
                                      <div className="flex flex-col">
                                        {!isMe && (
                                          <span className="text-[9px] text-stone-400 font-bold mb-0.5 ml-1">
                                            {msg.sender === 'bot' ? 'บอทตอบอัตโนมัติ (👵)' : 'ลูกค้า'}
                                          </span>
                                        )}
                                        <div className={`px-4 py-2.5 rounded-2xl text-xs font-bold leading-relaxed whitespace-pre-line shadow-sm ${isMe
                                          ? 'bg-[#7e22ce] text-white rounded-br-none font-bold'
                                          : msg.sender === 'bot'
                                            ? 'bg-white border border-stone-200 text-stone-500 font-semibold'
                                            : 'bg-white border border-stone-200 text-stone-850 font-bold'
                                          }`}>
                                          {msg.text}
                                        </div>
                                        <span className={`text-[9px] text-stone-400 font-semibold mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                          {msg.timestamp}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div ref={adminChatEndRef} />
                            </div>

                            {/* Reply Input Form */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleAdminSendChatMessage();
                              }}
                              className="p-4 bg-white border-t border-stone-200 flex gap-3 items-center"
                            >
                              <input
                                type="text"
                                value={adminChatInput}
                                onChange={(e) => setAdminChatInput(e.target.value)}
                                placeholder={`พิมพ์ข้อความตอบกลับคุณ ${selectedAdminChatKey}...`}
                                className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-purple-600 font-semibold text-stone-850"
                              />
                              <button
                                type="submit"
                                className="bg-[#166534] hover:bg-emerald-800 text-white font-extrabold px-6 py-3 rounded-2xl text-xs transition-all cursor-pointer shadow-md shrink-0"
                              >
                                ส่งคำตอบ
                              </button>
                            </form>
                          </>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="text-5xl mb-4">💬</div>
                            <h4 className="font-extrabold text-stone-800 text-base">ศูนย์บริการลูกค้าสัมพันธ์</h4>
                            <p className="text-xs text-stone-500 font-medium max-w-xs mt-1">
                              เลือกห้องแชทของลูกค้าหรือผู้เยี่ยมชมจากรายการด้านซ้าย เพื่อตรวจสอบประวัติการสนทนาและพิมพ์พูดคุยตอบกลับ
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. EMAILS TAB */}
                {adminTab === 'emails' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">📧 ส่งอีเมลแจ้งเตือน (Email Notifications)</h3>
                      <p className="text-sm text-stone-500 font-medium">ส่งอีเมลไปยังสมาชิกหรือลูกค้าในระบบ</p>
                    </div>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const { to, subject, html } = emailForm;
                        
                        if (!to || !subject || !html) {
                          alert('กรุณากรอกข้อมูลให้ครบถ้วน');
                          return;
                        }
                        
                        try {
                          const res = await sendEmail({ to, subject, html, text: html.replace(/<[^>]+>/g, '') });
                          if (res.success) {
                            alert('ส่งอีเมลสำเร็จแล้ว!');
                            setEmailForm({ to: '', subject: '', html: '' });
                          } else {
                            alert('เกิดข้อผิดพลาดในการส่งอีเมล: ' + res.error);
                          }
                        } catch (err: any) {
                          alert('เกิดข้อผิดพลาด: ' + err.message);
                        }
                      }}
                      className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/60 shadow-sm space-y-5"
                    >
                      {/* Templates Menu */}
                      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-stone-100">
                        <span className="text-xs font-bold text-stone-500 mr-2">เลือกเทมเพลตด่วน:</span>
                        {emailTemplates.map((tpl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setEmailForm({ ...emailForm, subject: tpl.subject, html: tpl.html })}
                            className="bg-stone-50 hover:bg-purple-50 text-stone-700 hover:text-purple-700 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-stone-200 hover:border-purple-200 transition-colors"
                          >
                            {tpl.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setEmailForm({ ...emailForm, subject: '', html: '' })}
                          className="bg-stone-50 hover:bg-stone-200 text-stone-500 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-stone-200 transition-colors ml-auto"
                        >
                          ล้างค่า (Clear)
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-2">ถึง (To): อีเมลผู้รับ</label>
                        <input type="email" value={emailForm.to} onChange={e => setEmailForm({...emailForm, to: e.target.value})} required placeholder="customer@example.com" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-600 font-medium text-stone-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-2">หัวข้ออีเมล (Subject)</label>
                        <input type="text" value={emailForm.subject} onChange={e => setEmailForm({...emailForm, subject: e.target.value})} required placeholder="แจ้งโปรโมชั่น หรือ สถานะคำสั่งซื้อ..." className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-600 font-medium text-stone-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-2">เนื้อหาอีเมล (Rich Text)</label>
                        <RichTextEditor 
                          value={emailForm.html} 
                          onChange={(html) => setEmailForm({...emailForm, html})} 
                          placeholder="พิมพ์เนื้อหาอีเมลที่นี่ หรือเลือกจากเทมเพลตด้านบน..."
                        />
                      </div>
                      <div className="pt-4 border-t border-stone-100 flex justify-end">
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-8 py-3.5 rounded-2xl text-sm transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center gap-2">
                          <span>📧</span> ยืนยันส่งอีเมล
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
            </div>
          </div>

          {/* PRODUCT ADD/EDIT MODAL */}
          {isProductModalOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-stone-900">
                    {editingProduct ? '✏️ แก้ไขรายละเอียดสินค้า' : '✨ เพิ่มสินค้าใหม่'}
                  </h4>
                  <button onClick={() => setIsProductModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  // Check duplicate product name
                  const targetName = productForm.name.trim().toLowerCase();
                  const isDuplicate = products.some(p => p.name.trim().toLowerCase() === targetName && (!editingProduct || p.id !== editingProduct.id));
                  if (isDuplicate) {
                    alert(`⚠️ มีสินค้าชื่อ "${productForm.name}" อยู่ในระบบแล้วครับ กรุณาใช้ชื่ออื่น`);
                    return;
                  }

                  setIsSavingProduct(true);
                  try {
                    if (editingProduct) {
                      await updateProduct(editingProduct.id, productForm);
                    } else {
                      await createProduct(productForm);
                    }
                    setIsProductModalOpen(false);
                    loadData(false);
                  } catch (err: any) {
                    console.error('Error saving product:', err);
                    alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้าครับ');
                  } finally {
                    setIsSavingProduct(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ชื่อสินค้า</label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ราคาขาย (บาท)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">หน่วยสินค้า</label>
                      <input
                        type="text"
                        required
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ราคาปกติ (กรณีทำโปรโมชั่น)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="ไม่บังคับ"
                        value={productForm.originalPrice || ''}
                        onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ข้อความโปรโมชั่น</label>
                      <input
                        type="text"
                        placeholder="เช่น ลด 20%, แนะนำ"
                        value={productForm.promotionText || ''}
                        onChange={(e) => setProductForm({ ...productForm, promotionText: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">หมวดหมู่สินค้า</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">จำนวนสต็อกสินค้า</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">รูปภาพสินค้า</label>
                    {productForm.image && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 mb-2">
                        <img src={productForm.image} alt="ตัวอย่างรูปภาพสินค้า" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0], (url) => setProductForm({ ...productForm, image: url }))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      disabled={isSavingProduct}
                      onClick={() => setIsProductModalOpen(false)}
                      className="w-1/2 border border-stone-300 hover:bg-stone-50 text-stone-750 font-bold py-3 rounded-full text-sm transition-all disabled:opacity-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProduct}
                      className="w-1/2 bg-[#7e22ce] hover:bg-[#6b21a8] text-white font-bold py-3 rounded-full text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingProduct ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>กำลังบันทึก...</span>
                        </>
                      ) : (
                        editingProduct ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CATEGORY ADD/EDIT MODAL */}
          {isCategoryModalOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-stone-900">
                    {editingCategory ? '✏️ แก้ไขรายละเอียดประเภทสินค้า' : '✨ เพิ่มประเภทสินค้าใหม่'}
                  </h4>
                  <button onClick={() => setIsCategoryModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  // Check duplicate category name
                  const targetName = categoryForm.name.trim().toLowerCase();
                  const isDuplicate = categories.some(c => c.name.trim().toLowerCase() === targetName && (!editingCategory || c.id !== editingCategory.id));
                  if (isDuplicate) {
                    alert(`⚠️ มีประเภทสินค้าชื่อ "${categoryForm.name}" อยู่ในระบบแล้วครับ กรุณาใช้ชื่ออื่น`);
                    return;
                  }

                  setIsSavingCategory(true);
                  try {
                    if (editingCategory) {
                      await updateCategory(editingCategory.id, categoryForm);
                    } else {
                      await createCategory(categoryForm);
                    }
                    setIsCategoryModalOpen(false);
                    loadData(false);
                  } catch (err: any) {
                    console.error('Error saving category:', err);
                    alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกประเภทสินค้าครับ');
                  } finally {
                    setIsSavingCategory(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ชื่อประเภทสินค้า</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="เช่น ข้าวสาร, ผลไม้แปรรูป..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">คำอธิบายประเภทสินค้า</label>
                    <textarea
                      required
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="คำอธิบายหมวดหมู่สั้นๆ เช่น ผลไม้ออร์แกนิกตามฤดูกาล..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">รูปภาพประเภท</label>
                    {categoryForm.image && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 mb-2">
                        <img src={categoryForm.image} alt="ตัวอย่างรูปภาพประเภท" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0], (url) => setCategoryForm({ ...categoryForm, image: url }))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 font-bold file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      disabled={isSavingCategory}
                      onClick={() => setIsCategoryModalOpen(false)}
                      className="w-1/2 border border-stone-300 hover:bg-stone-50 text-stone-750 font-bold py-3 rounded-full text-sm transition-all disabled:opacity-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCategory}
                      className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-full text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingCategory ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>กำลังบันทึก...</span>
                        </>
                      ) : (
                        editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มประเภทสินค้า'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADMIN ORDER DETAILS MODAL */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-150">
                  <h4 className="text-xl font-bold text-stone-900">
                    📋 รายละเอียดคำสั่งซื้อ {selectedOrder.id}
                  </h4>
                  <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {/* Customer Information */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
                    <h5 className="font-extrabold text-xs text-stone-500 uppercase tracking-wider">ข้อมูลผู้ซื้อ</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm font-semibold text-stone-800">
                      <div>
                        <span className="text-stone-400 font-medium">ชื่อลูกค้า:</span> {selectedOrder.username}
                      </div>
                      <div>
                        <span className="text-stone-400 font-medium">เบอร์โทรศัพท์:</span> {selectedOrder.phone || 'ไม่ได้ระบุ'}
                      </div>
                      <div className="col-span-2">
                        <span className="text-stone-400 font-medium">ที่อยู่จัดส่ง:</span>{' '}
                        <p className="mt-1 bg-white p-2.5 rounded-xl border border-stone-150 font-semibold text-xs leading-relaxed text-stone-700 whitespace-pre-wrap">
                          {selectedOrder.shippingAddress || 'ไม่ได้ระบุที่อยู่จัดส่ง'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Products ordered list */}
                  <div className="space-y-2">
                    <h5 className="font-extrabold text-xs text-stone-500 uppercase tracking-wider">รายการสินค้าที่สั่งซื้อ</h5>
                    <div className="divide-y divide-stone-150 border border-stone-150 rounded-2xl overflow-hidden bg-white">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3 text-xs sm:text-sm font-bold text-stone-850">
                          <div className="flex flex-col">
                            <span>{item.productName}</span>
                            <span className="text-stone-400 text-[11px] font-medium mt-0.5">
                              {item.price} บาท / {item.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-stone-500 font-semibold">x {item.quantity} {item.unit}</span>
                            <span className="block text-emerald-800 font-extrabold mt-0.5">{item.price * item.quantity} บาท</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment & Status Overview */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2.5">
                    <h5 className="font-extrabold text-xs text-stone-500 uppercase tracking-wider">สรุปการชำระเงินและสถานะ</h5>
                    <div className="grid grid-cols-2 gap-4 text-xs font-bold text-stone-800">
                      <div>
                        <p className="text-[11px] text-stone-400 font-medium">ช่องทางการชำระเงิน:</p>
                        <p className="text-sm font-extrabold text-stone-800 mt-0.5">💳 {selectedOrder.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-stone-400 font-medium">ยอดชำระเงินสุทธิ:</p>
                        <p className="text-sm font-extrabold text-emerald-850 mt-0.5">{selectedOrder.totalPrice} บาท</p>
                      </div>
                    </div>

                    {selectedOrder.slipUrl && (
                      <div className="pt-2.5 border-t border-stone-150 space-y-1.5">
                        <p className="text-[11px] text-stone-400 font-medium">หลักฐานการโอนเงินลูกค้า (สลิป):</p>
                        <div className="relative group w-36 h-48 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-sm cursor-zoom-in">
                          <img
                            src={selectedOrder.slipUrl}
                            alt="Slip Payment"
                            className="w-full h-full object-cover"
                            onClick={() => setViewingSlipUrl(selectedOrder.slipUrl || null)}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-extrabold uppercase pointer-events-none">
                            🔍 ดูสลิปภาพใหญ่
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedOrder.refundSlipUrl ? (
                      <div className="pt-2.5 border-t border-stone-150 space-y-1.5">
                        <p className="text-[11px] text-purple-700 font-bold flex items-center gap-1">
                          <span>💸</span> หลักฐานการโอนเงินคืน (สลิปคืนเงิน):
                        </p>
                        <div className="relative group w-36 h-48 rounded-xl overflow-hidden border border-purple-200 bg-stone-100 shadow-sm cursor-zoom-in">
                          <img
                            src={selectedOrder.refundSlipUrl}
                            alt="Refund Slip"
                            className="w-full h-full object-cover"
                            onClick={() => setViewingSlipUrl(selectedOrder.refundSlipUrl || null)}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-extrabold uppercase pointer-events-none">
                            🔍 ดูสลิปภาพใหญ่
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2.5 border-t border-stone-150 flex items-center justify-between">
                        <span className="text-[11px] text-stone-500 font-bold">แนบสลิปโอนเงินคืน (แอดมิน):</span>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 cursor-pointer transition-colors">
                          <span>📷</span> แนบรูปภาพสลิปคืนเงินให้ลูกค้า
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                const { url } = await uploadFile(formData);
                                await handleUpdateOrderStatus(selectedOrder.id, { orderStatus: 'ยกเลิกการสั่งซื้อ', refundSlipUrl: url });
                                setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, orderStatus: 'ยกเลิกการสั่งซื้อ', refundSlipUrl: url } : o));
                                setSelectedOrder({ ...selectedOrder, orderStatus: 'ยกเลิกการสั่งซื้อ', refundSlipUrl: url });
                                alert('อัปโหลดสลิปโอนเงินคืนและอัปเดตสถานะเรียบร้อยแล้ว!');
                              } catch (err) {
                                alert('เกิดข้อผิดพลาดในการอัปโหลดสลิปคืนเงิน');
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-150 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="bg-stone-900 hover:bg-stone-850 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. User Add / Edit Modal */}
          {isUserModalOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 relative max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-150">
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <span>{editingUser ? '✏️' : '➕'}</span>
                    {editingUser ? `แก้ไขข้อมูลสมาชิก: ${editingUser.username}` : 'เพิ่มสมาชิกใหม่'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsUserModalOpen(false);
                      setEditingUser(null);
                    }}
                    className="text-stone-400 hover:text-stone-600 font-bold text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUserSubmit} className="space-y-4 text-xs font-medium overflow-y-auto pr-1 flex-1">
                  {/* Profile Image Field */}
                  <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 bg-white flex-shrink-0 flex items-center justify-center">
                      {userForm.profileImage ? (
                        <img src={userForm.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-emerald-600">
                          {userForm.username ? userForm.username.charAt(0).toUpperCase() : '👤'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="block font-bold text-stone-800">📷 รูปโปรไฟล์ผู้ใช้งาน</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, (url) => setUserForm({ ...userForm, profileImage: url }));
                          }
                        }}
                        className="text-xs text-stone-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                      <p className="text-[10px] text-stone-400">อัปโหลดรูปภาพโปรไฟล์สมาชิกใหม่ หรือเปลี่ยนรูปเดิม</p>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">ชื่อผู้ใช้งาน (Username) *</label>
                    <input
                      type="text"
                      required
                      value={userForm.username || ''}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      placeholder="เช่น somchai_123"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500 text-stone-900 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">อีเมล (Email) *</label>
                    <input
                      type="email"
                      required
                      value={userForm.email || ''}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="เช่น user@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500 text-stone-900 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      รหัสผ่าน (Password) {editingUser && <span className="text-stone-400 font-normal">(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</span>}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={userForm.password || ''}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder={editingUser ? '••••••••' : 'กรอกรหัสผ่าน'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500 text-stone-900 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">เบอร์โทรศัพท์ (Phone)</label>
                    <input
                      type="text"
                      value={userForm.phone || ''}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      placeholder="เช่น 0812345678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500 text-stone-900 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">ระดับสิทธิ์ (Role)</label>
                    <select
                      value={userForm.role || 'User'}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500 text-stone-900 font-bold bg-white text-xs cursor-pointer"
                    >
                      <option value="Admin">🛠️ Admin (ผู้ดูแลระบบ)</option>
                      <option value="Member">💎 Member (สมาชิกพิเศษ)</option>
                      <option value="User">👤 User (ผู้ใช้งานทั่วไป)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-stone-150">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserModalOpen(false);
                        setEditingUser(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มสมาชิกใหม่'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 6. Member Order History Modal */}
          {selectedMemberOrders && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in zoom-in-95 duration-200">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-100 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-150">
                  <div>
                    <h4 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                      <span>📦</span> ประวัติการสั่งซื้อของ {selectedMemberOrders.username}
                    </h4>
                    <p className="text-xs text-stone-500">อีเมล: {selectedMemberOrders.email} | สิทธิ์: {selectedMemberOrders.role}</p>
                  </div>
                  <button
                    onClick={() => setSelectedMemberOrders(null)}
                    className="text-stone-400 hover:text-stone-600 font-bold text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {orders.filter(o => o.username === selectedMemberOrders.username).length === 0 ? (
                    <div className="text-center py-12 text-stone-400 font-semibold space-y-2">
                      <span className="text-4xl block">📭</span>
                      <p className="text-stone-600 text-sm">สมาชิกคนนี้ยังไม่มีประวัติการสั่งซื้อในระบบ</p>
                    </div>
                  ) : (
                    orders
                      .filter(o => o.username === selectedMemberOrders.username)
                      .map((order) => (
                        <div key={order.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-stone-200 text-xs">
                            <div>
                              <span className="font-extrabold text-stone-900 text-sm">คำสั่งซื้อ #{order.id}</span>
                              <span className="block text-[10px] text-stone-500 font-medium">
                                สั่งเมื่อ: {order.createdAt ? new Date(order.createdAt).toLocaleString('th-TH') : '-'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${order.paymentStatus === 'ชำระเงินแล้ว' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                order.paymentStatus === 'รอตรวจสอบ' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                💳 {order.paymentStatus}
                              </span>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${order.orderStatus === 'ส่งสำเร็จ' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                order.orderStatus === 'กำลังจัดส่ง' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  order.orderStatus === 'รอดำเนินการ' ? 'bg-stone-100 text-stone-600 border-stone-200' :
                                    'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                📦 {order.orderStatus}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1 bg-white p-3 rounded-xl border border-stone-150 text-xs">
                            {order.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-stone-800 font-semibold py-0.5">
                                <span>{item.productName} <span className="text-stone-400 font-normal">x {item.quantity} {item.unit || 'ชิ้น'}</span></span>
                                <span>฿{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="mt-2 pt-2 border-t border-stone-150 flex justify-between font-black text-stone-900 text-sm">
                              <span>ราคารวม</span>
                              <span className="text-emerald-600">฿{order.totalPrice?.toLocaleString()}</span>
                            </div>
                          </div>

                          {order.shippingAddress && (
                            <p className="text-[11px] text-stone-600 font-medium">
                              <span className="font-bold text-stone-800">📍 ที่อยู่จัดส่ง:</span> {order.shippingAddress}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            {order.slipUrl && (
                              <button
                                onClick={() => setViewingSlipUrl(order.slipUrl)}
                                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                              >
                                🧾 ดูสลิปชำระเงิน
                              </button>
                            )}

                            {order.refundSlipUrl && (
                              <button
                                onClick={() => setViewingSlipUrl(order.refundSlipUrl)}
                                className="text-xs font-bold text-purple-700 hover:text-purple-800 underline flex items-center gap-1 cursor-pointer"
                              >
                                💸 ดูสลิปคืนเงิน
                              </button>
                            )}

                            <label className="text-xs font-bold text-purple-700 hover:text-purple-800 underline flex items-center gap-1 cursor-pointer">
                              📷 แนบสลิปคืนเงิน
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const { url } = await uploadFile(formData);
                                    await handleUpdateOrderStatus(order.id, { paymentStatus: 'คืนเงินสำเร็จ', refundSlipUrl: url });
                                    setOrders(orders.map(o => o.id === order.id ? { ...o, paymentStatus: 'คืนเงินสำเร็จ', refundSlipUrl: url } : o));
                                    alert('แนบสลิปโอนเงินคืนเรียบร้อยแล้ว!');
                                  } catch (err) {
                                    alert('เกิดข้อผิดพลาดในการอัปโหลดสลิปคืนเงิน');
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lightbox / Full screen slip viewer */}
          {viewingSlipUrl && (
            <div
              onClick={() => setViewingSlipUrl(null)}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
            >
              <div className="relative max-w-sm w-full max-h-[85vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setViewingSlipUrl(null)}
                  className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors focus:outline-none"
                  title="ปิดหน้าต่าง"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="bg-white p-3 rounded-3xl shadow-2xl overflow-hidden border border-white/10 max-h-[75vh] flex items-center justify-center">
                  <img
                    src={viewingSlipUrl}
                    alt="สลิปการโอนเงินฉบับเต็ม"
                    className="object-contain max-h-[70vh] rounded-2xl"
                  />
                </div>
                <p className="text-white/85 text-xs mt-3 font-semibold bg-stone-900/60 px-4 py-1.5 rounded-full backdrop-blur-sm">คลิกพื้นที่ว่างหรือกดปุ่ม X เพื่อปิด</p>
              </div>
            </div>
          )}

        </div>
    </>
  );
}
