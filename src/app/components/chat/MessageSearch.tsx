interface MessageSearchProps {
  isOpen: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

export default function MessageSearch({
  isOpen,
  searchQuery,
  onSearchChange,
  onClearSearch,
}: MessageSearchProps) {
  if (!isOpen) return null;

  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="메시지 검색..."
          className="w-full px-4 py-2 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
        {searchQuery && (
          <button
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
