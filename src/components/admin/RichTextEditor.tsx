"use client";

import React, { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const lastHtmlRef = useRef(value);

  useEffect(() => {
    if (editorRef.current && value !== lastHtmlRef.current) {
      editorRef.current.innerHTML = value;
      lastHtmlRef.current = value;
    }
  }, [value]);

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      onChange(html);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      onChange(html);
    }
  };

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-stone-200 bg-stone-50">
        <button type="button" onClick={() => exec('bold')} className="p-1.5 hover:bg-stone-200 rounded text-stone-700 font-bold w-8 h-8 flex items-center justify-center" title="ตัวหนา">B</button>
        <button type="button" onClick={() => exec('italic')} className="p-1.5 hover:bg-stone-200 rounded text-stone-700 italic w-8 h-8 flex items-center justify-center" title="ตัวเอียง">I</button>
        <button type="button" onClick={() => exec('underline')} className="p-1.5 hover:bg-stone-200 rounded text-stone-700 underline w-8 h-8 flex items-center justify-center" title="ขีดเส้นใต้">U</button>
        <div className="w-px h-5 bg-stone-300 mx-1"></div>
        <button type="button" onClick={() => exec('formatBlock', 'H1')} className="p-1.5 hover:bg-stone-200 rounded text-stone-700 font-bold text-xs" title="หัวข้อใหญ่">H1</button>
        <button type="button" onClick={() => exec('formatBlock', 'H2')} className="p-1.5 hover:bg-stone-200 rounded text-stone-700 font-bold text-xs" title="หัวข้อย่อย">H2</button>
        <button type="button" onClick={() => exec('formatBlock', 'P')} className="p-1.5 hover:bg-stone-200 rounded text-stone-700 font-medium text-xs" title="ย่อหน้าปกติ">P</button>
        <div className="w-px h-5 bg-stone-300 mx-1"></div>
        <button type="button" onClick={() => exec('insertUnorderedList')} className="p-1.5 hover:bg-stone-200 rounded text-stone-700 text-xs w-8 h-8 flex items-center justify-center" title="รายการแบบจุด">•</button>
        <button type="button" onClick={() => exec('insertOrderedList')} className="p-1.5 hover:bg-stone-200 rounded text-stone-700 text-xs w-8 h-8 flex items-center justify-center" title="รายการตัวเลข">1.</button>
        <div className="w-px h-5 bg-stone-300 mx-1"></div>
        <button type="button" onClick={() => {
          const url = prompt('ใส่ URL ที่ต้องการลิ้งก์:');
          if (url) exec('createLink', url);
        }} className="p-1.5 hover:bg-stone-200 rounded text-stone-700 text-xs flex items-center justify-center" title="เพิ่มลิ้งก์">
          🔗
        </button>
        <button type="button" onClick={() => exec('unlink')} className="p-1.5 hover:bg-stone-200 rounded text-stone-700 text-xs flex items-center justify-center" title="ลบลิ้งก์">
          ❌🔗
        </button>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="p-4 min-h-[250px] max-h-[500px] overflow-y-auto focus:outline-none text-stone-900 prose prose-sm max-w-none prose-stone prose-p:my-1 prose-headings:my-2 prose-headings:text-stone-900 prose-ul:my-1"
        style={{ whiteSpace: 'pre-wrap' }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
