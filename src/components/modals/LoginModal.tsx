'use client';

import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getUsers, createUser, updateUser, uploadFile, sendOtpAction } from '@/app/actions';
import { compressImage, fileToBase64 } from '@/lib/imageCompressor';
import { UserProfile } from '@/types';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [modalMode, setModalMode] = useState<'login' | 'signup' | 'forgot_password'>('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupProfileImage, setSignupProfileImage] = useState<string>('');
  const [signupProfilePreview, setSignupProfilePreview] = useState<string | null>(null);

  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotFoundUser, setForgotFoundUser] = useState<UserProfile | null>(null);
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [userEnteredOtp, setUserEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [mockNotification, setMockNotification] = useState<{show: boolean, type: string, title: string, body: string} | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const allUsers = await getUsers();
      const target = loginEmail.trim().toLowerCase();
      const foundUser = allUsers.find(
        (u) =>
          u.password === loginPassword &&
          (u.email.toLowerCase() === target || (u.phone && u.phone.replace(/[-\s]/g, '') === target.replace(/[-\s]/g, '')))
      );
      if (foundUser) {
        login(foundUser);
        onClose();
      } else {
        alert("อีเมล หรือ รหัสผ่านไม่ถูกต้องครับ");
      }
    } catch (err: any) {
      alert(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 20MB ครับ');
        return;
      }
      try {
        const compressed = await compressImage(file);
        const previewUrl = await fileToBase64(compressed);
        setSignupProfilePreview(previewUrl);

        const formData = new FormData();
        formData.append('file', compressed);
        const { url } = await uploadFile(formData);
        setSignupProfileImage(url);
      } catch (err) {
        console.error("Error uploading image:", err);
        alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพครับ");
      }
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupUsername || !signupEmail || !signupPassword || !signupPhone) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วนครับ');
      return;
    }
    try {
      const allUsers = await getUsers();
      if (allUsers.some(u => u.email.toLowerCase() === signupEmail.toLowerCase())) {
        alert('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น หรือทำการเข้าสู่ระบบครับ');
        return;
      }
      const newUser = await createUser({
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
        phone: signupPhone,
        role: 'User',
        profileImage: signupProfileImage || undefined,
      });
      alert('สมัครสมาชิกสำเร็จแล้วครับ! กรุณาเข้าสู่ระบบ');
      setModalMode('login');
      setLoginEmail(signupEmail);
      setLoginPassword('');
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = forgotInput.trim().toLowerCase();
    if (!target) {
      alert('กรุณากรอกอีเมลหรือเบอร์โทรศัพท์ครับ');
      return;
    }
    const allUsers = await getUsers();
    const found = allUsers.find(
      u => u.email.toLowerCase() === target || (u.phone && u.phone.replace(/[-\s]/g, '') === target.replace(/[-\s]/g, ''))
    );
    if (!found) {
      alert('ไม่พบข้อมูลบัญชีที่ตรงกับอีเมลหรือเบอร์โทรศัพท์นี้ในระบบสมาชิก กรุณาสมัครสมาชิกก่อนครับ');
      return;
    }
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setForgotOtpCode(generatedOtp);
    setForgotFoundUser(found);
    setUserEnteredOtp('');
    const isEmail = target.includes('@');

    // Trigger real email sending via Nodemailer & Gmail SMTP
    if (found.email) {
      sendOtpAction(found.email, generatedOtp).then(res => {
        if (res.success) {
          console.log('Real OTP email sent to:', found.email);
        } else {
          console.warn('Real OTP email warning:', res.error);
        }
      });
    }

    alert(isEmail
      ? `📧 ระบบได้ส่งรหัสยืนยัน OTP ไปยังอีเมล ${found.email} เรียบร้อยแล้วครับ! กรุณาเช็กกล่องข้อความในอีเมลเพื่อนำรหัสมากรอกยืนยัน`
      : '📱 ระบบได้ส่งรหัสยืนยัน OTP ไปที่เบอร์โทรศัพท์ของคุณแล้วครับ'
    );
    setForgotStep(2);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-205">

      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200 flex flex-col relative max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer" title="ปิด">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex border-b border-stone-100 mb-6">
          <button onClick={() => setModalMode('login')} className={`w-1/2 pb-3 font-extrabold text-base transition-colors border-b-2 cursor-pointer ${modalMode === 'login' ? 'border-[#166534] text-[#166534]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>
            เข้าสู่ระบบ
          </button>
          <button onClick={() => setModalMode('signup')} className={`w-1/2 pb-3 font-extrabold text-base transition-colors border-b-2 cursor-pointer ${modalMode === 'signup' ? 'border-[#166534] text-[#166534]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>
            สมัครสมาชิก
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {modalMode === 'forgot_password' ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-stone-900">ลืมรหัสผ่าน</h3>
                <p className="text-xs text-stone-500 mt-1">
                  {forgotStep === 1 && 'กรอกอีเมลหรือเบอร์โทรศัพท์เพื่อค้นหาบัญชีผู้ใช้ของคุณ'}
                  {forgotStep === 2 && 'กรอกรหัสยืนยัน OTP ที่ส่งไปยังข้อมูลการติดต่อของคุณ'}
                  {forgotStep === 3 && 'ตั้งรหัสผ่านใหม่สำหรับบัญชีผู้ใช้ของคุณ'}
                </p>
              </div>

              {forgotStep === 1 && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">อีเมล หรือ เบอร์โทรศัพท์</label>
                    <input type="text" required value={forgotInput} onChange={(e) => setForgotInput(e.target.value)} placeholder="กรอกอีเมลหรือเบอร์โทรศัพท์ของคุณ" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850" />
                  </div>
                  <button type="submit" className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer">ถัดไป (ส่งรหัส OTP)</button>
                  <div className="text-center mt-4">
                    <button type="button" onClick={() => setModalMode('login')} className="text-xs font-bold text-stone-500 hover:text-stone-700 hover:underline cursor-pointer">ย้อนกลับไปหน้าเข้าสู่ระบบ</button>
                  </div>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (userEnteredOtp.trim() === forgotOtpCode) {
                    setForgotStep(3);
                  } else {
                    alert('รหัส OTP ไม่ถูกต้อง กรุณากรอกรหัสใหม่อีกครั้งครับ');
                  }
                }} className="space-y-4">
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 mb-2 text-center text-xs text-stone-600 font-semibold">
                    <span className="text-stone-800">ส่งรหัสยืนยันไปยังช่องทาง:</span> <span className="text-emerald-800 font-extrabold">{forgotInput.includes('@') ? '📧 ' + forgotFoundUser?.email : '📱 ' + forgotFoundUser?.phone}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">กรอกรหัสยืนยัน OTP (6 หลัก)</label>
                    <input type="text" required maxLength={6} pattern="\d{6}" value={userEnteredOtp} onChange={(e) => setUserEnteredOtp(e.target.value.replace(/\D/g, ''))} placeholder="กรอกรหัสตัวเลข 6 หลัก เช่น 123456" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850 text-center tracking-widest text-lg" />
                  </div>
                  <button type="submit" className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer">ยืนยันรหัส OTP</button>
                  <div className="text-center mt-4">
                    <button type="button" onClick={() => { setForgotStep(1); setForgotFoundUser(null); setForgotOtpCode(''); setUserEnteredOtp(''); }} className="text-xs font-bold text-stone-500 hover:text-stone-700 hover:underline cursor-pointer">ย้อนกลับไปขั้นตอนแรก</button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newPassword.length < 4) {
                    alert('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษรครับ');
                    return;
                  }
                  if (newPassword !== confirmNewPassword) {
                    alert('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้งครับ');
                    return;
                  }
                  if (forgotFoundUser) {
                    try {
                      await updateUser(forgotFoundUser.email, { password: newPassword });
                      alert('เปลี่ยนรหัสผ่านสำเร็จแล้วครับ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
                      setModalMode('login');
                      setForgotStep(1);
                      setForgotInput('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setForgotFoundUser(null);
                      setForgotOtpCode('');
                      setUserEnteredOtp('');
                    } catch (err) {
                      console.error(err);
                      alert("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
                    }
                  }
                }} className="space-y-4">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 mb-2">
                    <p className="text-xs font-bold text-stone-750">ยืนยันตัวตนสำเร็จ บัญชีผู้ใช้ของคุณคือ:</p>
                    <p className="text-sm font-semibold text-emerald-850 mt-1">👤 {forgotFoundUser?.username} ({forgotFoundUser?.email})</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">รหัสผ่านใหม่</label>
                    <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="กรอกรหัสผ่านใหม่" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ยืนยันรหัสผ่านใหม่</label>
                    <input type="password" required value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850" />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer">ยืนยันการเปลี่ยนรหัสผ่าน</button>
                  <div className="text-center mt-4">
                    <button type="button" onClick={() => { setForgotStep(2); setNewPassword(''); setConfirmNewPassword(''); }} className="text-xs font-bold text-stone-500 hover:text-stone-700 hover:underline cursor-pointer">ย้อนกลับไปขั้นตอนการกรอก OTP</button>
                  </div>
                </form>
              )}
            </div>
          ) : modalMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-stone-900">ยินดีต้อนรับสู่สวน Maiv Zev</h3>
                <p className="text-xs text-stone-500 mt-1">กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบของคุณ</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">อีเมลผู้ใช้งาน</label>
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="เช่น customer@example.com" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-stone-500 uppercase">รหัสผ่าน</label>
                  <button type="button" onClick={() => { setModalMode('forgot_password'); setForgotStep(1); setForgotInput(''); setNewPassword(''); setConfirmNewPassword(''); setForgotFoundUser(null); }} className="text-xs font-bold text-[#166534] hover:underline cursor-pointer">ลืมรหัสผ่าน?</button>
                </div>
                <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="กรอกรหัสผ่านของคุณ" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850" />
              </div>
              <button type="submit" className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer">เข้าสู่ระบบ</button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-stone-900">สร้างบัญชีผู้ใช้ใหม่</h3>
                <p className="text-xs text-stone-500 mt-1">กรอกรายละเอียดเพื่อสมัครสมาชิกเพื่อเริ่มสั่งซื้อสินค้า</p>
              </div>
              <div className="flex flex-col items-center justify-center space-y-2 py-2">
                <label className="block text-xs font-bold text-stone-500 uppercase self-start">รูปโปรไฟล์ของคุณ (เลือกอัปโหลดไฟล์)</label>
                <div className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-stone-200 hover:border-emerald-500 bg-stone-50 shadow-sm flex items-center justify-center cursor-pointer transition-all">
                  {signupProfilePreview ? (
                    <img src={signupProfilePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-[9px] font-bold mt-1 text-stone-500">อัปรูปภาพ</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleProfileImageChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
                {signupProfilePreview && (
                  <button type="button" onClick={() => { setSignupProfileImage(''); setSignupProfilePreview(null); }} className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer">ลบรูปโปรไฟล์</button>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ชื่อผู้ใช้งาน (ชื่อเต็ม)</label>
                <input type="text" required value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} placeholder="เช่น สมชาย สมาชิกพรีเมียม" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">อีเมลผู้ใช้งาน</label>
                <input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="เช่น somchai@example.com" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">รหัสผ่าน</label>
                <input type="password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="ตั้งรหัสผ่านของคุณ" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">เบอร์โทรศัพท์ (จำเป็น)</label>
                <input type="tel" required value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} placeholder="เช่น 0812345678" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850" />
              </div>
              <button type="submit" className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer">สมัครสมาชิกและเข้าสู่ระบบ</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
