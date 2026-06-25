export const PRODUCT_CATEGORIES = [
	"Bakery",
	"Beverages",
	"Condiments",
	"Dairy",
	"Dry Goods",
	"Frozen",
	"Fruits",
	"Meat",
	"Pantry",
	"Produce",
	"Seafood",
	"Seasonings",
	"Vegetables",
	"General",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }));
