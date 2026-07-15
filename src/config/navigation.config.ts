import {
	Bell,
	Boxes,
	ChefHat,
	ClipboardCheck,
	Clock,
	Factory,
	FileBarChart,
	LayoutDashboard,
	type LucideIcon,
	ScrollText,
	Settings,
	TrendingDown,
} from "lucide-react";
import type { UserRole } from "@/types/user";

// --- Types ---

export interface NavItem {
	href: string;
	title: string;
	description: string;
	icon: LucideIcon;
	roles: UserRole[]; // which roles can see this item
	exact?: boolean; // match href exactly for active state (default: false)
	children?: NavItem[]; // submenu items
}

// --- Navigation items ---
// Each role gets its own section. More items are added in later MVPs
// (inventory, recipes, expiry, reports, settings, profile).

export const navigationItems: NavItem[] = [
	{
		href: "/admin",
		title: "Dashboard",
		description: "Overview and summary",
		icon: LayoutDashboard,
		roles: ["admin"],
		exact: true,
	},
	{
		href: "/admin/inventory",
		title: "Inventory",
		description: "Products and stock batches",
		icon: Boxes,
		roles: ["admin"],
	},
	{
		href: "/admin/recipes",
		title: "Recipes",
		description: "Recipes and availability",
		icon: ChefHat,
		roles: ["admin"],
	},
	{
		href: "/admin/production",
		title: "Production",
		description: "What staff prepared",
		icon: Factory,
		roles: ["admin"],
	},
	{
		href: "/admin/forecast",
		title: "Forecast",
		description: "Days of stock left per ingredient",
		icon: TrendingDown,
		roles: ["admin"],
	},
	{
		href: "/admin/expiry",
		title: "Expiry Tracker",
		description: "Batches by expiry",
		icon: Clock,
		roles: ["admin"],
	},
	{
		href: "/admin/notifications",
		title: "Notifications",
		description: "System notifications",
		icon: Bell,
		roles: ["admin"],
	},
	{
		href: "/admin/inspections",
		title: "Inspections",
		description: "Assign and review stock inspections",
		icon: ClipboardCheck,
		roles: ["admin"],
	},
	{
		href: "/admin/reports",
		title: "Reports",
		description: "Restock, cook, production, expiry",
		icon: FileBarChart,
		roles: ["admin"],
	},
	{
		href: "/admin/audit-logs",
		title: "Audit Logs",
		description: "System activity trail",
		icon: ScrollText,
		roles: ["admin"],
	},
	{
		href: "/admin/settings",
		title: "Settings",
		description: "Config, users, permissions",
		icon: Settings,
		roles: ["admin"],
	},
];

// --- Helper: filter items by role ---

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

/**
 * Default landing route per role after a successful login.
 */
export const getDefaultRoute = (role: UserRole): string => {
	// Staff have no web area - they belong on the mobile app. Send them to sign-in
	// (defensive; staff are already rejected at login).
	const defaultRoutes: Record<UserRole, string> = {
		admin: "/admin",
		staff: "/sign-in",
	};
	return defaultRoutes[role];
};
