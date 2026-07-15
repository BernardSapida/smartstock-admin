// Client-side notification triggers, mirroring inventory-native's `syncAlerts`.
// Called after inventory writes so the `notifications` inbox stays in step with
// stock levels and expiry. Everything here is best-effort: a notification
// failure must NEVER fail (or slow) the underlying inventory write, so callers
// fire-and-forget (`void`) and these helpers swallow their own errors.

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatQuantity } from "@/lib/units";
import { deriveStatus } from "@/types/inventory";
import { createNotification, resolveAlerts } from "./notifications";

const EXPIRY_WINDOW_DAYS = 7;

/**
 * Recompute a product's on-hand vs. minimum threshold and update its stock
 * alerts: emit an out-of-stock / low-stock notification, or clear stale ones
 * once the product is healthy again. Keep the thresholds in sync with
 * `deriveStatus` so the inbox matches the Alerts page.
 *
 * Alerts target "all", not "admin": staff are the ones who actually restock and
 * pull expiring items, so an alert only an admin can see is an alert nobody acts
 * on. These used to be admin-only, which is why the staff notifications screen on
 * mobile appeared permanently empty.
 */
export async function syncStockAlert(productId: string): Promise<void> {
	try {
		const prodSnap = await getDoc(doc(db, "products", productId));
		if (!prodSnap.exists()) return;
		const p = prodSnap.data();
		const name = (p.name as string) ?? "Item";
		const displayUnit = (p.displayUnit as string) ?? "pcs";
		const threshold = (p.minimumThreshold as number) ?? null;

		const batches = await getDocs(query(collection(db, "inventory_batches"), where("productId", "==", productId)));
		const onHand = batches.docs.reduce((sum, b) => sum + ((b.data().quantity as number) ?? 0), 0);
		const status = deriveStatus(onHand, threshold);

		if (status === "out") {
			await createNotification({
				title: `${name} is out of stock`,
				message: `${name} has run out. Restock as soon as possible.`,
				targetRole: "all",
				type: "out_of_stock",
				itemId: productId,
			});
			await resolveAlerts(productId, ["low_stock"]);
		} else if (status === "low") {
			await createNotification({
				title: `Low stock: ${name}`,
				message: `${name} is running low (${formatQuantity(onHand, displayUnit)} on hand).`,
				targetRole: "all",
				type: "low_stock",
				itemId: productId,
			});
			await resolveAlerts(productId, ["out_of_stock"]);
		} else {
			await resolveAlerts(productId, ["low_stock", "out_of_stock"]);
		}
	} catch {
		// non-critical: never block the inventory write on a notification error.
	}
}

/**
 * Emit an "expiring soon" alert for a freshly added batch whose expiry falls
 * within the alert window. Keyed by batchId so each batch dedups independently.
 */
export async function notifyExpiringBatch(args: {
	batchId: string;
	productName: string;
	expirationDate: Date | null;
}): Promise<void> {
	if (!args.expirationDate) return;
	const days = Math.ceil((args.expirationDate.getTime() - Date.now()) / 86_400_000);
	if (days <= 0 || days > EXPIRY_WINDOW_DAYS) return;
	try {
		await createNotification({
			title: `Expiring soon: ${args.productName}`,
			message: `A batch of ${args.productName} expires in ${days} day(s).`,
			targetRole: "all",
			type: "expiry",
			itemId: args.batchId,
		});
	} catch {
		// non-critical
	}
}
