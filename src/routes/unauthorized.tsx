import { Button } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { seo } from "@/config/seo.config";

export const Route = createFileRoute("/unauthorized")({
	head: () => ({
		meta: [{ title: seo.title("Unauthorized") }, { name: "robots", content: "noindex" }],
	}),
	component: UnauthorizedPage,
});

function UnauthorizedPage() {
	const navigate = useNavigate();

	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
			<div className="text-center max-w-md">
				<div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
					<ShieldAlert size={40} />
				</div>
				<h1 className="text-3xl font-bold text-app-secondary mb-4">Unauthorized Access</h1>
				<p className="text-app-secondary/60 mb-8 leading-relaxed">
					You don't have the required permissions to view this page. Please contact your administrator if you believe
					this is an error.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Button
						className="bg-app-brand text-app-base font-bold rounded-xl px-8 h-12"
						onPress={() => navigate({ to: "/" })}
					>
						Back to Home
					</Button>
					<Button
						className="text-app-brand border-app-brand/20 rounded-xl px-8 h-12"
						onPress={() => navigate({ to: "/profile" })}
						variant="outline"
					>
						My Profile
					</Button>
				</div>
			</div>
		</div>
	);
}
