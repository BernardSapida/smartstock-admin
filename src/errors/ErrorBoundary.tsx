import { Button } from "@heroui/react";
import { Component, type ReactNode } from "react";
import { ERROR_MESSAGES } from "./error-messages";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback ?? (
					<div className="p-4 text-danger">
						<p>{ERROR_MESSAGES.GENERIC}</p>
						<p className="text-sm opacity-70">{this.state.error?.message}</p>
					</div>
				)
			);
		}
		return this.props.children;
	}
}

interface RouteErrorFallbackProps {
	error: Error;
	reset: () => void;
}

export function RouteErrorFallback({ error, reset }: RouteErrorFallbackProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 text-center">
			<div className="flex flex-col gap-2 max-w-md">
				<h2 className="text-2xl font-bold text-text-primary">Something went wrong</h2>
				<p className="text-text-secondary">{error.message || ERROR_MESSAGES.GENERIC}</p>
			</div>
			<Button
				onPress={reset}
				variant="primary"
			>
				Try again
			</Button>
		</div>
	);
}
