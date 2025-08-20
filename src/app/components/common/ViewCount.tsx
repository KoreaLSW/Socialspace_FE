import { Eye } from "lucide-react";

interface ViewCountProps {
  count?: number;
  className?: string;
  iconSize?: number;
}

export default function ViewCount({
  count,
  className = "",
  iconSize = 12,
}: ViewCountProps) {
  if (typeof count !== "number") return null;
  return (
    <div
      className={`flex items-center text-gray-500 dark:text-gray-400 ${className}`}
    >
      <Eye size={iconSize} />
      <span className="ml-1">{count}</span>
    </div>
  );
}
