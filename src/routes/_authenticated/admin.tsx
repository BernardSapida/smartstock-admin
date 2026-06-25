import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGuard } from "@/features/auth/components/RoleGuard";

export const Route = createFileRoute("/_authenticated/admin")({
	component: () => (
		<RoleGuard allow="admin">
			<Outlet />
		</RoleGuard>
	),
});
