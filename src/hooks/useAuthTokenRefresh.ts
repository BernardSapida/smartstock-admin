import { useEffect, useRef } from "react";
import { useRefreshToken } from "@/features/auth/hooks/use-auth-mutations";
import { getTokenTimeRemaining, isTokenExpired } from "@/features/auth/lib/auth/jwt";
import { getAuthTokens } from "@/features/auth/utils/token.utils";
import { APP_CONFIG } from "@/utils/config";

/**
 * Hook to automatically refresh token before expiration
 */
export function useAuthTokenRefresh() {
	const refreshMutation = useRefreshToken();
	const refreshTimeoutRef = useRef<NodeJS.Timeout>(null);

	useEffect(() => {
		const setupTokenRefresh = () => {
			// Clear existing timeout
			if (refreshTimeoutRef.current) {
				clearTimeout(refreshTimeoutRef.current);
			}

			const tokens = getAuthTokens();

			// No tokens, skip refresh
			if (!tokens?.accessToken || !tokens?.refreshToken) {
				return;
			}

			// Token already expired, refresh immediately
			if (isTokenExpired(tokens.accessToken)) {
				refreshMutation.mutate(tokens.refreshToken);
				return;
			}

			// Schedule refresh before expiration
			const timeRemaining = getTokenTimeRemaining(tokens.accessToken);

			if (timeRemaining) {
				// Refresh X minutes before expiration
				const refreshTime = Math.max(0, timeRemaining - APP_CONFIG.AUTH.REFRESH_MINUTES_BEFORE_EXPIRATION);

				// console.log(`Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`);

				refreshTimeoutRef.current = setTimeout(() => {
					refreshMutation.mutate(tokens.refreshToken);
				}, refreshTime);
			}
		};

		setupTokenRefresh();

		// Listen for storage changes (sync across tabs)
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "accessToken" || e.key === "refreshToken") {
				setupTokenRefresh();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		return () => {
			if (refreshTimeoutRef.current) {
				clearTimeout(refreshTimeoutRef.current);
			}
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [refreshMutation]);
}
