import { ProgressCircle } from "@heroui/react";
import type { ComponentProps } from "react";

type ProgressCircleColor = ComponentProps<typeof ProgressCircle>["color"];
type ProgressCircleSize = ComponentProps<typeof ProgressCircle>["size"];

interface AppProgressCircleProps {
	value?: number;
	label?: string;
	color?: ProgressCircleColor;
	size?: ProgressCircleSize;
	isIndeterminate?: boolean;
	className?: string;
}

export function AppProgressCircle({
	value = 0,
	label,
	color,
	size,
	isIndeterminate = false,
	className,
}: AppProgressCircleProps) {
	return (
		<div className={className ?? "flex flex-col items-center gap-2"}>
			<ProgressCircle
				aria-label={label ?? "Progress"}
				color={color}
				isIndeterminate={isIndeterminate}
				size={size}
				value={isIndeterminate ? undefined : value}
			>
				<ProgressCircle.Track>
					<ProgressCircle.TrackCircle />
					<ProgressCircle.FillCircle />
				</ProgressCircle.Track>
			</ProgressCircle>
			{label && <span className="text-xs text-text-secondary">{label}</span>}
		</div>
	);
}
