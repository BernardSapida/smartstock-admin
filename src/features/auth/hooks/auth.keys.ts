export const queryKeys = {
	auth: {
		all: ["auth"] as const,
		user: () => [...queryKeys.auth.all, "user"] as const,
	},
} as const;
