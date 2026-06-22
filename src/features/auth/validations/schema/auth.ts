import z from "zod";
import { authRules } from "../rules/auth";

// Sign Up - Step 1
export const credentialFormSchema = z.object({
	firstName: authRules.firstName,
	middleName: authRules.middleName,
	lastName: authRules.lastName,
	suffix: authRules.suffix,
	phoneNumber: authRules.phoneNumber,
	email: authRules.email,
	password: authRules.password,
});

export type CredentialFormSchema = z.infer<typeof credentialFormSchema>;
