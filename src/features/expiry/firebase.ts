// Expiry actions: mark a batch checked, or report it for disposal.
// Writes an inventory_events doc; disposal also reduces the batch quantity.

import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Actor } from "@/features/inventory/firebase/inventory.writes";
import { syncStockAlert } from "@/features/notifications/sync";
import { logAction } from "@/lib/audit";
import { db } from "@/lib/firebase";

export async function markBatchChecked(
	args: { productId: string; batchId: string; productName: string; note?: string },
	actor: Actor,
): Promise<void> {
	await addDoc(collection(db, "inventory_events"), {
		productId: args.productId,
		batchId: args.batchId,
		type: "checked",
		note: args.note ?? "",
		by: actor.uid,
		byName: actor.name,
		at: serverTimestamp(),
	});
	await updateDoc(doc(db, "inventory_batches", args.batchId), {
		lastCheckedAt: serverTimestamp(),
		lastCheckedBy: actor.name,
	}).catch(() => {});
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "UPDATE",
		module: "Expiry",
		description: `Checked a batch of "${args.productName}"`,
	});
}

export async function reportDisposal(
	args: { productId: string; batchId: string; productName: string; reason: string; note?: string },
	actor: Actor,
): Promise<void> {
	await addDoc(collection(db, "inventory_events"), {
		productId: args.productId,
		batchId: args.batchId,
		type: "disposal",
		reason: args.reason,
		note: args.note ?? "",
		by: actor.uid,
		byName: actor.name,
		at: serverTimestamp(),
	});
	// Disposed batch is removed from stock.
	await deleteDoc(doc(db, "inventory_batches", args.batchId));
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "DELETE",
		module: "Expiry",
		description: `Disposed a batch of "${args.productName}" (${args.reason})`,
	});
	// Removing the batch may drop the product to low/out of stock.
	void syncStockAlert(args.productId);
}
