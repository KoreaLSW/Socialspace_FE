# 🚀 SocialSpace API 문서

프론트엔드에서 백엔드로 호출하는 모든 API 엔드포인트 목록입니다.

**기본 URL**: `http://localhost:4000` (환경변수: `NEXT_PUBLIC_EXPRESS_SERVER_URL`)

---

## 📋 목차

- [1. 인증 (Auth) API](#1-인증-auth-api)
- [2. 게시물 (Posts) API](#2-게시물-posts-api)
- [3. 댓글 (Comments) API](#3-댓글-comments-api)
- [4. 팔로우/차단 (Follow) API](#4-팔로우차단-follow-api)
- [5. 채팅 (Chat) API](#5-채팅-chat-api)
- [6. 알림 (Notifications) API](#6-알림-notifications-api)
- [7. 사용자 (Users) API](#7-사용자-users-api)
- [8. API 통계](#8-api-통계)

---

## 1. 인증 (Auth) API

**파일**: `src/lib/api/auth.ts`, `src/lib/api/profile.ts`

### 1.1 현재 사용자 정보

```typescript
GET / auth / me;
```

현재 로그인한 사용자 정보를 조회합니다.

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "nickname": "John"
  }
}
```

---

### 1.2 프로필 관리

#### 내 프로필 조회

```typescript
GET / auth / profile;
```

#### 사용자 ID로 프로필 조회

```typescript
GET / auth / profile / { userId };
```

#### Username으로 프로필 조회

```typescript
GET / auth / profile / username / { username };
```

#### 프로필 업데이트

```typescript
PUT / auth / profile;
```

**요청 Body**:

```json
{
  "nickname": "새로운 닉네임",
  "bio": "자기소개",
  "visibility": "public" // "public" | "private"
}
```

---

### 1.3 차단 및 친한친구

#### 차단된 사용자 목록

```typescript
GET /auth/blocked-users?page={page}&limit={limit}
```

#### 친한친구 목록

```typescript
GET /auth/favorites?page={page}&limit={limit}
```

---

### 1.4 팔로우 요청 관리

#### 팔로우 요청 목록

```typescript
GET /auth/follow-requests?page={page}&limit={limit}
```

#### 팔로우 요청 승인

```typescript
POST / auth / follow - requests / { requesterId } / approve;
```

#### 팔로우 요청 거절

```typescript
POST / auth / follow - requests / { requesterId } / reject;
```

---

### 1.5 로그아웃

```typescript
POST / auth / logout;
```

---

## 2. 게시물 (Posts) API

**파일**: `src/lib/api/posts.ts`

### 2.1 게시물 조회

#### 전체 게시물 목록 (페이지네이션)

```typescript
GET /posts?page={page}&limit={limit}
```

**응답 예시**:

```json
{
  "success": true,
  "data": [
    {
      "id": "post-uuid",
      "user_id": "user-uuid",
      "content": "게시물 내용",
      "visibility": "public",
      "like_count": 10,
      "comment_count": 5,
      "view_count": 100,
      "is_liked": false,
      "images": [],
      "hashtags": [],
      "author": {
        "username": "johndoe",
        "nickname": "John",
        "profileImage": "https://..."
      },
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

#### 특정 게시물 조회

```typescript
GET / posts / { id };
```

#### 내 게시물 조회

```typescript
GET / posts / my;
```

#### 특정 사용자 게시물 조회

```typescript
GET /posts/user/{userId}?page={page}&limit={limit}&type={type}
```

**type**: `"posts"` | `"media"` | `"likes"`

---

#### 사용자가 좋아요한 게시물

```typescript
GET /posts/user/{userId}/likes?page={page}&limit={limit}
```

#### 해시태그별 게시물

```typescript
GET /posts/hashtag/{hashtagId}?page={page}&limit={limit}
```

#### 게시물 좋아요 사용자 목록

```typescript
GET /posts/{postId}/likes?page={page}&limit={limit}
```

---

### 2.2 게시물 작성/수정/삭제

#### 게시물 생성

```typescript
POST / posts;
```

**요청 Body**:

```json
{
  "content": "게시물 내용",
  "visibility": "public",
  "hide_likes": false,
  "hide_views": false,
  "allow_comments": true,
  "images": [
    "https://cloudinary.com/image1.jpg",
    "https://cloudinary.com/image2.jpg"
  ],
  "hashtags": ["태그1", "태그2"]
}
```

---

#### 게시물 수정

```typescript
PUT / posts / { id };
```

#### 게시물 삭제

```typescript
DELETE / posts / { id };
```

---

### 2.3 게시물 좋아요

#### 좋아요 추가

```typescript
POST / posts / { id } / like;
```

#### 좋아요 취소

```typescript
DELETE / posts / { id } / like;
```

---

### 2.4 이미지 업로드

#### 단일 이미지 업로드

```typescript
POST /posts/upload/single
Content-Type: multipart/form-data
```

**FormData**:

- `image`: File

---

#### 다중 이미지 업로드 (최대 5개)

```typescript
POST /posts/upload/multiple
Content-Type: multipart/form-data
```

**FormData**:

- `images`: File[]

---

#### Base64 이미지 업로드

```typescript
POST / posts / upload / base64;
```

**요청 Body**:

```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

---

## 3. 댓글 (Comments) API

**파일**: `src/lib/api/comments.ts`

### 3.1 댓글 조회

#### 게시물의 댓글 목록

```typescript
GET /comments/post/{postId}?page={page}&limit={limit}
```

#### 특정 댓글 조회

```typescript
GET / comments / { commentId };
```

#### 댓글의 대댓글 조회

```typescript
GET /comments/{commentId}/replies?page={page}&limit={limit}
```

#### 게시물의 댓글 수

```typescript
GET / comments / post / { postId } / count;
```

#### 댓글 페이지 위치 계산

```typescript
GET /comments/{commentId}/page?limit={limit}
```

---

### 3.2 댓글 작성/수정/삭제

#### 댓글 생성

```typescript
POST / comments;
```

**요청 Body**:

```json
{
  "post_id": "post-uuid",
  "content": "댓글 내용",
  "parent_id": "comment-uuid", // 대댓글인 경우
  "reply_to_comment_id": "comment-uuid" // 멘션인 경우
}
```

---

#### 댓글 수정

```typescript
PUT / comments / { commentId };
```

**요청 Body**:

```json
{
  "content": "수정된 댓글 내용"
}
```

---

#### 댓글 삭제

```typescript
DELETE / comments / { commentId };
```

---

### 3.3 댓글 좋아요

#### 좋아요 추가

```typescript
POST / comments / { commentId } / like;
```

#### 좋아요 취소

```typescript
DELETE / comments / { commentId } / like;
```

#### 좋아요 사용자 목록

```typescript
GET /comments/{commentId}/likes?page={page}&limit={limit}
```

---

## 4. 팔로우/차단 (Follow) API

**파일**: `src/lib/api/follows.ts`, `src/lib/api/blocks.ts`

### 4.1 팔로우 관계

#### 팔로우 상태 확인

```typescript
GET / follow / status / { targetUserId };
```

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "isFollowing": true,
    "isPending": false,
    "isFavorite": false,
    "isBlocked": false
  }
}
```

---

#### 팔로우/언팔로우 토글

```typescript
POST / follow / { targetUserId };
```

#### 팔로워 목록

```typescript
GET /follow/followers/{userId}?page={page}&limit={limit}
```

#### 팔로잉 목록

```typescript
GET /follow/following/{userId}?page={page}&limit={limit}
```

#### 상호 팔로우 목록

```typescript
GET /follow/mutual-follows/{userId}?page={page}&limit={limit}
```

#### 추천 유저 목록

```typescript
GET /follow/recommended-userss?limit={limit}
```

---

### 4.2 친한친구

#### 친한친구 추가/제거

```typescript
POST / follow / favorite / { targetUserId };
```

---

### 4.3 차단

#### 차단하기/차단해제

```typescript
POST / follow / block / { targetUserId };
```

---

## 5. 채팅 (Chat) API

**파일**: `src/lib/api/chat.ts`

### 5.1 채팅방 관리

#### 채팅방 생성 또는 1:1 채팅방 반환

```typescript
POST / chat / rooms;
```

**요청 Body**:

```json
{
  "target_user_id": "user-uuid",
  "is_group": false,
  "name": "채팅방 이름" // 그룹채팅인 경우
}
```

---

#### 채팅방 목록 조회

```typescript
GET /chat/rooms?page={page}&limit={limit}
```

**응답 예시**:

```json
{
  "success": true,
  "data": [
    {
      "id": "room-uuid",
      "is_group": false,
      "name": null,
      "last_message_at": "2025-01-01T00:00:00Z",
      "members": [
        {
          "user_id": "user-uuid",
          "user": {
            "username": "johndoe",
            "nickname": "John",
            "profile_image": "https://..."
          }
        }
      ],
      "last_message": {
        "content": "마지막 메시지",
        "message_type": "text",
        "created_at": "2025-01-01T00:00:00Z"
      },
      "unread_count": 3
    }
  ]
}
```

---

#### 채팅방 멤버 조회

```typescript
GET / chat / rooms / { roomId } / members;
```

#### 안읽은 메시지 수 조회

```typescript
GET / chat / rooms / { roomId } / unread - count;
```

#### 채팅방 메시지 목록 조회

```typescript
GET /chat/rooms/{roomId}/messages?page={page}&limit={limit}
```

---

### 5.2 메시지 관리

#### 메시지 전송 (HTTP - 백업용)

```typescript
POST / chat / messages;
```

**요청 Body**:

```json
{
  "room_id": "room-uuid",
  "content": "메시지 내용",
  "message_type": "text", // "text" | "image" | "file"
  "file_url": "https://...", // 파일인 경우
  "file_name": "파일명.pdf",
  "file_size": 1024
}
```

> **참고**: 실시간 메시지는 Socket.IO를 사용합니다.

---

#### 메시지 읽음 처리

```typescript
POST / chat / messages / { messageId } / read;
```

---

### 5.3 채팅 설정

#### 채팅 설정 조회

```typescript
GET / chat / settings;
```

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "user_id": "user-uuid",
    "allow_messages_from": "everyone", // "everyone" | "followers" | "none"
    "show_online_status": true,
    "notification_enabled": true
  }
}
```

---

#### 채팅 설정 업데이트

```typescript
PUT / chat / settings;
```

**요청 Body**:

```json
{
  "allow_messages_from": "followers",
  "show_online_status": false,
  "notification_enabled": true
}
```

---

## 6. 알림 (Notifications) API

**파일**: `src/lib/api/notifications.ts`, `src/lib/api/notificationPreferences.ts`

### 6.1 알림 조회

#### 알림 목록 조회

```typescript
GET /notifications?page={page}&limit={limit}
```

**응답 예시**:

```json
{
  "success": true,
  "data": [
    {
      "id": "notification-uuid",
      "user_id": "user-uuid",
      "type": "post_liked", // 알림 타입
      "from_user_id": "user-uuid",
      "target_id": "post-uuid",
      "is_read": false,
      "created_at": "2025-01-01T00:00:00Z",
      "from_user": {
        "id": "user-uuid",
        "username": "johndoe",
        "nickname": "John",
        "profile_image": "https://..."
      },
      "post": {
        "id": "post-uuid",
        "content": "게시물 내용",
        "thumbnail_url": "https://..."
      }
    }
  ]
}
```

---

#### 안읽은 알림 수 조회

```typescript
GET / notifications / unread - count;
```

---

### 6.2 알림 관리

#### 특정 알림 읽음 처리

```typescript
PATCH / notifications / { id } / read;
```

#### 모든 알림 읽음 처리

```typescript
PATCH / notifications / read - all;
```

---

### 6.3 알림 설정

#### 알림 설정 조회

```typescript
GET / users / notification - preferences;
```

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "follow": true,
    "followee_post": true,
    "post_liked": true,
    "comment_liked": true,
    "post_commented": true,
    "mention_comment": true
  }
}
```

---

#### 알림 설정 업데이트

```typescript
PUT / users / notification - preferences;
```

**요청 Body**:

```json
{
  "follow": true,
  "followee_post": false,
  "post_liked": true
}
```

---

#### 개별 알림 설정 토글

```typescript
PATCH / users / notification - preferences / { type };
```

**알림 타입**:

- `follow` - 팔로우 알림
- `followee_post` - 팔로잉한 사람의 새 게시물 알림
- `post_liked` - 내 게시물 좋아요 알림
- `comment_liked` - 내 댓글 좋아요 알림
- `post_commented` - 내 게시물에 댓글 알림
- `mention_comment` - 댓글에서 멘션 알림

---

## 7. 사용자 (Users) API

**파일**: `src/lib/api/users.ts`

### 7.1 사용자 검색

```typescript
GET /users/search?q={query}&limit={limit}
```

**응답 예시**:

```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "username": "johndoe",
      "nickname": "John",
      "profile_image": "https://..."
    }
  ]
}
```

---

### 7.2 프로필 이미지 관리

#### 프로필 이미지 파일 업로드

```typescript
POST /users/profile-image/upload
Content-Type: multipart/form-data
```

**FormData**:

- `image`: File

---

#### 프로필 이미지 Base64 업로드

```typescript
POST / users / profile - image / upload - base64;
```

**요청 Body**:

```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

---

#### 프로필 이미지 URL 업데이트

```typescript
PUT / users / profile - image;
```

**요청 Body**:

```json
{
  "profileImage": "https://cloudinary.com/image.jpg"
}
```

---

## 8. API 통계

### 📊 엔드포인트 통계

```
총 엔드포인트: 70개+

카테고리별:
✅ 인증 (Auth): 11개
✅ 게시물 (Posts): 16개
✅ 댓글 (Comments): 11개
✅ 팔로우/차단 (Follow): 8개
✅ 채팅 (Chat): 10개
✅ 알림 (Notifications): 7개
✅ 사용자 (Users): 4개
✅ 프로필 (Profile): 3개

HTTP 메서드별:
📗 GET: 42개
📘 POST: 18개
📙 PUT: 4개
📕 DELETE: 4개
📓 PATCH: 2개
```

---

### 🔐 인증 방식

모든 API 요청은 NextAuth 세션 정보를 헤더에 포함합니다:

```typescript
Headers:
  x-session-data: Base64(encodeURIComponent(JSON.stringify({
    userId: "user-uuid",
    email: "user@example.com",
    username: "johndoe",
    nickname: "John"
  })))
```

---

### 🎯 API 파일 구조

```
src/lib/api/
├── config.ts                     # Axios 설정, 인터셉터
├── auth.ts                       # 인증 API
├── posts.ts                      # 게시물 API
├── comments.ts                   # 댓글 API
├── follows.ts                    # 팔로우 API
├── blocks.ts                     # 차단 API
├── chat.ts                       # 채팅 API
├── notifications.ts              # 알림 API
├── notificationPreferences.ts    # 알림 설정 API
├── profile.ts                    # 프로필 API
├── users.ts                      # 사용자 API
├── mutations.ts                  # SWR mutation 헬퍼
└── index.ts                      # 통합 export
```

---

### 📚 Hook 사용 예시

```typescript
// 무한 스크롤 게시물 조회
import { useInfinitePosts } from "@/hooks/usePosts";

const { posts, isLoading, hasMore, setSize } = useInfinitePosts(10);

// 사용자 검색
import { useUserSearch } from "@/hooks/useUsers";

const { users, isLoading } = useUserSearch(query);

// 알림 목록
import { useNotifications } from "@/hooks/useNotifications";

const { notifications, unreadCount, markAsRead } = useNotifications();
```

---

### 🔄 실시간 통신 (Socket.IO)

채팅과 알림은 Socket.IO를 통한 실시간 통신을 지원합니다:

```typescript
// 채팅 이벤트
socket.emit("send_message", { roomId, content, messageType });
socket.on("new_message", (message) => {
  /* ... */
});
socket.on("message_read", ({ messageId, userId }) => {
  /* ... */
});

// 알림 이벤트
socket.on("notification", (notification) => {
  /* ... */
});
```

---

## 🚀 사용 예시

### 게시물 생성 플로우

```typescript
import { postsApi } from "@/lib/api/posts";
import { mutate } from "swr";

// 1. 이미지 업로드
const formData = new FormData();
formData.append("images", file1);
formData.append("images", file2);

const imageResponse = await postsApi.uploadImages(formData);
const imageUrls = imageResponse.data.urls;

// 2. 게시물 생성
const postData = {
  content: "안녕하세요!",
  visibility: "public",
  hide_likes: false,
  allow_comments: true,
  images: imageUrls,
  hashtags: ["일상", "소통"],
};

await postsApi.create(postData);

// 3. 캐시 갱신
mutate("/posts");
```

---

### 댓글 작성 플로우

```typescript
import { createComment } from "@/lib/api/comments";
import { mutate } from "swr";

// 댓글 작성
await createComment({
  post_id: postId,
  content: "좋은 글이네요!",
  parent_id: null, // 대댓글인 경우 부모 댓글 ID
});

// 캐시 갱신
mutate(`/comments/post/${postId}`);
```

---

### 팔로우 토글 플로우

```typescript
import { followApi } from "@/lib/api/follows";
import { mutate } from "swr";

// 팔로우/언팔로우
const response = await followApi.toggleFollow(targetUserId);

// 캐시 갱신
mutate(`/follow/status/${targetUserId}`);
mutate(`/follow/followers/${targetUserId}`);
```

---

## 📝 참고사항

1. **페이지네이션**: 대부분의 목록 API는 `page`와 `limit` 쿼리 파라미터를 지원합니다.
2. **에러 처리**: 모든 API는 통일된 에러 응답 형식을 사용합니다.
3. **캐싱**: SWR을 사용하여 자동 캐싱 및 재검증을 수행합니다.
4. **실시간**: 채팅과 알림은 Socket.IO를 통해 실시간으로 업데이트됩니다.
5. **인증**: 모든 보호된 엔드포인트는 NextAuth 세션이 필요합니다.

---

**마지막 업데이트**: 2025년 10월 8일



