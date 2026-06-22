import { ToggleButton } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

type ToggleButtonVariant = ComponentProps<typeof ToggleButton>["variant"];
type ToggleButtonSize = ComponentProps<typeof ToggleButton>["size"];

interface AppToggleButtonProps {
	isSelected: boolean;
	onChange: (isSelected: boolean) => void;
	children: ReactNode;
	variant?: ToggleButtonVariant;
	size?: ToggleButtonSize;
	isDisabled?: boolean;
	isIconOnly?: boolean;
	className?: string;
}

export function AppToggleButton({
	isSelected,
	onChange,
	children,
	variant,
	size,
	isDisabled,
	isIconOnly,
	className,
}: AppToggleButtonProps) {
	return (
		<ToggleButton
			className={className}
			isDisabled={isDisabled}
			isIconOnly={isIconOnly}
			isSelected={isSelected}
			onChange={onChange}
			size={size}
			variant={variant}
		>
			{children}
		</ToggleButton>
	);
}
