import { Breadcrumbs } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
	key: string;
	label: string;
	href?: string;
	icon?: LucideIcon;
}

interface AppBreadcrumbsProps {
	items: BreadcrumbItem[];
	separator?: ReactNode;
	className?: string;
}

export function AppBreadcrumbs({ items, separator, className }: AppBreadcrumbsProps) {
	return (
		<Breadcrumbs
			className={className}
			separator={separator}
		>
			{items.map((item, index) => {
				const isLast = index === items.length - 1;
				return (
					<Breadcrumbs.Item
						href={isLast ? undefined : item.href}
						key={item.key}
					>
						{item.icon && <item.icon className="size-3.5" />}
						{item.label}
					</Breadcrumbs.Item>
				);
			})}
		</Breadcrumbs>
	);
}
