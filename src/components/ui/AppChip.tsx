import { Chip } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

type ChipColor = ComponentProps<typeof Chip>["color"];
type ChipVariant = ComponentProps<typeof Chip>["variant"];
type ChipSize = ComponentProps<typeof Chip>["size"];

interface AppChipProps {
	label: string;
	color?: ChipColor;
	variant?: ChipVariant;
	size?: ChipSize;
	startContent?: ReactNode;
	className?: string;
}

export function AppChip({ label, color, variant, size, startContent, className }: AppChipProps) {
	return (
		<Chip
			className={className}
			color={color}
			size={size}
			variant={variant}
		>
			{startContent}
			{label}
		</Chip>
	);
}
