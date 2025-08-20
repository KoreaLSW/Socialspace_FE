import { useState, useEffect } from "react";
import { MoreVertical, Edit, Trash2 } from "lucide-react";

interface PostActionsProps {
  isAuthor: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PostActions({
  isAuthor,
  onEdit,
  onDelete,
}: PostActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDropdown && !target.closest(".dropdown-container")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  if (!isAuthor) return null;

  return (
    <div className="relative dropdown-container">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="게시글 메뉴"
      >
        <MoreVertical size={20} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          <button
            onClick={() => {
              setShowDropdown(false);
              onEdit?.();
            }}
            className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
          >
            <Edit size={16} />
            <span>수정</span>
          </button>
          <button
            onClick={() => {
              setShowDropdown(false);
              onDelete?.();
            }}
            className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 transition-colors"
          >
            <Trash2 size={16} />
            <span>삭제</span>
          </button>
        </div>
      )}
    </div>
  );
}
