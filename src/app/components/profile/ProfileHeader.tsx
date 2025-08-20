"use client";

import { Settings } from "lucide-react";
import { UserProfile } from "@/lib/api/profile";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import ProfileActions from "./profileHeader/ProfileActions";
import ProfileIdentity from "./profileHeader/ProfileIdentity";
import ProfileBio from "./profileHeader/ProfileBio";
import ProfileMeta from "./profileHeader/ProfileMeta";
import ProfileStats from "./profileHeader/ProfileStats";
import FollowListModal from "../modal/followModal/FollowListModal";
import { useState } from "react";

interface ProfileHeaderProps {
  profile: UserProfile | undefined;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const isMyProfile = session?.user?.username === params?.username;
  const [isFollowersOpen, setFollowersOpen] = useState(false);
  const [isFollowingOpen, setFollowingOpen] = useState(false);

  // 설정 페이지로 이동하는 함수
  const handleSettingsClick = () => {
    router.push("/settings");
  };

  // 액션 관련 로직은 ProfileActions로 분리

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <ProfileIdentity
          avatarUrl={
            profile?.profileImage ||
            "https://via.placeholder.com/80x80/cccccc/666666?text=?"
          }
          nickname={profile?.nickname || "사용자"}
          username={profile?.username || "username"}
        />

        {/* 버튼 영역 */}
        <div className="flex items-center space-x-2">
          {isMyProfile ? (
            <button
              onClick={handleSettingsClick}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings size={16} />
              <span className="text-gray-700 dark:text-gray-300">편집</span>
            </button>
          ) : (
            <ProfileActions profileId={profile?.id || ""} isMyProfile={false} />
          )}
        </div>
      </div>

      {/* 프로필 정보 */}
      <div className="mb-4">
        <ProfileBio bio={profile?.bio} />
        <ProfileMeta createdAt={profile?.createdAt as any} />
      </div>

      {/* 팔로워/팔로잉 통계 */}
      <ProfileStats
        postsCount={profile?.postsCount || 0}
        followersCount={profile?.followersCount || 0}
        followingCount={profile?.followingCount || 0}
        onFollowersClick={() => setFollowersOpen(true)}
        onFollowingClick={() => setFollowingOpen(true)}
      />

      {/* 드롭다운은 ProfileActions 내부에서 제어 */}
      <FollowListModal
        isOpen={isFollowersOpen}
        onClose={() => setFollowersOpen(false)}
        userId={profile?.id || ""}
        type="followers"
      />
      <FollowListModal
        isOpen={isFollowingOpen}
        onClose={() => setFollowingOpen(false)}
        userId={profile?.id || ""}
        type="following"
      />
    </div>
  );
}
