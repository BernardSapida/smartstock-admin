// FEFO consumption: deduct a quantity (in base unit) from a product's batches,
// earliest-expiry first. Returns the per-batch breakdown of what was consumed.

import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { syncStockAlert } from "@/features/notifications/sync";
import { db } from "@/lib/firebase";

export interface ConsumedPart {
	batchId: string;
	quantity: number; // base unit
}

export interface ConsumeResult {
	consumed: ConsumedPart[];
	shortBy: number; // base unit still needed if stock ran out (0 if fully satisfied)
}

function ms(v: unknown): number {
	const t = v as { toMillis?: () => number } | null;
	return t?.toMillis ? t.toMillis() : Number.POSITIVE_INFINITY;
}

/**
 * Deduct `qtyBase` of product `productId` from its batches (FEFO).
 * Empties are deleted; partials are reduced. Does nothing if qtyBase <= 0.
 */
export async function consumeProduct(productId: string, qtyBase: number): Promise<ConsumeResult> {
	if (qtyBase <= 0) return { consumed: [], shortBy: 0 };

	const snap = await getDocs(query(collection(db, "inventory_batches"), where("productId", "==", productId)));
	const batches = snap.docs
		.map((d) => ({ id: d.id, ref: d.ref, quantity: (d.data().quantity as number) ?? 0, exp: d.data().expirationDate }))
		.sort((a, b) => ms(a.exp) - ms(b.exp));

	const wb = writeBatch(db);
	const consumed: ConsumedPart[] = [];
	let remaining = qtyBase;

	for (const b of batches) {
		if (remaining <= 0) break;
		if (b.quantity <= 0) continue;
		const take = Math.min(b.quantity, remaining);
		remaining -= take;
		consumed.push({ batchId: b.id, quantity: take });
		const left = b.quantity - take;
		if (left <= 0) wb.delete(b.ref);
		else wb.update(b.ref, { quantity: left });
	}

	await wb.commit();
	// Consuming stock may push the product to low/out - refresh its alert.
	void syncStockAlert(productId);
	return { consumed, shortBy: remaining > 0 ? remaining : 0 };
}
