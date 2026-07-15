import {
	collection,
	limit,
	onSnapshot,
	orderBy,
	type QueryConstraint,
	query,
	Timestamp,
	where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
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
 * everything to a Timestamp (or null) so the sort/render never throws - a single
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

export interface AuditRange {
	start: Date | null; // inclusive; widened to 00:00:00
	end: Date | null; // inclusive; widened to 23:59:59
}

function startOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

function endOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(23, 59, 59, 999);
	return x;
}

/**
 * Live audit log, optionally restricted to a date range.
 *
 * The range is applied SERVER-SIDE. This was previously `limit(200)` with no
 * `orderBy`, which returns an arbitrary 200 documents - not the newest 200. That
 * was survivable while the table just meant "recent activity", but a date filter
 * layered on an arbitrary window silently returns partial results: ask for
 * July 1–13 and you would see only whichever July rows happened to land in the
 * arbitrary slice, with no indication any were missing.
 *
 * A range filter and an `orderBy` on the SAME field need no composite index, so
 * this still rides Firestore's automatic single-field index.
 *
 * Caveat: `orderBy("timestamp")` drops documents that have no `timestamp` field
 * at all. That is correct for a time-ordered log (an undated entry has no place
 * on a timeline), but it does mean a legacy doc missing the field will no longer
 * appear. Legacy docs that merely store the wrong *type* still sort and render.
 */
export function useAuditLogs(range: AuditRange = { start: null, end: null }, max = 500) {
	const [logs, setLogs] = useState<AuditEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	// Key off epoch millis, not the Date objects: a fresh Date instance holding
	// the same instant would otherwise tear down and rebuild the listener on
	// every render.
	const startMs = range.start ? startOfDay(range.start).getTime() : null;
	const endMs = range.end ? endOfDay(range.end).getTime() : null;

	const constraints = useMemo(() => {
		const c: QueryConstraint[] = [];
		if (startMs != null) c.push(where("timestamp", ">=", Timestamp.fromMillis(startMs)));
		if (endMs != null) c.push(where("timestamp", "<=", Timestamp.fromMillis(endMs)));
		// Newest first, so `limit` keeps the most recent rows rather than any N.
		c.push(orderBy("timestamp", "desc"), limit(max));
		return c;
	}, [startMs, endMs, max]);

	useEffect(() => {
		setLoading(true);
		const unsub = onSnapshot(
			query(collection(db, "audit_logs"), ...constraints),
			(snap) => {
				try {
					const rows: AuditEntry[] = snap.docs.map((d) => {
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
					});
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
	}, [constraints]);

	return { logs, loading, error };
}
