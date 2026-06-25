// Bridges a Firestore realtime listener into the TanStack Query cache.
// - Data is visible in the React Query devtools and cached across navigation.
// - A one-time getDocs powers initial load + error state (so nothing hangs).
// - onSnapshot keeps the cached data live via setQueryData.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type DocumentData, getDocs, onSnapshot, type Query } from "firebase/firestore";
import { useEffect } from "react";
import { logClientError } from "@/errors/logger";

export function useRealtimeQuery<T>(
	queryKey: readonly unknown[],
	makeQuery: () => Query<DocumentData>,
	map: (id: string, data: DocumentData) => T,
) {
	const qc = useQueryClient();

	const result = useQuery<T[]>({
		queryKey: [...queryKey],
		queryFn: async () => {
			const snap = await getDocs(makeQuery());
			return snap.docs.map((d) => map(d.id, d.data()));
		},
		staleTime: Number.POSITIVE_INFINITY,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: key is the stable identity
	useEffect(() => {
		const unsub = onSnapshot(
			makeQuery(),
			(snap) => {
				qc.setQueryData(
					[...queryKey],
					snap.docs.map((d) => map(d.id, d.data())),
				);
			},
			(err) => logClientError(err, "REALTIME_QUERY"),
		);
		return unsub;
	}, [qc, JSON.stringify(queryKey)]);

	return result;
}
