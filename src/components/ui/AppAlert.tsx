import { Alert, CloseButton } from "@heroui/react";
import type { LucideIcon } from "lucide-react";

type AlertStatus = "default" | "accent" | "success" | "warning" | "danger";

interface AppAlertProps {
	description: string;
	title?: string;
	status?: AlertStatus;
	onClose?: () => void;
	icon?: LucideIcon;
	className?: string;
}

export function AppAlert({ description, title, status = "default", onClose, icon: Icon, className }: AppAlertProps) {
	return (
		<Alert
			className={className}
			status={status}
		>
			{Icon ? (
				<Alert.Indicator>
					<Icon className="size-4" />
				</Alert.Indicator>
			) : (
				<Alert.Indicator />
			)}
			<Alert.Content>
				{title && <Alert.Title>{title}</Alert.Title>}
				<Alert.Description>{description}</Alert.Description>
			</Alert.Content>
			{onClose && <CloseButton onPress={onClose} />}
		</Alert>
	);
}
