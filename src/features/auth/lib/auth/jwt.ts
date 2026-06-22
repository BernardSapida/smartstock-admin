import type { IJWTPayload } from "../../types/auth.types";

/**
 * Decode JWT token without verification (server handles verification)
 */
export function decodeToken(token: string): IJWTPayload | null {
	if (!token || typeof token !== "string") {
		return null;
	}

	try {
		// Split the token into parts
		const parts = token.split(".");

		if (parts.length !== 3) {
			return null;
		}

		// Decode the payload (second part)
		const payload = parts[1];

		// Replace URL-safe characters
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

		// Decode base64
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
				.join(""),
		);

		const decoded = JSON.parse(jsonPayload) as IJWTPayload;

		// Validate structure
		if (!decoded.userId || !decoded.userType) {
			return null;
		}

		return decoded;
	} catch (error) {
		console.error("Failed to decode token:", error);
		return null;
	}
}

/**
 * Check if token is expired without verification
 */
export function isTokenExpired(token: string): boolean {
	try {
		const decoded = decodeToken(token);

		if (!decoded || !decoded.exp) {
			return true;
		}

		// Check if token expiration is in the past
		return decoded.exp * 1000 < Date.now();
	} catch {
		return true;
	}
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpirationTime(token: string): number | null {
	try {
		const decoded = decodeToken(token) as IJWTPayload | null;

		if (!decoded || !decoded.exp) {
			return null;
		}

		return decoded.exp * 1000;
	} catch {
		return null;
	}
}

/**
 * Get time remaining until token expiration in milliseconds
 */
export function getTokenTimeRemaining(token: string): number | null {
	const expirationTime = getTokenExpirationTime(token);

	if (!expirationTime) {
		return null;
	}

	const timeRemaining = expirationTime - Date.now();

	return timeRemaining > 0 ? timeRemaining : 0;
}
