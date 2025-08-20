import {
  Bell,
  Shield,
  User,
  Palette,
  Globe,
  HelpCircle,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { SettingsSection, SettingsOption } from "../../../types/settings";

export const settingsSections: SettingsSection[] = [
  {
    title: "프로필 설정",
    icon: User,
    items: [
      { label: "닉네임 변경", description: "표시될 이름을 변경하세요" },
      { label: "자기소개 편집", description: "프로필 소개글을 작성하세요" },
      { label: "프로필 이미지", description: "프로필 사진을 변경하세요" },
      {
        label: "프로필 공개 범위",
        description: "전체, 팔로우만, 비공개 중 선택",
      },
    ],
  },
  {
    title: "게시글 설정",
    icon: Palette,
    items: [
      {
        label: "좋아요 수 표시",
        description: "게시글의 좋아요 개수 표시 여부",
      },
      { label: "조회수 표시", description: "게시글의 조회수 표시 여부" },
      { label: "댓글 허용", description: "게시글에 댓글 작성 허용 여부" },
      {
        label: "기본 공개 범위",
        description: "새 게시글의 기본 공개 범위 설정",
      },
    ],
  },
  {
    title: "알림 설정",
    icon: Bell,
    items: [
      {
        label: "팔로우 알림",
        description: "새로운 팔로우 요청 및 수락 알림",
      },
      {
        label: "좋아요 알림",
        description: "내 게시글/댓글에 좋아요 받은 알림",
      },
      { label: "댓글 알림", description: "내 게시글에 댓글 달린 알림" },
      { label: "푸시 알림", description: "모바일 푸시 알림 수신 여부" },
      { label: "이메일 알림", description: "이메일로 받을 알림 종류 선택" },
    ],
  },
  {
    title: "개인정보 및 보안",
    icon: Shield,
    items: [
      {
        label: "계정 공개 설정",
        description: "프로필과 게시물의 공개 범위 설정",
      },
      {
        label: "차단 계정 관리",
        description: "차단한 사용자 목록 확인 및 관리",
      },
      {
        label: "팔로우 승인 방식",
        description: "자동 수락 또는 수동 승인 선택",
      },
      {
        label: "데이터 다운로드",
        description: "내 데이터 백업 파일 다운로드",
      },
    ],
  },
  {
    title: "채팅 설정",
    icon: MessageSquare,
    items: [
      { label: "개인 채팅 알림", description: "1:1 채팅 메시지 알림 설정" },
      {
        label: "그룹 채팅 알림",
        description: "그룹 채팅방 메시지 알림 설정",
      },
      { label: "읽음 표시", description: "메시지 읽음 상태 표시 여부" },
      { label: "채팅 기록 보관", description: "채팅 메시지 보관 기간 설정" },
    ],
  },
  {
    title: "표시 및 접근성",
    icon: Palette,
    items: [
      { label: "다크 모드", description: "어두운 테마 사용 설정" },
      { label: "언어 설정", description: "앱에서 사용할 언어 선택" },
      { label: "접근성", description: "시각적 보조 기능 설정" },
    ],
  },
];

export const additionalOptions: SettingsOption[] = [
  {
    icon: Globe,
    label: "북마크 관리",
    description: "저장한 게시글 및 폴더 관리",
  },
  {
    icon: Globe,
    label: "도움말 센터",
    description: "자주 묻는 질문과 사용 가이드",
  },
  { icon: HelpCircle, label: "문의하기", description: "기술 지원 및 피드백" },
  {
    icon: LogOut,
    label: "로그아웃",
    description: "계정에서 안전하게 로그아웃",
    danger: true,
  },
];
