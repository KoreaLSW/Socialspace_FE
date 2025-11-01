# 🔄 SWR Stale-While-Revalidate 패턴 분석

프로젝트에서 **SWR의 Stale-While-Revalidate 패턴**이 적용된 부분들을 분석합니다.

---

## 📋 Stale-While-Revalidate 패턴이란?

**SWR의 핵심 개념**: 캐시된 데이터(stale)를 즉시 표시하고, 백그라운드에서 재검증(revalidate)을 수행하여 최신 데이터로 업데이트하는 전략

**동작 원리**:

1. 캐시된 데이터가 있으면 즉시 표시 (빠른 응답)
2. 동시에 백그라운드에서 서버에 최신 데이터 요청
3. 새 데이터가 오면 캐시와 UI 자동 업데이트

---

## 🎯 패턴 적용 위치 분석

### **1️⃣ 전역 SWR 설정** (`src/app/providers.tsx`)

**Stale-While-Revalidate 설정**

```typescript:src/app/providers.tsx
<SWRConfig
  value={{
    fetcher,
    revalidateOnFocus: false,        // 🔄 포커스 시 재검증 비활성화
    revalidateOnReconnect: true,     // ✅ 재연결 시 재검증 활성화
    refreshInterval: 0,
    dedupingInterval: 2000,          // ⚡ 2초 내 중복 요청 방지
    errorRetryCount: 3,              // 🔄 에러 시 최대 3회 재시도
    errorRetryInterval: 5000,        // ⏱️ 5초 후 재시도
  }}
>
```

**설명**:

- `revalidateOnReconnect: true` → 네트워크 재연결 시 자동으로 최신 데이터 확인
- `dedupingInterval: 2000` → 2초 내 동일 요청 중복 방지로 불필요한 네트워크 요청 감소
- 에러 발생 시 자동 재시도로 안정성 확보

---

### **2️⃣ 게시물 무한 스크롤** (`src/hooks/usePosts.ts`)

**Stale-While-Revalidate 적용 예시**

```typescript:src/hooks/usePosts.ts
export const useInfinitePosts = (limit: number = 10) => {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<InfinitePostsResponse>(
      (pageIndex, previousPageData) => {
        // 키 생성 로직
        if (pageIndex === 0) return [`/posts`, 1, limit];
        if (
          previousPageData &&
          previousPageData.pagination.page <
            previousPageData.pagination.totalPages
        ) {
          return [`/posts`, pageIndex + 1, limit];
        }
        return null;
      },
      ([, page, limit]) => {
        return postsApi.getAllPaginated(Number(page), Number(limit));
      },
      {
        revalidateOnFocus: false,        // 🔄 포커스 시 재검증 비활성화
        revalidateOnReconnect: true,     // ✅ 재연결 시 재검증 활성화
        dedupingInterval: 0,             // ⚡ 캐싱 비활성화 (즉시 로딩 상태 표시)
        keepPreviousData: false,         // 📋 이전 데이터 유지하지 않음
      }
    );

  // 중복 제거 및 데이터 가공
  const uniquePosts = allPosts.filter((post, index, self) => {
    if (!post || !post.id) return false;
    return index === self.findIndex((p) => p && p.id && p.id === post.id);
  });

  return {
    posts: uniquePosts,
    isLoading,
    isValidating, // 🔄 revalidate 중인지 확인
    hasMore,
    // ...
  };
};
```

**적용 사례**:

- ✅ 기존 캐시된 게시물을 즉시 표시 (stale data)
- ✅ `isValidating`이 true일 때 백그라운드에서 최신 데이터 재검증
- ✅ 로딩 인디케이터 표시로 사용자 경험 향상

---

### **3️⃣ 댓글 시스템** (`src/hooks/useComments.ts`)

**낙관적 업데이트 + Stale-While-Revalidate**

```typescript:src/hooks/useComments.ts
export function useComments(postId: string) {
  const { data: pages, mutate: mutateComments, ... } = useSWRInfinite(
    (pageIndex, previousPage: any) => {
      if (!postId) return null;
      if (previousPage && previousPage.pagination) {
        const { page, totalPages } = previousPage.pagination;
        if (pageIndex > 0 && page >= totalPages) return null;
      }
      return ["comments", postId, pageIndex + 1, PAGE_SIZE];
    },
    ([, id, page, limit]) =>
      commentsApi.getCommentsByPostId(
        id as string,
        page as number,
        limit as number
      ),
    {
      revalidateOnFocus: false,      // 🔄 포커스 시 재검증 비활성화
      revalidateOnReconnect: true,   // ✅ 재연결 시 재검증 활성화
      keepPreviousData: true,        // 📋 이전 데이터 유지 (UX 개선)
      dedupingInterval: 500,         // ⚡ 500ms 내 중복 요청 방지
    }
  );

  // 낙관적 업데이트: 댓글 작성 시 즉시 UI에 표시
  const optimisticCommentCreate = async (content: string, currentUser: any) => {
    // 1. 캐시 업데이트 (revalidate: false)
    mutateComments((current: any) => {
      if (!current?.data) return current;
      return {
        ...current,
        data: [...(current.data || []), optimisticComment],
      };
    }, false); // 🚫 서버 재요청 하지 않음 (낙관적)

    // 2. 서버에 실제 요청
    const response = await commentsApi.createComment(commentData);

    // 3. 재검증으로 서버 데이터와 동기화
    mutateComments(); // ✅ 서버 재요청으로 최신 데이터 반영
  };
}
```

