import { ChevronRight } from "lucide-react";
import { SettingsOption as SettingsOptionType } from "../../../types/settings";

interface SettingsOptionProps extends SettingsOptionType {}

export default function SettingsOption({
  icon: Icon,
  label,
  description,
  danger,
  onClick,
}: SettingsOptionProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors ${
        danger ? "hover:bg-red-50 dark:hover:bg-red-900/20" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <Icon className={danger ? "text-red-500" : "text-gray-500"} size={20} />
        <div>
          <h3
            className={`font-medium ${
              danger
                ? "text-red-600 dark:text-red-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {label}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
