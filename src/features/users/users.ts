// User management over the `users` collection (the shared user store).
// NOTE: creating brand-new auth users must happen via the backend Admin SDK
// (doing it client-side would sign the admin out). Here we manage existing users.

import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Actor } from "@/features/inventory/firebase/inventory.writes";
import { logAction } from "@/lib/audit";
import { db } from "@/lib/firebase";
import type { AppUser, UserRole } from "@/types/user";

function toUser(uid: string, d: Record<string, unknown>): AppUser {
	return {
		uid,
		email: (d.email as string) ?? "",
		fullName: (d.fullName as string) ?? "",
		role: ((d.role as string)?.toLowerCase() === "admin" ? "admin" : "staff") as UserRole,
		phoneNumber: (d.phoneNumber as string) ?? "",
		unitPreference: (d.unitPreference as string) ?? "",
		isActive: (d.isActive as boolean) ?? true,
		shiftOn: (d.shiftOn as boolean) ?? false,
		isArchived: (d.isArchived as boolean) ?? false,
		permissions: (d.permissions as Record<string, boolean>) ?? {},
		photoUrl: (d.photoUrl as string) ?? "",
	};
}

export function useUsers() {
	const [users, setUsers] = useState<AppUser[]>([]);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		const unsub = onSnapshot(collection(db, "users"), (snap) => {
			setUsers(snap.docs.map((d) => toUser(d.id, d.data())).sort((a, b) => a.fullName.localeCompare(b.fullName)));
			setLoading(false);
		});
		return unsub;
	}, []);
	return { users, loading };
}

export async function updateUserRole(uid: string, role: UserRole, actor: Actor): Promise<void> {
	await updateDoc(doc(db, "users", uid), { role, updatedAt: serverTimestamp() });
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "SETTING",
		module: "Users",
		description: `Set role of ${uid} to ${role}`,
	});
}

export async function updateUserActive(uid: string, isActive: boolean, actor: Actor): Promise<void> {
	await updateDoc(doc(db, "users", uid), { isActive, updatedAt: serverTimestamp() });
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "SETTING",
		module: "Users",
		description: `${isActive ? "Activated" : "Deactivated"} ${uid}`,
	});
}

export async function updateUserPermissions(
	uid: string,
	permissions: Record<string, boolean>,
	actor: Actor,
): Promise<void> {
	await updateDoc(doc(db, "users", uid), { permissions, updatedAt: serverTimestamp() });
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "SETTING",
		module: "Users",
		description: `Updated permissions for ${uid}`,
	});
}

export async function updateOwnProfile(uid: string, data: { fullName: string; phoneNumber: string }): Promise<void> {
	await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
}

export const PERMISSION_KEYS = [
	"inventoryView",
	"inventoryAdjust",
	"recipePrepare",
	"inspectionSubmit",
	"notificationsView",
	"forecastView",
	"staffManage",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

// Human-readable label and explanation for each permission, shown to admins
// in Settings → Permissions instead of the raw camelCase keys.
export const PERMISSION_META: Record<PermissionKey, { label: string; description: string }> = {
	inventoryView: {
		label: "View inventory",
		description: "See products, stock levels, and batches.",
	},
	inventoryAdjust: {
		label: "Adjust stock",
		description: "Add, remove, or correct inventory quantities.",
	},
	recipePrepare: {
		label: "Prepare recipes",
		description: "Record recipe preparations, deducting the ingredients used.",
	},
	inspectionSubmit: {
		label: "Submit inspections",
		description: "Complete and submit stock inspection checklists.",
	},
	notificationsView: {
		label: "View notifications",
		description: "See low-stock and expiry alerts.",
	},
	forecastView: {
		label: "View forecasts & reports",
		description: "Access restock, production, and expiry forecasts.",
	},
	staffManage: {
		label: "Manage staff",
		description: "Edit other staff members’ details and shift status.",
	},
};
