"use client";

import { useState } from "react";
import { Image, Smile, MapPin, X } from "lucide-react";

export default function CreatePage() {
  const [content, setContent] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
  };

  const handleSubmit = () => {
    if (content.trim()) {
      // 여기서 게시물을 제출하는 로직을 추가할 수 있습니다
      alert("게시물이 작성되었습니다!");
      setContent("");
      setAttachedImage(null);
    }
  };

  return (
    <>
      {/* 글쓰기 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          새 게시물 작성
        </h1>
      </div>

      {/* 글쓰기 폼 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start space-x-4">
          {/* 프로필 아바타 */}
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
            alt="프로필"
            className="w-12 h-12 rounded-full object-cover"
          />

          {/* 글쓰기 영역 */}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="무슨 일이 일어나고 있나요?"
              className="w-full h-32 p-4 border border-gray-200 dark:border-gray-600 rounded-lg resize-none outline-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
            />

            {/* 첨부된 이미지 */}
            {attachedImage && (
              <div className="relative mt-4">
                <img
                  src={attachedImage}
                  alt="첨부 이미지"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* 도구 모음 */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer text-blue-500 hover:text-blue-600">
                  <Image size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <button className="text-blue-500 hover:text-blue-600">
                  <Smile size={20} />
                </button>
                <button className="text-blue-500 hover:text-blue-600">
                  <MapPin size={20} />
                </button>
              </div>

              {/* 글자 수 표시 및 게시 버튼 */}
              <div className="flex items-center space-x-4">
                <span
                  className={`text-sm ${
                    content.length > 280
                      ? "text-red-500"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {content.length}/280
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || content.length > 280}
                  className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  게시하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 작성 팁 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 mt-6">
        <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
          ✨ 작성 팁
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• 해시태그(#)를 사용해서 주제를 표시해보세요</li>
          <li>• 이미지를 첨부하면 더 많은 관심을 받을 수 있어요</li>
          <li>• 280자 이내로 간결하게 작성해주세요</li>
        </ul>
      </div>
    </>
  );
}
