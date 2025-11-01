"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import { useHashtagPosts } from "@/hooks/usePosts";
import PostList from "../../components/home/PostList";
import { expressApi } from "@/lib/api/config";

export default function TagPage() {
  const params = useParams();
  const router = useRouter();
  // URL 파라미터를 안전하게 디코딩 (한글 태그명 처리)
  const tagName = useMemo(() => {
    const tag = params.tag;
    if (!tag || Array.isArray(tag)) return "";
    try {
      // Next.js가 자동으로 디코딩하지 않는 경우를 대비해 명시적으로 디코딩
      // 인코딩된 문자가 있으면 디코딩, 없으면 그대로 사용
      const decoded = decodeURIComponent(tag);
      return decoded;
    } catch (error) {
      // 디코딩 실패 시 원본 반환 (이미 디코딩된 경우)
      return typeof tag === "string" ? tag : "";
    }
  }, [params.tag]);
  const [hashtagId, setHashtagId] = useState<string | null>(null);
  const [hashtagInfo, setHashtagInfo] = useState<{
    id: string;
    name: string;
    post_count: number;
  } | null>(null);
  const [isLoadingHashtag, setIsLoadingHashtag] = useState(true);

  // 태그 이름으로 해시태그 정보 조회
  useEffect(() => {
    const fetchHashtagInfo = async () => {
      if (!tagName) {
        setIsLoadingHashtag(false);
        return;
      }

      try {
        setIsLoadingHashtag(true);
        // 해시태그 검색 API 호출 (태그명을 인코딩하여 전달)
        const response = await expressApi.get(
          `/posts/hashtags/search?q=${encodeURIComponent(tagName)}&limit=1`
        );

        if (response.data?.data && response.data.data.length > 0) {
          const hashtag = response.data.data[0];
          // 태그 이름이 정확히 일치하는지 확인
          if (hashtag.name.toLowerCase() === tagName.toLowerCase()) {
            setHashtagInfo(hashtag);
            setHashtagId(hashtag.id);
          } else {
            // 일치하는 해시태그가 없음
            setHashtagInfo(null);
            setHashtagId(null);
          }
        } else {
          setHashtagInfo(null);
          setHashtagId(null);
        }
      } catch (error) {
        console.error("해시태그 조회 실패:", error);
        setHashtagInfo(null);
        setHashtagId(null);
      } finally {
        setIsLoadingHashtag(false);
      }
    };

    fetchHashtagInfo();
  }, [tagName]);

  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const { posts, isLoading, totalPages } = useHashtagPosts(
    hashtagId || "",
    page,
    10
  );

  // ApiPost를 Post 형식으로 변환
  const convertToPostFormat = (apiPost: any) => ({
    id: apiPost.id,
    // 백엔드에서 평면 구조로 반환하므로 author 객체 또는 직접 속성 확인
    username: apiPost.author?.username || apiPost.username || "익명",
    nickname:
      apiPost.author?.nickname ||
      apiPost.nickname ||
      apiPost.author?.username ||
      apiPost.username ||
      "익명",
    avatar:
      apiPost.author?.profileImage ||
      apiPost.profile_image ||
      "/default-avatar.png",
    time: apiPost.created_at,
    updatedAt: apiPost.updated_at,
    isEdited: apiPost.is_edited === true,
    visibility: apiPost.visibility,
    content: apiPost.content,
    image: apiPost.images?.map((img: any) => img.image_url) || [],
    likes: apiPost.like_count || 0,
    comments: apiPost.comment_count || 0,
    hashtags: apiPost.hashtags?.map((h: any) => h.tag) || [],
    isLiked: apiPost.is_liked || false,
    viewCount: apiPost.view_count,
    hideLikes: apiPost.hide_likes,
    hideViews: apiPost.hide_views,
    allowComments: apiPost.allow_comments,
  });

  // 페이지가 변경되면 게시물 추가 (useRef로 이전 값 추적)
  const prevPostsRef = useRef<any[]>([]);
  const prevPageRef = useRef<number>(1);

  // 해시태그가 변경되면 초기화
  useEffect(() => {
    setAllPosts([]);
    setPage(1);
    prevPostsRef.current = [];
    prevPageRef.current = 1;
  }, [hashtagId]);

  useEffect(() => {
    // hashtagId가 없으면 아무것도 하지 않음
    if (!hashtagId) {
      prevPostsRef.current = [];
      prevPageRef.current = 1;
      return;
    }

    // posts가 유효하지 않으면 리턴
    if (!posts || !Array.isArray(posts)) {
      return;
    }

    // 같은 posts와 page면 업데이트하지 않음 (무한 루프 방지)
    const postsChanged =
      prevPostsRef.current.length !== posts.length ||
      prevPostsRef.current.some((prev, idx) => prev?.id !== posts[idx]?.id);
    const pageChanged = prevPageRef.current !== page;

    if (!postsChanged && !pageChanged) {
      return;
    }

    if (posts.length > 0) {
      const convertedPosts = posts.map(convertToPostFormat);
      if (page === 1) {
        // 첫 페이지일 때는 항상 교체
        setAllPosts(convertedPosts);
      } else {
        // 다음 페이지일 때는 추가 (중복 제거)
        setAllPosts((prev) => {
          const existingIds = new Set(prev.map((p: any) => p.id));
          const newPosts = convertedPosts.filter(
            (p: any) => !existingIds.has(p.id)
          );
          return newPosts.length > 0 ? [...prev, ...newPosts] : prev;
        });
      }
    } else if (page === 1) {
      // 첫 페이지이고 게시물이 빈 배열인 경우에만 초기화
      setAllPosts([]);
    }

    // 현재 값을 이전 값으로 저장
    prevPostsRef.current = posts;
    prevPageRef.current = page;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, page, hashtagId]);

  // 해시태그 클릭 핸들러
  const handleHashtagClick = (hashtag: string) => {
    const cleanTag = hashtag.replace(/^#/, "");
    router.push(`/tag/${encodeURIComponent(cleanTag)}`);
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  if (!tagName) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          태그를 선택해주세요.
        </div>
      </div>
    );
  }

  if (isLoadingHashtag) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          태그 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  if (!hashtagInfo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <h1 className="text-2xl font-bold mb-4">#{tagName}</h1>
          <p>해당 태그가 없거나 게시물이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          #{hashtagInfo.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {hashtagInfo.post_count}개의 게시물
        </p>
      </div>

      {/* 게시물 목록 */}
      {!hashtagId ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          게시물을 불러오는 중...
        </div>
      ) : isLoading && allPosts.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          게시물을 불러오는 중...
        </div>
      ) : allPosts.length === 0 && !isLoading ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          게시물이 없습니다.
        </div>
      ) : (
        <>
          <PostList
            posts={allPosts}
            onHashtagClick={handleHashtagClick}
            mutatePosts={undefined}
            showSortSelector={false}
          />
          {page < totalPages && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "로딩 중..." : "더 보기"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
