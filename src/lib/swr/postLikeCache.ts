import { InfinitePostsResponse, UserPostsResponse } from "@/hooks/usePosts";

type AnyPost = any;

export function mapPostLike(post: AnyPost, liked: boolean, count: number) {
  return {
    ...post,
    is_liked: liked,
    like_count: count,
    // 일부 컴포넌트에서 참조하는 camelCase 필드도 동기화
    isLiked: liked,
    likes: count,
  };
}

export function updateInfinitePosts(
  postId: string,
  liked: boolean,
  count: number
) {
  return (pages: InfinitePostsResponse[]) => {
    if (!pages || !Array.isArray(pages)) return pages;
    return pages.map((page) => ({
      ...page,
      data: page.data.map((post) =>
        post.id === postId ? mapPostLike(post, liked, count) : post
      ),
    }));
  };
}

export function updateUserPosts(
  postId: string,
  liked: boolean,
  count: number,
  removeOnUnlike: boolean = false
) {
  return (pages: UserPostsResponse[]) => {
    if (!pages || !Array.isArray(pages)) return pages;
    return pages.map((page) => {
      if (!Array.isArray(page?.data)) return page;
      const mapped = page.data.map((post) =>
        post.id === postId ? mapPostLike(post, liked, count) : post
      );
      // 좋아요 취소해도 게시물은 유지 (removeOnUnlike 무시)
      return { ...page, data: mapped };
    });
  };
}
