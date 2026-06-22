import z from "zod";

/**
 * Zod Schema Validator used for invalidate prop of Inputs
 */
export const createZodValidator = (zodSchema: z.ZodSchema) => {
	return (value?: string | number | { currentKey: string }) => {
		// Extract the actual value
		let val: unknown;

		if (typeof value === "object" && value !== null && "currentKey" in value) {
			val = value.currentKey;
		} else {
			val = value;
		}

		// Convert numeric strings to number if schema expects number
		if (typeof val === "string" && zodSchema instanceof z.ZodNumber) {
			const parsed = Number(val);
			val = Number.isNaN(parsed) ? val : parsed;
		}

		const result = zodSchema.safeParse(val ?? "");

		return result.success || JSON.parse(result.error.message)[0].message;
	};
};
