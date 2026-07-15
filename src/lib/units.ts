// Canonical units: every quantity is stored in a product's base unit
// (g / ml / piece). Display/entry can use friendlier units (kg, L) and is
// converted on the way in/out. This powers correct recipe math later.
//
// SPOON UNITS AND DENSITY
// tbsp/tsp/cup are units of VOLUME, but the seasonings they usually measure
// (sugar, salt, spices) are stocked by MASS. Converting between the two needs
// the ingredient's density in g/ml -- there is no universal factor, because a
// tablespoon of salt (~17.7 g) and a tablespoon of flour (~7.8 g) differ by
// more than 2x. So a product carries an optional `density`, and any conversion
// that crosses the ml<->g boundary goes through it. Without a density we refuse
// the conversion rather than guessing, which is what used to silently deduct
// 1 g for "1 tbsp sugar".

import type { BaseUnit, Product } from "@/types/inventory";

// display unit -> { base unit, factor to that base }
// `base` here is the unit's NATURAL base: volume units land in ml, mass units
// in g. Crossing families is density's job, not this table's.
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

/** Volume units that only make sense for a mass product via density. */
export const SPOON_UNITS = ["tbsp", "tsp", "cup"] as const;

export function unitInfo(unit: string) {
	return UNIT_TABLE[unit.trim().toLowerCase()] ?? { base: "piece" as BaseUnit, factor: 1 };
}

// ---------------------------------------------------------------------------
// Density
// ---------------------------------------------------------------------------

/** ml in one level tablespoon - the pivot between the cook-facing "g per tbsp"
 *  the admin edits and the g/ml density the math actually uses. */
export const TBSP_ML = UNIT_TABLE.tbsp.factor;

/**
 * One row of the editable spoon-conversion table: an ingredient-name keyword and
 * the weight of ONE level tablespoon of it, in grams (how a cook thinks). Stored
 * globally in `system_config`; density (g/ml) = gPerTbsp / TBSP_ML.
 */
export interface SpoonDefault {
	name: string;
	gPerTbsp: number;
}

/**
 * Built-in seed for the global conversion table. Used until an admin saves their
 * own in Settings, and shown there as the starting point. Packed/level-spoon
 * figures; a product's own `density` always wins over any of these.
 *
 * Sanity-check: sugar at 12.5 g/tbsp = 12.5 / 14.787 = 0.845 g/ml, which gives
 * 1 tsp = 4.929 ml * 0.845 = 4.2 g. Order matters: more specific names first
 * ("brown sugar" before "sugar"), since the first keyword that matches wins.
 */
export const BUILTIN_SPOON_DEFAULTS: SpoonDefault[] = [
	{ name: "brown sugar", gPerTbsp: 13.75 },
	{ name: "powdered sugar", gPerTbsp: 8.3 },
	{ name: "sugar", gPerTbsp: 12.5 },
	{ name: "salt", gPerTbsp: 17.7 },
	{ name: "baking soda", gPerTbsp: 13.3 },
	{ name: "baking powder", gPerTbsp: 13.3 },
	{ name: "cornstarch", gPerTbsp: 9.3 },
	{ name: "flour", gPerTbsp: 7.8 },
	{ name: "pepper", gPerTbsp: 7.4 },
	{ name: "spice", gPerTbsp: 7.4 },
	{ name: "seasoning", gPerTbsp: 7.4 },
	{ name: "msg", gPerTbsp: 13.6 },
	{ name: "rice", gPerTbsp: 12.6 },
	{ name: "oil", gPerTbsp: 14.8 },
	{ name: "vinegar", gPerTbsp: 14.8 },
	{ name: "soy sauce", gPerTbsp: 14.8 },
	{ name: "water", gPerTbsp: 14.8 },
	{ name: "milk", gPerTbsp: 14.8 },
	{ name: "honey", gPerTbsp: 21 },
	{ name: "syrup", gPerTbsp: 21 },
	{ name: "butter", gPerTbsp: 13.5 },
	{ name: "margarine", gPerTbsp: 13.5 },
];

// Admin's saved table, pushed in from system_config at startup. Null = not loaded
// or empty, in which case the built-in seed applies. Kept in a module-level cache
// because resolveDensity() is a hot, synchronous call deep inside recipe math and
// can't take an async settings read on every invocation.
let runtimeSpoonDefaults: SpoonDefault[] | null = null;

/** Point density resolution at the admin's saved conversion table (or reset to
 *  the built-in seed with null/empty). Called by the settings subscriber. */
export function setSpoonDefaults(list: SpoonDefault[] | null): void {
	runtimeSpoonDefaults = list && list.length > 0 ? list : null;
}

