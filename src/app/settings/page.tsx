"use client";

import { useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/useAuth";
import { useFollowRequestsCount } from "@/hooks/useFollowRequests";
import SettingsHeader from "../components/settings/SettingsHeader";
import SettingsSection from "../components/settings/SettingsSection";
import SettingsOption from "../components/settings/SettingsOption";
import { settingsSections, additionalOptions } from "./data/settingsData";
import EditNicknameModal from "../components/modal/settings/EditNicknameModal";
import EditBioModal from "../components/modal/settings/EditBioModal";
import EditProfileImageModal from "../components/modal/settings/EditProfileImageModal";
import EditVisibilityModal from "../components/modal/settings/EditVisibilityModal";
import FavoriteFriendsModal from "../components/modal/settings/FavoriteFriendsModal";
import BlockedUsersModal from "../components/modal/settings/BlockedUsersModal";
import FollowApprovalModal from "../components/modal/settings/FollowApprovalModal";
import FollowRequestsModal from "../components/modal/settings/FollowRequestsModal";
import MutualFollowModal from "../components/modal/settings/MutualFollowModal";

export default function SettingsPage() {
  const { user } = useCurrentUser();
  const { count: followRequestsCount } = useFollowRequestsCount();

  // 디버깅 로그 추가
  console.log("⚙️ 설정 페이지 - 팔로우 요청 수:", followRequestsCount);
  const [openNicknameModal, setOpenNicknameModal] = useState(false);
  const [openBioModal, setOpenBioModal] = useState(false);
  const [openProfileImageModal, setOpenProfileImageModal] = useState(false);
  const [openVisibilityModal, setOpenVisibilityModal] = useState(false);
  const [openFavoriteFriendsModal, setOpenFavoriteFriendsModal] =
    useState(false);
  const [openBlockedUsersModal, setOpenBlockedUsersModal] = useState(false);
  const [openFollowApprovalModal, setOpenFollowApprovalModal] = useState(false);
  const [openFollowRequestsModal, setOpenFollowRequestsModal] = useState(false);
  const [openMutualFollowModal, setOpenMutualFollowModal] = useState(false);

  // useMemo 제거하고 직접 계산
  const sectionsWithHandlers = settingsSections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.label === "닉네임 변경") {
        return { ...item, onClick: () => setOpenNicknameModal(true) };
      }
      if (item.label === "자기소개 편집") {
        return { ...item, onClick: () => setOpenBioModal(true) };
      }
      if (item.label === "프로필 이미지") {
        return { ...item, onClick: () => setOpenProfileImageModal(true) };
      }
      if (item.label === "프로필 공개 범위") {
        const visibilityLabels = {
          public: "전체공개",
          followers: "팔로우만 공개",
          private: "비공개",
        };
        return {
          ...item,
          onClick: () => setOpenVisibilityModal(true),
          currentValue: user?.visibility
            ? visibilityLabels[user.visibility as keyof typeof visibilityLabels]
            : undefined,
        };
      }
      if (item.label === "친한친구 관리") {
        return {
          ...item,
          onClick: () => setOpenFavoriteFriendsModal(true),
        };
      }
      if (item.label === "차단 친구 관리") {
        return {
          ...item,
          onClick: () => setOpenBlockedUsersModal(true),
        };
      }
      if (item.label === "팔로우 승인 방식") {
        const approvalLabels = {
          auto: "자동 수락",
          manual: "수동 승인",
        };
        return {
          ...item,
          onClick: () => setOpenFollowApprovalModal(true),
          currentValue: user?.followApprovalMode
            ? approvalLabels[
                user.followApprovalMode as keyof typeof approvalLabels
              ]
            : undefined,
        };
      }
      if (item.label === "팔로우 요청 관리") {
        return {
          ...item,
          onClick: () => setOpenFollowRequestsModal(true),
          currentValue:
            followRequestsCount > 0 ? `${followRequestsCount}건` : undefined,
        };
      }
      if (item.label === "상호 팔로우 표시") {
        return {
          ...item,
          onClick: () => setOpenMutualFollowModal(true),
          currentValue: user?.showMutualFollow ? "표시" : "숨김",
        };
      }
      return item;
    }),
  }));

  return (
    <>
      <SettingsHeader />

      {sectionsWithHandlers.map((section, index) => (
        <SettingsSection
          key={index}
          {...section}
          followRequestsCount={
            section.title === "팔로우 설정" ? followRequestsCount : undefined
          }
        />
      ))}

      {/* 추가 옵션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          기타
        </h2>

        <div className="space-y-4">
          {additionalOptions.map((option, index) => (
            <SettingsOption key={index} {...option} />
          ))}
        </div>
      </div>

      {/* 앱 정보 */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        <p>SocialSpace v1.0.0</p>
        <p>© 2024 SocialSpace. All rights reserved.</p>
      </div>

      <EditNicknameModal
        open={openNicknameModal}
        onClose={() => setOpenNicknameModal(false)}
      />
      <EditBioModal
        open={openBioModal}
        onClose={() => setOpenBioModal(false)}
      />
      <EditProfileImageModal
        open={openProfileImageModal}
        onClose={() => setOpenProfileImageModal(false)}
      />
      <EditVisibilityModal
        open={openVisibilityModal}
        onClose={() => setOpenVisibilityModal(false)}
      />
      <FavoriteFriendsModal
        open={openFavoriteFriendsModal}
        onClose={() => setOpenFavoriteFriendsModal(false)}
      />
      <BlockedUsersModal
        open={openBlockedUsersModal}
        onClose={() => setOpenBlockedUsersModal(false)}
      />
      <FollowApprovalModal
        open={openFollowApprovalModal}
        onClose={() => setOpenFollowApprovalModal(false)}
        currentMode={user?.followApprovalMode}
      />
      <FollowRequestsModal
        open={openFollowRequestsModal}
        onClose={() => setOpenFollowRequestsModal(false)}
      />
      <MutualFollowModal
        open={openMutualFollowModal}
        onClose={() => setOpenMutualFollowModal(false)}
      />
    </>
  );
}
