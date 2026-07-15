import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { AppSpinner } from "@/components/ui/AppSpinner";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { RecipeFormPage } from "@/features/recipes/pages/RecipeFormPage";
import { db } from "@/lib/firebase";
import { normalizeRecipe, type Recipe } from "@/types/recipe";

export const Route = createFileRoute("/_authenticated/admin/recipes_/$recipeId/edit")({
	// NO loader: a loader reads Firestore during the route-load phase, which runs
	// outside React and BEFORE the `_authenticated` auth gate, so a hard refresh
	// fires the read unauthenticated. Fetch inside the (auth-gated) component.
	component: RecipeEditPage,
	staticData: { breadcrumb: "Edit Recipe" },
});

function RecipeEditPage() {
	const { recipeId } = Route.useParams();
	const navigate = useNavigate();
	const { rows } = useInventory();
	const products = useMemo(() => rows.map((r) => r.product), [rows]);

	const [recipe, setRecipe] = useState<Recipe | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		getDoc(doc(db, "recipes", recipeId))
			.then((snap) => {
				if (!active) return;
				if (!snap.exists()) {
					navigate({ to: "/admin/recipes" });
					return;
				}
				setRecipe(normalizeRecipe(snap.id, snap.data() as Record<string, unknown>));
			})
			.catch((err) => {
				console.error("Failed to load recipe", err);
				if (active) navigate({ to: "/admin/recipes" });
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [recipeId, navigate]);

	if (loading || !recipe) {
		return (
			<div className="flex items-center justify-center py-16">
				<AppSpinner />
			</div>
		);
	}

	return (
		<RecipeFormPage
			editing={recipe}
			products={products}
		/>
	);
}
