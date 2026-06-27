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

export async function updateOwnProfile(uid: string, data: { fullName: string; phoneNumber: string }): Promise<void> {
	await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
}
