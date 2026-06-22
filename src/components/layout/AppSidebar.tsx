import { Surface } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Layout } from "lucide-react";
import { APP_NAME } from "@/config/seo.config";

interface NavItem {
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	title: string;
}

interface AppSidebarProps {
	bottom?: React.ReactNode;
	navigation: NavItem[];
}

export function AppSidebar({ bottom, navigation }: AppSidebarProps) {
	return (
		<Surface
			className="hidden lg:flex flex-col w-72 h-screen fixed left-0 top-0 border-r border-text-primary/5 p-6 z-50 rounded-none shadow-none text-left bg-app-base"
			variant="secondary"
		>
			<div className="flex items-center gap-3 px-3 mb-12">
				<Link
					className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-brand text-white shadow-lg"
					to="/"
				>
					<Layout className="h-6 w-6" />
				</Link>
				<span className="font-serif text-xl font-bold tracking-tight">{APP_NAME}</span>
			</div>

			<nav
				aria-label="Main navigation"
				className="flex-1 space-y-1 overflow-y-auto"
			>
				{navigation.map((item) => (
					<Link
						activeProps={{ className: "bg-app-brand/10 text-app-brand" }}
						className="flex items-center gap-3 px-4 h-12 rounded-2xl transition-all duration-200 group hover:bg-app-brand/5 font-semibold"
						key={item.href}
						to={item.href}
					>
						<item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
						<span className="text-sm">{item.title}</span>
						<ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
					</Link>
				))}
			</nav>

			{bottom && <div className="mt-auto pt-8">{bottom}</div>}
		</Surface>
	);
}
