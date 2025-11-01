/**
 * 시간을 상대 시간 형식으로 변환 (몇 초/분/시간/일/주 전)
 */
export function formatTimeAgo(dateString: string | Date): string {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();

  // 한국 시간으로 변환 (UTC+9)
  const koreaDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const koreaNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const diffInSeconds = Math.floor(
    (koreaNow.getTime() - koreaDate.getTime()) / 1000
  );

  // 몇 초 전
  if (diffInSeconds < 60) {
    return diffInSeconds < 1 ? "방금 전" : `${diffInSeconds}초 전`;
  }

  // 몇 분 전
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  // 몇 시간 전
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  // 몇 일 전
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  // 몇 주 전
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}주 전`;
  }

  // 그 이상은 날짜로 표시
  return koreaDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
