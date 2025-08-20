import { MessageCircle } from "lucide-react";
import { ApiPost } from "@/types/post";
import { SWRInfiniteKeyedMutator } from "swr/infinite";
import LikeButton from "@/app/components/common/LikeButton";
import { usePost } from "@/hooks/usePosts";
import ViewCount from "@/app/components/common/ViewCount";

interface PostGridCardProps {
  post: ApiPost;
  onClick: (post: ApiPost) => void;
  mutateUserPosts?: SWRInfiniteKeyedMutator<any>;
}

export default function PostGridCard({
  post,
  onClick,
  mutateUserPosts,
}: PostGridCardProps) {
  // 단건 게시글 SWR 구독으로 최신 데이터 병합 (낙관적 업데이트 반영)
  const { post: livePost } = usePost(post.id);
  const p: ApiPost = (
    livePost ? { ...(post as any), ...(livePost as any) } : post
  ) as ApiPost;
  return (
    <div
      onClick={() => onClick(p)}
      className="bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:shadow-md transition-shadow overflow-hidden h-80 flex flex-col"
    >
      {/* 이미지 미리보기 (위쪽) */}
      {p.images && p.images.length > 0 ? (
        <div className="relative flex-shrink-0">
          <img
            src={p.images[0].image_url}
            alt="게시물 이미지"
            className="w-full h-48 object-cover"
          />
          {p.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              +{p.images.length - 1}
            </div>
          )}
        </div>
      ) : (
        /* 이미지가 없는 경우 텍스트만 있는 카드 */
        <div className="h-48 bg-gray-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
          <div className="text-gray-400 dark:text-gray-500 text-center">
            <div className="text-4xl mb-2">🖼️</div>
            <div className="text-sm">사진 없음</div>
          </div>
        </div>
      )}

      {/* 게시물 내용 (아래쪽) */}
      <div className="p-4 flex-1 flex flex-col">
        {/* 작성자 닉네임 */}
        {p.author && (
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-2 truncate">
            {p.author.nickname || p.author.username}
          </div>
        )}
        {/* 게시물 내용 미리보기 */}
        <p className="text-gray-900 dark:text-white text-sm mb-3 flex-1 overflow-hidden whitespace-pre-wrap">
          <span className="block line-clamp-1">{p.content}</span>
        </p>

        {/* 게시물 메타 정보 */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>{new Date(p.created_at).toLocaleDateString("ko-KR")}</span>
          <div className="flex items-center space-x-3">
            {/* 좋아요 버튼 */}
            <div onClick={(e) => e.stopPropagation()}>
              <LikeButton
                postId={String(p.id)}
                initialLiked={p.is_liked ?? false}
                initialCount={p.like_count ?? 0}
                mutateUserPosts={mutateUserPosts}
                size={12}
              />
            </div>

            {/* 댓글 버튼 */}
            <div className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle size={12} />
              <span>{p.comment_count ?? 0}</span>
            </div>

            {p.view_count !== undefined && (
              <ViewCount count={p.view_count} iconSize={12} />
            )}
          </div>
        </div>

        {/* 해시태그 표시 */}
        {p.hashtags && p.hashtags.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1">
              {p.hashtags.slice(0, 3).map((hashtag) => (
                <span
                  key={hashtag.id}
                  className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 max-w-12 overflow-hidden"
                  title={hashtag.tag}
                >
                  <span className="block truncate">#{hashtag.tag}</span>
                </span>
              ))}
              {p.hashtags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{p.hashtags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 공개 범위 표시 */}
        <div className="mt-auto">
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {p.visibility === "public"
              ? "전체 공개"
              : p.visibility === "followers"
              ? "팔로워만"
              : "비공개"}
          </span>
        </div>
      </div>
    </div>
  );
}
