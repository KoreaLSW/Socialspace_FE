"use client";

import { useRouter } from "next/navigation";

interface UserNickNameProps {
  username?: string;
  name?: string;
  className?: string;
  title?: string;
  as?: "button" | "span"; // 버튼 중첩 회피용
}

export default function UserNickName({
  username,
  name,
  className = "",
  title,
  as = "button",
}: UserNickNameProps) {
  const router = useRouter();
  const handleClick = () => {
    if (username) router.push(`/profile/${username}`);
  };

  if (as === "span") {
    return (
      <span
        className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${className}`}
        title={title || name || username || "프로필로 이동"}
      >
        {name || username || "사용자"}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!username}
      className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${className}`}
      title={title || name || username || "프로필로 이동"}
    >
      {name || username || "사용자"}
    </button>
  );
}
