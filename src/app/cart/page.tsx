'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/providers/CartProvider';
import { useAuth } from '@/providers/AuthProvider';
import { getProducts } from '@/app/admin/actions';
import { uploadFile, createOrder } from '@/app/actions';
import { compressImage } from '@/lib/imageCompressor';
import LoginModal from '@/components/modals/LoginModal';
import { Product } from '@/types';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { currentUser } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<{ [productName: string]: boolean }>({});
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('พร้อมเพย์ (PromptPay)');
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    getProducts()
      .then((data: any) => setProducts(data.map((p: any) => ({ ...p, id: p.id.toString() }))))
      .catch((e) => console.error('Failed to load products:', e));
  }, []);

  const findProduct = (name: string) => products.find((p) => p.name === name);
  const isItemSelected = (name: string) => selected[name] !== false;
  const toggleItemSelection = (name: string) => {
    setSelected((prev) => ({ ...prev, [name]: prev[name] === false ? true : false }));
  };

  const selectedItems = cart.filter((item) => isItemSelected(item.productName));
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSlipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      setSlipPreview(url);
    } catch (err) {
      console.error('Error uploading slip:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดสลิปครับ');
    }
  };

  const handleGoToCheckout = () => {
    if (selectedItems.length === 0) {
      alert('กรุณาเลือกสินค้าอย่างน้อย 1 รายการก่อนทำการสั่งซื้อครับ');
      return;
    }
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    setStep(2);
  };

  const handleConfirmOrder = async () => {
    if (isPlacingOrder) return;
    if (!shippingAddress.trim()) {
      alert('กรุณากรอกที่อยู่จัดส่งสินค้าเพื่อทำการสั่งซื้อครับ');
      return;
    }
    if (!slipPreview) {
      alert('กรุณาแนบภาพสลิปหลักฐานการโอนเงินเพื่อชำระค่าสินค้าด้วยครับ');
      return;
    }
    if (!currentUser?.email) {
      setIsLoginModalOpen(true);
      return;
    }
    if (selectedItems.length === 0) {
      alert('ไม่มีสินค้าที่ถูกเลือกสำหรับคำสั่งซื้อนี้ครับ');
      return;
    }

    const stockIssue = selectedItems.find((item) => {
      const product = findProduct(item.productName);
      return product && item.quantity > product.stock;
    });
    if (stockIssue) {
      const product = findProduct(stockIssue.productName);
      alert(`ขออภัยครับ สินค้า "${stockIssue.productName}" มีคงเหลือในระบบเพียง ${product?.stock ?? 0} ${stockIssue.unit} แต่คุณสั่งซื้อ ${stockIssue.quantity} ${stockIssue.unit} กรุณาลดจำนวนสินค้าในตะกร้าลงก่อนสั่งซื้อครับ`);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const created = await createOrder({
        email: currentUser.email,
        totalPrice,
        paymentMethod,
        paymentStatus: 'รอตรวจสอบ',
        orderStatus: 'รอดำเนินการ',
        shippingAddress: shippingAddress.trim(),
        slipUrl: slipPreview,
        items: selectedItems.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      selectedItems.forEach((item) => removeFromCart(item.productName));
      setShippingAddress('');
      setSlipPreview(null);
      setStep(1);
      alert(`🎉 สั่งซื้อสินค้าสำเร็จ!
รหัสคำสั่งซื้อของคุณคือ: ORD-${created.id.padStart(3, '0')}
(แอดมินได้รับการแจ้งเตือนสลิปโอนเงินของคุณแล้ว และกำลังทำการตรวจสอบความถูกต้องในระบบดูแลระบบครับ)`);
      router.push('/');
    } catch (err) {
      console.error('Error creating order:', err);
      alert('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้งครับ');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="flex-1 bg-stone-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            {step === 1 ? '🛒 ตะกร้าสินค้าของคุณ' : '📍 กรอกที่อยู่และการชำระเงิน'}
          </h1>
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="text-stone-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-full transition-all border border-stone-200"
            >
              ← แก้ไขตะกร้า
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-6">
          {cart.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-stone-400 space-y-3">
              <svg className="w-16 h-16 stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="font-semibold text-lg">ไม่มีสินค้าในตะกร้า</p>
              <Link
                href="/products"
                className="bg-[#166534] hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-md transition-all"
              >
                เลือกซื้อสินค้า
              </Link>
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              {cart.map((item) => {
                const product = findProduct(item.productName);
                return (
                  <div key={item.productName} className="flex items-center gap-4 p-4 rounded-2xl border border-stone-100 bg-stone-50/50">
                    <input
                      type="checkbox"
                      checked={isItemSelected(item.productName)}
                      onChange={() => toggleItemSelection(item.productName)}
                      className="w-5 h-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-stone-100 flex-shrink-0">
                      {product?.image && (
                        <img src={product.image} alt={item.productName} className="object-cover w-full h-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-900 truncate">{item.productName}</h4>
                      <p className="text-sm text-stone-500 font-medium">{item.price} บาท/{item.unit}</p>
                      {product && (
                        <p className="text-xs text-stone-400 font-semibold mt-0.5">คงเหลือ: {product.stock} {item.unit}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => updateQuantity(item.productName, item.quantity - 1)}
                          className="bg-white border border-stone-200 text-stone-600 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="font-bold text-stone-800 text-sm">{item.quantity} {item.unit}</span>
                        <button
                          onClick={() => updateQuantity(item.productName, item.quantity + 1)}
                          disabled={!!product && item.quantity >= product.stock}
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border ${
                            product && item.quantity >= product.stock
                              ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.productName)}
                          className="text-xs text-red-500 hover:text-red-700 font-bold ml-2"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-800">{item.price * item.quantity} บาท</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl border border-stone-150 bg-stone-50/50 space-y-2">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">📦 รายการสินค้าที่เลือก</p>
                <div className="divide-y divide-stone-100 max-h-40 overflow-y-auto pr-1">
                  {selectedItems.map((item) => (
                    <div key={item.productName} className="flex justify-between py-1.5 text-xs font-bold text-stone-800">
                      <span>{item.productName} <span className="text-stone-400 font-medium ml-1">x {item.quantity} {item.unit}</span></span>
                      <span>{item.price * item.quantity} บาท</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 text-stone-800">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-1">📍 ที่อยู่จัดส่งสินค้า</label>
                  <textarea
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="กรุณากรอกที่อยู่ เช่น บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์..."
                    className="w-full p-3 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-600 bg-white font-bold text-stone-700"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-1">💳 ช่องทางการชำระเงิน</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-3 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-600 bg-white cursor-pointer font-bold text-stone-700"
                  >
                    <option value="พร้อมเพย์ (PromptPay)">พร้อมเพย์ (PromptPay) - แนะนำ</option>
                    <option value="โอนเงินผ่านธนาคาร">โอนเงินผ่านธนาคาร</option>
                  </select>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-medium space-y-2">
                  {paymentMethod === 'พร้อมเพย์ (PromptPay)' ? (
                    <div className="flex flex-col items-center text-center space-y-2 py-1">
                      <p className="font-bold text-stone-900">โอนผ่านพร้อมเพย์ (PromptPay)</p>
                      <div className="bg-white p-2 rounded-xl border border-stone-200 shadow-sm flex items-center justify-center">
                        <svg className="w-24 h-24 text-emerald-805" viewBox="0 0 100 100" fill="currentColor">
                          <rect x="5" y="5" width="90" height="90" rx="10" fill="#f8fafc" stroke="#166534" strokeWidth="2" />
                          <rect x="20" y="20" width="10" height="10" fill="#0f172a" />
                          <rect x="20" y="70" width="10" height="10" fill="#0f172a" />
                          <rect x="70" y="20" width="10" height="10" fill="#0f172a" />
                          <rect x="40" y="20" width="5" height="15" fill="#0f172a" />
                          <rect x="50" y="25" width="10" height="5" fill="#0f172a" />
                          <rect x="45" y="45" width="10" height="10" fill="#0f172a" />
                          <rect x="20" y="45" width="15" height="5" fill="#0f172a" />
                          <rect x="70" y="45" width="10" height="15" fill="#0f172a" />
                          <rect x="40" y="65" width="20" height="15" fill="#0f172a" />
                          <rect x="30" y="10" width="40" height="4" rx="2" fill="#166534" />
                          <text x="50" y="90" textAnchor="middle" className="font-sans font-bold text-[8px] fill-[#166534]">PROMPTPAY QR</text>
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-stone-800">เบอร์โทรศัพท์: <span className="text-[#166534]">089-123-4567</span></p>
                        <p className="text-stone-500 text-[10px]">ชื่อบัญชี: สวนครอบครัว Maiv Zev (ยายมี)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-center">
                      <p className="font-bold text-stone-900">โอนเงินผ่านบัญชีธนาคาร</p>
                      <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-sm space-y-1">
                        <p className="font-bold text-stone-800">ธนาคารกสิกรไทย (KBANK)</p>
                        <p className="font-extrabold text-[#166534] text-sm">123-4-56789-0</p>
                        <p className="text-stone-500 text-[10px]">ชื่อบัญชี: นางมี รักสวนไทย (ยายมี)</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-1">📸 แนบสลิปการโอนเงิน (จำเป็นต้องระบุ)</label>
                  {!slipPreview ? (
                    <div className="relative group border-2 border-dashed border-stone-200 hover:border-emerald-500 rounded-2xl p-4 bg-white hover:bg-emerald-50/10 transition-all flex flex-col items-center justify-center cursor-pointer text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlipChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <svg className="w-8 h-8 text-stone-400 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-bold text-stone-700 mt-2">คลิกเพื่ออัปโหลดรูปสลิปการโอนเงิน</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">รองรับไฟล์รูปภาพ JPG, PNG</p>
                    </div>
                  ) : (
                    <div className="relative border border-stone-200 rounded-2xl p-2.5 bg-white space-y-2">
                      <div className="relative aspect-[3/4] max-h-40 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 flex items-center justify-center">
                        <img src={slipPreview} alt="สลิปการชำระเงินพรีวิว" className="object-contain w-full h-full" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSlipPreview(null)}
                        className="w-full text-center text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-2 rounded-xl transition-all border border-red-100"
                      >
                        🗑️ ลบรูปภาพสลิปนี้
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {cart.length > 0 && (
            <div className="border-t border-stone-100 mt-6 pt-6 space-y-4">
              <div className="flex justify-between text-base font-bold text-stone-900">
                <p>ราคารวมทั้งหมด</p>
                <p className="text-xl text-emerald-800">{totalPrice} บาท</p>
              </div>

              {step === 1 ? (
                <button
                  onClick={handleGoToCheckout}
                  className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-bold py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  ดำเนินการสั่งซื้อสินค้า →
                </button>
              ) : (
                <button
                  disabled={isPlacingOrder}
                  onClick={handleConfirmOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPlacingOrder ? 'กำลังดำเนินการสั่งซื้อ...' : 'ยืนยันการสั่งซื้อสินค้า'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} />}
    </div>
  );
}
