import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSpinner } from "@/components/ui/AppSpinner";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { ProductFormPage } from "@/features/inventory/pages/ProductFormPage";

export const Route = createFileRoute("/_authenticated/admin/inventory_/$productId/edit")({
	// NO loader: a loader reads Firestore during the route-load phase, which runs
	// outside React and BEFORE the `_authenticated` layout's auth gate. On a hard
	// refresh that fires the read before Firebase restores the session, so the
	// request is unauthenticated and Firestore rejects it (or we bounce to login).
	// Instead we read the product from the auth-gated live subscription in the
	// component below, which only renders once `_authenticated` confirms the user.
	component: ProductEditPage,
	staticData: { breadcrumb: "Edit Product" },
});

function ProductEditPage() {
	const { productId } = Route.useParams();
	const navigate = useNavigate();
	const { rows, loading } = useInventory();
	const product = rows.find((r) => r.product.id === productId)?.product;

	// Once inventory has loaded, a missing id means the product was deleted or the
	// URL is bad -- send them back to the list.
	useEffect(() => {
		if (!loading && !product) {
			navigate({ to: "/admin/inventory" });
		}
	}, [loading, product, navigate]);

	if (!product) {
		return (
			<div className="flex items-center justify-center py-16">
				<AppSpinner />
			</div>
		);
	}

	return <ProductFormPage editing={product} />;
}
