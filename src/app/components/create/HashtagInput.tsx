"use client";

import { useState } from "react";
import { Hash, X } from "lucide-react";

interface HashtagInputProps {
  hashtags: string[];
  setHashtags: (hashtags: string[]) => void;
}

export default function HashtagInput({
  hashtags,
  setHashtags,
}: HashtagInputProps) {
  const [inputValue, setInputValue] = useState("");

  // 해시태그 추가
  const addHashtag = (tag: string) => {
    const cleanTag = tag.replace(/^#/, "").trim();
    if (cleanTag && !hashtags.includes(cleanTag) && hashtags.length < 10) {
      setHashtags([...hashtags, cleanTag]);
    }
  };

  // 해시태그 제거
  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };

  // Enter 키나 스페이스바로 해시태그 추가
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (inputValue.trim()) {
        addHashtag(inputValue);
        setInputValue("");
      }
    }
  };

  // 입력값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // # 없이 입력했을 때 자동으로 # 추가
    if (value && !value.startsWith("#")) {
      value = "#" + value;
    }

    setInputValue(value);
  };

  // 입력 완료 시 해시태그 추가
  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addHashtag(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <Hash size={16} className="text-blue-600 mr-2" />
        <span className="text-sm font-medium text-gray-700">해시태그</span>
        <span className="text-xs text-gray-500 ml-2">
          ({hashtags.length}/10)
        </span>
      </div>

      {/* 기존 해시태그 표시 */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {hashtags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              #{tag}
              <button
                onClick={() => removeHashtag(tag)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 해시태그 입력 */}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleInputBlur}
        placeholder="해시태그를 입력하세요 (Enter 또는 스페이스로 추가)"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={hashtags.length >= 10}
        maxLength={50}
      />

      <p className="text-xs text-gray-500 mt-1">
        최대 10개까지 추가할 수 있습니다. Enter 또는 스페이스바로 해시태그를
        추가하세요.
      </p>
    </div>
  );
}
