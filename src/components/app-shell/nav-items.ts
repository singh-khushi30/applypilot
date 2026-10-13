import {
  Briefcase,
  LayoutDashboard,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
};

export const appNav: AppNavItem[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/app/new", label: "New Analysis", icon: Plus, exact: false },
  { href: "/app/applications", label: "Applications", icon: Briefcase, exact: false },
  { href: "/app/contacts", label: "Contacts", icon: Users, exact: false },
];

export function isNavActive(pathname: string, item: AppNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
