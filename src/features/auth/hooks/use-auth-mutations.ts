import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { notify } from "@/components/feedback";
import { getDefaultRoute } from "@/config/navigation.config";
import { logClientError } from "@/errors/logger";
import { loginApi, logoutApi, refreshTokenApi, registerUserApi, requestOTPApi, verifyOTPApi } from "../api/auth.api";
import { clearAuthCookies, setAuthCookies } from "../helpers";
import type { ILoginRequest, IRegisterRequest, IRequestOTPRequest, IVerifyOTPRequest } from "../types/auth.types";
import { clearAuthTokens, saveTokens, saveUser } from "../utils/token.utils";
import { queryKeys } from "./auth.keys";

/**
 * Login mutation hook
 */
export const useLogin = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: (data: ILoginRequest) => loginApi(data),
		onSuccess: async (response) => {
			// Save tokens to localStorage
			saveTokens({
				accessToken: response.accessToken,
				refreshToken: response.refreshToken,
				expiresIn: response.expiresIn,
			});

			// Save user to localStorage
			saveUser(response.user);

			// Set cookies for server-side auth
			setAuthCookies(response.accessToken, response.refreshToken, response.expiresIn);

			// Update React Query cache
			queryClient.setQueryData(queryKeys.auth.user(), response.user);

			// Navigate to the correct default page based on user role
			navigate({ to: getDefaultRoute(response.user.userType as any) as any });

			// Show success toast
			notify.success({
				title: `Welcome back, ${response.user.firstName} ${response.user.lastName}! 👋`,
				description: "You've successfully signed in to your account",
			});
		},
		onError: (error) => {
			logClientError(error, "LOGIN_MUTATION");

			notify.danger({
				title: "Login failed",
				description: error.message || "Unable to sign in. Please try again.",
			});
		},
	});
};

/**
 * Logout mutation hook
 */
export const useLogout = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: () => logoutApi(),
		onError: (error) => {
			logClientError(error, "LOGOUT_MUTATION");
		},
		onSettled: () => {
			// Clear all auth data
			clearAuthTokens();
			clearAuthCookies();

			// Clear React Query cache
			queryClient.removeQueries({ queryKey: queryKeys.auth.user(), exact: true });
			queryClient.clear();

			// Navigate to login
			navigate({ to: "/" });

			// Show success toast
			notify.success({
				title: "See you soon! 👋",
				description: "You've been logged out successfully",
			});
		},
	});
};

/**
 * Refresh token mutation hook
 */
export const useRefreshToken = () => {
	return useMutation({
		mutationFn: (refreshToken: string) => refreshTokenApi(refreshToken),
		onSuccess: (response) => {
			// Save new tokens
			saveTokens({
				accessToken: response.accessToken,
				refreshToken: response.refreshToken,
				expiresIn: response.expiresIn,
			});

			// Update cookies
			setAuthCookies(response.accessToken, response.refreshToken, response.expiresIn);
		},
		onError: (error: any) => {
			logClientError(error, "REFRESH_TOKEN_MUTATION");

			// Clear invalid tokens
			clearAuthTokens();
			clearAuthCookies();
		},
	});
};

/**
 * Verify OTP mutation hook
 */
export const useVerifyOTP = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: (data: IVerifyOTPRequest) => verifyOTPApi(data),
		onSuccess: (response) => {
			// Save tokens to localStorage
			saveTokens({
				accessToken: response.accessToken,
				refreshToken: response.refreshToken,
				expiresIn: response.expiresIn,
			});

			// Save user to localStorage
			saveUser(response.user);

			// Set cookies for server-side auth
			setAuthCookies(response.accessToken, response.refreshToken, response.expiresIn);

			// Update React Query cache
			queryClient.setQueryData(queryKeys.auth.user(), response.user);

			navigate({ to: getDefaultRoute(response.user.userType as any) as any });

			// Show success toast
			notify.success({
				title: `Welcome, ${response.user.firstName}! 🎉`,
				description: "Your account has been created successfully",
			});
		},
		onError: (error: any) => {
			logClientError(error, "VERIFY_OTP_MUTATION");

			notify.danger({
				title: "Verification failed",
				description: error.message || "Invalid OTP code",
			});
		},
	});
};

/**
 * Request OTP mutation hook
 */
export const useRequestOTP = () => {
	return useMutation({
		mutationFn: (data: IRequestOTPRequest) => requestOTPApi(data),
		onSuccess: () => {
			notify.success({
				title: "Code sent",
				description: "OTP code has been sent",
			});
		},
		onError: (error: any) => {
			logClientError(error, "REQUEST_OTP_MUTATION");

			notify.danger({
				title: "Request failed",
				description: error.message || "Failed to send OTP",
			});
		},
	});
};

/**
 * Register user mutation hook
 */
export const useRegisterUser = () => {
	return useMutation({
		mutationFn: (data: IRegisterRequest) => registerUserApi(data),
		onError: (error: any) => {
			logClientError(error, "REGISTER_MUTATION");

			notify.danger({
				title: "Registration failed",
				description: error.message || "Failed to create account",
			});
		},
	});
};
