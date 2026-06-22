import { z } from "zod";
import { authRules } from "../rules/auth";

export const RegisterSchema = z
	.object({
		firstName: authRules.firstName,
		lastName: authRules.lastName,
		email: authRules.email,
		phoneNumber: authRules.phoneNumber,
		password: authRules.password,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export type RegisterInput = z.infer<typeof RegisterSchema>;
