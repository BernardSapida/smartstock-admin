import { AUTH_CONFIG } from "./config/api.config";

/**
 * Set authentication cookies
 */
export const setAuthCookies = (accessToken: string, refreshToken: string, expiresIn: number) => {
	document.cookie = `${AUTH_CONFIG.storage.accessTokenKey}=${accessToken}; path=/; max-age=${expiresIn}; SameSite=Lax`;
	document.cookie = `${AUTH_CONFIG.storage.refreshTokenKey}=${refreshToken}; path=/; max-age=${expiresIn}; SameSite=Lax`;
};

/**
 * Clear authentication cookies
 */
export const clearAuthCookies = () => {
	document.cookie = `${AUTH_CONFIG.storage.accessTokenKey}=; path=/; max-age=0; SameSite=Lax`;
	document.cookie = `${AUTH_CONFIG.storage.refreshTokenKey}=; path=/; max-age=0; SameSite=Lax`;
};
