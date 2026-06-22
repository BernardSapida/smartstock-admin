import { Alert, Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";

interface QueryErrorProps {
	message?: string;
	onRetry?: () => void;
}

/**
 * A professional error state visualizer for data synchronization failures.
 */
export function QueryError({ message, onRetry }: QueryErrorProps) {
	return (
		<Alert
			className="border-none bg-danger/5 p-6 rounded-2xl"
			status="danger"
		>
			<Alert.Indicator />
			<Alert.Content className="flex flex-col gap-4">
				<div>
					<Alert.Title className="font-bold text-lg text-danger">Data Synchronization Failed</Alert.Title>
					<Alert.Description className="mt-1 text-sm opacity-90">
						{message ||
							"An unexpected error occurred while communicating with the server. Ensure your session is active and check your network connection."}
					</Alert.Description>
				</div>
				{onRetry && (
					<div>
						<Button
							className="font-bold flex items-center gap-2 px-6"
							onPress={onRetry}
							size="sm"
							variant="danger"
						>
							<RefreshCw className="h-4 w-4" />
							Retry Request
						</Button>
					</div>
				)}
			</Alert.Content>
		</Alert>
	);
}
