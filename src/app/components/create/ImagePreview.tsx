"use client";

import { X, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface ImagePreviewProps {
  imagePreview: string[]; // 미리보기 URL 목록
  removeImage: (index: number) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
  isLoading?: boolean;
  maxImages?: number;
}

export default function ImagePreview({
  imagePreview,
  removeImage,
  handleImageUpload,
  isUploading = false,
  isLoading = false,
  maxImages = 5,
}: ImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const canAddMore = imagePreview.length < maxImages;

  // 렌더링에 사용할 "슬라이드" 목록: 실제 이미지 + (여유 있으면) '추가' 카드 1장
  const slides = useMemo(
    () => [...imagePreview, ...(canAddMore ? ["__ADD__"] : [])],
    [imagePreview, canAddMore]
  );

  const maxIndex = Math.max(0, slides.length - 1); // itemsPerView = 1

  // 이미지 추가/삭제 등으로 길이가 바뀌었을 때 인덱스 보정
  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const goToPrevious = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const goToNext = () =>
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));

  if (slides.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="relative">
        {/* 뷰포트 */}
        <div className="overflow-hidden">
          {/* 트랙: 슬라이드들을 가로로 배치 */}
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {slides.map((item, index) => {
              const isAddCard = item === "__ADD__";

              return (
                <div
                  key={index}
                  className="relative flex-shrink-0 w-full"
                  aria-roledescription="slide"
                  aria-label={`슬라이드 ${index + 1}`}
                >
                  {isAddCard ? (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-128 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg transition-all duration-200 bg-gray-50 hover:bg-blue-50 hover:shadow-md">
                      <div className="flex flex-col items-center">
                        <div className="bg-gray-200 hover:bg-blue-100 rounded-full p-4 mb-3 transition-colors">
                          <ImageIcon size={40} className="text-gray-500" />
                        </div>
                        <span className="text-lg text-gray-600 font-medium mb-1">
                          이미지 추가하기
                        </span>
                        <span className="text-sm text-gray-400 mb-2">
                          클릭하거나 파일을 드래그하세요
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {imagePreview.length}/{maxImages}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading || isLoading || !canAddMore}
                      />
                    </label>
                  ) : (
                    <div className="w-full h-128 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={item as string}
                        alt={`이미지 미리보기 ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                        draggable={false}
                      />
                      <button
                        type="button"
                        aria-label="이미지 삭제"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md"
                        disabled={isUploading || isLoading}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 좌/우 네비게이션 */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="이전 이미지"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg hover:bg-white transition-colors z-10"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
        )}
        {currentIndex < maxIndex && (
          <button
            type="button"
            onClick={goToNext}
            aria-label="다음 이미지"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg hover:bg-white transition-colors z-10"
          >
            <ChevronRight size={24} className="text-gray-700" />
          </button>
        )}
      </div>

      {/* 하단 인디케이터 */}
      {slides.length > 1 && (
        <div className="flex flex-col items-center mt-3 space-y-2">
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {slides.length - 1}
          </div>
          <div className="flex justify-center space-x-1">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`${index + 1}번째 슬라이드로 이동`}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
