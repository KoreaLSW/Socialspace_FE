"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Image,
  X,
  Settings,
  Eye,
  EyeOff,
  MessageCircle,
  MessageCircleOff,
  Globe,
  Users,
  Lock,
} from "lucide-react";
import { useCreatePost } from "@/hooks/useCreatePost";

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { submitPost, isLoading, isUploading } = useCreatePost();

  // 폼 상태
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  // 게시글 설정
  const [visibility, setVisibility] = useState<
    "public" | "followers" | "private"
  >("public");
  const [allowComments, setAllowComments] = useState(true);
  const [hideViews, setHideViews] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);

  // UI 상태
  const [showSettings, setShowSettings] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 인증 체크
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      alert("로그인이 필요합니다.");
      router.push("/auth/login");
    }
  }, [session, status, router]);

  // 내용 변경 감지
  useEffect(() => {
    setHasUnsavedChanges(content.trim() !== "" || images.length > 0);
  }, [content, images]);

  // 페이지 이탈 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "작성 중인 내용이 있습니다. 정말 페이지를 떠나시겠습니까?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // 최대 5개 이미지 제한
    if (images.length + files.length > 5) {
      alert("최대 5개의 이미지만 업로드할 수 있습니다.");
      return;
    }

    // 파일 크기 제한 (5MB)
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert("각 이미지는 5MB 이하여야 합니다.");
      return;
    }

    setImages((prev) => [...prev, ...files]);

    // 미리보기 생성
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 이미지 제거
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
  };

  // 게시글 제출
  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    if (content.length > 2000) {
      alert("게시글은 2000자를 초과할 수 없습니다.");
      return;
    }

    try {
      // 실제 게시글 작성 API 호출
      const result = await submitPost({
        content,
        visibility,
        hideViews,
        hideLikes,
        allowComments,
        images: images.length > 0 ? images : undefined,
      });

      if (result.success) {
        // 성공 처리
        alert("게시글이 성공적으로 작성되었습니다!");
        setContent("");
        setImages([]);
        setImagePreview([]);
        setHasUnsavedChanges(false);
        router.push("/");
      } else {
        throw new Error(result.error || "게시글 작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("게시글 작성 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "게시글 작성 중 오류가 발생했습니다."
      );
    }
  };

  // 취소 처리
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm(
        "작성 중인 내용이 있습니다. 정말 취소하시겠습니까?"
      );
      if (!confirmed) return;
    }

    router.push("/");
  };

  // 로딩 중이면 아무것도 렌더링하지 않음
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto pt-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">새 게시글 작성</h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <Settings size={20} />
            </button>
          </div>

          {/* 설정 패널 */}
          {showSettings && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-semibold mb-4">게시글 설정</h3>

              {/* 공개 범위 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  공개 범위
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={visibility === "public"}
                      onChange={(e) =>
                        setVisibility(e.target.value as "public")
                      }
                      className="mr-2"
                    />
                    <Globe size={16} className="mr-2 text-green-600" />
                    <span>전체 공개</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="followers"
                      checked={visibility === "followers"}
                      onChange={(e) =>
                        setVisibility(e.target.value as "followers")
                      }
                      className="mr-2"
                    />
                    <Users size={16} className="mr-2 text-blue-600" />
                    <span>팔로워만</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={visibility === "private"}
                      onChange={(e) =>
                        setVisibility(e.target.value as "private")
                      }
                      className="mr-2"
                    />
                    <Lock size={16} className="mr-2 text-gray-600" />
                    <span>비공개</span>
                  </label>
                </div>
              </div>

              {/* 토글 설정들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center">
                    {allowComments ? (
                      <MessageCircle size={16} className="mr-2 text-blue-600" />
                    ) : (
                      <MessageCircleOff
                        size={16}
                        className="mr-2 text-gray-600"
                      />
                    )}
                    <span className="text-sm">댓글 허용</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="toggle"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center">
                    {hideViews ? (
                      <EyeOff size={16} className="mr-2 text-gray-600" />
                    ) : (
                      <Eye size={16} className="mr-2 text-blue-600" />
                    )}
                    <span className="text-sm">조회수 공개</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!hideViews}
                    onChange={(e) => setHideViews(!e.target.checked)}
                    className="toggle"
                  />
                </label>
              </div>
            </div>
          )}

          {/* 내용 입력 */}
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="무슨 일이 일어나고 있나요?"
              className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-2">
              <span
                className={`text-sm ${
                  content.length > 1800 ? "text-red-500" : "text-gray-500"
                }`}
              >
                {content.length}/2000
              </span>
            </div>
          </div>

          {/* 이미지 미리보기 */}
          {imagePreview.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`미리보기 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 하단 도구 */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                <Image size={20} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading || isLoading}
                />
              </label>
              <span className="text-sm text-gray-500">
                {images.length}/5 이미지
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancel}
                disabled={isUploading || isLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isUploading || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading
                  ? "업로드 중..."
                  : isLoading
                  ? "게시 중..."
                  : "게시하기"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
