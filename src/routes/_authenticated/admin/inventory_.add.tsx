import { createFileRoute } from "@tanstack/react-router";
import { ProductFormPage } from "@/features/inventory/pages/ProductFormPage";

export const Route = createFileRoute("/_authenticated/admin/inventory_/add")({
	component: ProductAddPage,
	staticData: { breadcrumb: "Add Product" },
});

function ProductAddPage() {
	return <ProductFormPage />;
}
