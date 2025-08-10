import { mutate } from "swr";

// useSWRInfinite 키 패턴: ["comments", postId, page, limit]
export function updateCommentsForPost(
  postId: string,
  commentId: string,
  liked: boolean,
  count: number
) {
  mutate(
    (key) => Array.isArray(key) && key[0] === "comments" && key[1] === postId,
    (pages: any[] | undefined) => {
      if (!Array.isArray(pages)) return pages as any;
      return pages.map((page) => {
        if (!page?.data) return page;
        const updated = page.data.map((c: any) =>
          c.id === commentId ? { ...c, is_liked: liked, like_count: count } : c
        );
        return { ...page, data: updated };
      });
    },
    { revalidate: false }
  );
}

export function rollbackCommentsForPost(postId: string) {
  mutate(
    (key) => Array.isArray(key) && key[0] === "comments" && key[1] === postId,
    undefined,
    true
  );
}
