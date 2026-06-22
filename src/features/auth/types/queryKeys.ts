export const queryKeys = {
	all: ["auth"] as const,
	me: () => [...queryKeys.all, "me"] as const,
};
