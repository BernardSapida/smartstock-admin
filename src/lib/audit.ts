// Append-only audit trail. UID-based - no external IP lookup (the legacy
// app called ipify.org on every action; we dropped that).

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AuditAction = "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "EXPORT" | "SETTING" | "ALERT";
export type AuditStatus = "success" | "warning" | "failed";

interface LogActionInput {
	uid: string;
	user: string; // display name or email
	role: string;
	action: AuditAction;
	module: string; // Auth | Inventory | Recipes | ...
	description: string;
	status?: AuditStatus;
}

export async function logAction(input: LogActionInput): Promise<void> {
	try {
		await addDoc(collection(db, "audit_logs"), {
			uid: input.uid,
			user: input.user,
			role: input.role,
			action: input.action,
			module: input.module,
			description: input.description,
			status: input.status ?? "success",
			timestamp: serverTimestamp(),
		});
	} catch {
		// Audit logging must never break the user flow.
	}
}
