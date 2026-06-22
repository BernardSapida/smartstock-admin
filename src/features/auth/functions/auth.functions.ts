// src/features/auth/functions/auth.functions.ts

import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { USER_TYPES } from "@/constants";
import { UnauthorizedError } from "@/errors/errors";
import { logServerError } from "@/errors/logger";
import { getCurrentUserApi, refreshTokenApi } from "../api/auth.api";
import { AUTH_CONFIG } from "../config/api.config";
import { decodeToken, isTokenExpired } from "../lib/auth/jwt";
import type { IJWTPayload, IUser } from "../types/auth.types";
import { redirectToDashboard, redirectToNotfound, redirectToUnauthorized } from "../utils/redirect.utils";

const allowedRolesSchema = z.object({
	allowedRoles: z.array(z.enum([...USER_TYPES] as [string, ...string[]])).min(1, "At least one role required"),
});

/**
 * Get access token from cookies
 */
const getAccessToken = (): string | undefined => {
	return getCookie(AUTH_CONFIG.storage.accessTokenKey);
};

/**
 * Get refresh token from cookies
 */
const getRefreshToken = (): string | undefined => {
	return getCookie(AUTH_CONFIG.storage.refreshTokenKey);
};

/**
 * Safely decode and validate JWT token
 */
const getDecodedToken = (token: string): IJWTPayload | null => {
	try {
		return decodeToken(token);
	} catch (error) {
		logServerError(error, "JWT_DECODE", { token: `${token.substring(0, 20)}...` });
		return null;
	}
};

/**
 * Update auth cookies with new tokens
 */
const updateAuthCookies = (accessToken: string, refreshToken: string, expiresIn: number) => {
	setCookie(AUTH_CONFIG.storage.accessTokenKey, accessToken, {
		maxAge: expiresIn,
		path: "/",
		sameSite: "lax",
	});
	setCookie(AUTH_CONFIG.storage.refreshTokenKey, refreshToken, {
		maxAge: expiresIn,
		path: "/",
		sameSite: "lax",
	});
};

/**
 * Clear auth cookies
 */
const clearAuthCookies = () => {
	setCookie(AUTH_CONFIG.storage.accessTokenKey, "", { maxAge: 0, path: "/" });
	setCookie(AUTH_CONFIG.storage.refreshTokenKey, "", { maxAge: 0, path: "/" });
};

/**
 * Resolve authentication state with automatic token refresh
 * Use in route beforeLoad to get current user
 */
export const resolveAuthFn = createServerFn().handler(async (): Promise<IUser | null> => {
	const accessToken = getAccessToken();
	const refreshToken = getRefreshToken();

	// No tokens available
	if (!accessToken || !refreshToken) {
		return null;
	}

	// Check if access token is expired
	if (isTokenExpired(accessToken)) {
		try {
			// Refresh token
			const response = await refreshTokenApi(refreshToken);
			updateAuthCookies(response.accessToken, response.refreshToken, response.expiresIn);

			// Fetch user with new token
			return await getCurrentUserApi(response.accessToken);
		} catch (error) {
			logServerError(error, "RESOLVE_AUTH_REFRESH_FAILED");
			clearAuthCookies();
			return null;
		}
	}

	// Token is valid, fetch user
	try {
		return await getCurrentUserApi(accessToken);
	} catch (error) {
		// If 401, try one refresh attempt
		if (error instanceof UnauthorizedError && refreshToken) {
			try {
				const response = await refreshTokenApi(refreshToken);
				updateAuthCookies(response.accessToken, response.refreshToken, response.expiresIn);
				return await getCurrentUserApi(response.accessToken);
			} catch (refreshError) {
				logServerError(refreshError, "RESOLVE_AUTH_FINAL_FAIL");
				clearAuthCookies();
				return null;
			}
		}

		logServerError(error, "RESOLVE_AUTH_GET_USER_FAILED");
		return null;
	}
});

/**
 * Redirect authenticated users from public pages (login/register)
 */
export const redirectSignedInUserFn = createServerFn().handler(async () => {
	const token = getAccessToken();

	if (token && getDecodedToken(token)) {
		redirectToDashboard();
	}

	return null;
});

/**
 * Assert user has required role - main auth guard for protected routes
 */
export const assertAuthenticatedRoleFn = createServerFn()
	.inputValidator(allowedRolesSchema)
	.handler(async ({ data }) => {
		const token = getAccessToken();

		// No token found
		if (!token) {
			logServerError(new Error("No access token"), "AUTH_GUARD", {
				allowedRoles: data.allowedRoles,
			});
			redirectToNotfound();
		}

		// Decode and validate token
		const decodedUser = getDecodedToken(token!);
		if (!decodedUser) {
			logServerError(new Error("Invalid token"), "AUTH_GUARD", {
				allowedRoles: data.allowedRoles,
			});
			redirectToNotfound();
		}

		// Check role authorization
		if (!data.allowedRoles.includes(decodedUser!.userType)) {
			logServerError(new Error("Insufficient permissions"), "AUTH_GUARD", {
				userType: decodedUser!.userType,
				allowedRoles: data.allowedRoles,
				userId: decodedUser!.userId,
			});
			redirectToUnauthorized();
		}
	});

/**
 * Get current user from /auth/me endpoint
 */
export const getMeFn = createServerFn().handler(async () => {
	let token = getAccessToken();
	const refreshToken = getRefreshToken();

	// Token expired, refresh it first
	if (token && isTokenExpired(token)) {
		if (refreshToken) {
			try {
				const response = await refreshTokenApi(refreshToken);

				// Update cookies with new tokens
				setCookie(AUTH_CONFIG.storage.accessTokenKey, response.accessToken, {
					maxAge: response.expiresIn,
					path: "/",
					sameSite: "lax",
				});
				setCookie(AUTH_CONFIG.storage.refreshTokenKey, response.refreshToken, {
					maxAge: response.expiresIn,
					path: "/",
					sameSite: "lax",
				});

				token = response.accessToken;
			} catch (error) {
				logServerError(error, "TOKEN_REFRESH_IN_GET_ME");
				throw new UnauthorizedError("Token refresh failed");
			}
		} else {
			throw new UnauthorizedError("No refresh token available");
		}
	}

	if (!token) {
		throw new UnauthorizedError("No access token found");
	}

	try {
		return await getCurrentUserApi(token);
	} catch (error) {
		logServerError(error, "GET_ME", { hasToken: !!token });
		throw error;
	}
});

/**
 * Refresh access token using refresh token
 */
export const refreshTokenFn = createServerFn().handler(async () => {
	const refreshToken = getRefreshToken();

	if (!refreshToken) {
		logServerError(new UnauthorizedError("No refresh token"), "REFRESH_TOKEN");
		throw new UnauthorizedError("No refresh token found");
	}

	try {
		return await refreshTokenApi(refreshToken);
	} catch (error) {
		logServerError(error, "REFRESH_TOKEN", { hasRefreshToken: !!refreshToken });
		throw error;
	}
});

/**
 * Check if user has required role (non-throwing version for conditional UI)
 */
export const checkUserRoleFn = createServerFn()
	.inputValidator(allowedRolesSchema)
	.handler(async ({ data }) => {
		const token = getAccessToken();

		if (!token) return false;

		const decoded = getDecodedToken(token);
		if (!decoded) return false;

		return data.allowedRoles.includes(decoded.userType);
	});

/**
 * Get auth token safely (returns null if not found)
 */
export const getAuthTokenFn = createServerFn().handler(async () => {
	return getAccessToken() || null;
});
