"use client";

import {
  Bell,
  Shield,
  User,
  Palette,
  Globe,
  HelpCircle,
  LogOut,
} from "lucide-react";

export default function SettingsPage() {
  const settingsSections = [
    {
      title: "계정",
      icon: User,
      items: [
        { label: "프로필 편집", description: "이름, 사진, 소개글 변경" },
        {
          label: "비밀번호 변경",
          description: "계정 보안을 위해 정기적으로 변경하세요",
        },
        { label: "이메일 설정", description: "이메일 주소 및 인증 설정" },
      ],
    },
    {
      title: "알림",
      icon: Bell,
      items: [
        { label: "푸시 알림", description: "좋아요, 댓글, 팔로우 알림 설정" },
        { label: "이메일 알림", description: "이메일로 받을 알림 종류 선택" },
        { label: "알림 시간", description: "알림을 받지 않을 시간대 설정" },
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
          label: "데이터 다운로드",
          description: "내 데이터 백업 파일 다운로드",
        },
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

  const additionalOptions = [
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

  return (
    <>
      {/* 설정 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          설정
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          계정 및 앱 설정을 관리하세요
        </p>
      </div>

      {/* 설정 섹션들 */}
      {settingsSections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <section.icon className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {section.title}
            </h2>
          </div>

          <div className="space-y-4">
            {section.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 추가 옵션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          기타
        </h2>

        <div className="space-y-4">
          {additionalOptions.map((option, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors ${
                option.danger ? "hover:bg-red-50 dark:hover:bg-red-900/20" : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <option.icon
                  className={option.danger ? "text-red-500" : "text-gray-500"}
                  size={20}
                />
                <div>
                  <h3
                    className={`font-medium ${
                      option.danger
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {option.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 앱 정보 */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        <p>SocialSpace v1.0.0</p>
        <p>© 2024 SocialSpace. All rights reserved.</p>
      </div>
    </>
  );
}
