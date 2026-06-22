import { Button, Surface } from "@heroui/react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { AppMobileDrawer } from "@/components/layout/AppMobileDrawer";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { CardUser } from "@/components/layout/CardUser";
import { AppBreadcrumbs } from "@/components/ui/AppBreadcrumbs";
import { getNavigation } from "@/config/navigation.config";
import { useLogout } from "@/features/auth/hooks/use-auth-mutations";
import { useUser } from "@/features/auth/hooks/use-auth-queries";
import { getAccessToken } from "@/features/auth/utils/token.utils";
import { useRouteBreadcrumbs } from "@/hooks/useRouteBreadcrumbs";
import { useUIStore } from "@/store/ui.store";
import { USER_ROLES } from "@/utils/config";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async () => {
		const token = getAccessToken();
		if (!token) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: AppLayout,
});

function AppLayout() {
	const { data: user } = useUser();
	const breadcrumbs = useRouteBreadcrumbs();
	const { toggleSidebar } = useUIStore();
	const logout = useLogout();

	const role = user?.userType ?? USER_ROLES.USER;
	const navigation = getNavigation(role);

	const cardUser = {
		name: user ? `${user.firstName} ${user.lastName}` : "User",
		email: user?.email ?? "",
	};

	const onLogout = () => logout.mutate();

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
			/>
			<AppMobileDrawer
				bottom={
					<CardUser
						onLogout={onLogout}
						user={cardUser}
					/>
				}
				navigation={navigation}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col lg:pl-72 text-left">
				{/* Top Navbar */}
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
