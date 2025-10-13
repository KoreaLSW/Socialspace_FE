import { useEffect, useState } from "react";
import ModalImageSection from "./ModalImageSection";
import ModalHeader from "./ModalHeader";
import ModalContent from "./ModalContent";
import ModalCommentInput from "./ModalCommentInput";
import { ApiPost, Comment as UiComment } from "@/types/post";
import { useComments } from "@/hooks/useComments";
import {
  optimisticReplyCreate,
  rollbackOptimisticReply,
  useReplies,
} from "@/hooks/useReplies";
import { useSession } from "next-auth/react";
import { SWRInfiniteKeyedMutator } from "swr/infinite";
import { InfinitePostsMutateFunction } from "@/hooks/usePosts";
import * as commentsApi from "@/lib/api/comments";
import { postsApi } from "@/lib/api/posts";
import ViewCount from "@/app/components/common/ViewCount";
import UserAvatar from "@/app/components/common/UserAvatar";
import UserNickName from "@/app/components/common/UserNickName";
import PostActions from "./PostActions";
import PostEditModal from "./PostEditModal";
import { usePostActions } from "@/hooks/usePostActions";
import { mutate } from "swr";
import { usePost } from "@/hooks/usePosts";

interface PostModalProps {
  post: ApiPost;
  isOpen: boolean;
  onClose: () => void;
  initialImageIndex?: number;
  mutatePosts?: InfinitePostsMutateFunction;
  mutateUserPosts?: SWRInfiniteKeyedMutator<any>;
  onViewCountUpdate?: (count: number) => void;
  onLikeChange?: (postId: string, isLiked: boolean, newCount: number) => void;
}

