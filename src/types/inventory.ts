// Batch/FEFO inventory model - the single source of truth shared by all apps.
// A product is "what an item is"; batches are "what is physically on hand",
// each with its own (manually entered) expiry. On-hand = sum of batch quantities.

import type { Timestamp } from "firebase/firestore";

export type BaseUnit = "g" | "ml" | "piece";

export interface Product {
	id: string;
	name: string;
	category: string;
	baseUnit: BaseUnit;
	displayUnit: string; // e.g. kg, L, pcs, bottles
	minimumThreshold: number | null; // in baseUnit
	shelfLifeDays: number | null; // optional; pre-fills suggested expiry only
	barcode?: string;
	countable: boolean;
	// measurable=true → item can be used in ml/g for recipes (e.g. a bottle of soy sauce).
	// unitSize = how many usageUnits fit in 1 displayUnit (e.g. 750 ml per bottle).
	// usageUnit = unit used in recipe ingredients and used_stock ("ml" | "g" | "pcs").
	measurable: boolean;
	unitSize: number | null;
	usageUnit: string | null;
	// g per ml. Lets recipes measure a mass-stocked ingredient in tbsp/tsp
	// (1 tbsp sugar = 12.5 g). Null = unknown; spoon units are then refused
	// rather than silently mis-deducted. See lib/units.ts.
	density: number | null;
}

export interface InventoryBatch {
	id: string;
	productId: string;
	quantity: number; // in product baseUnit
	expirationDate: Timestamp | null; // MANUAL entry
	receivedDate: Timestamp | null;
	location: string | null;
	source: string;
	addedBy: string;
}

export type StockStatus = "out" | "low" | "in";

export interface ProductWithBatches {
	product: Product;
	batches: InventoryBatch[];
	onHand: number; // sum of batch quantities, in baseUnit
	status: StockStatus;
	nearestExpiry: Timestamp | null; // earliest batch expiry (FEFO front)
}

export function deriveStatus(onHand: number, minimumThreshold: number | null): StockStatus {
	if (onHand <= 0) return "out";
	if (minimumThreshold != null && onHand <= minimumThreshold) return "low";
	return "in";
}

// Tracks remaining liquid/solid in opened units (bottles, cans) per product.
// Written by the mobile prep-recording flow; read here for display.
export interface UsedStock {
	id: string;            // = productId
	remainingBase: number; // remaining amount in base units (ml or g)
	updatedAt: string;     // ISO date string (converted from Timestamp on read)
}

export const STOCK_STATUS_MAP: Record<StockStatus, { label: string; color: "success" | "warning" | "danger" }> = {
	in: { label: "In Stock", color: "success" },
	low: { label: "Low Stock", color: "warning" },
	out: { label: "Out of Stock", color: "danger" },
};
