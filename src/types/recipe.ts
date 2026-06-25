// Recipe model. Legacy data has TWO ingredient shapes and string/number
// quantities, so everything is normalized on read.

import type { Timestamp } from "firebase/firestore";

export const RECIPE_CATEGORIES = [
	"Appetizer",
	"Main Course",
	"Side Dish",
	"Dessert",
] as const;

export interface RecipeIngredient {
	name: string;
	quantityPerServing: number; // 0 if legacy data had it blank
	unit: string;
	legacyRefId: string | null; // old itemId / inventoryId (no longer reliable)
}

export interface Recipe {
	id: string;
	name: string;
	category: string;
	servingSize: number;
	instructions: string;
	ingredients: RecipeIngredient[];
	createdBy: string;
	updatedAt: Timestamp | null;
}

function num(v: unknown): number {
	if (typeof v === "number") return v;
	if (typeof v === "string" && v.trim() !== "") {
		const n = Number(v);
		return Number.isNaN(n) ? 0 : n;
	}
	return 0;
}

export function normalizeIngredient(raw: Record<string, unknown>): RecipeIngredient {
	return {
		name: (raw.name as string) ?? (raw.itemName as string) ?? "",
		quantityPerServing: num(raw.quantity),
		unit: (raw.unit as string) ?? "pcs",
		legacyRefId: (raw.itemId as string) ?? (raw.inventoryId as string) ?? null,
	};
}

export function normalizeRecipe(id: string, d: Record<string, unknown>): Recipe {
	const rawIngredients = Array.isArray(d.ingredients) ? (d.ingredients as Record<string, unknown>[]) : [];
	return {
		id,
		name: (d.name as string) ?? "",
		category: (d.category as string) ?? "Main Course",
		servingSize: num(d.servingSize) || 1,
		instructions: (d.instructions as string) ?? "",
		ingredients: rawIngredients.map(normalizeIngredient).filter((i) => i.name),
		createdBy: (d.createdBy as string) ?? "",
		updatedAt: (d.updatedAt as Timestamp) ?? null,
	};
}
