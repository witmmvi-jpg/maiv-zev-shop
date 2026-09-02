"use client";

import React, { useState } from 'react';

export interface ConfirmModalState {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string | null;
  type?: 'delete' | 'warning' | 'info' | 'success' | 'logout';
  onConfirm?: () => Promise<void> | void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string | null;
  type?: 'delete' | 'warning' | 'info' | 'success' | 'logout';
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
      case 'logout':
        return { icon: '🚪', bg: 'bg-rose-50 text-rose-600 border-rose-200' };
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
      case 'logout':
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-7 sm:p-8 max-w-md w-full shadow-2xl border border-white/80 text-center space-y-6 animate-in zoom-in-95 duration-300 relative overflow-hidden ring-1 ring-stone-950/5">
        {/* Top Accent Gradient Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            type === 'logout' || type === 'delete'
              ? 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500'
              : type === 'warning'
              ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500'
              : type === 'success'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
              : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500'
          }`}
        />

        {/* Ambient Background Light Overlay */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 blur-3xl pointer-events-none rounded-full ${
            type === 'logout' || type === 'delete'
              ? 'bg-rose-500/15'
              : type === 'warning'
              ? 'bg-amber-500/15'
              : type === 'success'
              ? 'bg-emerald-500/15'
              : 'bg-purple-500/15'
          }`}
        />

        {/* Icon Header */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center transition-transform hover:scale-105 duration-300">
          <div className={`w-20 h-20 rounded-3xl ${iconInfo.bg} flex items-center justify-center text-4xl shadow-xl border`}>
            {iconInfo.icon}
          </div>
        </div>

        {/* Title & Message */}
        <div className="space-y-2 relative z-10">
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {title || (type === 'logout' ? 'ยืนยันการออกจากระบบ' : type === 'delete' ? 'ยืนยันการลบข้อมูล' : type === 'warning' ? 'แจ้งเตือนระบบ' : type === 'success' ? 'ทำรายการสำเร็จ' : 'แจ้งเตือน')}
          </h3>
          <p className="text-sm text-stone-600 font-semibold leading-relaxed px-2 break-words">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="pt-1 flex items-center justify-center gap-3 relative z-10">
          {cancelText && (
            <button
              disabled={isLoading}
              onClick={onClose}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200/90 text-stone-700 font-extrabold text-sm border border-stone-200/70 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {cancelText}
            </button>
          )}

          <button
            disabled={isLoading}
            onClick={handleConfirm}
            className={`flex-1 py-3.5 px-5 rounded-2xl font-black text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-xl flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer ${getConfirmBtnStyle()}`}
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
