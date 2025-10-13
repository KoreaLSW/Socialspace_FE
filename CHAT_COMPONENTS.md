# 채팅 시스템 컴포넌트 가이드

## 📁 구조 개요

```
src/
├── types/
│   └── chat.ts                 # 채팅 관련 타입 정의
├── app/components/chat/
│   ├── index.ts               # 컴포넌트 인덱스
│   ├── ChatRoomList.tsx       # 채팅방 목록 컴포넌트
│   ├── ChatRoomItem.tsx       # 채팅방 아이템 컴포넌트
│   ├── ChatRoomHeader.tsx     # 채팅방 헤더 컴포넌트
│   ├── ChatMessageItem.tsx    # 메시지 아이템 컴포넌트
│   ├── ChatInput.tsx          # 메시지 입력 컴포넌트
│   ├── TypingIndicator.tsx    # 타이핑 표시 컴포넌트
│   ├── UnreadBadge.tsx        # 안읽은 메시지 배지 컴포넌트
│   └── UserSearch.tsx         # 사용자 검색 컴포넌트
├── app/components/modal/chat/
│   └── ChatModal.tsx          # 채팅 모달 (리팩토링됨)
└── hooks/
    └── useDebounce.ts         # 디바운스 훅
```

## 🎯 주요 기능

### ✅ 구현 완료된 기능들

1. **채팅방 목록 관리**

   - 실시간 채팅방 목록 표시
   - 안읽은 메시지 수 표시
   - 마지막 메시지 미리보기
   - 채팅방 나가기 기능

2. **사용자 검색 및 새 채팅 시작**

   - 실시간 사용자 검색
   - 상호 팔로우 표시
   - 새 채팅방 생성

3. **메시지 관리**

   - 텍스트, 이미지, 파일 메시지 지원
   - 실시간 메시지 송수신
   - 무한 스크롤 메시지 로딩
   - 타이핑 상태 표시

4. **UI/UX 개선**
   - 컴포넌트화된 재사용 가능한 구조
   - 반응형 디자인
   - 다크 모드 지원
   - 로딩 및 에러 상태 처리

## 🔧 컴포넌트 사용법

### ChatRoomList 컴포넌트

```tsx
import { ChatRoomList } from "@/app/components/chat";

<ChatRoomList
  onRoomSelect={handleRoomSelect}
  selectedRoomId={selectedRoom?.id}
  showSearch={true}
  showNewChatButton={true}
/>;
```

### ChatModal 컴포넌트

```tsx
import ChatModal from "@/app/components/modal/chat/ChatModal";

<ChatModal
  isOpen={showChatModal}
  onClose={handleCloseChatModal}
  room={selectedRoom}
/>;
```

### UserSearch 컴포넌트

```tsx
import { UserSearch } from "@/app/components/chat";

<UserSearch
  onUserSelect={handleStartNewChat}
  placeholder="사용자를 검색해서 채팅을 시작하세요..."
  excludeUserIds={[currentUserId]}
/>;
```

## 🎨 스타일링 가이드

### 색상 시스템

- 주요 색상: `blue-500` (전송 버튼, 링크 등)
- 성공 색상: `green-500` (온라인 상태)
- 경고 색상: `yellow-500` (연결 중 상태)
- 위험 색상: `red-500` (안읽은 메시지, 나가기 버튼)

### 크기 시스템

- 아바타: 24px (소), 40px (중), 48px (대)
- 배지: sm(16px), md(20px), lg(24px)
- 버튼: 최소 40px 높이 (터치 친화적)

### 애니메이션

- 타이핑 인디케이터: `animate-bounce`
- 로딩 스피너: `animate-spin`
- 안읽은 배지: `animate-pulse`

## 🔄 데이터 플로우

### 채팅방 목록

1. `useChatRooms` 훅으로 채팅방 목록 조회
2. `ChatRoomList`에서 목록 렌더링
3. `ChatRoomItem`으로 개별 채팅방 표시
4. 사용자 클릭 시 `ChatModal` 열기

### 메시지 송수신

1. `useChatMessages` 훅으로 메시지 목록 조회
2. `ChatInput`에서 메시지 입력
3. `useChatActions`의 `sendMessage`로 전송
4. Socket.io를 통한 실시간 수신
5. `ChatMessageItem`으로 메시지 렌더링

### 사용자 검색

1. `UserSearch`에서 검색어 입력
2. `useDebounce`로 API 호출 최적화
3. 검색 결과 표시
4. 사용자 선택 시 새 채팅방 생성

## 🚀 성능 최적화

### 구현된 최적화

- **디바운스**: 사용자 검색에서 API 호출 최적화
- **컴포넌트 분리**: 재렌더링 최소화
- **조건부 렌더링**: 불필요한 컴포넌트 렌더링 방지
- **이벤트 정리**: useEffect cleanup으로 메모리 누수 방지

### 추후 최적화 가능 영역

- **가상화**: 긴 메시지 목록에 대한 react-window 적용
- **이미지 최적화**: lazy loading 및 압축
- **캐싱 개선**: SWR 캐시 전략 최적화

## 🔧 확장 가능성

### 쉽게 추가할 수 있는 기능들

1. **메시지 반응**: 이모지 반응 기능
2. **메시지 답장**: 특정 메시지에 답장
3. **파일 업로드**: 드래그 앤 드롭 지원
4. **음성 메시지**: 음성 녹음 및 재생
5. **메시지 검색**: 채팅 내 메시지 검색

### 확장 방법

```tsx
// 새로운 메시지 타입 추가 예시
interface VoiceMessage extends ChatMessage {
  message_type: "voice";
  duration?: number;
  waveform?: number[];
}

// ChatMessageItem에서 처리
{
  message.message_type === "voice" && <VoiceMessagePlayer message={message} />;
}
```

## 🐛 디버깅 가이드

### 자주 발생하는 문제들

1. **메시지가 실시간으로 표시되지 않음**

   - Socket 연결 상태 확인
   - `useChatRoomEvents` 훅 동작 확인
   - 콘솔에서 실시간 메시지 수신 로그 확인

2. **채팅방 목록이 로드되지 않음**

   - 사용자 인증 상태 확인
   - API 응답 확인
   - `useChatRooms` 훅의 에러 상태 확인

3. **사용자 검색이 작동하지 않음**
   - 디바운스 동작 확인
   - API 엔드포인트 응답 확인
   - 검색 권한 확인

### 로그 확인 방법

```typescript
// 개발자 도구에서 확인할 수 있는 로그들
console.log("💬 ChatModal - 실시간 메시지 수신:", data);
console.log("✅ ChatModal - 해당 방 메시지 수신, 강제 갱신");
console.log("🔄 메시지 목록 강제 갱신");
```

이 가이드를 통해 채팅 시스템의 전체적인 구조를 이해하고, 필요에 따라 확장하거나 수정할 수 있습니다.









