import { Chip } from "@heroui/react";
import clsx from "clsx";
import type { ComponentProps } from "react";

type ChipColor = ComponentProps<typeof Chip>["color"];
type ChipSize = ComponentProps<typeof Chip>["size"];
type ChipVariant = ComponentProps<typeof Chip>["variant"];

interface StatusMapEntry {
	label: string;
	color: ChipColor;
}

interface StatusChipProps {
	status: string;
	statusMap: Record<string, StatusMapEntry>;
	size?: ChipSize;
	variant?: ChipVariant;
	className?: string;
}

export function StatusChip({ status, statusMap, size, variant, className }: StatusChipProps) {
	const entry = statusMap[status];

	return (
		<Chip
			className={clsx("capitalize", className)}
			color={entry?.color ?? "default"}
			size={size}
			variant={variant}
		>
			{entry?.label ?? status}
		</Chip>
	);
}