**적용 사례**:

- ✅ 낙관적 업데이트: 댓글 작성 즉시 UI에 반영
- ✅ 자동 재검증: 서버 응답 후 최신 데이터로 자동 업데이트
- ✅ 에러 시 롤백: 실패하면 캐시를 원래 상태로 복원

---

### **4️⃣ 실시간 채팅** (`src/hooks/useChat.ts`)

**Socket.io + SWR Stale-While-Revalidate**

```typescript:src/hooks/useChat.ts
export const useChatMessages = (roomId: string, limit: number = 50) => {
  const { data, mutate } = useSWRInfinite<ChatMessagesResponse>(
    (pageIndex, previousPageData) => {
      if (!roomId) return null;
      if (pageIndex === 0) return chatKeys.roomMessages(roomId, 1, limit);

      if (
        previousPageData &&
        previousPageData.pagination.page <
          previousPageData.pagination.totalPages
      ) {
        return chatKeys.roomMessages(roomId, pageIndex + 1, limit);
      }
      return null;
    },
    async ([, , , page]) => {
      return await getRoomMessages(roomId, page, limit);
    },
    {
      revalidateOnFocus: false,       // 🔄 포커스 시 재검증 비활성화
      revalidateOnReconnect: true,    // ✅ 재연결 시 재검증 활성화
      dedupingInterval: 0,            // ⚡ 캐싱 비활성화
      keepPreviousData: false,        // 📋 이전 데이터 유지하지 않음
    }
  );

  // Socket.io로 실시간 메시지 수신 시 캐시 업데이트
  useEffect(() => {
    const unsubscribe = onMessage((data: any) => {
      if (data.room_id === roomId) {
        // SWR 캐시 업데이트 (revalidate: false)
        mutate(
          (currentData: any) => {
            if (!currentData || !Array.isArray(currentData)) {
              return currentData;
            }

            // 새로운 메시지를 캐시에 추가
            const updatedData = [...currentData];
            if (updatedData[0]?.data) {
              updatedData[0] = {
                ...updatedData[0],
                data: [...updatedData[0].data, data.message],
              };
            }
            return updatedData;
          },
          { revalidate: false } // 🚫 서버 재요청 하지 않음
        );
      }
    });

    return () => unsubscribe();
  }, [onMessage, mutate, roomId]);
}
```

**적용 사례**:

- ✅ Socket.io로 받은 메시지를 캐시에 즉시 반영 (stale)
- ✅ `revalidate: false`로 서버 재요청 없이 UI만 업데이트
- ✅ 실시간 데이터와 캐시 데이터를 동기화

---

### **5️⃣ 단일 게시물 조회** (`src/hooks/usePosts.ts`)

**선택적 재검증 설정**

```typescript:src/hooks/usePosts.ts
export const usePost = (postId: string) => {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: ApiPost;
    message: string;
  }>(postId ? [`post`, postId] : null, () => postsApi.getById(postId), {
    revalidateOnFocus: false,       // 🔄 포커스 시 재검증 비활성화
    revalidateOnReconnect: true,    // ✅ 재연결 시 재검증 활성화
    onError: (error: any) => {
      // 404 에러는 차단된 게시물이거나 존재하지 않는 게시물
      if (error?.response?.status === 404) {
        console.log("게시물을 찾을 수 없습니다 (차단되었거나 삭제됨)");
      }
    },
  });

  return {
    post: data?.data,
    isLoading,
    error,
    mutate,
  };
};
```

**적용 사례**:

- ✅ 페이지 포커스 시 재검증 비활성화로 불필요한 요청 감소
- ✅ 재연결 시 재검증으로 최신 데이터 확보
- ✅ 에러 핸들링으로 안정적인 UX 제공

---

### **6️⃣ 해시태그별 게시물 조회** (`src/hooks/usePosts.ts`)

**캐싱 전략 적용**

