import { z } from "zod";
import { authRules } from "../rules/auth";

export const LoginSchema = z.object({
	identifier: authRules.email.or(authRules.phoneNumber),
	password: authRules.loginPassword,
});

export type LoginInput = z.infer<typeof LoginSchema>;
