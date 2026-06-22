import { Button } from "@heroui/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Layout, X } from "lucide-react";
import { useEffect } from "react";
import { APP_NAME } from "@/config/seo.config";
import { useUIStore } from "@/store/ui.store";

interface NavItem {
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	title: string;
}

interface MobileDrawerProps {
	bottom?: React.ReactNode;
	navigation: NavItem[];
}

export function AppMobileDrawer({ bottom, navigation }: MobileDrawerProps) {
	const { isSidebarOpen, toggleSidebar } = useUIStore();
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	// Close drawer on route change
	useEffect(() => {
		if (isSidebarOpen) {
			toggleSidebar();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isSidebarOpen) {
				toggleSidebar();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isSidebarOpen, toggleSidebar]);

	return (
		<AnimatePresence>
			{isSidebarOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						animate={{ opacity: 1 }}
						className="fixed inset-0 z-50 bg-black/50 lg:hidden"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						onClick={toggleSidebar}
					/>

					{/* Drawer panel */}
					<motion.div
						animate={{ x: 0 }}
						className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-text-primary/5 bg-app-base p-6 lg:hidden"
						exit={{ x: -288 }}
						initial={{ x: -288 }}
						transition={{ ease: "easeInOut", duration: 0.25 }}
					>
						{/* Header */}
						<div className="flex items-center justify-between px-3 mb-12">
							<Link
								className="flex items-center gap-3 w-full"
								to="/"
							>
								<div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-app-brand text-white shadow-lg">
									<Layout className="h-6 w-6" />
								</div>
								<span className="font-serif text-xl font-bold tracking-tight">{APP_NAME}</span>
							</Link>
							<Button
								aria-label="Close menu"
								className="shrink-0"
								isIconOnly
								onPress={toggleSidebar}
								variant="ghost"
							>
								<X className="h-5 w-5" />
							</Button>
						</div>

						{/* Navigation */}
						<nav
							aria-label="Mobile navigation"
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
								</Link>
							))}
						</nav>

						{bottom && <div className="mt-auto pt-8">{bottom}</div>}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
