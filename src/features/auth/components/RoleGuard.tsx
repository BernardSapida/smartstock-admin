// Per-route role guard. Use inside a route under /_authenticated.
// Redirects a signed-in user to their own home if they hit the wrong area.

import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { AppSpinner } from "@/components/ui/AppSpinner";
import { getDefaultRoute } from "@/config/navigation.config";
import type { UserRole } from "@/types/user";
import { useAuth } from "../context/AuthProvider";

export function RoleGuard({ allow, children }: { allow: UserRole; children: ReactNode }) {
	const { profile, loading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!loading && profile && profile.role !== allow) {
			navigate({ to: getDefaultRoute(profile.role) });
		}
	}, [loading, profile, allow, navigate]);

	if (loading || !profile || profile.role !== allow) {
		return (
			<div className="flex items-center justify-center py-20">
				<AppSpinner />
			</div>
		);
	}

	return <>{children}</>;
}
