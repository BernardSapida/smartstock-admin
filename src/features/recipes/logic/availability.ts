// Ingredient availability + max-cookable-servings, matching recipe ingredients
// to products by NAME (legacy ingredient ids don't map to migrated product ids).

import { toBaseUnit, unitInfo } from "@/lib/units";
import type { ProductWithBatches } from "@/types/inventory";
import type { Recipe, RecipeIngredient } from "@/types/recipe";

export type ProductIndex = Map<string, ProductWithBatches>;

export function buildProductIndex(rows: ProductWithBatches[]): ProductIndex {
	const idx: ProductIndex = new Map();
	for (const r of rows) idx.set(r.product.name.trim().toLowerCase(), r);
	return idx;
}

export interface IngredientStatus {
	ingredient: RecipeIngredient;
	matched: boolean;
	unitMismatch: boolean;
	requiredPerServingBase: number; // in product base unit
	haveBase: number;
	displayUnit: string;
	enough: boolean; // enough for the requested servings
	maxServingsForThis: number | null; // null = no constraint (blank qty)
}

export function ingredientStatus(ing: RecipeIngredient, index: ProductIndex, servings: number): IngredientStatus {
	const match = index.get(ing.name.trim().toLowerCase());
	if (!match) {
		return {
			ingredient: ing,
			matched: false,
			unitMismatch: false,
			requiredPerServingBase: 0,
			haveBase: 0,
			displayUnit: ing.unit,
			enough: false,
			maxServingsForThis: 0,
		};
	}

	const product = match.product;
	const ingBase = unitInfo(ing.unit).base;

	// Measurable pcs products (bottles, cans) are stored as pieces but used in ml/g in recipes.
	// Convert onHand from pieces → usageUnit so the unit comparison is valid.
	const isMeasurablePcs =
		product.measurable &&
		product.baseUnit === "piece" &&
		!!product.usageUnit &&
		product.usageUnit !== "pcs" &&
		!!product.unitSize;
	const effectiveBase = isMeasurablePcs ? unitInfo(product.usageUnit!).base : product.baseUnit;
	const haveBase = isMeasurablePcs
		? toBaseUnit(match.onHand * (product.unitSize ?? 1), product.usageUnit!)
		: match.onHand;

	const unitMismatch = ingBase !== effectiveBase;
	const requiredPerServingBase = ing.quantityPerServing > 0 ? toBaseUnit(ing.quantityPerServing, ing.unit) : 0;

	// Blank/zero quantity = not a real constraint.
	if (requiredPerServingBase <= 0 || unitMismatch) {
		return {
			ingredient: ing,
			matched: true,
			unitMismatch,
			requiredPerServingBase,
			haveBase,
			displayUnit: product.displayUnit,
			enough: !unitMismatch,
			maxServingsForThis: unitMismatch ? 0 : null,
		};
	}

	const need = requiredPerServingBase * Math.max(1, servings);
	return {
		ingredient: ing,
		matched: true,
		unitMismatch: false,
		requiredPerServingBase,
		haveBase,
		displayUnit: product.displayUnit,
		enough: haveBase >= need,
		maxServingsForThis: Math.floor(haveBase / requiredPerServingBase),
	};
}

export interface RecipeAvailability {
	statuses: IngredientStatus[];
	maxServings: number | null; // null = unknown (no computable constraints)
	hasUnlinked: boolean;
	canCookRequested: boolean;
}

export function recipeAvailability(recipe: Recipe, index: ProductIndex, servings: number): RecipeAvailability {
	const statuses = recipe.ingredients.map((i) => ingredientStatus(i, index, servings));
	const constraints = statuses.map((s) => s.maxServingsForThis).filter((v): v is number => v !== null);
	const maxServings = constraints.length ? Math.min(...constraints) : null;
	return {
		statuses,
		maxServings,
		hasUnlinked: statuses.some((s) => !s.matched),
		canCookRequested: statuses.every((s) => s.enough),
	};
}
