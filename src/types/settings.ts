import { LucideIcon } from "lucide-react";

export interface SettingsItem {
  label: string;
  description: string;
  onClick?: () => void;
}

export interface SettingsSection {
  title: string;
  icon: LucideIcon;
  items: SettingsItem[];
}

export interface SettingsOption {
  icon: LucideIcon;
  label: string;
  description: string;
  danger?: boolean;
  onClick?: () => void;
}
