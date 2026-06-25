import { createFileRoute, redirect } from "@tanstack/react-router";
import { doc, getDoc } from "firebase/firestore";
import { useMemo } from "react";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { RecipeFormPage } from "@/features/recipes/pages/RecipeFormPage";
import { db } from "@/lib/firebase";
import { normalizeRecipe } from "@/types/recipe";

export const Route = createFileRoute("/_authenticated/admin/recipes_/$recipeId/edit")({
	loader: async ({ params }) => {
		const snap = await getDoc(doc(db, "recipes", params.recipeId));
		if (!snap.exists()) {
			throw redirect({ to: "/admin/recipes" });
		}
		return { recipe: normalizeRecipe(snap.id, snap.data() as Record<string, unknown>) };
	},
	component: RecipeEditPage,
	staticData: { breadcrumb: "Edit Recipe" },
});

function RecipeEditPage() {
	const { recipe } = Route.useLoaderData();
	const { rows } = useInventory();
	const products = useMemo(() => rows.map((r) => r.product), [rows]);
	return (
		<RecipeFormPage
			editing={recipe}
			products={products}
		/>
	);
}
