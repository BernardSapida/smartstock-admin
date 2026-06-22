interface ErrorContext {
	[key: string]: any;
}

export const logApiError = (error: any, endpoint: string, status?: number, context?: string) => {
	const errorDetails = {
		timestamp: new Date().toISOString(),
		endpoint,
		status,
		context,
		message: error?.message || "Unknown error",
		stack: error?.stack,
	};

	// Log to console in development
	if (process.env.NODE_ENV === "development") {
		console.error("🔴 API Error:", errorDetails);
	}

	// In production, send to error tracking service (e.g., Sentry)
	if (process.env.NODE_ENV === "production") {
		// Example: Sentry.captureException(error, { extra: errorDetails });
		console.error("[AUTH_API_ERROR]", JSON.stringify(errorDetails));
	}
};

/**
 * Log server-side errors with context for debugging
 */
export const logServerError = (error: unknown, context: string, additionalData?: ErrorContext): void => {
	const errorDetails = {
		timestamp: new Date().toISOString(),
		context: `[AUTH_SERVER_${context}]`,
		message: error instanceof Error ? error.message : "Unknown error",
		stack: error instanceof Error ? error.stack : undefined,
		...additionalData,
	};

	// Development: detailed console logs
	if (process.env.NODE_ENV === "development") {
		console.error("🔴 Server Error:", errorDetails);
	}

	// Production: structured logging for monitoring services
	if (process.env.NODE_ENV === "production") {
		// Send to error tracking (e.g., Sentry, LogRocket, CloudWatch)
		console.error(JSON.stringify(errorDetails));

		// Example: Sentry.captureException(error, { extra: errorDetails });
	}
};

/**
 * Log successful auth events for audit trail
 */
export const logAuthEvent = (event: string, userId?: string, additionalData?: ErrorContext): void => {
	const eventDetails = {
		timestamp: new Date().toISOString(),
		event: `[AUTH_EVENT_${event}]`,
		userId,
		...additionalData,
	};

	if (process.env.NODE_ENV === "development") {
		console.log("✅ Auth Event:", eventDetails);
	}

	if (process.env.NODE_ENV === "production") {
		// Send to analytics or audit logging service
		console.log(JSON.stringify(eventDetails));
	}
};

/**
 * Log client-side errors with context for debugging
 */
export const logClientError = (error: unknown, context: string, additionalData?: ErrorContext): void => {
	const errorDetails = {
		timestamp: new Date().toISOString(),
		context: `[AUTH_CLIENT_${context}]`,
		message: error instanceof Error ? error.message : "Unknown error",
		stack: error instanceof Error ? error.stack : undefined,
		userAgent: navigator.userAgent,
		url: window.location.href,
		...additionalData,
	};

	// Development: detailed console logs
	if (process.env.NODE_ENV === "development") {
		console.error("🔴 Client Error:", errorDetails);
	}

	// Production: structured logging for monitoring services
	if (process.env.NODE_ENV === "production") {
		// Send to error tracking (e.g., Sentry, LogRocket)
		console.error(JSON.stringify(errorDetails));

		// Example: Sentry.captureException(error, { extra: errorDetails });
	}
};

/**
 * Log client auth events for analytics
 */
export const logClientAuthEvent = (event: string, additionalData?: ErrorContext): void => {
	const eventDetails = {
		timestamp: new Date().toISOString(),
		event: `[AUTH_CLIENT_EVENT_${event}]`,
		url: window.location.href,
		...additionalData,
	};

	if (process.env.NODE_ENV === "development") {
		console.log("✅ Client Auth Event:", eventDetails);
	}

	if (process.env.NODE_ENV === "production") {
		// Send to analytics service
		console.log(JSON.stringify(eventDetails));

		// Example: analytics.track(event, eventDetails);
	}
};
