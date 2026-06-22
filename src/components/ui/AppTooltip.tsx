import { Tooltip } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

type TooltipPlacement = ComponentProps<typeof Tooltip.Content>["placement"];

interface AppTooltipProps {
	content: ReactNode;
	children: ReactNode;
	placement?: TooltipPlacement;
	delay?: number;
	showArrow?: boolean;
	className?: string;
}

export function AppTooltip({
	content,
	children,
	placement,
	delay = 300,
	showArrow = false,
	className,
}: AppTooltipProps) {
	return (
		<Tooltip delay={delay}>
			{children}
			<Tooltip.Content
				className={className}
				placement={placement}
				showArrow={showArrow}
			>
				{showArrow && <Tooltip.Arrow />}
				{typeof content === "string" ? <p>{content}</p> : content}
			</Tooltip.Content>
		</Tooltip>
	);
}
