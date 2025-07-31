"use client";

import { useRecommendedUsers } from "@/hooks/useRecommendedUsers";
import UserList from "../components/common/UserList";

export default function RecommendedUsersPage() {
  const { recommendedUsers, isLoading, error } = useRecommendedUsers(30);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">추천 사용자</h1>
      {isLoading ? (
        <div className="text-center text-gray-400">로딩 중...</div>
      ) : error ? (
        <div className="text-center text-red-500">에러가 발생했습니다.</div>
      ) : recommendedUsers.length === 0 ? (
        <div className="text-center text-gray-400">추천 사용자가 없습니다.</div>
      ) : (
        <UserList users={recommendedUsers} showNickname />
      )}
    </div>
  );
}
