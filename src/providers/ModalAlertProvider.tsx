'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AlertState {
  isOpen: boolean;
  message: string;
  title?: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ModalAlertContextType {
  showAlert: (message: string, title?: string, type?: 'success' | 'warning' | 'error' | 'info') => Promise<void>;
  showConfirm: (message: string, title?: string, confirmText?: string, cancelText?: string) => Promise<boolean>;
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

  const showConfirm = (message: string, title?: string, confirmText = 'ตกลง', cancelText = 'ยกเลิก'): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        message,
        title: title || 'ยืนยันการทำรายการ',
        type: 'warning',
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
        <div className="fixed inset-0 z-[999999] overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-stone-150 text-center space-y-5 relative animate-in zoom-in-95 duration-200">
            {/* Top Glowing Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xs transition-transform hover:scale-105">
              {modalState.type === 'success' ? (
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-3xl shadow-sm">
                  ✨
                </div>
              ) : modalState.type === 'warning' ? (
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-3xl shadow-sm">
                  ⚠️
                </div>
              ) : modalState.type === 'error' ? (
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center text-3xl shadow-sm">
                  ❌
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center text-3xl shadow-sm">
                  💡
                </div>
              )}
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h3 className="text-lg font-black text-stone-900 leading-tight">
                {modalState.title}
              </h3>
              <p className="text-xs text-stone-600 font-medium leading-relaxed whitespace-pre-line px-1">
                {modalState.message}
              </p>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-center gap-3">
              {modalState.isConfirm ? (
                <>
                  <button
                    onClick={() => modalState.onCancel && modalState.onCancel()}
                    className="flex-1 py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    {modalState.cancelText || 'ยกเลิก'}
                  </button>
                  <button
                    onClick={() => modalState.onConfirm && modalState.onConfirm()}
                    className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    {modalState.confirmText || 'ตกลง'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => modalState.onConfirm && modalState.onConfirm()}
                  className="w-full py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
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
