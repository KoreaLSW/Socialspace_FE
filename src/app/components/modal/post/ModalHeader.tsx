import { X, MessageCircle } from "lucide-react";
import UserAvatar from "../../common/UserAvatar";
import UserNickName from "../../common/UserNickName";

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
  commentCount?: number;
  updatedAt?: string;
  isEdited?: boolean;
}

export default function ModalHeader({
  user,
  onClose,
  commentCount,
  updatedAt,
  isEdited,
}: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <UserAvatar
          src={user?.profileImage}
          alt="프로필 이미지"
          nameForInitial={user?.nickname || user?.username || "사"}
          size={32}
          profileUsername={user?.username}
        />
        <div className="flex flex-col items-start text-left">
          <UserNickName
            username={user?.username}
            name={user?.nickname || user?.username || "사용자명"}
            className="font-semibold text-gray-900 dark:text-white"
          />
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            {commentCount !== undefined && (
              <div className="flex items-center space-x-1">
                <MessageCircle size={14} />
                <span>{commentCount}개의 댓글</span>
              </div>
            )}
            {isEdited && updatedAt ? <span>· {updatedAt} (수정됨)</span> : null}
          </div>
        </div>
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
