import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
	icon: LucideIcon;
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	className?: string;
}

export function PageHeader({ icon: Icon, title, description, actions, className }: PageHeaderProps) {
	return (
		<div className={`flex flex-wrap items-center justify-between gap-3 ${className ?? ""}`}>
			<div className="flex min-w-0 items-center gap-3">
				<Icon className="h-7 w-7 shrink-0 text-app-brand" />
				<div className="min-w-0">
					<h1 className="text-2xl font-bold text-foreground">{title}</h1>
					{description && <p className="text-sm text-foreground/60">{description}</p>}
				</div>
			</div>
			{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
		</div>
	);
}
