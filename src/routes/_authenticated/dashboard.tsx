import { Button, Surface } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Shield, User } from "lucide-react";
import { seo } from "@/config/seo.config";
import { useUser } from "@/features/auth/hooks/use-auth-queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
	head: () => ({
		meta: [{ title: seo.title("Dashboard") }, { name: "robots", content: "noindex" }],
	}),
	staticData: {
		breadcrumb: "Dashboard",
	},
	component: DashboardPage,
});

function DashboardPage() {
	const { data: user } = useUser();
	const navigate = useNavigate();

	if (!user) return null;

	return (
		<div className="flex flex-col gap-8">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-4xl font-bold text-foreground mb-2">Welcome back, {user.firstName}!</h1>
					<p className="text-foreground/60">Here's an overview of your account.</p>
				</div>
				<div className="px-4 py-2 bg-app-brand/10 text-app-brand rounded-full text-sm font-bold flex items-center gap-2">
					<Shield size={16} />
					{user.userType.toUpperCase()}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<Surface className="p-8 rounded-[2rem] border border-app-brand/10 shadow-lg hover:shadow-xl transition-shadow group">
					<div className="w-12 h-12 rounded-2xl bg-app-brand/10 flex items-center justify-center text-app-brand mb-6 group-hover:scale-110 transition-transform">
						<User size={24} />
					</div>
					<h3 className="text-xl font-bold text-foreground mb-2">My Profile</h3>
					<p className="text-foreground/60 mb-6">Manage your personal information and account settings.</p>
					<Button
						className="bg-app-brand text-app-base font-bold rounded-xl w-full"
						onPress={() => navigate({ to: "/profile" })}
					>
						Go to Profile
					</Button>
				</Surface>

				<Surface className="p-8 rounded-[2rem] border border-app-brand/10 shadow-lg bg-app-brand/5">
					<div className="w-12 h-12 rounded-2xl bg-app-brand flex items-center justify-center text-app-base mb-6">
						<LayoutDashboard size={24} />
					</div>
					<h3 className="text-xl font-bold text-foreground mb-2">Overview</h3>
					<p className="text-foreground/60 mb-6">Quick stats and recent activity on your account.</p>
					<div className="h-20 flex items-center justify-center border-2 border-dashed border-app-brand/20 rounded-2xl text-app-brand/40 text-sm font-medium italic">
						Stats Coming Soon
					</div>
				</Surface>
			</div>
		</div>
	);
}
