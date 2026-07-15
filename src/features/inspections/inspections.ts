// Inspections: assigned by an admin here, performed by staff in the mobile app.
//
// SCHEMA MUST MATCH inventory-native/lib/types/inspection.ts and its
// lib/firebase/inspections.ts - both apps read and write the same `inspections`
// collection, and a disposal recorded on the phone has to show up here.

import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	serverTimestamp,
	Timestamp,
	updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Actor } from "@/features/inventory/firebase/inventory.writes";
import { createNotification } from "@/features/notifications/notifications";
import { logAction } from "@/lib/audit";
import { db } from "@/lib/firebase";

export type InspectionCondition = "good" | "warning" | "damaged" | "expired";
export type InspectionStatus = "pending" | "completed";

export const DISPOSABLE_CONDITIONS: InspectionCondition[] = ["damaged", "expired"];

export function isDisposable(c: InspectionCondition | null): boolean {
	return c != null && DISPOSABLE_CONDITIONS.includes(c);
}

export interface Inspection {
	id: string;
	productId: string | null;
	batchId: string | null;
	itemName: string;
	status: InspectionStatus;
	condition: InspectionCondition | null;
	notes: string;
	assignedTo: string | null;
	assignedToName: string | null;
	assignedBy: string | null;
	dueDate: Timestamp | null;
	staffId: string;
	staffName: string;
	checkedAt: Timestamp | null;
	disposed: boolean;
	disposedAt: Timestamp | null;
	/** How much was written off (base units). May be less than the batch held. */
	disposedQuantity: number | null;
}

function toInspection(id: string, d: Record<string, unknown>): Inspection {
	return {
		id,
		productId: (d.productId as string) ?? null,
		batchId: (d.batchId as string) ?? null,
		itemName: (d.itemName as string) ?? "",
		// Legacy rows predate the assign/perform split: they were written already
		// done, so a row with a condition but no status is a completed inspection.
		status: (d.status as InspectionStatus) ?? (d.condition ? "completed" : "pending"),
		condition: (d.condition as InspectionCondition) ?? null,
		notes: (d.notes as string) ?? "",
		assignedTo: (d.assignedTo as string) ?? null,
		assignedToName: (d.assignedToName as string) ?? null,
		assignedBy: (d.assignedBy as string) ?? null,
		dueDate: (d.dueDate as Timestamp) ?? null,
		staffId: (d.staffId as string) ?? "",
		staffName: (d.staffName as string) ?? "",
		checkedAt: (d.checkedAt as Timestamp) ?? null,
		disposed: (d.disposed as boolean) ?? false,
		disposedAt: (d.disposedAt as Timestamp) ?? null,
		disposedQuantity: (d.disposedQuantity as number) ?? null,
	};
}

/**
 * Live inspections feed.
 *
 * No `orderBy`: a pending assignment has no `checkedAt` yet, and ordering by it
 * would silently drop exactly the rows an admin most needs to see. Sort locally.
 */
export function useInspections() {
	const [inspections, setInspections] = useState<Inspection[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const unsub = onSnapshot(
			collection(db, "inspections"),
			(snap) => {
				const rows = snap.docs
					.map((d) => toInspection(d.id, d.data()))
					.sort((a, b) => {
						if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
						return (b.checkedAt?.toMillis() ?? 0) - (a.checkedAt?.toMillis() ?? 0);
					});
				setInspections(rows);
				setError(null);
				setLoading(false);
			},
			(err) => {
				setError(err);
				setLoading(false);
			},
		);
		return unsub;
	}, []);

	return { inspections, loading, error };
}

