import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import AuthCard from "@/features/auth/components/AuthCard";
import LoginForm from "@/features/auth/components/LoginForm";

export const Route = createFileRoute("/sign-in")({
	head: () => ({
		meta: [
			{ title: seo.title("Sign In") },
			{ name: "description", content: seo.description },
			{ name: "robots", content: "noindex" },
		],
		links: [{ rel: "canonical", href: `${seo.url}/sign-in` }],
	}),
	component: SignInPage,
});

function SignInPage() {
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
