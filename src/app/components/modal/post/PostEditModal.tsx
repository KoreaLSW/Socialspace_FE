"use client";

import React, { useEffect, useRef, useState } from "react";
import { postsApi } from "@/lib/api/posts";
import { ApiPost } from "@/types/post";

interface PostEditModalProps {
  isOpen: boolean;
  post: ApiPost;
  onClose: () => void;
  onSubmit?: (updates: {
    content?: string;
    visibility?: "public" | "followers" | "private";
    allow_comments?: boolean;
    hide_likes?: boolean;
    hide_views?: boolean;
  }) => void | Promise<void>;
}

export default function PostEditModal({
  isOpen,
  post,
  onClose,
  onSubmit,
}: PostEditModalProps) {
  const normalizeVisibility = (v: any): "public" | "followers" | "private" => {
    if (v === "public" || v === "followers" || v === "private") return v;
    return "public";
  };
  const [content, setContent] = useState(post.content || "");
  const [visibility, setVisibility] = useState<
    "public" | "followers" | "private"
  >(normalizeVisibility((post as any)?.visibility));
  const [allowComments, setAllowComments] = useState<boolean>(
    (post as any)?.allow_comments !== false
  );
  const [hideLikes, setHideLikes] = useState<boolean>(
    (post as any)?.hide_likes === true
  );
  const [hideViews, setHideViews] = useState<boolean>(
    (post as any)?.hide_views === true
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const initializedPostIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    if (initializedPostIdRef.current === post.id) return;
    setContent(post.content || "");
    setVisibility(normalizeVisibility((post as any)?.visibility));
    setAllowComments((post as any)?.allow_comments !== false);
    setHideLikes((post as any)?.hide_likes === true);
    setHideViews((post as any)?.hide_views === true);
    setIsDirty(false);
    setMessage(null);
    initializedPostIdRef.current = post.id;
  }, [isOpen, post.id]);

  // 상세 정보를 재확인하여 초기값 보정 (피드에서 visibility가 누락/변형된 경우 대비)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const ensureDetail = async () => {
      try {
        const resp = await postsApi.getById(post.id);
        const data = resp?.data || resp; // API 래퍼 형식 대비
        if (cancelled) return;
        // 사용자가 이미 수정 시작했다면 덮어쓰지 않음
        setVisibility((prev) =>
          isDirty ? prev : normalizeVisibility((data as any)?.visibility)
        );
        setAllowComments((prev) =>
          isDirty ? prev : (data as any)?.allow_comments !== false
        );
        setHideLikes((prev) =>
          isDirty ? prev : (data as any)?.hide_likes === true
        );
        setHideViews((prev) =>
          isDirty ? prev : (data as any)?.hide_views === true
        );
      } catch (error: any) {
        // 404 에러는 차단된 게시물이거나 존재하지 않는 게시물
        if (error?.response?.status === 404) {
          console.log("게시물을 찾을 수 없습니다 (차단되었거나 삭제됨)");
        }
      }
    };
    // 피드 객체에 visibility가 없거나 비정상일 때만 보정 호출
    const v = (post as any)?.visibility;
    if (v !== "public" && v !== "followers" && v !== "private") {
      ensureDetail();
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen, post.id, isDirty]);
  // 변경 감지
  useEffect(() => {
    const original = {
      content: post.content || "",
      visibility: ((post as any)?.visibility || "public") as any,
      allow_comments: (post as any)?.allow_comments !== false,
      hide_likes: (post as any)?.hide_likes === true,
      hide_views: (post as any)?.hide_views === true,
    };
    const current = {
      content,
      visibility,
      allow_comments: allowComments,
      hide_likes: hideLikes,
      hide_views: hideViews,
    };
    setIsDirty(JSON.stringify(original) !== JSON.stringify(current));
  }, [content, visibility, allowComments, hideLikes, hideViews, post]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const payload = {
      content: content?.trim() ?? "",
      visibility,
      allow_comments: allowComments,
      hide_likes: hideLikes,
      hide_views: hideViews,
    };
    try {
      setIsSaving(true);
      setMessage(null);
      await onSubmit?.(payload);
      alert("게시글이 수정되었습니다.");
      setIsDirty(false);
      // 메시지는 유지하지 않고 알럿으로만 안내
    } catch (e) {
      setMessage("수정 중 오류가 발생했습니다.");
      setTimeout(() => setMessage(null), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            게시글 수정
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* 이미지 섹션 (비활성 안내) */}
        {Array.isArray(post.images) && post.images.length > 0 && (
          <div className="px-5 pt-4">
            <div className="relative rounded-lg overflow-hidden border border-dashed border-gray-300 dark:border-gray-600 p-3">
              <div className="grid grid-cols-3 gap-2">
                {(post.images || []).slice(0, 6).map((img, idx) => (
                  <img
                    key={idx}
                    src={(img as any)?.image_url || (img as any)}
                    alt={`img-${idx}`}
                    className="w-full h-24 object-cover rounded"
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-white/70 dark:bg-black/30 flex items-center justify-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  이미지 수정은 현재 지원하지 않습니다
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 본문 */}
        <div className="px-5 pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="내용을 입력하세요 (최대 2000자)"
            maxLength={2000}
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {content.length}/2000
          </div>
        </div>

        {/* 설정들 */}
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              공개 범위
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2"
            >
              <option value="public">전체 공개</option>
              <option value="followers">팔로워만</option>
              <option value="private">비공개</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              댓글 허용
            </label>
            <input
              type="checkbox"
              checked={allowComments}
              onChange={(e) => setAllowComments(e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-2 00 dark:border-gray-700">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              좋아요 공개
            </label>
            <input
              type="checkbox"
              checked={!hideLikes}
              onChange={(e) => setHideLikes(!e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              조회수 공개
            </label>
            <input
              type="checkbox"
              checked={!hideViews}
              onChange={(e) => setHideViews(!e.target.checked)}
            />
          </div>
        </div>

        {/* 액션 */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            disabled={isSaving}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className={`px-5 py-2 rounded-lg text-white ${
              isDirty && !isSaving
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>

        {/* 토스트/메시지 */}
        {message && (
          <div className="px-5 pb-4">
            <div className="text-sm text-green-600 dark:text-green-400">
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
