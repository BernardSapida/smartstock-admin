import type { ReactNode } from "react";

interface AuthPageShellProps {
	children: ReactNode;
}

export function AuthPageShell({ children }: AuthPageShellProps) {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6 bg-app-base relative overflow-hidden">
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-[120%] -z-10 opacity-30 pointer-events-none">
				<div className="absolute top-[10%] right-[20%] h-96 w-96 rounded-full bg-app-brand/20 blur-3xl animate-pulse" />
				<div className="absolute bottom-[20%] left-[30%] h-64 w-64 rounded-full bg-app-accent/20 blur-3xl animate-pulse delay-500" />
			</div>
			{children}
		</div>
	);
}
