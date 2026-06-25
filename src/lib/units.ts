// Canonical units: every quantity is stored in a product's base unit
// (g / ml / piece). Display/entry can use friendlier units (kg, L) and is
// converted on the way in/out. This powers correct recipe math later.

import type { BaseUnit } from "@/types/inventory";

// display unit -> { base unit, factor to base }
const UNIT_TABLE: Record<string, { base: BaseUnit; factor: number }> = {
	mg: { base: "g", factor: 0.001 },
	g: { base: "g", factor: 1 },
	gram: { base: "g", factor: 1 },
	grams: { base: "g", factor: 1 },
	kg: { base: "g", factor: 1000 },
	ml: { base: "ml", factor: 1 },
	l: { base: "ml", factor: 1000 },
	liter: { base: "ml", factor: 1000 },
	liters: { base: "ml", factor: 1000 },
	tbsp: { base: "ml", factor: 14.787 },
	tablespoon: { base: "ml", factor: 14.787 },
	tsp: { base: "ml", factor: 4.929 },
	teaspoon: { base: "ml", factor: 4.929 },
	cup: { base: "ml", factor: 240 },
	oz: { base: "ml", factor: 29.574 },
	pcs: { base: "piece", factor: 1 },
	piece: { base: "piece", factor: 1 },
	pieces: { base: "piece", factor: 1 },
	bottle: { base: "piece", factor: 1 },
	bottles: { base: "piece", factor: 1 },
};

export function unitInfo(unit: string) {
	return UNIT_TABLE[unit.trim().toLowerCase()] ?? { base: "piece" as BaseUnit, factor: 1 };
}

// Friendly display units offered for each base unit, in entry order. A recipe
// ingredient may only use a unit from its product's family, otherwise recipe
// math (toBaseUnit) would mix incompatible measures.
const DISPLAY_UNITS_BY_BASE: Record<BaseUnit, string[]> = {
	g: ["g", "kg"],
	ml: ["ml", "L", "tbsp", "tsp", "cup", "oz"],
	piece: ["pcs"],
};

/** Display units compatible with a base unit (same measurement family). */
export function displayUnitsForBase(base: BaseUnit): string[] {
	return DISPLAY_UNITS_BY_BASE[base] ?? ["pcs"];
}

/**
 * Units allowed for an ingredient of a given product: its own display unit
 * plus the rest of its base-unit family (deduped, product's unit first).
 *
 * For measurable pcs products (bottles/cans), the usageUnit drives the
 * allowed family - e.g. a "pcs" soy sauce bottle with usageUnit="ml"
 * should allow ml, L, tbsp, etc. in recipe ingredients.
 */
export function allowedUnitsForProduct(p: {
	baseUnit: BaseUnit;
	displayUnit: string;
	measurable?: boolean;
	usageUnit?: string | null;
}): string[] {
	if (p.measurable && p.usageUnit && p.usageUnit !== "pcs") {
		const info = unitInfo(p.usageUnit);
		return Array.from(new Set([p.usageUnit, ...displayUnitsForBase(info.base)]));
	}
	return Array.from(new Set([p.displayUnit, ...displayUnitsForBase(p.baseUnit)]));
}

/** Convert a value entered in `displayUnit` into the product's base unit. */
export function toBaseUnit(value: number, displayUnit: string): number {
	return value * unitInfo(displayUnit).factor;
}

/** Convert a base-unit value back into `displayUnit` for showing. */
export function fromBaseUnit(baseValue: number, displayUnit: string): number {
	const factor = unitInfo(displayUnit).factor || 1;
	return baseValue / factor;
}

/** Format a base-unit quantity for display, e.g. 3000 (g) + "kg" -> "3 kg". */
export function formatQuantity(baseValue: number, displayUnit: string): string {
	const v = fromBaseUnit(baseValue, displayUnit);
	const rounded = Math.round(v * 1000) / 1000;
	return `${rounded} ${displayUnit}`;
}
