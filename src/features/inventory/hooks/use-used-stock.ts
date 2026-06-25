import { useEffect, useState } from "react";
import type { UsedStock } from "@/types/inventory";
import { watchUsedStock } from "../firebase/inventory.firebase";

export function useUsedStock() {
	const [items, setItems] = useState<UsedStock[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsub = watchUsedStock((data) => {
			setItems(data);
			setLoading(false);
		});
		return unsub;
	}, []);

	return { items, loading };
}
