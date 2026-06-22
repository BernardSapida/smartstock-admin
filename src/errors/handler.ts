import { toast } from "@heroui/react";
import { logApiError } from "./logger";

/**
 * Handle API errors with user-friendly messages and logging
 */
export const handleApiError = (error: any, endpoint: string, status: number): void => {
	// Log error for debugging
	logApiError(error, endpoint, status, "API_FETCH");

	// Map status codes to user-friendly messages
	const errorMessages: Record<number, string> = {
		400: "Invalid request. Please check your input.",
		401: "Your session has expired. Please log in again.",
		403: "You don't have permission to perform this action.",
		404: "The requested resource was not found.",
		409: "This data already exists.",
		422: "Unable to process your request. Please check your input.",
		429: "Too many requests. Please try again later.",
		500: "Server error. Please try again later.",
		503: "Service temporarily unavailable. Please try again later.",
	};

	const userMessage = errorMessages[status] || error?.message || "Something went wrong";

	// Show toast notification for user feedback
	toast.danger("Error", {
		description: userMessage,
	});
};

/**
 * Handle network errors (no internet, timeout, etc.)
 */
export const handleNetworkError = (error: Error): void => {
	logApiError(error, "NETWORK", undefined, "NETWORK_ERROR");

	toast.danger("Connection Error", {
		description: "Unable to connect. Please check your internet connection.",
	});
};
