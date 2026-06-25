// Notifications - aligned to the EXISTING `notifications` collection shape shared
// with inventory-native. Documents carry { title, message, targetRole, type,
// itemId, isRead, timestamp, readAt }. targetRole is "admin" | "staff" | "all".
//
// IMPORTANT: inventory-native writes the time field as `timestamp` (and uses
// underscore type strings like `out_of_stock`). Older admin code wrote
// `createdAt`. We read `timestamp` with a `createdAt` fallback so notifications
// from either app display and sort correctly, and we WRITE `timestamp` so the
// native reader (which queries by `timestamp`) stays consistent.

import {
	addDoc,
	collection,
	doc,
	getDocs,
	onSnapshot,
	query,
	serverTimestamp,
	type Timestamp,
	updateDoc,
	where,
	writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserRole } from "@/types/user";

export type NotificationType =
	| "low_stock"
	| "out_of_stock"
	| "expiry"
	| "recipe_prepared"
	| "inspection_alert"
	| "system"
	| "general";

export type TargetRole = "admin" | "staff" | "all";

export interface AppNotification {
	id: string;
	title: string;
	message: string;
	targetRole: TargetRole;
	type: NotificationType;
	itemId: string | null;
	isRead: boolean;
	timestamp: Timestamp | null;
}

function timeOf(data: Record<string, unknown>): Timestamp | null {
	return ((data.timestamp as Timestamp) ?? (data.createdAt as Timestamp)) ?? null;
}

export function watchNotifications(role: UserRole, cb: (n: AppNotification[]) => void): () => void {
	// Avoid composite-index requirements: filter client-side, sort client-side.
	return onSnapshot(collection(db, "notifications"), (snap) => {
		const rows = snap.docs
			.map((d) => {
				const data = d.data();
				return {
					id: d.id,
					title: (data.title as string) ?? "",
					message: (data.message as string) ?? "",
					targetRole: ((data.targetRole as string) ?? "all") as AppNotification["targetRole"],
					type: ((data.type as string) ?? "general") as NotificationType,
					itemId: (data.itemId as string) ?? null,
					isRead: (data.isRead as boolean) ?? false,
					timestamp: timeOf(data),
				};
			})
			.filter((n) => n.targetRole === "all" || n.targetRole === role)
			.sort((a, b) => (b.timestamp?.toMillis() ?? 0) - (a.timestamp?.toMillis() ?? 0));
		cb(rows);
	});
}

export async function markRead(id: string): Promise<void> {
	await updateDoc(doc(db, "notifications", id), { isRead: true, readAt: serverTimestamp() });
}

export async function markAllRead(notifications: AppNotification[]): Promise<void> {
	const unread = notifications.filter((n) => !n.isRead);
	if (!unread.length) return;
	const wb = writeBatch(db);
	for (const n of unread) wb.update(doc(db, "notifications", n.id), { isRead: true, readAt: serverTimestamp() });
	await wb.commit();
}

export interface NotificationInput {
	title: string;
	message: string;
	targetRole: TargetRole;
	type: NotificationType;
	itemId?: string;
}

/**
 * Create a notification, mirroring inventory-native's writer: when `itemId` is
 * given, upsert the existing unread notification of the same (type, itemId)
 * instead of stacking duplicates for the same recurring condition.
 */
export async function createNotification(input: NotificationInput): Promise<void> {
	const { itemId, ...rest } = input;
	if (itemId) {
		const existing = await getDocs(
			query(
				collection(db, "notifications"),
				where("type", "==", input.type),
				where("itemId", "==", itemId),
				where("isRead", "==", false),
			),
		);
		if (!existing.empty) {
			await updateDoc(existing.docs[0].ref, {
				title: input.title,
				message: input.message,
				timestamp: serverTimestamp(),
			});
			return;
		}
	}
	await addDoc(collection(db, "notifications"), {
		...rest,
		itemId: itemId ?? null,
		isRead: false,
		timestamp: serverTimestamp(),
	});
}

/**
 * Mark unread alerts of the given types for an item as read - e.g. once a
 * product is restocked above threshold, its stale low/out-of-stock alerts clear.
 */
export async function resolveAlerts(itemId: string, types: NotificationType[]): Promise<void> {
	const snap = await getDocs(
		query(collection(db, "notifications"), where("itemId", "==", itemId), where("isRead", "==", false)),
	);
	const stale = snap.docs.filter((d) => types.includes((d.data().type as NotificationType) ?? "general"));
	if (!stale.length) return;
	const wb = writeBatch(db);
	for (const d of stale) wb.update(d.ref, { isRead: true, readAt: serverTimestamp() });
	await wb.commit();
}
