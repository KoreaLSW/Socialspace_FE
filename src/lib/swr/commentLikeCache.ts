import { mutate } from "swr";

// 댓글 리스트 키: `/comments/post/${postId}` 형태 사용
export function updateCommentsForPost(
  postId: string,
  commentId: string,
  liked: boolean,
  count: number
) {
  mutate(
    `/comments/post/${postId}`,
    (current: any) => {
      if (!current?.data) return current;
      const updated = current.data.map((c: any) =>
        c.id === commentId
          ? {
              ...c,
              is_liked: liked,
              like_count: count,
            }
          : c
      );
      return { ...current, data: updated };
    },
    { revalidate: false }
  );
}

export function rollbackCommentsForPost(postId: string) {
  mutate(`/comments/post/${postId}`);
}
