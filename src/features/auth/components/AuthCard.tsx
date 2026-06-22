import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { APP_CONFIG } from "@/utils/config";

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
			<div className="flex w-full max-w-[1000px] bg-app-base rounded-[2rem] overflow-hidden shadow-2xl border border-app-brand/10 min-h-[600px]">
				{/* Left Side: Image Background */}
				<div className="hidden lg:block w-1/2 relative overflow-hidden">
					<img
						alt="Auth Background"
						className="absolute inset-0 w-full h-full object-cover"
						src="/assets/images/auth-bg.png"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-app-secondary/80 to-transparent p-12 flex flex-col justify-end">
						<motion.h2
							animate={{ y: 0, opacity: 1 }}
							className="text-white text-3xl font-bold mb-4"
							initial={{ y: 20, opacity: 0 }}
							transition={{ delay: 0.2 }}
						>
							{APP_CONFIG.APP_NAME}
						</motion.h2>
						<motion.p
							animate={{ y: 0, opacity: 1 }}
							className="text-white/80 text-lg leading-relaxed max-w-sm"
							initial={{ y: 20, opacity: 0 }}
							transition={{ delay: 0.3 }}
						>
							Start simple, ship quickly. Experience the ultimate REST template built with TanStack Start.
						</motion.p>
					</div>
				</div>

				{/* Right Side: Form */}
				<div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
					<div className="mb-8">
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
		</div>
	);
}