```typescript:src/hooks/usePosts.ts
export const useHashtagPosts = (
  hashtagId: string,
  page: number = 1,
  limit: number = 10
) => {
  const { data, error, isLoading, mutate } = useSWR<PostsResponse>(
    hashtagId ? [`hashtag-posts`, hashtagId, page, limit] : null,
    () => postsApi.getByHashtagPaginated(hashtagId, page, limit),
    {
      revalidateOnFocus: false,        // 🔄 포커스 시 재검증 비활성화
      revalidateOnReconnect: true,     // ✅ 재연결 시 재검증 활성화
      dedupingInterval: 60000,         // ⏱️ 1분 내 중복 요청 방지
    }
  );

  return {
    posts: data?.data?.posts || [],
    totalCount: data?.data?.totalCount || 0,
    isLoading,
    error,
    mutate,
  };
};
```

**적용 사례**:

- ✅ 1분 캐시로 잦은 해시태그 조회 시 네트워크 부하 감소
- ✅ 재검증으로 최신 게시물 자동 반영

---

## 📊 Stale-While-Revalidate 패턴 요약

### **패턴 적용 위치**

| 위치            | 파일                                 | 주요 설정                                               | 목적                               |
| :-------------- | :----------------------------------- | :------------------------------------------------------ | :--------------------------------- |
| **전역 설정**   | `src/app/providers.tsx`              | `revalidateOnReconnect: true`, `dedupingInterval: 2000` | 모든 SWR 요청에 적용되는 기본 동작 |
| **게시물 피드** | `src/hooks/usePosts.ts` (무한스크롤) | `revalidateOnFocus: false`, `dedupingInterval: 0`       | 빠른 초기 로딩, 명확한 로딩 상태   |
| **댓글 시스템** | `src/hooks/useComments.ts`           | `keepPreviousData: true`, `dedupingInterval: 500`       | 낙관적 업데이트 + 자동 재검증      |
| **실시간 채팅** | `src/hooks/useChat.ts`               | `revalidate: false` (수동)                              | Socket.io 메시지 즉시 반영         |
| **단일 게시물** | `src/hooks/usePosts.ts` (usePost)    | `revalidateOnFocus: false`                              | 불필요한 재요청 방지               |
| **해시태그**    | `src/hooks/usePosts.ts` (hashtag)    | `dedupingInterval: 60000`                               | 1분 캐시로 성능 최적화             |

---

## 💡 패턴의 장점

### **1. 빠른 응답성**

- 캐시된 데이터를 즉시 표시하여 사용자는 빠르게 콘텐츠를 볼 수 있음
- 백그라운드에서 최신 데이터를 받아 올 때까지 stale data로 부드러운 UX 제공

### **2. 자동 동기화**

- 네트워크 재연결 시 자동으로 최신 데이터 확인
- 설정된 주기로 자동 재검증하여 최신 정보 유지

### **3. 낙관적 업데이트**

- 사용자 액션(댓글 작성, 좋아요 등)을 즉시 UI에 반영
- 서버 응답 기다리지 않고 빠른 피드백

### **4. 성능 최적화**

- `dedupingInterval`로 중복 요청 방지
- `revalidateOnFocus: false`로 불필요한 재요청 감소
- 네트워크 부하 감소로 서버 비용 절감

### **5. 에러 복구**

- 자동 재시도로 일시적인 네트워크 에러 복구
- 사용자 개입 없이 자동으로 재연결 시도

---

## 🎯 실제 동작 흐름 예시

### **게시물 피드에서의 흐름**

```
1. 사용자가 홈페이지 접속
   → 캐시된 게시물 없음 → 서버에 요청 → 로딩 표시

2. 서버 응답 후 UI 업데이트
   → 게시물 표시 + 캐시 저장

3. 사용자가 스크롤하여 다음 페이지 요청
   → 캐시된 첫 페이지는 즉시 표시 (stale)
   → 백그라운드에서 최신 데이터 재검증
   → 새 데이터가 오면 자동 업데이트

4. 네트워크 재연결
   → revalidateOnReconnect: true
   → 자동으로 최신 데이터 확인

5. 댓글 작성
   → 낙관적 업데이트로 즉시 UI 반영
   → 서버 요청 완료 후 실제 데이터로 교체
```

---

## 📝 결론

프로젝트 전반에 걸쳐 **SWR의 Stale-While-Revalidate 패턴**을 적극 활용하여:

✅ **빠른 응답성** 확보  
✅ **자동 데이터 동기화** 구현  
✅ **낙관적 UI 업데이트**로 사용자 경험 향상  
✅ **성능 최적화** 및 **네트워크 부하 감소**

각 Hook별로 요구사항에 맞는 재검증 전략을 세밀하게 적용하고 있습니다!

**작성일**: 2025년 10월 8일








