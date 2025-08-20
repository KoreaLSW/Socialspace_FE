"use client";

import { useMemo, useState } from "react";
import SettingsHeader from "../components/settings/SettingsHeader";
import SettingsSection from "../components/settings/SettingsSection";
import SettingsOption from "../components/settings/SettingsOption";
import { settingsSections, additionalOptions } from "./data/settingsData";
import EditNicknameModal from "../components/modal/settings/EditNicknameModal";
import EditBioModal from "../components/modal/settings/EditBioModal";
import EditProfileImageModal from "../components/modal/settings/EditProfileImageModal";

export default function SettingsPage() {
  const [openNicknameModal, setOpenNicknameModal] = useState(false);
  const [openBioModal, setOpenBioModal] = useState(false);
  const [openProfileImageModal, setOpenProfileImageModal] = useState(false);

  const sectionsWithHandlers = useMemo(() => {
    return settingsSections.map((section) => ({
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
        return item;
      }),
    }));
  }, []);

  return (
    <>
      <SettingsHeader />

      {sectionsWithHandlers.map((section, index) => (
        <SettingsSection key={index} {...section} />
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
    </>
  );
}
