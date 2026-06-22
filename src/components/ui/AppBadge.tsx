import { Badge } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

type BadgeColor = ComponentProps<typeof Badge>["color"];
type BadgeVariant = ComponentProps<typeof Badge>["variant"];
type BadgePlacement = ComponentProps<typeof Badge>["placement"];
type BadgeSize = ComponentProps<typeof Badge>["size"];

interface AppBadgeProps {
	children: ReactNode;
	content?: ReactNode;
	color?: BadgeColor;
	variant?: BadgeVariant;
	placement?: BadgePlacement;
	size?: BadgeSize;
	isInvisible?: boolean;
	className?: string;
}

export function AppBadge({
	children,
	content,
	color = "danger",
	variant,
	placement,
	size,
	isInvisible,
	className,
}: AppBadgeProps) {
	return (
		<Badge.Anchor className={className}>
			{children}
			{!isInvisible && (
				<Badge
					color={color}
					placement={placement}
					size={size}
					variant={variant}
				>
					{content}
				</Badge>
			)}
		</Badge.Anchor>
	);
}
