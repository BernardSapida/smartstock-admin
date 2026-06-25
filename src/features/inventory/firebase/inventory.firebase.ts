// Read layer for the batch inventory model. Subscribes to `products` and
// `inventory_batches`, joins them, and derives on-hand + status per product.

import { collection, onSnapshot, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deriveStatus, type InventoryBatch, type Product, type ProductWithBatches, type UsedStock } from "@/types/inventory";

function toProduct(id: string, d: Record<string, unknown>): Product {
	return {
		id,
		name: (d.name as string) ?? "",
		category: (d.category as string) ?? "Uncategorized",
		baseUnit: ((d.baseUnit as string) ?? "piece") as Product["baseUnit"],
		displayUnit: (d.displayUnit as string) ?? "pcs",
		minimumThreshold: (d.minimumThreshold as number) ?? null,
		shelfLifeDays: (d.shelfLifeDays as number) ?? null,
		barcode: (d.barcode as string) ?? "",
		countable: (d.countable as boolean) ?? false,
		measurable: (d.measurable as boolean) ?? false,
		unitSize: (d.unitSize as number) ?? null,
		usageUnit: (d.usageUnit as string) ?? null,
	};
}

function toBatch(id: string, d: Record<string, unknown>): InventoryBatch {
	return {
		id,
		productId: (d.productId as string) ?? "",
		quantity: (d.quantity as number) ?? 0,
		expirationDate: (d.expirationDate as Timestamp) ?? null,
		receivedDate: (d.receivedDate as Timestamp) ?? null,
		location: (d.location as string) ?? null,
		source: (d.source as string) ?? "",
		addedBy: (d.addedBy as string) ?? "",
	};
}

function ms(ts: Timestamp | null): number {
	return ts ? ts.toMillis() : Number.POSITIVE_INFINITY;
}

function join(products: Product[], batches: InventoryBatch[]): ProductWithBatches[] {
	const byProduct = new Map<string, InventoryBatch[]>();
	for (const b of batches) {
		const list = byProduct.get(b.productId) ?? [];
		list.push(b);
		byProduct.set(b.productId, list);
	}

	return products
		.map((product) => {
			// FEFO order: earliest expiry first.
			const list = (byProduct.get(product.id) ?? []).sort((a, b) => ms(a.expirationDate) - ms(b.expirationDate));
			const onHand = list.reduce((sum, b) => sum + (b.quantity || 0), 0);
			return {
				product,
				batches: list,
				onHand,
				status: deriveStatus(onHand, product.minimumThreshold),
				nearestExpiry: list.find((b) => b.expirationDate)?.expirationDate ?? null,
			};
		})
		.sort((a, b) => a.product.name.localeCompare(b.product.name));
}

/** Live subscription to the used_stock collection (one doc per product). */
export function watchUsedStock(cb: (items: UsedStock[]) => void): () => void {
	return onSnapshot(collection(db, "used_stock"), (snap) => {
		const items = snap.docs.map((d) => {
			const raw = d.data();
			const ts = raw.updatedAt as Timestamp | undefined;
			return {
				id: d.id,
				remainingBase: (raw.remainingBase as number) ?? 0,
				updatedAt: ts?.toDate?.()?.toISOString?.() ?? "",
			};
		});
		cb(items);
	});
}

/**
 * Live subscription to the joined inventory. Calls `cb` whenever products or
 * batches change. Returns an unsubscribe function.
 */
export function watchInventory(cb: (rows: ProductWithBatches[]) => void): () => void {
	let products: Product[] = [];
	let batches: InventoryBatch[] = [];
	let haveProducts = false;
	let haveBatches = false;

	const emit = () => {
		if (haveProducts && haveBatches) cb(join(products, batches));
	};

	const unsubP = onSnapshot(collection(db, "products"), (snap) => {
		products = snap.docs.map((d) => toProduct(d.id, d.data()));
		haveProducts = true;
		emit();
	});
	const unsubB = onSnapshot(collection(db, "inventory_batches"), (snap) => {
		batches = snap.docs.map((d) => toBatch(d.id, d.data()));
		haveBatches = true;
		emit();
	});

	return () => {
		unsubP();
		unsubB();
	};
}
