import { z } from "zod";
import { authRules } from "../rules/auth";

export const UpdateProfileSchema = z.object({
	firstName: authRules.firstName,
	lastName: authRules.lastName,
	email: authRules.email,
	phoneNumber: authRules.phoneNumber,
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
