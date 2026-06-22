import { UnauthorizedError } from "@/errors/errors";
import { handleApiError } from "@/errors/handler";
import { logClientError } from "@/errors/logger";
import { refreshTokenApi } from "@/features/auth/api/auth.api";
import { AUTH_CONFIG } from "@/features/auth/config/api.config";
import { clearAuthTokens, getAuthTokens, saveTokens } from "@/features/auth/utils/token.utils";

// ============================================================================
// TOKEN REFRESH STATE
// ============================================================================

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Add callback to be executed when token is refreshed
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
	refreshSubscribers.push(callback);
}

/**
 * Execute all callbacks with new token
 */
function onTokenRefreshed(token: string) {
	refreshSubscribers.forEach((callback) => {
		callback(token);
	});
	refreshSubscribers = [];
}

// ============================================================================
// TOKEN REFRESH LOGIC
// ============================================================================

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string> {
	const tokens = getAuthTokens();

	if (!tokens?.refreshToken) {
		clearAuthTokens();
		throw new UnauthorizedError("No refresh token available");
	}

	try {
		const response = await refreshTokenApi(tokens.refreshToken);

		// Save new tokens
		saveTokens({
			accessToken: response.accessToken,
			refreshToken: response.refreshToken,
			expiresIn: response.expiresIn,
		});

		// Update cookies
		document.cookie = `${AUTH_CONFIG.storage.accessTokenKey}=${response.accessToken}; path=/; max-age=${response.expiresIn}; SameSite=Lax`;
		document.cookie = `${AUTH_CONFIG.storage.refreshTokenKey}=${response.refreshToken}; path=/; max-age=${response.expiresIn}; SameSite=Lax`;

		return response.accessToken;
	} catch (error) {
		logClientError(error, "TOKEN_REFRESH_FAILED");
		clearAuthTokens();

		// Redirect to home (login is a slider on the landing page)
		window.location.href = "/";

		throw error;
	}
}

// ============================================================================
// FETCH WRAPPER WITH AUTO REFRESH
// ============================================================================

/**
 * Enhanced fetch with automatic token refresh on 401
 */
export async function authenticatedFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
	const tokens = getAuthTokens();
	const url = `${AUTH_CONFIG.apiBaseUrl}${endpoint}`;

	// First attempt with current token
	const makeRequest = async (token?: string): Promise<Response> => {
		return fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...(token && { Authorization: `Bearer ${token}` }),
				...options?.headers,
			},
		});
	};

	let response = await makeRequest(tokens?.accessToken);

	// If 401, try to refresh token
	if (response.status === 401) {
		if (!isRefreshing) {
			isRefreshing = true;

			try {
				const newToken = await refreshAccessToken();
				onTokenRefreshed(newToken);
				isRefreshing = false;

				// Retry original request with new token
				response = await makeRequest(newToken);
			} catch (error) {
				isRefreshing = false;
				throw error;
			}
		} else {
			// Wait for ongoing refresh to complete
			const newToken = await new Promise<string>((resolve) => {
				subscribeTokenRefresh(resolve);
			});

			// Retry with new token
			response = await makeRequest(newToken);
		}
	}

	if (!response.ok) {
		const error = await response.json().catch(() => ({
			message: "An error occurred",
		}));

		throw new Error(error.message || `HTTP ${response.status}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	const text = await response.text();

	return text ? (JSON.parse(text) as T) : (undefined as T);
}

/**
 * Base fetch wrapper with standardized error handling
 */
export const apiFetch = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
	const url = `${AUTH_CONFIG.apiBaseUrl}${endpoint}`;
	const response = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({
			message: "An error occurred",
		}));

		// Log error for debugging
		handleApiError(error, endpoint, response.status);

		throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
	}

	return response.json();
};
