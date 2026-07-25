import { Button, Surface } from "@heroui/react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect } from "react";
import { AppMobileDrawer } from "@/components/layout/AppMobileDrawer";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { CardUser } from "@/components/layout/CardUser";
import { AppBreadcrumbs } from "@/components/ui/AppBreadcrumbs";
import { AppSpinner } from "@/components/ui/AppSpinner";
import { getNavigation } from "@/config/navigation.config";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { useLogout } from "@/features/auth/hooks/use-firebase-auth";
import { useNotifications } from "@/features/notifications/use-notifications";
import { useSyncSpoonDefaults } from "@/features/settings/settings";
import { useRouteBreadcrumbs } from "@/hooks/useRouteBreadcrumbs";
import { useUIStore } from "@/store/ui.store";

export const Route = createFileRoute("/_authenticated")({
	component: AppLayout,
});

function AppLayout() {
	const { profile, loading, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const onLogout = useLogout();
	const breadcrumbs = useRouteBreadcrumbs();
	const { toggleSidebar } = useUIStore();

	// Live unread count for the nav badge (called before the early return so the
	// hook order stays stable; the hook no-ops while role is undefined).
	const { unreadCount } = useNotifications(profile?.role);

	// Push the global spoon-conversion table into the units module app-wide, so
	// recipe math on every screen resolves the same densities as mobile.
	useSyncSpoonDefaults();

	// Client-side guard: Firebase auth state resolves on the client.
	useEffect(() => {
		if (!loading && !isAuthenticated) {
			navigate({ to: "/sign-in" });
		}
	}, [loading, isAuthenticated, navigate]);

	if (loading || !profile) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-app-base">
				<AppSpinner />
			</div>
		);
	}

	const navigation = getNavigation(profile.role);
	const cardUser = { name: profile.fullName || "User", email: profile.email };

	return (
		<div className="min-h-screen flex bg-app-base antialiased text-left">
			<AppSidebar
				bottom={
					<CardUser
						onLogout={onLogout}
						user={cardUser}
					/>
				}
				navigation={navigation}
				unreadCount={unreadCount}
			/>
			<AppMobileDrawer
				bottom={
					<CardUser
						onLogout={onLogout}
						user={cardUser}
					/>
				}
				navigation={navigation}
				unreadCount={unreadCount}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col lg:pl-72 text-left">
				{/* Top Navbar - hamburger opens the mobile drawer (hidden on desktop). */}
				<Surface
					className="h-20 bg-app-base/80 backdrop-blur-md border-b border-text-primary/5 px-8 lg:px-12 flex items-center sticky top-0 z-40 rounded-none"
					variant="default"
				>
					<div className="mx-auto w-full flex items-center gap-3">
						<div className="lg:hidden">
							<Button
								aria-label="Open menu"
								className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-app-brand/5 transition-colors"
								onPress={toggleSidebar}
								variant="ghost"
							>
								<Menu className="h-5 w-5" />
							</Button>
						</div>
						<AppBreadcrumbs items={breadcrumbs} />
					</div>
				</Surface>

				<main
					aria-label="Application content"
					className="flex-1 p-8 lg:p-12 overflow-y-auto bg-app-base"
				>
					<div className="mx-auto text-left">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}
