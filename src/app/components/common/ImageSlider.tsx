"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageSliderProps {
  images: string[];
  className?: string;
  showCounter?: boolean;
  showArrows?: boolean;
  showIndicators?: boolean;
  imageClassName?: string;
  onImageChange?: (index: number) => void;
  resetKey?: string | number; // 외부에서 리셋을 트리거하기 위한 키
  isModal?: boolean; // 모달용 레이아웃 여부
  initialIndex?: number; // 초기 이미지 인덱스
}

export default function ImageSlider({
  images,
  className = "",
  showCounter = true,
  showArrows = true,
  showIndicators = true,
  imageClassName = "",
  onImageChange,
  resetKey,
  isModal = false,
  initialIndex = 0,
}: ImageSliderProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);
  const hasMultipleImages = images.length > 1;

  // 외부에서 리셋 요청이 있을 때 초기 인덱스로 이동
  useEffect(() => {
    setCurrentImageIndex(initialIndex);
  }, [resetKey, initialIndex]);

  // 이미지 변경 시 콜백 호출
  useEffect(() => {
    onImageChange?.(currentImageIndex);
  }, [currentImageIndex, onImageChange]);

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 이미지 슬라이더 컨테이너 */}
      <div
        className={`flex transition-transform duration-300 ease-in-out ${
          isModal ? "h-full" : ""
        }`}
        style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className={`w-full flex-shrink-0 ${
              isModal ? "h-full flex items-center justify-center" : ""
            }`}
          >
            <img
              src={image}
              alt={`Image ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className={`image-high-quality ${
                isModal
                  ? "w-full h-auto object-contain"
                  : `w-full object-cover ${imageClassName}`
              }`}
              style={{
                ...(isModal ? {} : { objectPosition: "center" }),
              }}
            />
          </div>
        ))}
      </div>

      {/* 현재 이미지 번호 표시 */}
      {hasMultipleImages && showCounter && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded-full z-10">
          {currentImageIndex + 1} / {images.length}
        </div>
      )}

      {/* 화살표 네비게이션 */}
      {hasMultipleImages && showArrows && (
        <>
          {/* 이전 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPreviousImage();
            }}
            className={`absolute top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full transition-all duration-200 z-10 ${
              isModal ? "left-4 p-2" : "left-2 p-3"
            }`}
          >
            <ChevronLeft size={24} />
          </button>

          {/* 다음 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNextImage();
            }}
            className={`absolute top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full transition-all duration-200 z-10 ${
              isModal ? "right-4 p-2" : "right-2 p-3"
            }`}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* 이미지 인디케이터 */}
      {hasMultipleImages && showIndicators && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(index);
              }}
              className={`rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? "w-2.5 h-2.5 bg-sky-400 scale-110 shadow-md"
                  : "w-2 h-2 bg-white bg-opacity-60 hover:bg-opacity-80 hover:scale-105"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
