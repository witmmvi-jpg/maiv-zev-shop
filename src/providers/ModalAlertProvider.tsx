'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AlertState {
  isOpen: boolean;
  message: string;
  title?: string;
  type?: 'success' | 'warning' | 'error' | 'info' | 'logout';
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ModalAlertContextType {
  showAlert: (message: string, title?: string, type?: 'success' | 'warning' | 'error' | 'info') => Promise<void>;
  showConfirm: (message: string, title?: string, confirmText?: string, cancelText?: string, type?: 'warning' | 'error' | 'logout') => Promise<boolean>;
}

const ModalAlertContext = createContext<ModalAlertContextType>({
  showAlert: async () => {},
  showConfirm: async () => false,
});

export const useModalAlert = () => useContext(ModalAlertContext);

export default function ModalAlertProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<AlertState | null>(null);

  const showAlert = (message: string, title?: string, type: 'success' | 'warning' | 'error' | 'info' = 'info'): Promise<void> => {
    return new Promise((resolve) => {
      let finalType = type;
      if (type === 'info') {
        if (message.includes('สำเร็จ') || message.includes('เรียบร้อย') || message.includes('🎉') || message.includes('ขอบคุณ')) {
          finalType = 'success';
        } else if (message.includes('ไม่ถูกต้อง') || message.includes('ผิดพลาด') || message.includes('ขออภัย') || message.includes('ลบ') || message.includes('โปรด') || message.includes('กรุณา')) {
          finalType = 'warning';
        }
      }

      setModalState({
        isOpen: true,
        message,
        title: title || (finalType === 'success' ? 'ทำรายการสำเร็จ!' : finalType === 'warning' ? 'แจ้งเตือนจากระบบ' : 'แจ้งเตือน'),
        type: finalType,
        isConfirm: false,
        onConfirm: () => {
          setModalState(null);
          resolve();
        }
      });
    });
  };

  const showConfirm = (message: string, title?: string, confirmText = 'ตกลง', cancelText = 'ยกเลิก', type: 'warning' | 'error' | 'logout' = 'warning'): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        message,
        title: title || (type === 'logout' ? 'ยืนยันการออกจากระบบ' : 'ยืนยันการทำรายการ'),
        type,
        isConfirm: true,
        confirmText,
        cancelText,
        onConfirm: () => {
          setModalState(null);
          resolve(true);
        },
        onCancel: () => {
          setModalState(null);
          resolve(false);
        }
      });
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (msg: string) => {
        showAlert(String(msg));
      };
    }
  }, []);

  return (
    <ModalAlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Global Custom Alert / Confirm Modal Popup */}
      {modalState?.isOpen && (
        <div className="fixed inset-0 z-[999999] overflow-hidden flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] max-w-sm w-full p-7 sm:p-8 shadow-2xl border border-white/80 text-center space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-stone-950/5">
            {/* Top Accent Gradient Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                modalState.type === 'logout' || modalState.type === 'error'
                  ? 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500'
                  : modalState.type === 'success'
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
                  : modalState.type === 'warning'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500'
                  : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500'
              }`}
            />

            {/* Ambient Background Light Overlay */}
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 blur-3xl pointer-events-none rounded-full ${
                modalState.type === 'logout' || modalState.type === 'error'
                  ? 'bg-rose-500/15'
                  : modalState.type === 'success'
                  ? 'bg-emerald-500/15'
                  : modalState.type === 'warning'
                  ? 'bg-amber-500/15'
                  : 'bg-purple-500/15'
              }`}
            />

            {/* Top Glowing Icon Badge */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center transition-transform hover:scale-105 duration-300">
              {modalState.type === 'logout' ? (
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-100 via-red-50 to-orange-50 border border-rose-200/80 text-rose-600 shadow-xl shadow-rose-500/20 flex items-center justify-center text-4xl">
                  🚪
                </div>
              ) : modalState.type === 'success' ? (
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 via-teal-50 to-green-50 border border-emerald-200/80 text-emerald-600 shadow-xl shadow-emerald-500/20 flex items-center justify-center text-4xl">
                  ✨
                </div>
              ) : modalState.type === 'warning' ? (
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50 border border-amber-200/80 text-amber-600 shadow-xl shadow-amber-500/20 flex items-center justify-center text-4xl">
                  ⚠️
                </div>
              ) : modalState.type === 'error' ? (
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-100 via-rose-50 to-pink-50 border border-red-200/80 text-red-600 shadow-xl shadow-red-500/20 flex items-center justify-center text-4xl">
                  ❌
                </div>
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-50 border border-purple-200/80 text-purple-600 shadow-xl shadow-purple-500/20 flex items-center justify-center text-4xl">
                  💡
                </div>
              )}
            </div>

            {/* Title & Message */}
            <div className="space-y-2 relative z-10">
              <h3 className="text-xl font-black text-stone-900 tracking-tight leading-tight">
                {modalState.title}
              </h3>
              <p className="text-sm text-stone-600 font-semibold leading-relaxed whitespace-pre-line px-2">
                {modalState.message}
              </p>
            </div>

            {/* Buttons */}
            <div className="pt-1 flex items-center justify-center gap-3 relative z-10">
              {modalState.isConfirm ? (
                <>
                  <button
                    onClick={() => modalState.onCancel && modalState.onCancel()}
                    className="flex-1 py-3.5 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200/90 text-stone-700 font-extrabold text-sm border border-stone-200/70 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer shadow-xs"
                  >
                    {modalState.cancelText || 'ยกเลิก'}
                  </button>
                  <button
                    onClick={() => modalState.onConfirm && modalState.onConfirm()}
                    className={`flex-1 py-3.5 px-5 rounded-2xl text-white font-black text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer shadow-xl flex items-center justify-center gap-2 ${
                      modalState.type === 'logout'
                        ? 'bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 hover:from-red-700 hover:to-rose-800 shadow-red-600/30 border border-rose-500/20'
                        : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/30 border border-emerald-500/20'
                    }`}
                  >
                    {modalState.confirmText || 'ตกลง'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => modalState.onConfirm && modalState.onConfirm()}
                  className={`w-full py-3.5 px-6 rounded-2xl text-white font-black text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer shadow-xl flex items-center justify-center gap-2 ${
                    modalState.type === 'logout' || modalState.type === 'error'
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 hover:from-red-700 hover:to-rose-800 shadow-red-600/30 border border-rose-500/20'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/30 border border-emerald-500/20'
                  }`}
                >
                  ตกลง
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalAlertContext.Provider>
  );
}
