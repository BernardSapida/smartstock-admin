import { useEffect, useState } from "react";
import type { ProductWithBatches } from "@/types/inventory";
import { watchInventory } from "../firebase/inventory.firebase";

export function useInventory() {
	const [rows, setRows] = useState<ProductWithBatches[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsub = watchInventory((data) => {
			setRows(data);
			setLoading(false);
		});
		return unsub;
	}, []);

	return { rows, loading };
}
