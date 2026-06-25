import { createFileRoute, redirect } from "@tanstack/react-router";
import { doc, getDoc } from "firebase/firestore";
import { ProductFormPage } from "@/features/inventory/pages/ProductFormPage";
import { db } from "@/lib/firebase";
import type { Product } from "@/types/inventory";

export const Route = createFileRoute("/_authenticated/admin/inventory_/$productId/edit")({
	loader: async ({ params }) => {
		const snap = await getDoc(doc(db, "products", params.productId));
		if (!snap.exists()) {
			throw redirect({ to: "/admin/inventory" });
		}
		return { product: { id: snap.id, ...snap.data() } as Product };
	},
	component: ProductEditPage,
	staticData: { breadcrumb: "Edit Product" },
});

function ProductEditPage() {
	const { product } = Route.useLoaderData();
	return <ProductFormPage editing={product} />;
}
