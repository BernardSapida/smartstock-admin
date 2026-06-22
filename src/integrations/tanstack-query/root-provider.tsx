import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { UnauthorizedError } from "#/errors/errors";
import { refreshTokenApi } from "#/features/auth/api/auth.api";
import { getRefreshToken, saveTokens } from "#/features/auth/utils/token.utils";
import { APP_CONFIG } from "#/utils/config";

let context:
	| {
			queryClient: QueryClient;
	  }
	| undefined;

export function getContext() {
	if (context) return context;

	const queryClient = new QueryClient({
		queryCache: new QueryCache({
			onError: (error, query) => {
				// Handle 401 errors globally
				if (error instanceof UnauthorizedError) {
					// Trigger token refresh
					const refreshToken = getRefreshToken();
					if (refreshToken) {
						// Retry the failed query after refresh
						refreshTokenApi(refreshToken)
							.then((response) => {
								saveTokens({
									accessToken: response.accessToken,
									refreshToken: response.refreshToken,
									expiresIn: response.expiresIn,
								});

								// Invalidate and refetch the failed query
								queryClient.invalidateQueries({ queryKey: query.queryKey });
							})
							.catch(() => {
								// Refresh failed, redirect to home
								window.location.href = "/";
							});
					}
				}
			},
		}),
		defaultOptions: {
			queries: {
				retry: (failureCount, error) => {
					// Don't retry on 401 (will be handled by refresh logic)
					if (error instanceof UnauthorizedError) {
						return false;
					}
					// Retry other errors up to 2 times
					return failureCount < APP_CONFIG.QUERY_CLIENT.retry;
				},
				refetchOnWindowFocus: APP_CONFIG.QUERY_CLIENT.refetchOnWindowFocus,
				staleTime: APP_CONFIG.QUERY_CLIENT.staleTime,
				gcTime: APP_CONFIG.QUERY_CLIENT.staleTime,
			},
		},
	});

	context = { queryClient };

	return context;
}

export default function TanStackQueryProvider({ children }: { children: ReactNode }) {
	const { queryClient } = getContext();

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
