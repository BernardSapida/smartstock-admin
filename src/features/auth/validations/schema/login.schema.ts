import { z } from "zod";
import { authRules } from "../rules/auth";

export const LoginSchema = z.object({
	email: authRules.email,
	password: authRules.loginPassword,
});

export type LoginInput = z.infer<typeof LoginSchema>;
