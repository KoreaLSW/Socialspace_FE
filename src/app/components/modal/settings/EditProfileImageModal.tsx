"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentUser, useUpdateProfile } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api/users";

interface EditProfileImageModalProps {
  open: boolean;
  onClose: () => void;
}

type Point = { x: number; y: number };

export default function EditProfileImageModal({
  open,
  onClose,
}: EditProfileImageModalProps) {
  const { user } = useCurrentUser();
  const { updateProfile, isUpdating } = useUpdateProfile();

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });

  // 크롭 상태: 이미지 이동/줌
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const imgStartRef = useRef<Point>({ x: 0, y: 0 });
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [containerSize, setContainerSize] = useState<number>(360);
  const minZoom = 1;
  const maxZoom = 3;

  // 컨테이너 크기 측정
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setContainerSize(Math.min(rect.width, rect.height));
  }, [open, sourceUrl]);

  useEffect(() => {
    if (!open) {
      // 상태 초기화
      setSourceUrl(null);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setError(null);
    }
  }, [open]);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("이미지는 5MB 이하여야 합니다.");
      return;
    }
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    setError(null);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  // wheel 비수동 리스너 등록 (passive: false)로 preventDefault 가능하게 처리
  useEffect(() => {
    if (!open || !sourceUrl) return;
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.cancelable) e.preventDefault();
      const delta = -e.deltaY;
      const step = Math.max(0.02, Math.min(0.2, Math.abs(delta) / 1000));
      const factor = delta > 0 ? step : -step;
      setZoom((currentZoom) => {
        const nextZoom = Math.min(
          maxZoom,
          Math.max(minZoom, currentZoom + factor)
        );
        // 줌 변경 후 위치도 경계 내로 보정
        setPosition((prev) => clampPosition(prev, nextZoom));
        return nextZoom;
      });
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel as EventListener);
    };
  }, [open, sourceUrl]);

  // 모달 오픈 시 배경 스크롤 잠금 (마우스/터치)
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as Node;
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }
      if (e.cancelable) e.preventDefault();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("touchmove", preventTouchMove, {
      passive: false,
    });
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener(
        "touchmove",
        preventTouchMove as EventListener
      );
    };
  }, [open]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    imgStartRef.current = { ...position };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const next = {
      x: imgStartRef.current.x + dx,
      y: imgStartRef.current.y + dy,
    };
    setPosition(clampPosition(next, zoom));
  };

  const onMouseUp = () => {
    isDraggingRef.current = false;
  };

  const renderToCanvas = useCallback(
    async (asCircle = false): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = imgRef.current;
        if (!img || !imgDims) return reject("no image");

        const size = 512; // 저장될 정사각 크기
        const cSize = containerSize; // 프리뷰 컨테이너 한 변(예: 360)
        const z = zoom;

        // 화면(컨테이너)에서의 배치 계산
        const coverScale = cSize / Math.min(imgDims.w, imgDims.h);
        const drawW = imgDims.w * coverScale * z; // 화면에 표시되는 이미지의 가로 px
        const drawH = imgDims.h * coverScale * z; // 화면에 표시되는 이미지의 세로 px

        // 화면에서 이미지의 좌상단(컨테이너 좌표)
        const imgX = cSize / 2 - drawW / 2 + position.x;
        const imgY = cSize / 2 - drawH / 2 + position.y;

        // 우리가 저장할 정사각 영역(화면 기준): 컨테이너 중앙의 cSize×cSize 정사각
        const viewX = 0; // 컨테이너 기준 정사각의 좌상단 X (컨테이너 자체가 정사각이므로 0)
        const viewY = 0; // 동일
        const viewSize = cSize; // 한 변

        // 화면 좌표 -> 이미지 원본 좌표로 역변환(스케일만 역으로)
        const scaleDisplayToImage = 1 / (coverScale * z);

        // 정사각(프리뷰) 좌상단이 이미지 내부에서 어디인지
        const sx = (viewX - imgX) * scaleDisplayToImage;
        const sy = (viewY - imgY) * scaleDisplayToImage;
        const sSize = viewSize * scaleDisplayToImage;

        // 캔버스에 그리기
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("no ctx");

        // (옵션) 원형 PNG로 저장하려면 true로
        if (asCircle) {
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();
        }

        // 이미지 좌표(sx, sy, sSize)를 결과 캔버스(size, size)에 맞춰 그리기
        ctx.drawImage(
          img,
          sx,
          sy,
          sSize,
          sSize, // 원본에서 잘라낼 영역
          0,
          0,
          size,
          size // 결과 캔버스에 채울 영역
        );

        resolve(canvas.toDataURL("image/png"));
      });
    },
    [position.x, position.y, zoom, containerSize, imgDims]
  );

  // 현재 scaled 이미지가 원형 영역 밖으로 나가지 않게 좌표 보정
  // 기존 함수 대체
  const clampPosition = (pos: Point, z: number): Point => {
    if (!imgDims) return pos;

    const cSize = containerSize; // 예: 360
    const radius = cSize / 2;

    // cover: 짧은 변이 컨테이너에 딱 맞게
    const coverScale = cSize / Math.min(imgDims.w, imgDims.h);

    const drawW = imgDims.w * coverScale * z;
    const drawH = imgDims.h * coverScale * z;

    const maxOffsetX = Math.max(0, drawW / 2 - radius);
    const maxOffsetY = Math.max(0, drawH / 2 - radius);

    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, pos.x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, pos.y)),
    };
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (!sourceUrl) return;
      const dataUrl = await renderToCanvas();

      // 이미지 파일 생성 및 다운로드
      // const link = document.createElement("a");
      // link.download = "profile-image.png";
      // link.href = dataUrl;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);

      // 서버 업로드
      const upload = await usersApi.uploadBase64ProfileImage(dataUrl);
      const url = upload?.data?.imageUrl || upload?.data?.url; // 백엔드 응답 케이스 흡수
      if (!url) {
        setToast({
          visible: true,
          message: "업로드에 실패했습니다.",
          type: "error",
        });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1500);
        return;
      }
      const result = await updateProfile({ profileImage: url });
      if ((result as any)?.success === false) {
        setToast({
          visible: true,
          message: "프로필 업데이트에 실패했습니다.",
          type: "error",
        });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1500);
        return;
      }
      // 프로필 업데이트 후 캐시 무효화는 useUpdateProfile에서 자동으로 처리됨
      setToast({
        visible: true,
        message: "프로필 이미지가 변경되었습니다.",
        type: "success",
      });
      setTimeout(() => {
        setToast((t) => ({ ...t, visible: false }));
        onClose();
      }, 1000);
    } catch (e) {
      setToast({
        visible: true,
        message: "오류가 발생했습니다. 잠시 후 다시 시도하세요.",
        type: "error",
      });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1500);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative w-full max-w-xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          프로필 이미지 변경
        </h3>

        {!sourceUrl ? (
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={onInputChange}
              className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div
              ref={containerRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              className="relative mx-auto h-[360px] w-[360px] select-none overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
            >
              {/* 원형 마스크 컨테이너 내부에서 이미지 이동/확대 */}
              <img
                ref={imgRef}
                src={sourceUrl}
                alt="preview"
                className="pointer-events-none select-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  translate: "-50% -50%",
                }}
                onLoad={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  setImgDims({
                    w: target.naturalWidth,
                    h: target.naturalHeight,
                  });
                  // 초기 위치 보정
                  setPosition((prev) => clampPosition(prev, zoom));
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                >
                  축소
                </button>
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                >
                  확대
                </button>
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  onClick={() => {
                    setZoom(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                >
                  초기화
                </button>
              </div>
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                onClick={() => setSourceUrl(null)}
              >
                다른 이미지 선택
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            disabled={isSaving}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !sourceUrl}
            className={`rounded-md px-4 py-2 text-white ${
              isSaving || !sourceUrl
                ? "bg-blue-400"
                : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>저장 중...</span>
              </div>
            ) : (
              "저장"
            )}
          </button>
        </div>

        {toast.visible && (
          <div
            className={`fixed right-4 top-4 z-[60] rounded-md px-4 py-2 text-sm shadow-lg ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
