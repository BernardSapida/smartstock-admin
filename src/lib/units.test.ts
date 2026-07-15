import { afterEach, describe, expect, it } from "vitest";
import type { Product } from "@/types/inventory";
import {
	allowedUnitsForProduct,
	convertToBase,
	resolveDensity,
	setSpoonDefaults,
	toProductBase,
} from "./units";

function product(over: Partial<Product> = {}): Product {
	return {
		id: "p1",
		name: "Sugar",
		category: "Seasoning",
		baseUnit: "g",
		displayUnit: "kg",
		minimumThreshold: null,
		shelfLifeDays: null,
		barcode: "",
		countable: false,
		measurable: true,
		unitSize: null,
		usageUnit: null,
		density: null,
		...over,
	};
}

describe("spoon -> gram conversion", () => {
	// The figures the panel asked for, to 1 decimal place.
	it("converts 1 tbsp of sugar to 12.5 g", () => {
		expect(toProductBase(1, "tbsp", product())).toBeCloseTo(12.5, 1);
	});

	it("converts 1 tsp of sugar to 4.2 g", () => {
		expect(toProductBase(1, "tsp", product())).toBeCloseTo(4.2, 1);
	});

	it("scales linearly", () => {
		expect(toProductBase(3, "tbsp", product())).toBeCloseTo(37.5, 1);
	});

	it("uses each ingredient's own density, not one global factor", () => {
		// A tbsp of salt weighs far more than a tbsp of flour. A single
		// grams-per-tbsp constant would get one of these badly wrong.
		const salt = toProductBase(1, "tbsp", product({ name: "Salt" }));
		const flour = toProductBase(1, "tbsp", product({ name: "All-purpose flour" }));
		expect(salt).toBeCloseTo(17.7, 1);
		expect(flour).toBeCloseTo(7.8, 1);
	});

	it("prefers an explicit density over the name-based default", () => {
		expect(resolveDensity(product({ name: "Sugar", density: 1 }))).toBe(1);
		expect(toProductBase(1, "tbsp", product({ name: "Sugar", density: 1 }))).toBeCloseTo(14.787, 2);
	});
});

describe("global editable conversion table", () => {
	// Every test resets the runtime table so one override can't leak into the next.
	afterEach(() => setSpoonDefaults(null));

	it("lets an admin's saved table change what a recipe deducts", () => {
		// Built-in sugar is 12.5 g/tbsp; the admin re-weighs it at 20 g/tbsp.
		setSpoonDefaults([{ name: "sugar", gPerTbsp: 20 }]);
		expect(toProductBase(1, "tbsp", product({ name: "Sugar" }))).toBeCloseTo(20, 1);
	});

	it("falls back to the built-in seed when the table is cleared", () => {
		setSpoonDefaults(null);
		expect(toProductBase(1, "tbsp", product({ name: "Sugar" }))).toBeCloseTo(12.5, 1);
	});

	it("a product's own density still overrides the global table", () => {
		setSpoonDefaults([{ name: "sugar", gPerTbsp: 20 }]);
		expect(resolveDensity(product({ name: "Sugar", density: 1 }))).toBe(1);
	});

	it("matches whole words only, so 'basalt' does not match 'salt'", () => {
		setSpoonDefaults([{ name: "salt", gPerTbsp: 17.7 }]);
		expect(resolveDensity(product({ name: "Basalt rock", density: null }))).toBeNull();
	});
});

describe("refusing impossible conversions", () => {
	it("returns null for a spoon measure on a mass product with no known density", () => {
		// The old code silently returned 1 (factor 1, base "piece"), deducting
		// 1 g for "1 tbsp". Refusing is the whole point.
		const unknown = product({ name: "Mystery Powder", density: null });
		expect(resolveDensity(unknown)).toBeNull();
		expect(toProductBase(1, "tbsp", unknown)).toBeNull();
	});

	it("returns null when mixing a count with a measure", () => {
		const egg = product({ name: "Egg", baseUnit: "piece", displayUnit: "pcs", measurable: false });
		expect(toProductBase(1, "tbsp", egg)).toBeNull();
		expect(convertToBase(5, "g", "piece", 0.8)).toBeNull();
	});
});

describe("volume products need no density", () => {
	it("converts tbsp to ml directly", () => {
		const oil = product({ name: "Cooking Oil", baseUnit: "ml", displayUnit: "L" });
		expect(toProductBase(1, "tbsp", oil)).toBeCloseTo(14.787, 2);
	});
});

describe("allowedUnitsForProduct", () => {
	it("offers spoons for a mass product once a density is known", () => {
		expect(allowedUnitsForProduct(product({ name: "Sugar" }))).toContain("tbsp");
	});

	it("withholds spoons from a mass product with no density", () => {
		const units = allowedUnitsForProduct(product({ name: "Mystery Powder" }));
		expect(units).not.toContain("tbsp");
		expect(units).toContain("g");
	});

	it("never offers spoons for a countable product", () => {
		const egg = product({ name: "Egg", baseUnit: "piece", displayUnit: "pcs", measurable: false });
		expect(allowedUnitsForProduct(egg)).not.toContain("tbsp");
	});
});
