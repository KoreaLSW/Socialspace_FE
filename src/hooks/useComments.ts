import { useState } from "react";
import useSWR, { mutate } from "swr";
import * as commentsApi from "../lib/api/comments";

export function useComments(postId: string) {
  const [isLoading, setIsLoading] = useState(false);

  // 댓글 목록 조회
  const {
    data,
    error,
    mutate: mutateComments,
  } = useSWR(
    postId ? `/comments/post/${postId}` : null,
    () => commentsApi.getCommentsByPostId(postId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const comments = data?.data || [];

  // 댓글 생성
  const createComment = async (content: string, parentId?: string) => {
    setIsLoading(true);
    try {
      const commentData: commentsApi.CreateCommentData = {
        post_id: postId,
        content,
        parent_id: parentId,
      };

      // 게시글 목록의 댓글 수 즉시 증가 (낙관적 업데이트)
      mutate(
        (key) =>
          typeof key === "string" &&
          (key.includes("/posts") || key.startsWith("/posts")),
        (data: any) => {
          if (!data?.data) return data;

          // 게시물 목록인 경우
          if (Array.isArray(data.data)) {
            const updatedPosts = data.data.map((post: any) => {
              if (post.id === postId) {
                return {
                  ...post,
                  comment_count: (post.comment_count || 0) + 1,
                };
              }
              return post;
            });
            return { ...data, data: updatedPosts };
          }

          // 단일 게시물인 경우
          if (data.data.id === postId) {
            return {
              ...data,
              data: {
                ...data.data,
                comment_count: (data.data.comment_count || 0) + 1,
              },
            };
          }

          return data;
        },
        { revalidate: false }
      );

      const response = await commentsApi.createComment(commentData);

      if (response.success) {
        // 댓글 목록 갱신 (실제 데이터로)
        mutateComments();

        return response.data;
      } else {
        // 실패 시 게시글 목록 롤백
        mutate(
          (key) =>
            typeof key === "string" &&
            (key.includes("/posts") || key.startsWith("/posts")),
          undefined,
          { revalidate: true }
        );
        throw new Error(response.message || "댓글 작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("댓글 작성 오류:", error);

      // 에러 발생 시 게시글 목록 새로고침
      mutate(
        (key) =>
          typeof key === "string" &&
          (key.includes("/posts") || key.startsWith("/posts")),
        undefined,
        { revalidate: true }
      );

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("댓글 작성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 댓글 수정
  const updateComment = async (commentId: string, content: string) => {
    setIsLoading(true);
    try {
      const response = await commentsApi.updateComment(commentId, content);

      if (response.success) {
        mutateComments();
        return response.data;
      } else {
        throw new Error(response.message || "댓글 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("댓글 수정 오류:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("댓글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 댓글 삭제
  const deleteComment = async (commentId: string) => {
    setIsLoading(true);
    try {
      const response = await commentsApi.deleteComment(commentId);

      if (response.success) {
        mutateComments();

        // 게시글 목록의 댓글 수도 업데이트
        mutate(
          (key) => typeof key === "string" && key.includes("/posts"),
          undefined,
          { revalidate: true }
        );

        return true;
      } else {
        throw new Error(response.message || "댓글 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("댓글 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    comments,
    isLoading,
    error,
    createComment,
    updateComment,
    deleteComment,
    mutateComments,
  };
}