export default function PostModal({
  post,
  isOpen,
  onClose,
  initialImageIndex = 0,
  mutatePosts,
  mutateUserPosts,
  onViewCountUpdate,
  onLikeChange,
}: PostModalProps) {
  const { data: session } = useSession();
  const { deletePost, updatePost, isLoading: deleting } = usePostActions();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyContext, setReplyContext] = useState<{
    parentId?: string;
    replyToCommentId?: string;
    mentionUsername?: string;
  } | null>(null);
  const {
    createComment,
    mutateComments,
    size,
    setSize,
    optimisticCommentCreate,
    rollbackOptimisticComment,
  } = useComments(post.id);
  // useReplies는 항상 호출하되, parentId가 undefined일 때는 빈 객체 반환
  const { mutateReplies: repliesMutateReplies } = useReplies(
    replyContext?.parentId || ""
  );
  const mutateReplies = replyContext?.parentId
    ? repliesMutateReplies
    : undefined;

  const [pinnedComment, setPinnedComment] = useState<UiComment | null>(null);
  const [viewCount, setViewCount] = useState<number | undefined>(
    (post as any)?.view_count
  );

  // 최신 게시글 데이터 구독 (낙관적 업데이트 포함)
  const { post: livePost } = usePost(post.id);
  const effectivePost = (
    livePost ? { ...(post as any), ...(livePost as any) } : post
  ) as ApiPost;

  // 모달 오픈 시 상세 조회 호출(백엔드에서 조회 기록/조회수 반영)
  useEffect(() => {
    if (!isOpen) return;
    postsApi
      .getById(post.id)
      .then((resp: any) => {
        const next = resp?.data?.view_count;
        if (typeof next === "number") {
          setViewCount(next);
          onViewCountUpdate?.(next);
        }
      })
      .catch((error) => {
        // 404 에러는 차단된 게시물이거나 존재하지 않는 게시물
        // 조용히 처리 (에러 로그만 출력)
        if (error.response?.status === 404) {
          console.log("게시물을 찾을 수 없습니다 (차단되었거나 삭제됨)");
        }
      });
  }, [isOpen, post.id]);

  // 알림에서 전달된 특정 댓글로 스크롤 포커싱
  const highlightCommentId: string | undefined = (post as any)
    .highlightCommentId;
  const preloaded: UiComment | undefined = (post as any).highlightComment as
    | UiComment
    | undefined;
  useEffect(() => {
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
  }, [highlightCommentId, post.id]);

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

  // 게시물 작성자 정보 사용 (최신 데이터 기준)
  const postAuthor = effectivePost.author
    ? {
        id: effectivePost.author.id || "",
        username: effectivePost.author.username,
        nickname: effectivePost.author.nickname,
        profileImage: effectivePost.author.profileImage,
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

  // 게시글 작성자와 현재 사용자가 같은지 확인
  const isAuthor = currentUser?.username === effectivePost.author?.username;

  // 댓글 작성 핸들러
  const handleCommentSubmit = async (content: string) => {
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }

    try {
      // 낙관적 업데이트 적용
      await optimisticCommentCreate(
        content,
        currentUser,
        mutatePosts,
        mutateUserPosts
      );

      // 실제 API 호출
      const response = await createComment(content);

      // 댓글 목록 새로고침
      mutateComments();

      // replyContext 초기화
      setReplyContext(null);
    } catch (error) {
      console.error("댓글 작성 실패:", error);

      // 에러 발생 시 낙관적 업데이트 롤백
      await rollbackOptimisticComment(mutatePosts, mutateUserPosts);

      throw error;
    }
  };

  // 게시글 삭제 핸들러
  const handleDeletePost = async () => {
    const confirmed = confirm(
      "정말 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다."
    );
    if (!confirmed) return;
    try {
      await deletePost(post.id);

      // 1) 현재 모달에 주입된 무한스크롤 피드 캐시에서 해당 게시글 제거
      const removeFromPages = (pages: any[] | undefined) => {
        if (!Array.isArray(pages)) return pages as any;
        return pages.map((page: any) => {
          if (!page?.data) return page;
          const filtered = (page.data as any[]).filter(
            (p) => p?.id !== post.id
          );
          return { ...page, data: filtered };
        });
      };
      if (mutatePosts) {
        await mutatePosts((current: any) => removeFromPages(current), false);
      }
      if (mutateUserPosts) {
        await mutateUserPosts(
          (current: any) => removeFromPages(current),
          false
        );
      }

      alert("게시글이 삭제되었습니다.");

      onClose();
    } catch (error) {
      console.error("게시글 삭제 실패", error);
      alert(
        error instanceof Error
          ? error.message
          : "게시글 삭제 중 오류가 발생했습니다."
      );
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
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 sm:p-6 lg:p-8"
      onClick={handleBackgroundClick}
    >
      <div
        className={`bg-white dark:bg-gray-800 h-[90vh] max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] lg:max-h-[calc(100vh-4rem)] flex flex-col lg:flex-row rounded-lg ${
          effectivePost.images && effectivePost.images.length > 0
            ? "w-full max-w-4xl"
            : "w-full max-w-lg"
        }`}
      >
        {/* 상단/왼쪽: 이미지 영역 (이미지가 있을 때만 표시) */}
        {effectivePost.images && effectivePost.images.length > 0 && (
          <ModalImageSection
            post={effectivePost}
            initialImageIndex={initialImageIndex}
          />
        )}

        {/* 하단/오른쪽: 상세 정보 패널 */}
        <div
          className={`flex flex-col flex-1 min-h-0 ${
            effectivePost.images && effectivePost.images.length > 0
              ? "lg:w-96 lg:border-l border-t lg:border-t-0 border-gray-200 dark:border-gray-700"
              : "w-full"
          }`}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <UserAvatar
                src={postAuthor?.profileImage}
                alt={postAuthor?.username}
                size={32}
                profileUsername={postAuthor?.username}
                className="hover:opacity-80 transition-opacity"
              />
              <div>
                <UserNickName
                  username={postAuthor?.username}
                  name={postAuthor?.nickname}
                  className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm sm:text-base"
                />
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {effectivePost.is_edited && effectivePost.updated_at
                    ? `${new Date(effectivePost.updated_at).toLocaleDateString(
                        "ko-KR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )} (수정됨)`
                    : new Date(effectivePost.created_at).toLocaleDateString(
                        "ko-KR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                </p>
              </div>
            </div>

            {/* 게시글 액션 (수정/삭제) */}
            <PostActions
              isAuthor={isAuthor}
              onEdit={() => {
                setIsEditOpen(true);
              }}
              onDelete={handleDeletePost}
            />

            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 조회수 표시 (서버에서 hide_views면 미포함됨) */}
          <ViewCount
            count={viewCount}
            className="px-3 sm:px-4 pt-1 pb-1 text-xs"
          />

          {/* 게시물 내용 */}
          <div className="flex-1 min-h-0 flex flex-col">
            <ModalContent
              post={effectivePost}
              user={postAuthor}
              mutatePosts={mutatePosts}
              mutateUserPosts={mutateUserPosts}
              pinnedComment={pinnedComment as any}
              replyContext={replyContext}
              setReplyContext={setReplyContext}
              currentUserId={currentUser?.id}
              onLikeChange={onLikeChange}
            />
          </div>

          {/* 댓글 입력 - 하단 고정 */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative z-10">
            <ModalCommentInput
              user={currentUser}
              postId={effectivePost.id}
              onCommentSubmit={handleCommentSubmit}
              isLoading={commentLoading}
              replyContext={replyContext}
              onReplySubmit={async (content: string) => {
                if (replyContext?.replyToCommentId) {
                  try {
                    setCommentLoading(true);

                    // 낙관적 업데이트 적용
                    if (mutateReplies) {
                      await optimisticReplyCreate(
                        content,
                        currentUser,
                        replyContext.parentId!,
                        replyContext.replyToCommentId,
                        effectivePost.id,
                        mutateComments,
                        mutateReplies
                      );
                    }

                    // 실제 API 호출
                    await commentsApi.createComment({
                      content,
                      post_id: effectivePost.id,
                      parent_id: replyContext.parentId,
                      reply_to_comment_id: replyContext.replyToCommentId,
                    });

                    // 댓글/대댓글 캐시 재검증
                    if (mutateReplies) {
                      await mutateReplies(undefined, true);
                    }
                    await mutateComments();

                    // replyContext 초기화
                    setReplyContext(null);
                  } catch (error) {
                    console.error("대댓글 작성 실패:", error);

                    // 에러 발생 시 낙관적 업데이트 롤백
                    if (mutateReplies) {
                      await rollbackOptimisticReply(
                        replyContext.parentId!,
                        effectivePost.id,
                        mutateComments,
                        mutateReplies
                      );
                    }
                  } finally {
                    setCommentLoading(false);
                  }
                }
              }}
              onCancelReply={() => setReplyContext(null)}
            />
          </div>
        </div>
      </div>
      {/* 수정 모달 */}
      <PostEditModal
        isOpen={isEditOpen}
        post={effectivePost}
        onClose={() => setIsEditOpen(false)}
        onSubmit={async (payload) => {
          await updatePost(effectivePost.id, payload as any);
          setIsEditOpen(false);
        }}
      />
    </div>
  );
}
