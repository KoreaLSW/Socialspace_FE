"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCreatePost } from "@/hooks/useCreatePost";

// 분리된 컴포넌트들 import
import CreateHeader from "../components/create/CreateHeader";
import ContentInput from "../components/create/ContentInput";
import ImagePreview from "../components/create/ImagePreview";
import HashtagInput from "../components/create/HashtagInput";
import PostSettings from "../components/create/PostSettings";
import ActionButtons from "../components/create/ActionButtons";

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { submitPost, isLoading, isUploading } = useCreatePost();

  // 폼 상태
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);

  // 게시글 설정
  const [visibility, setVisibility] = useState<
    "public" | "followers" | "private"
  >("public");
  const [allowComments, setAllowComments] = useState(true);
  const [hideViews, setHideViews] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);

  // UI 상태
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
    setHasUnsavedChanges(
      content.trim() !== "" || images.length > 0 || hashtags.length > 0
    );
  }, [content, images, hashtags]);

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
        hashtags: hashtags.length > 0 ? hashtags : undefined,
      });

      if (result.success) {
        // 성공 처리
        alert("게시글이 성공적으로 작성되었습니다!");
        setContent("");
        setImages([]);
        setImagePreview([]);
        setHashtags([]);
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
          <CreateHeader />

          <ImagePreview
            imagePreview={imagePreview}
            removeImage={removeImage}
            handleImageUpload={handleImageUpload}
            isUploading={isUploading}
            isLoading={isLoading}
            maxImages={5}
          />

          <ContentInput content={content} setContent={setContent} />

          <HashtagInput hashtags={hashtags} setHashtags={setHashtags} />

          <PostSettings
            visibility={visibility}
            setVisibility={setVisibility}
            allowComments={allowComments}
            setAllowComments={setAllowComments}
            hideViews={hideViews}
            setHideViews={setHideViews}
            hideLikes={hideLikes}
            setHideLikes={setHideLikes}
          />

          <ActionButtons
            images={images}
            handleImageUpload={handleImageUpload}
            handleCancel={handleCancel}
            handleSubmit={handleSubmit}
            content={content}
            isUploading={isUploading}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
