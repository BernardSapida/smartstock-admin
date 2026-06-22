import { env } from "@/env";

export const AUTH_CONFIG = {
	apiBaseUrl: env.VITE_SERVER_URL,
	endpoints: {
		login: "/auth/login",
		logout: "/auth/logout",
		refresh: "/auth/refresh",
		me: "/auth/me",
		verifyOtp: "/auth/verify-otp",
		requestOtp: "/auth/request-otp",
		register: "/auth/register",
	},
	storage: {
		accessTokenKey: "accessToken",
		refreshTokenKey: "refreshToken",
		expiresIn: "expiresIn",
		userKey: "user",
	},
} as const;
