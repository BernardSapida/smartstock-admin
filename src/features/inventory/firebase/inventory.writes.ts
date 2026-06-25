// Write layer for the batch inventory model (client SDK; rules allow authed writes).
// All quantities are converted to the product base unit before storing.

import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	query,
	serverTimestamp,
	Timestamp,
	updateDoc,
	where,
	writeBatch,
} from "firebase/firestore";
import { notifyExpiringBatch, syncStockAlert } from "@/features/notifications/sync";
import { logAction } from "@/lib/audit";
import { db } from "@/lib/firebase";
import { toBaseUnit, unitInfo } from "@/lib/units";

export interface Actor {
	uid: string;
	name: string;
	role: string;
}

export interface ProductInput {
	name: string;
	category: string;
	displayUnit: string;
	minimumThresholdDisplay: number | null; // entered in displayUnit
	shelfLifeDays: number | null;
	measurable: boolean;
	unitSize: number | null;
	usageUnit: string | null;
}

function productDoc(input: ProductInput) {
	const { base } = unitInfo(input.displayUnit);
	return {
		name: input.name.trim(),
		category: input.category.trim() || "Uncategorized",
		baseUnit: base,
		displayUnit: input.displayUnit,
		minimumThreshold:
			input.minimumThresholdDisplay != null ? toBaseUnit(input.minimumThresholdDisplay, input.displayUnit) : null,
		shelfLifeDays: input.shelfLifeDays,
		barcode: "",
		countable: base === "piece",
		measurable: input.measurable,
		unitSize: input.unitSize,
		usageUnit: input.usageUnit,
		updatedAt: serverTimestamp(),
	};
}

export async function addProduct(input: ProductInput, actor: Actor): Promise<string> {
	const ref = await addDoc(collection(db, "products"), { ...productDoc(input), createdAt: serverTimestamp() });
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "CREATE",
		module: "Inventory",
		description: `Added product "${input.name}"`,
	});
	return ref.id;
}

export async function updateProduct(id: string, input: ProductInput, actor: Actor): Promise<void> {
	await updateDoc(doc(db, "products", id), productDoc(input));
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "UPDATE",
		module: "Inventory",
		description: `Updated product "${input.name}"`,
	});
}

/** Delete a product and all of its batches. */
export async function deleteProduct(id: string, name: string, actor: Actor): Promise<void> {
	const batchesSnap = await getDocs(query(collection(db, "inventory_batches"), where("productId", "==", id)));
	const wb = writeBatch(db);
	for (const b of batchesSnap.docs) wb.delete(b.ref);
	wb.delete(doc(db, "products", id));
	await wb.commit();
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "DELETE",
		module: "Inventory",
		description: `Deleted product "${name}" and ${batchesSnap.size} batch(es)`,
	});
}

export interface BatchInput {
	productId: string;
	displayUnit: string;
	quantityDisplay: number; // entered in displayUnit
	expirationDate: Date | null; // MANUAL entry
	location: string;
}

export async function addBatch(input: BatchInput, productName: string, actor: Actor): Promise<string> {
	const ref = await addDoc(collection(db, "inventory_batches"), {
		productId: input.productId,
		quantity: toBaseUnit(input.quantityDisplay, input.displayUnit),
		expirationDate: input.expirationDate ? Timestamp.fromDate(input.expirationDate) : null,
		receivedDate: serverTimestamp(),
		location: input.location.trim() || null,
		source: "manual",
		addedBy: actor.name,
	});
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "CREATE",
		module: "Inventory",
		description: `Added batch (${input.quantityDisplay} ${input.displayUnit}) to "${productName}"`,
	});
	// Best-effort notifications: a restock may clear a stock alert, and a
	// soon-to-expire batch should raise one. Never block the write on these.
	void syncStockAlert(input.productId);
	void notifyExpiringBatch({ batchId: ref.id, productName, expirationDate: input.expirationDate });
	return ref.id;
}

export async function updateBatchQuantity(
	productId: string,
	batchId: string,
	newQtyDisplay: number,
	displayUnit: string,
	productName: string,
	actor: Actor,
): Promise<void> {
	await updateDoc(doc(db, "inventory_batches", batchId), {
		quantity: toBaseUnit(newQtyDisplay, displayUnit),
	});
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "UPDATE",
		module: "Inventory",
		description: `Set batch of "${productName}" to ${newQtyDisplay} ${displayUnit}`,
	});
	void syncStockAlert(productId);
}

export async function deleteBatch(
	productId: string,
	batchId: string,
	productName: string,
	actor: Actor,
): Promise<void> {
	await deleteDoc(doc(db, "inventory_batches", batchId));
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "DELETE",
		module: "Inventory",
		description: `Removed a batch of "${productName}"`,
	});
	void syncStockAlert(productId);
}
