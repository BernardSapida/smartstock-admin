import { z } from "zod";

export const phoneRegex = /^9\d{9}$/;
export const otpRegex = /^\d{6}$/;
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const authRules = {
	// Sign Up
	firstName: z.string().min(1, "Firstname is required").max(50, "Maximum 50 characters"),
	middleName: z.string().optional(),
	lastName: z.string().min(1, "Lastname is required").max(50, "Maximum 50 characters"),
	suffix: z.string().min(1, "Suffix is required").max(10, "Maximum 10 characters").optional().or(z.literal("")),
	phoneNumber: z.string().regex(phoneRegex, "Invalid phone number (Example: +63 923 456 7891)"),
	email: z.email("Invalid email address"),
	password: z
		.string()
		.regex(
			passwordRegex,
			"Password must be at least 8 characters with uppercase, lowercase, number and special character",
		),
	otp: z.string().regex(otpRegex, "Invalid registration otp."),

	// Login
	loginPassword: z.string().min(6, "Password must be at least 6 characters"),

	// Password Check
	eightCharacters: z.string().min(8, "Password must be at least 8 characters"),
	lowerAndUpper: z
		.string()
		.regex(/[a-z]/, "Password must contain at least 1 lowercase")
		.regex(/[A-Z]/, "Password must contain at least 1 uppercase"),
	specialCharacter: z.string().regex(/[@$!%*?&]/, "Password must contain at least 1 special character"),
};
