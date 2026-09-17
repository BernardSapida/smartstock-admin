import { z } from "zod";
import { authRules } from "../rules/auth";

export const ChangePasswordSchema = z
	.object({
		currentPassword: authRules.loginPassword,
		newPassword: authRules.password,
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	})
	.refine((data) => data.currentPassword !== data.newPassword, {
		message: "New password must be different from your current password",
		path: ["newPassword"],
	});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
