import { X } from "lucide-react";

interface User {
  id?: string;
  email?: string;
  username?: string;
  nickname?: string;
  profileImage?: string;
}

interface ModalHeaderProps {
  user: User | null;
  onClose: () => void;
}

export default function ModalHeader({ user, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt="프로필 이미지"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">
              {user?.nickname?.charAt(0) || user?.username?.charAt(0) || "사"}
            </span>
          </div>
        )}
        <span className="font-semibold text-gray-900 dark:text-white">
          {user?.nickname || user?.username || "사용자명"}
        </span>
      </div>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <X size={20} />
      </button>
    </div>
  );
}
