import { Label, ProgressBar } from "@heroui/react";
import type { ComponentProps } from "react";

type ProgressBarColor = ComponentProps<typeof ProgressBar>["color"];
type ProgressBarSize = ComponentProps<typeof ProgressBar>["size"];

interface AppProgressBarProps {
	value?: number;
	label?: string;
	showValueLabel?: boolean;
	color?: ProgressBarColor;
	size?: ProgressBarSize;
	isIndeterminate?: boolean;
	className?: string;
}

export function AppProgressBar({
	value = 0,
	label,
	showValueLabel = false,
	color,
	size,
	isIndeterminate = false,
	className,
}: AppProgressBarProps) {
	return (
		<ProgressBar
			aria-label={label ?? "Progress"}
			className={className}
			color={color}
			isIndeterminate={isIndeterminate}
			size={size}
			value={isIndeterminate ? undefined : value}
		>
			{label && <Label>{label}</Label>}
			{showValueLabel && !isIndeterminate && <ProgressBar.Output />}
			<ProgressBar.Track>
				<ProgressBar.Fill />
			</ProgressBar.Track>
		</ProgressBar>
	);
}
