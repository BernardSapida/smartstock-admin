import { Surface } from "@heroui/react";
import type { LucideIcon } from "lucide-react";

export function StatCard({
	icon: Icon,
	label,
	value,
	tone = "default",
}: {
	icon: LucideIcon;
	label: string;
	value: string | number;
	tone?: "default" | "warning" | "danger" | "success";
}) {
	const toneClass =
		tone === "danger"
			? "text-danger"
			: tone === "warning"
				? "text-warning"
				: tone === "success"
					? "text-success"
					: "text-app-brand";
	return (
		<Surface
			className="flex items-center gap-4 rounded-2xl p-5"
			variant="secondary"
		>
			<div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-app-brand/10 ${toneClass}`}>
				<Icon className="h-6 w-6" />
			</div>
			<div>
				<p className="text-2xl font-bold text-foreground">{value}</p>
				<p className="text-xs text-foreground/60">{label}</p>
			</div>
		</Surface>
	);
}
