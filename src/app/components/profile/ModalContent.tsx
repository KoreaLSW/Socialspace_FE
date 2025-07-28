import { Heart, MessageCircle, Share, Bookmark } from "lucide-react";
import { ApiPost } from "@/types/post";

interface User {
  id?: string;
  email?: string;
  username?: string;
  nickname?: string;
  profileImage?: string;
}

interface ModalContentProps {
  post: ApiPost;
  user: User | null;
}

export default function ModalContent({ post, user }: ModalContentProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* 게시물 텍스트 */}
      <div className="mb-4">
        <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-sm">
          {post.content}
        </p>
      </div>

      {/* 해시태그 표시 */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((hashtag) => (
              <span
                key={hashtag.id}
                className="text-sm px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
              >
                #{hashtag.tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 게시물 메타 정보 */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        {new Date(post.created_at).toLocaleDateString("ko-KR")}
      </div>

      {/* 상호작용 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-red-500 transition-colors">
            <Heart size={24} />
          </button>
          <button className="text-gray-500 hover:text-gray-700 transition-colors">
            <MessageCircle size={24} />
          </button>
          <button className="text-gray-500 hover:text-gray-700 transition-colors">
            <Share size={24} />
          </button>
        </div>
        <button className="text-gray-500 hover:text-gray-700 transition-colors">
          <Bookmark size={24} />
        </button>
      </div>

      {/* 좋아요 수 */}
      <div className="mb-4">
        <p className="font-semibold text-gray-900 dark:text-white text-sm">
          좋아요 {post.like_count || 0}개
        </p>
      </div>

      {/* 댓글 섹션 */}
      <div className="space-y-3">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          댓글이 없습니다.
        </div>
      </div>
    </div>
  );
}
