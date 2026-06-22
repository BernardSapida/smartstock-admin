import { authenticatedFetch } from "@/api/api-client";
import { UnauthorizedError } from "@/errors/errors";
import { createHeader, formatPhoneNumber } from "@/utils/helpers";
import { AUTH_CONFIG } from "../config/api.config";
import type {
	ILoginRequest,
	ILoginResponse,
	ILogoutResponse,
	IRefreshTokenResponse,
	IRegisterRequest,
	IRegisterResponse,
	IRequestOTPRequest,
	IRequestOTPResponse,
	IUser,
	IVerifyOTPRequest,
	IVerifyOTPResponse,
} from "../types/auth.types";
import { clearAuthTokens, getAuthTokens } from "../utils/token.utils";

/**
 * Login user with phone/email and password
 */
export const loginApi = async ({ identifier, password }: ILoginRequest): Promise<ILoginResponse> => {
	return authenticatedFetch<ILoginResponse>(AUTH_CONFIG.endpoints.login, {
		method: "POST",
		body: JSON.stringify({
			identifier: formatPhoneNumber(identifier),
			password,
		}),
	});
};

/**
 * Logout user and invalidate session
 */
export const logoutApi = async (): Promise<ILogoutResponse> => {
	const tokens = getAuthTokens();

	if (!tokens?.accessToken) {
		throw new UnauthorizedError("No access token found");
	}

	return authenticatedFetch<ILogoutResponse>(AUTH_CONFIG.endpoints.logout, {
		method: "POST",
		headers: createHeader(tokens.accessToken),
		body: JSON.stringify({ logoutAll: true }),
	});
};

/**
 * Refresh access token using refresh token
 */
export const refreshTokenApi = async (refreshToken: string): Promise<IRefreshTokenResponse> => {
	if (!refreshToken) {
		clearAuthTokens();
		throw new UnauthorizedError("No refresh token provided");
	}

	return authenticatedFetch<IRefreshTokenResponse>(AUTH_CONFIG.endpoints.refresh, {
		method: "POST",
		body: JSON.stringify({ refreshToken }),
	});
};

/**
 * Get current authenticated user profile
 */
export const getCurrentUserApi = async (accessToken: string): Promise<IUser> => {
	if (!accessToken) {
		throw new UnauthorizedError("No access token provided");
	}

	return authenticatedFetch<IUser>(AUTH_CONFIG.endpoints.me, {
		method: "GET",
		headers: createHeader(accessToken),
	});
};

/**
 * Verify OTP code for authentication flow
 */
export const verifyOTPApi = async (data: IVerifyOTPRequest): Promise<IVerifyOTPResponse> => {
	return authenticatedFetch<IVerifyOTPResponse>(AUTH_CONFIG.endpoints.verifyOtp, {
		method: "POST",
		body: JSON.stringify(data),
	});
};

/**
 * Request OTP code to be sent via SMS/Email
 */
export const requestOTPApi = async (data: IRequestOTPRequest): Promise<IRequestOTPResponse> => {
	return authenticatedFetch<IRequestOTPResponse>(AUTH_CONFIG.endpoints.requestOtp, {
		method: "POST",
		body: JSON.stringify(data),
	});
};

/**
 * Register new user account
 */
export const registerUserApi = async (data: IRegisterRequest): Promise<IRegisterResponse> => {
	return authenticatedFetch<IRegisterResponse>(AUTH_CONFIG.endpoints.register, {
		method: "POST",
		body: JSON.stringify(data),
	});
};
