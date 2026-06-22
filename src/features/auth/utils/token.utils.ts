import { AUTH_CONFIG } from "../config/api.config";
import type { IAuthTokens } from "../types/auth.types";

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(AUTH_CONFIG.storage.accessTokenKey);
};

export const getRefreshToken = (): string | null => {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(AUTH_CONFIG.storage.refreshTokenKey);
};

/**
 * Read tokens from localStorage
 */
export function getAuthTokens(): IAuthTokens | null {
	if (typeof window === "undefined") return null;

	const accessToken = localStorage.getItem(AUTH_CONFIG.storage.accessTokenKey);
	const refreshToken = localStorage.getItem(AUTH_CONFIG.storage.refreshTokenKey);
	const expiresInRaw = localStorage.getItem(AUTH_CONFIG.storage.expiresIn);

	if (!accessToken || !refreshToken || !expiresInRaw) {
		return null;
	}

	const expiresIn = Number(expiresInRaw);

	if (Number.isNaN(expiresIn)) {
		return null;
	}

	return {
		accessToken,
		refreshToken,
		expiresIn,
	};
}

/**
 * Save tokens to localStorage
 */
export const saveTokens = (tokens: IAuthTokens): void => {
	if (typeof window === "undefined") return;
	localStorage.setItem(AUTH_CONFIG.storage.accessTokenKey, tokens.accessToken);
	localStorage.setItem(AUTH_CONFIG.storage.refreshTokenKey, tokens.refreshToken);
	localStorage.setItem(AUTH_CONFIG.storage.expiresIn, String(tokens.expiresIn));
};

/**
 * Save user data to localStorage
 */
export const saveUser = (user: any): void => {
	if (typeof window === "undefined") return;
	localStorage.setItem(AUTH_CONFIG.storage.userKey, JSON.stringify(user));
};

/**
 * Remove accessToken, refreshToken, and expiresIn
 */
export function clearAuthTokens() {
	if (typeof window === "undefined") return;
	localStorage.removeItem(AUTH_CONFIG.storage.accessTokenKey);
	localStorage.removeItem(AUTH_CONFIG.storage.refreshTokenKey);
	localStorage.removeItem(AUTH_CONFIG.storage.expiresIn);
}

/**
 * Convert backend login/refresh response
 * into persistent token shape
 */
export function buildIAuthTokens(params: {
	accessToken: string;
	refreshToken: string;
	expiresIn: number; // seconds
}): IAuthTokens {
	return {
		accessToken: params.accessToken,
		refreshToken: params.refreshToken,
		expiresIn: Date.now() + params.expiresIn * 1000,
	};
}
