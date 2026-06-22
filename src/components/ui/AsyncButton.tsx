import { Button, Spinner } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";

type ButtonVariant = ComponentProps<typeof Button>["variant"];
type ButtonSize = ComponentProps<typeof Button>["size"];

interface AsyncButtonProps {
	onPress: () => Promise<void>;
	children: ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
	startContent?: ReactNode;
	isDisabled?: boolean;
	className?: string;
}

export function AsyncButton({
	onPress,
	children,
	variant,
	size,
	startContent,
	isDisabled,
	className,
}: AsyncButtonProps) {
	const [isPending, setIsPending] = useState(false);

	const handlePress = async () => {
		setIsPending(true);
		try {
			await onPress();
		} finally {
			setIsPending(false);
		}
	};

	return (
		<Button
			className={className}
			isDisabled={isPending || isDisabled}
			isPending={isPending}
			onPress={handlePress}
			size={size}
			variant={variant}
		>
			{({ isPending: pending }) => (
				<>
					{pending ? (
						<Spinner
							color="current"
							size="sm"
						/>
					) : (
						startContent
					)}
					{children}
				</>
			)}
		</Button>
	);
}
