import { Surface } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Boxes, ChefHat, Clock, Factory, PackageX } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { CategoryChart, ProductionChart, StatusChart } from "@/features/dashboard/Charts";
import { StatCard } from "@/features/dashboard/StatCard";
import { flattenExpiring } from "@/features/expiry/expiry";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { usePreparations, useRecipes } from "@/features/recipes/hooks/use-recipes";

export const Route = createFileRoute("/_authenticated/admin/")({
	component: AdminDashboard,
	staticData: { breadcrumb: "Dashboard" },
});

function AdminDashboard() {
	const { profile } = useAuth();
	const { rows } = useInventory();
	const { recipes } = useRecipes();
	const { preparations } = usePreparations();

	const stats = useMemo(() => {
		const expiring = flattenExpiring(rows).filter((b) => ["expired", "critical", "warning"].includes(b.urgency)).length;
		const today = new Date().toISOString().slice(0, 10);
		return {
			products: rows.length,
			low: rows.filter((r) => r.status === "low").length,
			out: rows.filter((r) => r.status === "out").length,
			expiring,
			recipes: recipes.length,
			preparedToday: preparations.filter((p) => p.date === today).reduce((s, p) => s + p.servings, 0),
		};
	}, [rows, recipes, preparations]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground">Welcome, {profile?.fullName || profile?.email}</h1>
				<p className="text-sm text-foreground/60">Live overview of inventory, recipes, and production.</p>
			</div>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
				<StatCard
					icon={Boxes}
					label="Products"
					value={stats.products}
				/>
				<StatCard
					icon={AlertTriangle}
					label="Low stock"
					tone="warning"
					value={stats.low}
				/>
				<StatCard
					icon={PackageX}
					label="Out of stock"
					tone="danger"
					value={stats.out}
				/>
				<StatCard
					icon={Clock}
					label="Expiring soon"
					tone="warning"
					value={stats.expiring}
				/>
				<StatCard
					icon={ChefHat}
					label="Recipes"
					value={stats.recipes}
				/>
				<StatCard
					icon={Factory}
					label="Servings prepared today"
					tone="success"
					value={stats.preparedToday}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<CategoryChart rows={rows} />
				<StatusChart rows={rows} />
				<ProductionChart preparations={preparations} />
			</div>

			<Surface
				className="rounded-2xl p-5"
				variant="secondary"
			>
				<h2 className="mb-3 font-semibold text-foreground">Recent production</h2>
				{preparations.length === 0 ? (
					<p className="text-sm text-foreground/60">No preparations recorded yet.</p>
				) : (
					<div className="space-y-2">
						{preparations.slice(0, 6).map((p) => (
							<div
								className="flex items-center justify-between text-sm"
								key={p.id}
							>
								<span className="text-foreground">
									{p.recipeName} <span className="text-foreground/50">×{p.servings}</span>
								</span>
								<span className="text-foreground/50">{p.preparedByName}</span>
							</div>
						))}
					</div>
				)}
			</Surface>
		</div>
	);
}