export async function assignInspection(
	args: {
		productId: string;
		batchId: string | null;
		itemName: string;
		assignedTo: string;
		assignedToName: string;
		dueDate: Date | null;
	},
	actor: Actor,
): Promise<void> {
	await addDoc(collection(db, "inspections"), {
		productId: args.productId,
		batchId: args.batchId,
		itemName: args.itemName,
		status: "pending" as InspectionStatus,
		condition: null,
		notes: "",
		assignedTo: args.assignedTo,
		assignedToName: args.assignedToName,
		assignedBy: actor.uid,
		dueDate: args.dueDate ? Timestamp.fromDate(args.dueDate) : null,
		staffId: "",
		staffName: "",
		disposed: false,
		disposedAt: null,
		createdAt: serverTimestamp(),
	});

	// Go through createNotification rather than hand-rolling an addDoc: it owns the
	// field names the readers actually query on (`isRead`, not `read` - an earlier
	// hand-rolled write here used `read` and the notification never reached the
	// phone, because native filters on `where("isRead", "==", false)`).
	//
	// Target "staff" explicitly, not "all": native's reader queries
	// `where("targetRole", "==", role)`, which never matches "all".
	await createNotification({
		title: "New inspection assigned",
		message: `You have been asked to inspect "${args.itemName}".`,
		targetRole: "staff",
		type: "inspection_alert",
	});

	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "CREATE",
		module: "Inspections",
		description: `Assigned inspection of "${args.itemName}" to ${args.assignedToName}`,
	});
}

export async function cancelInspection(inspection: Inspection, actor: Actor): Promise<void> {
	await deleteDoc(doc(db, "inspections", inspection.id));
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "DELETE",
		module: "Inspections",
		description: `Cancelled inspection of "${inspection.itemName}"`,
	});
}

/**
 * Dispose of an inspected item from the web.
 *
 * PARTIAL DISPOSAL: `quantity` is how much (in base units) is actually written off.
 * If it's less than the batch holds, the batch is REDUCED rather than deleted -
 * 2 kg of a 5 kg batch spoiled leaves 3 kg on hand. Only a full write-off deletes.
 *
 * Deliberately identical to the mobile app's disposeInspectedItem: same
 * `inventory_events` doc (`type: "disposal"`), same reduce-vs-delete rule, same flag
 * on the inspection. An admin disposing here and a staff member disposing on the
 * phone must produce the same inventory history, not two shapes of record.
 *
 * `onHand` is the batch's current quantity, passed in by the caller (which already
 * has it from the live inventory feed) so we don't re-read the doc.
 */
export async function disposeInspectedItem(
	inspection: Inspection,
	quantity: number,
	onHand: number,
	actor: Actor,
): Promise<void> {
	if (inspection.status !== "completed" || !isDisposable(inspection.condition)) {
		throw new Error("Only a completed inspection marked damaged or expired can be disposed.");
	}
	if (!inspection.batchId || !inspection.productId) {
		throw new Error("This inspection is not linked to a batch, so it cannot be disposed.");
	}
	if (inspection.disposed) {
		throw new Error("This item has already been disposed.");
	}
	if (quantity <= 0) {
		throw new Error("Enter how much is being disposed.");
	}
	if (quantity > onHand) {
		throw new Error(`This batch only has ${onHand} left - you cannot dispose more than that.`);
	}

	const remaining = onHand - quantity;
	const isFull = remaining <= 0;

	await addDoc(collection(db, "inventory_events"), {
		productId: inspection.productId,
		batchId: inspection.batchId,
		type: "disposal",
		reason: inspection.condition,
		note: inspection.notes ?? "",
		quantity, // how much was written off, NOT how much the batch held
		partial: !isFull,
		inspectionId: inspection.id,
		by: actor.uid,
		byName: actor.name,
		at: serverTimestamp(),
	});

	if (isFull) {
		await deleteDoc(doc(db, "inventory_batches", inspection.batchId));
	} else {
		await updateDoc(doc(db, "inventory_batches", inspection.batchId), { quantity: remaining });
	}

	await updateDoc(doc(db, "inspections", inspection.id), {
		disposed: true,
		disposedAt: serverTimestamp(),
		disposedQuantity: quantity,
	});

	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "DELETE",
		module: "Inventory",
		description: `Disposed ${quantity} of "${inspection.itemName}" (${inspection.condition}) after inspection${isFull ? " - whole batch removed" : ` - ${remaining} left on hand`}`,
		status: "warning",
	});
}
