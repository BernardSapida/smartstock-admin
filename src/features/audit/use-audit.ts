import { collection, limit, onSnapshot, query, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

export interface AuditEntry {
	id: string;
	user: string;
	role: string;
	action: string;
	module: string;
	description: string;
	timestamp: Timestamp | null;
	status: string;
}

/**
 * audit_logs predates this app: legacy docs (preserved as a protected collection
 * in the backend) may store `timestamp` as an ISO string, epoch millis, a Date,
 * or a {seconds, nanoseconds} shape rather than a Firestore Timestamp. Coerce
 * everything to a Timestamp (or null) so the sort/render never throws — a single
 * bad doc used to wedge the whole table on an infinite loading skeleton.
 */
function coerceTimestamp(v: unknown): Timestamp | null {
	if (!v) return null;
	if (v instanceof Timestamp) return v;
	if (typeof v === "object") {
		const o = v as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
		if (typeof o.toMillis === "function") return Timestamp.fromMillis(o.toMillis());
		if (typeof o.seconds === "number") {
			return new Timestamp(o.seconds, typeof o.nanoseconds === "number" ? o.nanoseconds : 0);
		}
	}
	if (v instanceof Date) return Timestamp.fromDate(v);
	if (typeof v === "number") return Timestamp.fromMillis(v);
	if (typeof v === "string") {
		const ms = Date.parse(v);
		return Number.isNaN(ms) ? null : Timestamp.fromMillis(ms);
	}
	return null;
}

export function useAuditLogs(max = 200) {
	const [logs, setLogs] = useState<AuditEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	useEffect(() => {
		// No orderBy (avoids composite index); sort client-side.
		const unsub = onSnapshot(
			query(collection(db, "audit_logs"), limit(max)),
			(snap) => {
				try {
					const rows: AuditEntry[] = snap.docs
						.map((d) => {
							const data = d.data();
							return {
								id: d.id,
								user: (data.user as string) ?? "",
								role: (data.role as string) ?? "",
								action: (data.action as string) ?? "",
								module: (data.module as string) ?? "",
								description: (data.description as string) ?? "",
								timestamp: coerceTimestamp(data.timestamp),
								status: (data.status as string) ?? "success",
							};
						})
						.sort((a, b) => (b.timestamp?.toMillis() ?? 0) - (a.timestamp?.toMillis() ?? 0));
					setLogs(rows);
					setError(null);
				} catch (e) {
					// A malformed doc must not leave the table loading forever.
					setError(e instanceof Error ? e : new Error("Failed to parse audit logs"));
				} finally {
					setLoading(false);
				}
			},
			(err) => {
				// Without this handler a listener error (e.g. permission denied)
				// leaves the table loading forever.
				setError(err);
				setLoading(false);
			},
		);
		return unsub;
	}, [max]);
	return { logs, loading, error };
}
