import React, { memo } from "react";

function ProfileBio({ bio, className }: { bio?: string; className?: string }) {
  return (
    <p
      className={`text-gray-900 dark:text-white mb-3${
        className ? ` ${className}` : ""
      }`}
    >
      {bio || "자기소개가 없습니다."}
    </p>
  );
}

export default memo(ProfileBio);
