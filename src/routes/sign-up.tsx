import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import AuthCard from "@/features/auth/components/AuthCard";
import RegisterForm from "@/features/auth/components/RegisterForm";

export const Route = createFileRoute("/sign-up")({
	head: () => ({
		meta: [
			{ title: seo.title("Sign Up") },
			{ name: "description", content: seo.description },
			{ name: "robots", content: "noindex" },
		],
		links: [{ rel: "canonical", href: `${seo.url}/sign-up` }],
	}),
	component: SignUpPage,
});

function SignUpPage() {
	return (
		<AuthCard
			footerLinkText="Sign in instead"
			footerLinkTo="/sign-in"
			footerText="Already have an account?"
			subtitle="Create an account to get started with our platform."
			title="Join Us"
		>
			<RegisterForm />
		</AuthCard>
	);
}
