import { Button } from "@heroui/react";
import { Link } from "@tanstack/react-router";

export function NotFound() {
	return (
		<div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-app-base relative overflow-hidden">
			{/* Background Glow */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-[120%] -z-10 opacity-30 pointer-events-none">
				<div className="absolute top-[10%] left-[20%] h-96 w-96 rounded-full bg-app-brand/20 blur-3xl animate-pulse" />
				<div className="absolute bottom-[20%] right-[30%] h-64 w-64 rounded-full bg-app-accent/20 blur-3xl animate-pulse delay-500" />
			</div>

			<div className="rise-in flex flex-col items-center max-w-lg mb-24">
				<h1 className="text-[12rem] font-black text-app-brand/10 leading-none select-none">404</h1>
				<h2 className="text-5xl font-bold text-text-primary -mt-8 mb-6 tracking-tight">Lost at Sea?</h2>

				<p className="text-lg text-text-secondary font-medium leading-relaxed mb-12 max-w-sm">
					We couldn't find the page you're searching for. It might have drifted away or never existed in these waters.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
					<Link to="/">
						<Button className="bg-app-brand h-14 px-12 rounded-2xl text-lg font-bold shadow-xl shadow-app-brand/20 text-white w-full sm:w-auto">
							Return to Shore
						</Button>
					</Link>
					<Link to="/dashboard">
						<Button
							className="h-14 px-12 rounded-2xl border-text-primary/10 hover:border-text-primary/20 font-bold text-text-primary w-full sm:w-auto"
							variant="outline"
						>
							Go to Dashboard
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
