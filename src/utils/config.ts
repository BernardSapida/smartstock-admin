import { env } from "@/env";

export type { UserRole } from "@/types/user";

export const APP_CONFIG = {
	APP_NAME: "Smartstock",
	API_BASE_URL: env.VITE_SERVER_URL,
	AUTH: {
		REFRESH_MINUTES_BEFORE_EXPIRATION: 2 * 60 * 1000, // 2 minutes
		ACCESS_TOKEN_EXPIRES_IN: 15 * 60 * 1000, // 15 minutes
		REFRESH_TOKEN_EXPIRES_IN: 24 * 60 * 60 * 1000, // 1 day (hrs * minutes * seconds * ms)
	},
	QUERY_CLIENT: {
		refetchOnWindowFocus: false,
		retry: 2,
		staleTime: 60 * 60 * 1000, // 1 hour
		gcTime: 90 * 60 * 1000, // 1 hour 30 minutes
	},
	SIGNUP_OTP: {
		OTP_LENGTH: 6,
		OTP_EXPIRY_IN: 10 * 60 * 1000, // 10 minutes
		OTP_RESEND_COOLDOWN: 10 * 1000, // 10 seconds
		OTP_LONG_COOLDOWN: 30 * 60 * 1000, // 30 minutes
		MAX_RESEND_ATTEMPTS: 2,
	},
} as const;

export const USER_ROLES = {
	ADMIN: "admin",
	STAFF: "staff",
} as const;
