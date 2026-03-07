import { Crown, Edit2, Eye } from "lucide-react";

export const brutalBtnSm =
  "bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-brand-blue transition-all duration-150 h-8 px-3 rounded-lg text-xs";

export const roleConfig = {
  admin: {
    label: "Admin",
    cls: "bg-brand-lemon border-[#1A1A1A] text-[#111]",
    Icon: Crown,
  },
  editor: {
    label: "Editor",
    cls: "bg-brand-mint border-[#1A1A1A] text-[#111]",
    Icon: Edit2,
  },
  viewer: {
    label: "Viewer",
    cls: "bg-[#e5e7eb] border-[#1A1A1A] text-[#6B7280]",
    Icon: Eye,
  },
} as const;
