import { Settings, Calendar } from "lucide-react";
import { UserProfile } from "@/lib/api/profile";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

interface ProfileHeaderProps {
  profile: UserProfile | undefined;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { data: session } = useSession();
  const params = useParams();
  const isMyProfile = session?.user?.username === params?.username;

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
        {isMyProfile && (
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Settings size={16} />
            <span className="text-gray-700 dark:text-gray-300">편집</span>
          </button>
        )}
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
    </div>
  );
}
