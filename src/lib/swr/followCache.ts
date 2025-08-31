import { mutate } from "swr";

// 프로필 관련 캐시 키 매처: 프로필 상세/내 프로필 키에 일괄 적용
const isProfileKey = (key: any) =>
  typeof key === "string" &&
  (key.includes("/profile/username/") || key.includes("/profile/me"));

// 내 프로필 캐시 키 매처
const isMyProfileKey = (key: any) =>
  typeof key === "string" && key.includes("/profile/me");

// 특정 사용자명 프로필 캐시 키 매처
const isSpecificUserProfileKey = (username: string) => (key: any) =>
  typeof key === "string" && key.includes(`/profile/username/${username}`);

// 팔로우 상태 키 매처
const isFollowStatusKey = (targetUserId: string) => (key: any) =>
  typeof key === "string" && key.includes(`/follow/status/${targetUserId}`);

// 내 팔로잉 수 낙관적 증감 적용 (내가 다른 사람을 팔로우/언팔로우할 때)
export function updateMyFollowingCountOptimistic(
  isCurrentlyFollowing: boolean
) {
  const delta = isCurrentlyFollowing ? -1 : 1;
  console.log(`🔄 내 팔로잉 수 업데이트: ${delta > 0 ? "+" : ""}${delta}`);

  mutate(
    isMyProfileKey,
    (data: any) => {
      if (!data?.data) return data;
      const currentCount = Number(data.data.followingCount || 0);
      const newCount = Math.max(0, currentCount + delta);
      console.log(`📊 내 팔로잉 수: ${currentCount} → ${newCount}`);

      return {
        ...data,
        data: {
          ...data.data,
          followingCount: newCount,
        },
      };
    },
    { revalidate: false }
  );
}

// 대상 사용자의 팔로워 수 낙관적 증감 적용 (내가 해당 사용자를 팔로우/언팔로우할 때)
export function updateTargetUserFollowersCountOptimistic(
  targetUsername: string,
  isCurrentlyFollowing: boolean
) {
  const delta = isCurrentlyFollowing ? -1 : 1;
  console.log(
    `🔄 ${targetUsername}의 팔로워 수 업데이트: ${delta > 0 ? "+" : ""}${delta}`
  );

  mutate(
    isSpecificUserProfileKey(targetUsername),
    (data: any) => {
      if (!data?.data) return data;
      const currentCount = Number(data.data.followersCount || 0);
      const newCount = Math.max(0, currentCount + delta);
      console.log(
        `📊 ${targetUsername}의 팔로워 수: ${currentCount} → ${newCount}`
      );

      return {
        ...data,
        data: {
          ...data.data,
          followersCount: newCount,
        },
      };
    },
    { revalidate: false }
  );
}

// 팔로우 상태 낙관적 토글 적용
export function updateFollowStatusOptimistic(
  targetUserId: string,
  newIsFollowing: boolean,
  newIsPending?: boolean
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
          isPending: newIsPending !== undefined ? newIsPending : false,
        },
      };
    },
    { revalidate: false }
  );
}

// 한 번에 낙관적 업데이트 적용
export function optimisticToggleFollowCaches(
  targetUserId: string,
  targetUsername: string,
  isCurrentlyFollowing: boolean
) {
  // 내 프로필의 팔로잉 수 업데이트
  updateMyFollowingCountOptimistic(isCurrentlyFollowing);

  // 대상 사용자 프로필의 팔로워 수 업데이트
  updateTargetUserFollowersCountOptimistic(
    targetUsername,
    isCurrentlyFollowing
  );

  // 팔로우 상태 업데이트
  updateFollowStatusOptimistic(targetUserId, !isCurrentlyFollowing);
}

// 실패 시 롤백: 해당 키들 재검증
export function rollbackFollowCaches(targetUserId: string) {
  mutate((key) => isProfileKey(key), undefined, { revalidate: true });
  mutate(isFollowStatusKey(targetUserId), undefined, { revalidate: true });
}
