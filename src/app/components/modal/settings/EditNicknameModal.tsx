"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { useCurrentUser, useUpdateProfile } from "@/hooks/useAuth";

interface EditNicknameModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EditNicknameModal({
  open,
  onClose,
}: EditNicknameModalProps) {
  const { user } = useCurrentUser();
  const initialNickname = useMemo(
    () => (user?.nickname as string) || "",
    [user?.nickname]
  );
  const [nickname, setNickname] = useState<string>(initialNickname);
  const [error, setError] = useState<string | null>(null);
  const { updateProfile, isUpdating } = useUpdateProfile();
  const { mutate } = useSWRConfig();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });
  const maxLength = 10;

  useEffect(() => {
    if (open) {
      setNickname(initialNickname);
      setError(null);
      // 포커스 초기화
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open, initialNickname]);

  const handleClose = () => {
    if (isUpdating) return;
    onClose();
  };

  const validate = (value: string) => {
    const v = value.trim();
    if (v.length === 0) return "닉네임을 입력하세요.";
    if (v.length > maxLength) return `닉네임은 ${maxLength}자 이하여야 합니다.`;
    return null;
  };

  const handleSave = async () => {
    const trimmed = nickname.trim();
    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (trimmed === (initialNickname || "")) {
      onClose();
      return;
    }

    try {
      setError(null);
      const result = await updateProfile({ nickname: trimmed });
      if ((result as any)?.success === false) {
        setToast({
          visible: true,
          message: "프로필 업데이트에 실패했습니다.",
          type: "error",
        });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1500);
        return;
      }
      await Promise.all([mutate("/auth/me"), mutate("/profile/me")]);
      setToast({
        visible: true,
        message: "닉네임이 변경되었습니다.",
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
    }
  };

  // ESC 닫기 & 포커스 트랩
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key === "Tab") {
        const container = modalRef.current;
        if (!container) return;
        const focusable = container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isUpdating]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-nickname-title"
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <h3
          id="edit-nickname-title"
          className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
        >
          닉네임 변경
        </h3>
        <div className="space-y-2">
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="새 닉네임을 입력하세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={maxLength}
            ref={inputRef}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              최대 {maxLength}자
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {nickname.trim().length}/{maxLength}
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            disabled={isUpdating}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              isUpdating ||
              nickname.trim().length === 0 ||
              !!validate(nickname.trim()) ||
              nickname.trim() === (initialNickname || "")
            }
            className={`rounded-md px-4 py-2 text-white ${
              isUpdating ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isUpdating ? "저장 중..." : "저장"}
          </button>
        </div>
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
  );
}
