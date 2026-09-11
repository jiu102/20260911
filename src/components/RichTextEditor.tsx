import React, { useRef, useState } from 'react';
import {
  Bold,
  Italic,
  List,
  Code,
  Image as ImageIcon,
  Eye,
  Edit3,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  onImagePaste?: (file: File) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '請輸入公報或工程紀錄內容，支援 Markdown 與剪貼簿截圖直接貼上 (Ctrl+V)...',
  minHeight = '140px',
  onImagePaste,
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [pasteFeedback, setPasteFeedback] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousValue = textarea.value;
    const selectedText = previousValue.substring(start, end);

    const newValue =
      previousValue.substring(0, start) +
      before +
      selectedText +
      after +
      previousValue.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  // Clipboard Paste-to-Upload (Specification 3.4)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          e.preventDefault();
          if (onImagePaste) {
            onImagePaste(blob);
          }
          // Read as data URL and insert directly into markdown
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const imgTag = `\n\n![工程現場照-${new Date().toLocaleTimeString()}](${dataUrl})\n\n`;
            const textarea = textareaRef.current;
            if (textarea) {
              const start = textarea.selectionStart;
              const curVal = textarea.value;
              const nextVal = curVal.slice(0, start) + imgTag + curVal.slice(start);
              onChange(nextVal);
            } else {
              onChange(value + imgTag);
            }
            setPasteFeedback(true);
            setTimeout(() => setPasteFeedback(false), 2500);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  // Parse simple markdown-like syntax for preview in editorial typography
  const renderPreview = (text: string) => {
    if (!text.trim()) {
      return <p className="text-[#737373] italic font-mono text-xs">[ 尚無內文文字 ]</p>;
    }

    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-xs font-body text-[#111111] leading-relaxed break-words">
        {lines.map((line, idx) => {
          // Check for image markdown: ![alt](url)
          const imgMatch = line.match(/^!\[(.*?)\]\((.+)\)$/);
          if (imgMatch) {
            return (
              <div key={idx} className="my-2 border-2 border-[#111111] bg-white p-1.5 hard-shadow-sm">
                <img
                  src={imgMatch[2]}
                  alt={imgMatch[1] || '剪貼簿工程圖'}
                  className="max-h-80 w-auto border border-[#111111] object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="px-1 py-0.5 text-[10px] text-[#737373] font-mono flex items-center gap-1 mt-1">
                  <Paperclip className="w-3 h-3 text-[#111111]" />
                  {imgMatch[1] || '剪貼簿貼上之工程照片'}
                </div>
              </div>
            );
          }

          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-serif font-bold text-sm text-[#111111] mt-2 border-b border-[#111111] pb-0.5">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-serif font-bold text-base text-[#111111] mt-2 border-b-2 border-[#111111] pb-1">
                {line.replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h2 key={idx} className="font-serif font-black text-lg text-[#111111] mt-2 border-b-2 border-[#111111] pb-1">
                {line.replace('# ', '')}
              </h2>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-4 list-square text-[#111111]">
                {line.replace(/^[-*]\s+/, '')}
              </li>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="border-2 border-[#111111] bg-[#F9F9F7] font-mono hard-shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#E5E5E0] border-b-2 border-[#111111]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="editor-btn-bold"
            onClick={() => insertText('**', '**')}
            title="粗體 (Ctrl+B)"
            className="p-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition-colors"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="editor-btn-italic"
            onClick={() => insertText('*', '*')}
            title="斜體 (Ctrl+I)"
            className="p-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition-colors"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="editor-btn-code"
            onClick={() => insertText('`', '`')}
            title="行內代碼"
            className="p-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="editor-btn-list"
            onClick={() => insertText('- ')}
            title="條列清單"
            className="p-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition-colors"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-[#111111] mx-1" />
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[#111111] bg-white px-1.5 py-0.5 border border-[#111111]">
            <ImageIcon className="w-3 h-3 text-[#CC0000]" />
            CTRL+V 直接貼上剪貼簿工程照
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pasteFeedback && (
            <span className="text-[10px] text-white bg-[#111111] px-1.5 py-0.5 border border-[#111111] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#CC0000]" />
              圖片已嵌入！
            </span>
          )}
          <button
            type="button"
            id="editor-btn-toggle-preview"
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition-colors"
          >
            {isPreview ? (
              <>
                <Edit3 className="w-3 h-3" />
                編輯文字
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                版面預覽
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {isPreview ? (
        <div
          className="p-3 bg-white overflow-y-auto"
          style={{ minHeight }}
        >
          {renderPreview(value)}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          id="rich-text-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full p-3 font-mono text-xs text-[#111111] bg-white placeholder:text-[#A3A3A3] focus:outline-none resize-y"
        />
      )}
    </div>
  );
};
