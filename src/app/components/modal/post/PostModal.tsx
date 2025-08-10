import { useEffect, useState } from "react";
import ModalImageSection from "./ModalImageSection";
import ModalHeader from "./ModalHeader";
import ModalContent from "./ModalContent";
import ModalCommentInput from "./ModalCommentInput";
import { ApiPost, Comment as UiComment } from "@/types/post";
import { useComments } from "@/hooks/useComments";
import { useSession } from "next-auth/react";
import { SWRInfiniteKeyedMutator } from "swr/infinite";
import { InfinitePostsMutateFunction } from "@/hooks/usePosts";
import * as commentsApi from "@/lib/api/comments";

interface PostModalProps {
  post: ApiPost;
  isOpen: boolean;
  onClose: () => void;
  initialImageIndex?: number;
  mutatePosts?: InfinitePostsMutateFunction;
  mutateUserPosts?: SWRInfiniteKeyedMutator<any>;
}

export default function PostModal({
  post,
  isOpen,
  onClose,
  initialImageIndex = 0,
  mutatePosts,
  mutateUserPosts,
}: PostModalProps) {
  const { data: session } = useSession();
  const {
    createComment,
    isLoading: commentLoading,
    mutateComments,
    size,
    setSize,
  } = useComments(post.id);

  const [pinnedComment, setPinnedComment] = useState<UiComment | null>(null);

  // 알림에서 전달된 특정 댓글로 스크롤 포커싱
  useEffect(() => {
    const anyPost: any = post as any;
    const highlightCommentId: string | undefined = anyPost.highlightCommentId;
    const preloaded = anyPost.highlightComment as UiComment | undefined;
    if (!highlightCommentId) return;

    const ensureVisible = async () => {
      try {
        // 알림 페이지에서 미리 받아온 댓글이 있으면 즉시 세팅
        if (preloaded) {
          setPinnedComment(preloaded);
        } else {
          // 없으면 단건 조회
          try {
            const single = await commentsApi.getCommentById(highlightCommentId);
            const commentData = single?.data as UiComment | undefined;
            if (commentData) setPinnedComment(commentData);
          } catch {}
        }

        // 댓글이 어느 페이지에 있는지 계산 후 필요한 만큼 더 로드
        const pageInfo = await commentsApi.getCommentPage(
          highlightCommentId,
          20
        );
        const targetPage = pageInfo?.data?.page || 1;
        // 현재 size가 targetPage보다 작다면 setSize 반복
        for (let i = size; i < targetPage; i++) {
          await setSize(i + 1);
        }
        // 상단 고정 영역 강조 효과
        requestAnimationFrame(() => {
          const el = document.getElementById(`comment-${highlightCommentId}`);
          if (el) {
            el.classList.add("ring-2", "ring-blue-400");
            setTimeout(
              () => el.classList.remove("ring-2", "ring-blue-400"),
              1600
            );
          }
        });
      } catch (e) {}
    };

    ensureVisible();
  }, [post]);

  // 모달이 열릴 때 배경 스크롤 방지 및 ESC 키 처리
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;

      // body 스크롤 비활성화
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      // ESC 키 처리
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        // 모달이 닫힐 때 스크롤 복원
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);

        // 이벤트 리스너 제거
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  // 게시물 작성자 정보 사용
  const postAuthor = post.author
    ? {
        id: post.author.id || "",
        username: post.author.username,
        nickname: post.author.nickname,
        profileImage: post.author.profileImage,
      }
    : null;

  // 현재 사용자 정보
  const currentUser = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
        nickname: session.user.nickname,
        profileImage: session.user.profileImage,
      }
    : null;

  // 댓글 작성 핸들러
  const handleCommentSubmit = async (content: string) => {
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }

    try {
      // 낙관적 업데이트: 즉시 UI에 댓글 표시
      const optimisticComment = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        post_id: post.id,
        user_id: currentUser.id!,
        content,
        is_edited: false,
        created_at: new Date().toISOString(),
        author: {
          id: currentUser.id!,
          username: currentUser.username || "",
          nickname: currentUser.nickname || currentUser.username || "사용자",
          profileImage: currentUser.profileImage,
        },
        like_count: 0,
        is_liked: false,
      };

      // 댓글 목록에 즉시 추가 (낙관적 업데이트)
      mutateComments((current: any) => {
        if (!current?.data) return current;
        return {
          ...current,
          data: [...(current.data || []), optimisticComment],
        };
      }, false);

      // 게시글 목록 캐시에도 낙관적 댓글 수 증가 반영 (프로필 그리드 / 전체 피드)
      const incrementCount = (pages: any[] | undefined) => {
        if (!Array.isArray(pages)) return pages as any;
        return pages.map((page: any) => {
          if (!page?.data || !Array.isArray(page.data)) return page;
          const updatedData = page.data.map((p: any) => {
            if (!p || p.id !== post.id) return p;
            return { ...p, comment_count: (p.comment_count || 0) + 1 };
          });
          return { ...page, data: updatedData };
        });
      };

      // 사용자 게시글(프로필 탭) 무한스크롤 캐시 갱신
      if (mutateUserPosts) {
        await mutateUserPosts((current: any) => incrementCount(current), false);
      }
      // 전체 피드 무한스크롤 캐시 갱신
      if (mutatePosts) {
        await mutatePosts((current: any) => incrementCount(current), false);
      }

      // 실제 API 호출
      await createComment(content);
    } catch (error) {
      console.error("댓글 작성 실패:", error);
      // 에러 발생 시 댓글 목록 새로고침
      mutateComments();
      // 실패 시 낙관적 증가 되돌리기
      const decrementCount = (pages: any[] | undefined) => {
        if (!Array.isArray(pages)) return pages as any;
        return pages.map((page: any) => {
          if (!page?.data || !Array.isArray(page.data)) return page;
          const updatedData = page.data.map((p: any) => {
            if (!p || p.id !== post.id) return p;
            const next = (p.comment_count || 0) - 1;
            return { ...p, comment_count: next > 0 ? next : 0 };
          });
          return { ...page, data: updatedData };
        });
      };
      if (mutateUserPosts) {
        await mutateUserPosts((current: any) => decrementCount(current), false);
      }
      if (mutatePosts) {
        await mutatePosts((current: any) => decrementCount(current), false);
      }
      throw error;
    }
  };

  if (!isOpen) return null;

  // 배경 클릭 시 모달 닫기
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div
        className={`bg-white dark:bg-gray-800 h-[90vh] flex ${
          post.images && post.images.length > 0
            ? "w-full max-w-4xl"
            : "w-full max-w-lg"
        }`}
      >
        {/* 왼쪽: 이미지 영역 (이미지가 있을 때만 표시) */}
        <ModalImageSection post={post} initialImageIndex={initialImageIndex} />

        {/* 오른쪽: 상세 정보 패널 */}
        <div
          className={`flex flex-col ${
            post.images && post.images.length > 0
              ? "w-96 border-l border-gray-200 dark:border-gray-700"
              : "w-full"
          }`}
        >
          {/* 헤더 */}
          <ModalHeader
            user={postAuthor}
            onClose={onClose}
            commentCount={post.comment_count}
          />

          {/* 게시물 내용 */}
          <ModalContent
            post={post}
            user={postAuthor}
            mutatePosts={mutatePosts}
            mutateUserPosts={mutateUserPosts}
            pinnedComment={pinnedComment as any}
          />

          {/* 댓글 입력 */}
          <ModalCommentInput
            user={currentUser}
            postId={post.id}
            onCommentSubmit={handleCommentSubmit}
            isLoading={commentLoading}
          />
        </div>
      </div>
    </div>
  );
}
