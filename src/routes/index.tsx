import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getDefaultRoute } from "@/config/navigation.config";
import AuthCard from "@/features/auth/components/AuthCard";
import LoginForm from "@/features/auth/components/LoginForm";
import { useAuth } from "@/features/auth/context/AuthProvider";

export const Route = createFileRoute("/")({
	component: IndexPage,
});

function IndexPage() {
	const { profile, loading, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (loading) return;
		if (isAuthenticated && profile) {
			navigate({ to: getDefaultRoute(profile.role) });
		}
	}, [loading, isAuthenticated, profile, navigate]);

	return (
		<AuthCard
			footerLinkText="Create one for free"
			footerLinkTo="/sign-up"
			footerText="Don't have an account?"
			subtitle="Sign in to manage your profile and dashboard."
			title="Welcome Back"
		>
			<LoginForm />
		</AuthCard>
	);
}
