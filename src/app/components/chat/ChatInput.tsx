"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip } from "lucide-react";
import { ChatInputProps } from "@/types/chat";

export default function ChatInput({
  value,
  onChange,
  onSend,
  onTyping,
  disabled = false,
  placeholder = "메시지를 입력하세요...",
  maxLength = 1000,
  showFileUpload = false,
  onFileSelect
}: ChatInputProps) {
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 메시지 전송
  const handleSend = () => {
    if (!value.trim() || disabled) return;
    
    // 타이핑 상태 종료
    if (isTyping && onTyping) {
      setIsTyping(false);
      onTyping(false);
    }
    
    onSend();
    
    // 포커스 유지
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // 입력 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // 최대 길이 체크
    if (newValue.length > maxLength) return;
    
    onChange(newValue);

    // 타이핑 상태 처리
    if (onTyping) {
      if (newValue.trim() && !isTyping) {
        setIsTyping(true);
        onTyping(true);
      } else if (!newValue.trim() && isTyping) {
        setIsTyping(false);
        onTyping(false);
      }

      // 타이핑 상태 자동 종료 타이머
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          onTyping(false);
        }
      }, 3000);
    }
  };

  // 파일 선택 처리
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-end space-x-2">
        {/* 파일 업로드 버튼 */}
        {showFileUpload && (
          <>
            <button
              type="button"
              onClick={handleFileClick}
              disabled={disabled}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="파일 첨부"
            >
              <Paperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />
          </>
        )}

        {/* 텍스트 입력 */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white max-h-20 min-h-[40px]"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '40px',
              maxHeight: '80px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 80) + 'px';
            }}
          />
          {/* 글자 수 표시 */}
          {maxLength && (
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {value.length}/{maxLength}
            </div>
          )}
        </div>

        {/* 전송 버튼 */}
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex-shrink-0"
          title="메시지 전송 (Enter)"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
