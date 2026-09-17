import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, ShieldX, UserX } from "lucide-react";
import { seo } from "@/config/seo.config";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { useLogout } from "@/features/auth/hooks/use-firebase-auth";

export const Route = createFileRoute("/account-status")({
	head: () => ({
		meta: [{ title: seo.title("Account Status") }, { name: "robots", content: "noindex" }],
	}),
	component: AccountStatusPage,
});

function AccountStatusPage() {
	const { profile, loading } = useAuth();
	const onLogout = useLogout();

	const state = loading
		? null
		: profile?.status === "rejected"
			? {
					icon: ShieldX,
					title: "Registration rejected",
					message: "Your registration was not approved. Contact an administrator if you believe this is a mistake.",
				}
			: profile && (profile.isArchived || !profile.isActive)
				? {
						icon: UserX,
						title: "Account deactivated",
						message: "Your account has been deactivated. Contact an administrator to have it restored.",
					}
				: {
						icon: Clock,
						title: "Pending approval",
						message:
							"Your account is waiting for an administrator to approve it. You'll be able to sign in once approved.",
					};

	const Icon = state?.icon ?? Clock;

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="text-center max-w-md">
				<div className="w-20 h-20 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto mb-6">
					<Icon size={40} />
				</div>
				<h1 className="text-3xl font-bold text-app-secondary mb-4">{state?.title ?? "Checking your account…"}</h1>
				<p className="text-app-secondary/60 mb-8 leading-relaxed">{state?.message ?? ""}</p>
				<Button
					className="bg-app-brand text-app-base font-bold rounded-xl px-8 h-12"
					onPress={onLogout}
				>
					Sign Out
				</Button>
			</div>
		</div>
	);
}
