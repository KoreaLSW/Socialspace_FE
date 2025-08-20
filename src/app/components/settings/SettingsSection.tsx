import { SettingsSection as SettingsSectionType } from "../../../types/settings";
import SettingsItem from "./SettingsItem";

interface SettingsSectionProps extends SettingsSectionType {}

export default function SettingsSection({
  title,
  icon: Icon,
  items,
}: SettingsSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="text-blue-500" size={24} />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <SettingsItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
}
