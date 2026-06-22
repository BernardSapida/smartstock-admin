import { Popover } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

type PopoverPlacement = ComponentProps<typeof Popover.Content>["placement"];

interface AppPopoverProps {
	trigger: ReactNode;
	children: ReactNode;
	title?: string;
	placement?: PopoverPlacement;
	showArrow?: boolean;
	className?: string;
}

export function AppPopover({ trigger, children, title, placement, showArrow = false, className }: AppPopoverProps) {
	return (
		<Popover>
			{trigger}
			<Popover.Content
				className={className}
				placement={placement}
			>
				<Popover.Dialog>
					{showArrow && <Popover.Arrow />}
					{title && <Popover.Heading>{title}</Popover.Heading>}
					{children}
				</Popover.Dialog>
			</Popover.Content>
		</Popover>
	);
}