/** The conversion table currently in force: the admin's if saved, else built-in. */
export function activeSpoonDefaults(): SpoonDefault[] {
	return runtimeSpoonDefaults ?? BUILTIN_SPOON_DEFAULTS;
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Density (g/ml) for a product name from the active table: first whole-word
 *  keyword match wins, mirroring the built-in ordering (specific before general). */
function densityFromDefaults(name: string): number | null {
	const n = name.trim().toLowerCase();
	for (const d of activeSpoonDefaults()) {
		const kw = d.name.trim().toLowerCase();
		if (!kw) continue;
		if (new RegExp(`\\b${escapeRegExp(kw)}\\b`).test(n)) return d.gPerTbsp / TBSP_ML;
	}
	return null;
}

/**
 * Best-known density (g/ml) for a product. Three cases, so the "measurable by
 * spoon" toggle can be honored:
 *   density > 0  → an explicit value the admin entered; use it.
 *   density === 0 → explicit OFF (toggle unchecked); NO spoons, do not guess.
 *   density == null → never configured (legacy/seeded); guess from the name via
 *     the global conversion table.
 * The 0-vs-null distinction is what lets an admin turn spoons off for an
 * ingredient the name table would otherwise auto-enable (e.g. "Sugar").
 */
export function resolveDensity(p: Pick<Product, "name" | "density">): number | null {
	if (p.density != null) return p.density > 0 ? p.density : null;
	return densityFromDefaults(p.name);
}

/** Suggested density for a name, used to pre-fill the product form. */
export function suggestedDensity(name: string): number | null {
	return densityFromDefaults(name);
}

/** True when converting `unit` into `base` requires a density (ml <-> g crossing). */
export function needsDensity(unit: string, base: BaseUnit): boolean {
	const from = unitInfo(unit).base;
	return (from === "ml" && base === "g") || (from === "g" && base === "ml");
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/** Convert a value entered in `displayUnit` into that unit's own natural base. */
export function toBaseUnit(value: number, displayUnit: string): number {
	return value * unitInfo(displayUnit).factor;
}

/** Convert a base-unit value back into `displayUnit` for showing. */
export function fromBaseUnit(baseValue: number, displayUnit: string): number {
	const factor = unitInfo(displayUnit).factor || 1;
	return baseValue / factor;
}

/**
 * Convert `value` expressed in `unit` into `targetBase`, using `density` (g/ml)
 * to cross the volume<->mass boundary.
 *
 * Returns null when the conversion is genuinely impossible -- a count/piece unit
 * mixed with a measured one, or a spoon unit for a mass product whose density we
 * don't know. Callers must surface null as "unit mismatch", never coerce it to 0
 * or fall through to a 1:1 factor.
 */
export function convertToBase(
	value: number,
	unit: string,
	targetBase: BaseUnit,
	density: number | null,
): number | null {
	const { base: from, factor } = unitInfo(unit);
	const amount = value * factor; // in `from`'s natural base

	if (from === targetBase) return amount;
	if (from === "piece" || targetBase === "piece") return null; // can't measure a count

	if (from === "ml" && targetBase === "g") {
		return density && density > 0 ? amount * density : null;
	}
	if (from === "g" && targetBase === "ml") {
		return density && density > 0 ? amount / density : null;
	}
	return null;
}

/**
 * Convert a recipe-ingredient quantity into the product's stocking base unit.
 * This is THE function recipe math and inventory deduction should call --
 * it is the only one that knows about the product's density.
 *
 * For measurable piece products (a 750 ml bottle of soy sauce), the effective
 * base is the usageUnit's base, not "piece".
 */
export function toProductBase(value: number, unit: string, product: Product): number | null {
	return convertToBase(value, unit, effectiveBase(product), resolveDensity(product));
}

/**
 * The unit a product is effectively *consumed* in. Normally its baseUnit, but a
 * measurable piece product (bottle/can) is consumed in its usageUnit's base.
 */
export function effectiveBase(p: Product): BaseUnit {
	if (p.measurable && p.baseUnit === "piece" && p.usageUnit && p.usageUnit !== "pcs" && p.unitSize) {
		return unitInfo(p.usageUnit).base;
	}
	return p.baseUnit;
}

// ---------------------------------------------------------------------------
// Allowed units for entry
// ---------------------------------------------------------------------------

// Friendly display units offered for each base unit, in entry order.
const DISPLAY_UNITS_BY_BASE: Record<BaseUnit, string[]> = {
	g: ["g", "kg"],
	ml: ["ml", "L", "oz"],
	piece: ["pcs"],
};

/** Display units compatible with a base unit (same measurement family). */
export function displayUnitsForBase(base: BaseUnit): string[] {
	return DISPLAY_UNITS_BY_BASE[base] ?? ["pcs"];
}

/**
 * Units allowed for an ingredient of a given product: its own display unit plus
 * the rest of its base-unit family, plus spoon units when we can convert them.
 *
 * Spoons are offered for any ml product (volume -> volume, no density needed)
 * and for a g product that has a known density -- which is what lets a recipe
 * say "1 tbsp sugar" against a product stocked in kilograms.
 */
export function allowedUnitsForProduct(p: Product): string[] {
	const base = effectiveBase(p);
	const own = p.measurable && p.usageUnit && p.usageUnit !== "pcs" ? p.usageUnit : p.displayUnit;

	const units = [own, ...displayUnitsForBase(base)];
	if (base === "ml" || (base === "g" && resolveDensity(p) != null)) {
		units.push(...SPOON_UNITS);
	}
	return Array.from(new Set(units));
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Format a base-unit quantity for display, e.g. 3000 (g) + "kg" -> "3 kg". */
export function formatQuantity(baseValue: number, displayUnit: string): string {
	const v = fromBaseUnit(baseValue, displayUnit);
	const rounded = Math.round(v * 1000) / 1000;
	return `${rounded} ${displayUnit}`;
}

/**
 * Explain a spoon measurement in the unit the product is actually stocked in,
 * e.g. "1 tbsp = 12.5 g". Returns null when no conversion is needed (the units
 * already match) or when it isn't possible.
 */
export function explainConversion(value: number, unit: string, product: Product): string | null {
	const base = effectiveBase(product);
	if (unitInfo(unit).base === base) return null;
	const converted = toProductBase(value, unit, product);
	if (converted == null) return null;
	return `${value} ${unit} = ${Math.round(converted * 100) / 100} ${base}`;
}
