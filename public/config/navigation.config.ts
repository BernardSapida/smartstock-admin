import { LayoutDashboard, type LucideIcon, Settings, ShieldCheck, UserCircle, Users } from "lucide-react";
import type { UserRole } from "@/utils/config";

// --- Types ---

export interface NavItem {
	href: string;
	title: string;
	description: string;
	icon: LucideIcon;
	roles: UserRole[]; // which roles can see this item
	exact?: boolean; // match href exactly for active state (default: false)
	children?: NavItem[]; // submenu items — inherit parent roles if not specified
}

// --- Navigation items ---
// roles: list every role that can see this item.
// Different roles can share the same href — just include all of them in roles[].
// For submenu items, roles are checked independently per child.

export const navigationItems: NavItem[] = [
	{
		href: "/dashboard",
		title: "Dashboard",
		description: "Overview and summary",
		icon: LayoutDashboard,
		roles: ["ADMIN", "USER"],
		exact: true,
	},
	{
		href: "/dashboard/admin",
		title: "Admin",
		description: "Admin controls and settings",
		icon: ShieldCheck,
		roles: ["ADMIN"],
		children: [
			{
				href: "/dashboard/admin/users",
				title: "Users",
				description: "Manage user accounts",
				icon: Users,
				roles: ["ADMIN"],
			},
			{
				href: "/dashboard/admin/settings",
				title: "Settings",
				description: "App-wide configuration",
				icon: Settings,
				roles: ["ADMIN"],
			},
		],
	},
	{
		href: "/dashboard/profile",
		title: "Profile",
		description: "Your account and preferences",
		icon: UserCircle,
		roles: ["ADMIN", "USER"],
	},
];

// --- Helper: filter items by role ---
// Pass the current user's role to get their visible menu.
// Recursively filters children too — a child hidden from a role
// will not appear even if the parent is visible.

export const getNavigation = (role: UserRole): NavItem[] => {
	const filterItems = (items: NavItem[]): NavItem[] =>
		items
			.filter((item) => item.roles.includes(role))
			.map((item) => ({
				...item,
				children: item.children ? filterItems(item.children) : undefined,
			}));

	return filterItems(navigationItems);
};
