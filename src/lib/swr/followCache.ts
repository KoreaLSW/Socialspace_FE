import { mutate } from "swr";

// 프로필 관련 캐시 키 매처: 프로필 상세/내 프로필 키에 일괄 적용
const isProfileKey = (key: any) =>
  typeof key === "string" &&
  (key.includes("/profile/username/") || key.includes("/profile/me"));

// 팔로우 상태 키 매처
const isFollowStatusKey = (targetUserId: string) => (key: any) =>
  typeof key === "string" && key.includes(`/follow/status/${targetUserId}`);

// followersCount 낙관적 증감 적용
export function updateProfileFollowersCountOptimistic(
  isCurrentlyFollowing: boolean
) {
  const delta = isCurrentlyFollowing ? -1 : 1;
  mutate(
    (key) => isProfileKey(key),
    (data: any) => {
      if (!data?.data) return data;
      const currentCount = Number(data.data.followersCount || 0);
      return {
        ...data,
        data: {
          ...data.data,
          followersCount: Math.max(0, currentCount + delta),
        },
      };
    },
    { revalidate: false }
  );
}

// 팔로우 상태 낙관적 토글 적용
export function updateFollowStatusOptimistic(
  targetUserId: string,
  newIsFollowing: boolean
) {
  mutate(
    isFollowStatusKey(targetUserId),
    (data: any) => {
      if (!data?.data) return data;
      return {
        ...data,
        data: {
          ...data.data,
          isFollowing: newIsFollowing,
        },
      };
    },
    { revalidate: false }
  );
}

// 한 번에 낙관적 업데이트 적용
export function optimisticToggleFollowCaches(
  targetUserId: string,
  isCurrentlyFollowing: boolean
) {
  updateProfileFollowersCountOptimistic(isCurrentlyFollowing);
  updateFollowStatusOptimistic(targetUserId, !isCurrentlyFollowing);
}

// 실패 시 롤백: 해당 키들 재검증
export function rollbackFollowCaches(targetUserId: string) {
  mutate((key) => isProfileKey(key), undefined, { revalidate: true });
  mutate(isFollowStatusKey(targetUserId), undefined, { revalidate: true });
}
