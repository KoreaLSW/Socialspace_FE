import ModalImageSection from "./ModalImageSection";
import ModalHeader from "./ModalHeader";
import ModalContent from "./ModalContent";
import ModalCommentInput from "./ModalCommentInput";
import { ApiPost } from "@/types/post";

interface PostModalProps {
  post: ApiPost;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostModal({ post, isOpen, onClose }: PostModalProps) {
  // 게시물 작성자 정보 사용
  const postAuthor = post.author
    ? {
        id: post.author.id || "",
        username: post.author.nickname,
        nickname: post.author.nickname,
        profileImage: post.author.profileImage,
      }
    : null;
  console.log("postAuthor:::", postAuthor);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div
        className={`bg-white dark:bg-gray-800 h-[90vh] flex ${
          post.images && post.images.length > 0
            ? "w-full max-w-4xl"
            : "w-full max-w-lg"
        }`}
      >
        {/* 왼쪽: 이미지 영역 (이미지가 있을 때만 표시) */}
        <ModalImageSection post={post} />

        {/* 오른쪽: 상세 정보 패널 */}
        <div
          className={`flex flex-col ${
            post.images && post.images.length > 0
              ? "w-96 border-l border-gray-200 dark:border-gray-700"
              : "w-full"
          }`}
        >
          {/* 헤더 */}
          <ModalHeader user={postAuthor} onClose={onClose} />

          {/* 게시물 내용 */}
          <ModalContent post={post} user={postAuthor} />

          {/* 댓글 입력 */}
          <ModalCommentInput user={postAuthor} />
        </div>
      </div>
    </div>
  );
}
