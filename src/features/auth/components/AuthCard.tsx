import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface AuthCardProps {
	children: ReactNode;
	title: string;
	subtitle: string;
	footerText: string;
	footerLinkText: string;
	footerLinkTo: string;
}

export default function AuthCard({
	children,
	title,
	subtitle,
	footerText,
	footerLinkText,
	footerLinkTo,
}: AuthCardProps) {
	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
			<div className="w-full max-w-md bg-app-base rounded-[2rem] shadow-2xl border border-app-brand/10 p-8 md:p-12 flex flex-col">
				<div className="mb-8 flex flex-col items-center text-center">
					<BrandLogo className="h-16 w-16 mb-4" />
					<h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
					<p className="text-foreground/60">{subtitle}</p>
				</div>

				<div className="flex-1">{children}</div>

				<div className="mt-8 pt-6 border-t border-app-brand/10 text-center">
					<p className="text-sm text-foreground/60">
						{footerText}{" "}
						<Link
							className="text-app-brand font-bold hover:underline underline-offset-4"
							to={footerLinkTo}
						>
							{footerLinkText}
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
