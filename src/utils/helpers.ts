export const formatPhoneNumber = (identifier: string): string => {
	const isPhone = /^\d{10}$/.test(identifier);
	return isPhone ? `+63${identifier}` : identifier;
};

export const createHeader = (token: string) => ({
	Authorization: `Bearer ${token}`,
});
