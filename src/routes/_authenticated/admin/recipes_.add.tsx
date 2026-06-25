import { createFileRoute } from "@tanstack/react-router";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { RecipeFormPage } from "@/features/recipes/pages/RecipeFormPage";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/admin/recipes_/add")({
	component: RecipeAddPage,
	staticData: { breadcrumb: "New Recipe" },
});

function RecipeAddPage() {
	const { rows } = useInventory();
	const products = useMemo(() => rows.map((r) => r.product), [rows]);
	return <RecipeFormPage products={products} />;
}
