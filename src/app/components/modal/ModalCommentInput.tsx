interface User {
  id?: string;
  email?: string;
  username?: string;
  nickname?: string;
  profileImage?: string;
}

interface ModalCommentInputProps {
  user: User | null;
}

export default function ModalCommentInput({ user }: ModalCommentInputProps) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center space-x-3">
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt="프로필 이미지"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-xs font-medium">
              {user?.nickname?.charAt(0) || user?.username?.charAt(0) || "사"}
            </span>
          </div>
        )}
        <input
          type="text"
          placeholder="댓글 달기..."
          className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
        />
        <button className="text-blue-500 font-semibold hover:text-blue-600 text-sm">
          게시
        </button>
      </div>
    </div>
  );
}
