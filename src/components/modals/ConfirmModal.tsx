"use client";

import React, { useState } from 'react';

export interface ConfirmModalState {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string | null;
  type?: 'delete' | 'warning' | 'info' | 'success';
  onConfirm?: () => Promise<void> | void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string | null;
  type?: 'delete' | 'warning' | 'info' | 'success';
  onConfirm?: () => Promise<void> | void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'ตกลง',
  cancelText = 'ยกเลิก',
  type = 'delete',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      if (onConfirm) {
        await Promise.all([
          Promise.resolve(onConfirm()),
          new Promise(res => setTimeout(res, 350)) // Smooth fast loading feedback (350ms)
        ]);
      } else {
        await new Promise(res => setTimeout(res, 200));
      }
    } catch (e) {
      console.error('Error during modal confirm:', e);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return { icon: '🗑️', bg: 'bg-red-50 text-red-600 border-red-150' };
      case 'warning':
        return { icon: '⚠️', bg: 'bg-amber-50 text-amber-600 border-amber-150' };
      case 'success':
        return { icon: '✅', bg: 'bg-emerald-50 text-emerald-600 border-emerald-150' };
      default:
        return { icon: 'ℹ️', bg: 'bg-purple-50 text-purple-600 border-purple-150' };
    }
  };

  const getConfirmBtnStyle = () => {
    switch (type) {
      case 'delete':
        return 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-600/25';
      case 'warning':
        return 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-amber-600/25';
      case 'success':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/25';
      default:
        return 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/25';
    }
  };

  const iconInfo = getIcon();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-150 text-center space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Icon Header */}
        <div className={`w-16 h-16 rounded-2xl ${iconInfo.bg} flex items-center justify-center mx-auto text-3xl shadow-sm border`}>
          {iconInfo.icon}
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h3 className="text-xl font-black text-stone-900">
            {title || (type === 'delete' ? 'ยืนยันการลบข้อมูล' : type === 'warning' ? 'แจ้งเตือนระบบ' : type === 'success' ? 'ทำรายการสำเร็จ' : 'แจ้งเตือน')}
          </h3>
          <p className="text-sm text-stone-600 font-bold leading-relaxed px-2 break-words">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-center gap-3">
          {cancelText && (
            <button
              disabled={isLoading}
              onClick={onClose}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>
          )}

          <button
            disabled={isLoading}
            onClick={handleConfirm}
            className={`flex-1 py-3.5 px-5 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer ${getConfirmBtnStyle()}`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังดำเนินการ...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
