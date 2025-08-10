"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface ContentWithMentionsProps {
  text: string;
  className?: string;
  insideButton?: boolean; // 부모가 button일 때 중첩 button 방지
}

export default function ContentWithMentions({
  text,
  className = "",
  insideButton = false,
}: ContentWithMentionsProps) {
  const router = useRouter();
  const nodes: React.ReactNode[] = [];

  // @username 또는 @닉네임 패턴
  const mentionRegex = /@([A-Za-z0-9._가-힣]{1,20})/g;
  let lastIndex = 0;

  const pushText = (str: string) => {
    if (!str) return;
    const parts = str.split("\n");
    parts.forEach((part, idx) => {
      nodes.push(part);
      if (idx < parts.length - 1) nodes.push(<br key={`br-${nodes.length}`} />);
    });
  };

  for (const match of text.matchAll(mentionRegex)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const username = match[1];

    // 일반 텍스트 추가
    if (start > lastIndex) pushText(text.slice(lastIndex, start));

    // 멘션 추가 (파란색, 클릭 이동)
    if (insideButton) {
      nodes.push(
        <span
          key={`m-${start}-${username}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/profile/${username}`);
          }}
          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          @{username}
        </span>
      );
    } else {
      nodes.push(
        <button
          key={`m-${start}-${username}`}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/profile/${username}`);
          }}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          @{username}
        </button>
      );
    }

    lastIndex = end;
  }

  // 남은 텍스트 추가
  if (lastIndex < text.length) pushText(text.slice(lastIndex));

  return <span className={className}>{nodes}</span>;
}
