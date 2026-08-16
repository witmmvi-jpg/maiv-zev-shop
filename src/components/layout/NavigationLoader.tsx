'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Turn off loading indicator when pathname or searchParams change, or after fast timeout
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Intercept click on <a> tags to show instant visual feedback
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      if (target && target.href && target.target !== '_blank') {
        const url = new URL(target.href, window.location.href);
        // Only trigger loading for internal links with different pathname/search
        if (url.origin === window.location.origin) {
          const currentFull = window.location.pathname + window.location.search;
          const targetFull = url.pathname + url.search;
          if (currentFull !== targetFull) {
            setIsLoading(true);
          }
        }
      }
    };

    const anchors = Array.from(document.querySelectorAll('a[href]'));
    anchors.forEach(anchor => anchor.addEventListener('click', handleAnchorClick as EventListener));

    // MutationObserver to attach click listener to dynamically created links
    const observer = new MutationObserver(() => {
      const currentAnchors = Array.from(document.querySelectorAll('a[href]'));
      currentAnchors.forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick as EventListener);
        anchor.addEventListener('click', handleAnchorClick as EventListener);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      anchors.forEach(anchor => anchor.removeEventListener('click', handleAnchorClick as EventListener));
      observer.disconnect();
    };
  }, []);

  if (!isLoading) return null;

  return (
    <>
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-stone-200 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-600 animate-pulse w-full origin-left transition-all duration-300" />
      </div>

      {/* Floating Center Loading Badge */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="bg-stone-900/85 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl border border-stone-700/50 flex items-center gap-2">
          <svg className="animate-spin h-3.5 w-3.5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>กำลังเปลี่ยนหน้า...</span>
        </div>
      </div>
    </>
  );
}
