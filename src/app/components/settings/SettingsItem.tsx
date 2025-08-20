import { ChevronRight } from "lucide-react";
import { SettingsItem as SettingsItemType } from "../../../types/settings";

interface SettingsItemProps extends SettingsItemType {}

export default function SettingsItem({
  label,
  description,
  onClick,
}: SettingsItemProps) {
  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white">{label}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
