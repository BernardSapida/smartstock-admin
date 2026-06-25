import { collection, onSnapshot, orderBy, query, type Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import type { Recipe } from "@/types/recipe";
import { watchRecipes } from "../firebase/recipes.firebase";

export function useRecipes() {
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		const unsub = watchRecipes((r) => {
			setRecipes(r);
			setLoading(false);
		});
		return unsub;
	}, []);
	return { recipes, loading };
}

export interface PreparationRecord {
	id: string;
	recipeId: string;
	recipeName: string;
	category: string;
	servings: number;
	preparedBy: string;
	preparedByName: string;
	preparedByRole: string;
	preparedAt: Timestamp | null;
	date: string;
}

export function usePreparations(filterUid?: string) {
	const [preparations, setPreparations] = useState<PreparationRecord[]>([]);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		const q = query(collection(db, "preparations"), orderBy("preparedAt", "desc"));
		const unsub = onSnapshot(
			q,
			(snap) => {
				let rows = snap.docs.map((d) => {
					const data = d.data();
					return {
						id: d.id,
						recipeId: (data.recipeId as string) ?? "",
						recipeName: (data.recipeName as string) ?? "",
						category: (data.category as string) ?? "",
						servings: (data.servings as number) ?? 0,
						preparedBy: (data.preparedBy as string) ?? "",
						preparedByName: (data.preparedByName as string) ?? "",
						preparedByRole: (data.preparedByRole as string) ?? "",
						preparedAt: (data.preparedAt as Timestamp) ?? null,
						date: (data.date as string) ?? "",
					};
				});
				if (filterUid) rows = rows.filter((r) => r.preparedBy === filterUid);
				setPreparations(rows);
				setLoading(false);
			},
			() => setLoading(false),
		);
		return unsub;
	}, [filterUid]);
	return { preparations, loading };
}
