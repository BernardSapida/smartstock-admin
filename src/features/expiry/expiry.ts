// Per-batch expiry urgency + flattening helpers.

import type { Timestamp } from "firebase/firestore";
import type { InventoryBatch, ProductWithBatches } from "@/types/inventory";

export type UrgencyLevel = "expired" | "critical" | "warning" | "watch" | "ok" | "none";

export const URGENCY_META: Record<
	UrgencyLevel,
	{ label: string; color: "danger" | "warning" | "success" | "default" }
> = {
	expired: { label: "Expired", color: "danger" },
	critical: { label: "Critical", color: "danger" },
	warning: { label: "Warning", color: "warning" },
	watch: { label: "Watch", color: "warning" },
	ok: { label: "OK", color: "success" },
	none: { label: "No expiry", color: "default" },
};

export function daysLeft(ts: Timestamp | null): number | null {
	if (!ts) return null;
	return Math.ceil((ts.toMillis() - Date.now()) / 86_400_000);
}

export function urgencyOf(ts: Timestamp | null): UrgencyLevel {
	const d = daysLeft(ts);
	if (d === null) return "none";
	if (d <= 0) return "expired";
	if (d <= 2) return "critical";
	if (d <= 5) return "warning";
	if (d <= 10) return "watch";
	return "ok";
}

export interface ExpiringBatch {
	batch: InventoryBatch;
	productId: string;
	productName: string;
	category: string;
	displayUnit: string;
	daysLeft: number | null;
	urgency: UrgencyLevel;
}

/** Flatten product+batches into a list of batches with expiry, sorted soonest first. */
export function flattenExpiring(rows: ProductWithBatches[]): ExpiringBatch[] {
	const out: ExpiringBatch[] = [];
	for (const r of rows) {
		for (const b of r.batches) {
			out.push({
				batch: b,
				productId: r.product.id,
				productName: r.product.name,
				category: r.product.category,
				displayUnit: r.product.displayUnit,
				daysLeft: daysLeft(b.expirationDate),
				urgency: urgencyOf(b.expirationDate),
			});
		}
	}
	return out.sort((a, b) => {
		const av = a.daysLeft ?? Number.POSITIVE_INFINITY;
		const bv = b.daysLeft ?? Number.POSITIVE_INFINITY;
		return av - bv;
	});
}
