import { queryOptions, useQuery } from "@tanstack/react-query";
import { UnauthorizedError } from "@/errors/errors";
import { logClientError } from "@/errors/logger";
import { APP_CONFIG } from "@/utils/config";
import { getCurrentUserApi } from "../api/auth.api";
import { getAccessToken, saveUser } from "../utils/token.utils";
import { queryKeys } from "./auth.keys";
/**
 * Query options for fetching current user
 */
export const getCurrentUserQueryOptions = () => {
	return queryOptions({
		queryKey: queryKeys.auth.user(),
		queryFn: async () => {
			const token = getAccessToken();

			// No token available
			if (!token) return null;

			try {
				const user = await getCurrentUserApi(token);

				// Sync user to localStorage for offline access
				saveUser(user);

				return user;
			} catch (error) {
				// Handle unauthorized errors gracefully
				if (error instanceof UnauthorizedError) {
					logClientError(error, "USER_QUERY_UNAUTHORIZED");
					return null;
				}

				// Log other errors but don't fail silently
				logClientError(error, "USER_QUERY_ERROR");
				throw error;
			}
		},
		enabled: !!getAccessToken(),
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		retry: false, // Don't retry on 401 errors
		staleTime: APP_CONFIG.AUTH.ACCESS_TOKEN_EXPIRES_IN,
		gcTime: APP_CONFIG.AUTH.ACCESS_TOKEN_EXPIRES_IN * 2, // Keep in cache longer
	});
};

/**
 * Hook to get current user with loading and error states
 */
export const useUser = () => {
	return useQuery(getCurrentUserQueryOptions());
};
