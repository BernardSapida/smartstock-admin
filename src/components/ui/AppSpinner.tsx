import { Spinner } from "@heroui/react";
import type { ComponentProps } from "react";

type SpinnerSize = ComponentProps<typeof Spinner>["size"];
type SpinnerColor = ComponentProps<typeof Spinner>["color"];

interface AppSpinnerProps {
	size?: SpinnerSize;
	color?: SpinnerColor;
	label?: string;
	className?: string;
}

export function AppSpinner({ size = "md", color, label, className }: AppSpinnerProps) {
	return (
		<div className="flex flex-col items-center gap-2">
			<Spinner
				aria-label={label ?? "Loading"}
				className={className}
				color={color}
				size={size}
			/>
			{label && <span className="text-xs text-text-secondary">{label}</span>}
		</div>
	);
}
