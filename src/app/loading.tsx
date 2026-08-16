import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-900/40 backdrop-blur-md transition-all duration-300">
      <div className="bg-white/95 border border-emerald-100 rounded-3xl p-8 shadow-2xl flex flex-col items-center max-w-xs w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
        {/* Animated Garden Spinner */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-600 border-r-emerald-500 animate-spin" />
          <div className="text-2xl animate-bounce">🍇</div>
        </div>

        <div>
          <h3 className="text-base font-bold text-stone-900">กำลังโหลดข้อมูล...</h3>
          <p className="text-xs text-emerald-700 font-medium mt-1">Maiv Zev Shop สดจากสวน</p>
        </div>

        {/* Loading Bar */}
        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full animate-pulse w-3/4 transition-all duration-500" />
        </div>
      </div>
    </div>
  );
}
