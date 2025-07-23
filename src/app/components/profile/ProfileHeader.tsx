import { Settings, Calendar, ChevronDown } from "lucide-react";
import { UserProfile } from "@/lib/api/profile";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useFollowStatus, useFollowActions } from "@/hooks/useFollow";
import { useState } from "react";

interface ProfileHeaderProps {
  profile: UserProfile | undefined;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { data: session } = useSession();
  const params = useParams();
  const isMyProfile = session?.user?.username === params?.username;
  const [showDropdown, setShowDropdown] = useState(false);

  // 팔로우 상태와 액션 (다른 사람 프로필일 때만)
  const { followStatus, mutate: mutateFollowStatus } = useFollowStatus(
    !isMyProfile && profile?.id ? profile.id : null
  );

  const { toggleFollow, toggleFavorite, toggleBlock, isLoading } =
    useFollowActions(profile?.id || "", () => {
      mutateFollowStatus(); // 팔로우 상태 새로고침
      setShowDropdown(false); // 드롭다운 닫기
    });

  const handleFollowClick = async () => {
    try {
      await toggleFollow();
    } catch (error) {
      console.error("팔로우 처리 실패:", error);
    }
  };

  const handleFavoriteClick = async () => {
    try {
      await toggleFavorite();
    } catch (error) {
      console.error("친한친구 처리 실패:", error);
    }
  };

  const handleBlockClick = async () => {
    if (confirm("정말로 이 사용자를 차단하시겠습니까?")) {
      try {
        await toggleBlock();
      } catch (error) {
        console.error("차단 처리 실패:", error);
      }
    }
  };

  const handleUnfollowClick = async () => {
    if (confirm("정말로 팔로우를 취소하시겠습니까?")) {
      try {
        await toggleFollow();
      } catch (error) {
        console.error("언팔로우 처리 실패:", error);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img
            src={
              profile?.profileImage ||
              "https://via.placeholder.com/80x80/cccccc/666666?text=?"
            }
            alt={profile?.username || "프로필"}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile?.nickname || "사용자"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              @{profile?.username || "username"}
            </p>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center space-x-2">
          {isMyProfile ? (
            // 내 프로필: 편집 버튼
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Settings size={16} />
              <span className="text-gray-700 dark:text-gray-300">편집</span>
            </button>
          ) : (
            // 다른 사람 프로필: 팔로우 관련 버튼
            <>
              {followStatus?.isFollowing ? (
                // 팔로잉 상태: 팔로잉 버튼 + 드롭다운
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      팔로잉
                    </span>
                    <ChevronDown
                      size={16}
                      className="text-gray-700 dark:text-gray-300"
                    />
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <button
                        onClick={handleFavoriteClick}
                        disabled={isLoading}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        {followStatus?.isFavorite
                          ? "친한친구에서 제거"
                          : "친한친구 리스트에 추가"}
                      </button>
                      <button
                        onClick={handleBlockClick}
                        disabled={isLoading}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        차단하기
                      </button>
                      <button
                        onClick={handleUnfollowClick}
                        disabled={isLoading}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        팔로우 취소
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // 팔로우하지 않은 상태: 팔로우 버튼
                <button
                  onClick={handleFollowClick}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "처리 중..." : "팔로우"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 프로필 정보 */}
      <div className="mb-4">
        <p className="text-gray-900 dark:text-white mb-3">
          {profile?.bio || "자기소개가 없습니다."}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Calendar size={16} />
            <span>
              {profile?.createdAt
                ? new Date(profile.createdAt).getFullYear() + "년에 가입"
                : "가입일 정보 없음"}
            </span>
          </div>
        </div>
      </div>

      {/* 팔로워/팔로잉 통계 */}
      <div className="flex items-center space-x-6">
        <div>
          <span className="font-bold text-gray-900 dark:text-white">
            {profile?.postsCount?.toLocaleString() || "0"}
          </span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">게시물</span>
        </div>
        <div>
          <span className="font-bold text-gray-900 dark:text-white">
            {profile?.followersCount?.toLocaleString() || "0"}
          </span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">팔로워</span>
        </div>
        <div>
          <span className="font-bold text-gray-900 dark:text-white">
            {profile?.followingCount?.toLocaleString() || "0"}
          </span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">팔로잉</span>
        </div>
      </div>

      {/* 드롭다운 닫기용 오버레이 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
