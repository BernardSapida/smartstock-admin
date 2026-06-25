import { Button } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, ChefHat, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { notify } from "@/components/feedback";
import { AppChip } from "@/components/ui/AppChip";
import { AppModal } from "@/components/ui/AppModal";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { TableFilterBar } from "@/components/ui/TableFilterBar";
import { useAuth } from "@/features/auth/context/AuthProvider";
import type { Actor } from "@/features/inventory/firebase/inventory.writes";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { deleteRecipe } from "@/features/recipes/firebase/recipes.firebase";
import { useRecipes } from "@/features/recipes/hooks/use-recipes";
import { buildProductIndex, recipeAvailability } from "@/features/recipes/logic/availability";
import { usePagination } from "@/hooks/use-pagination";
import { useTableFilter } from "@/hooks/use-table-filter";
import type { Recipe } from "@/types/recipe";

export const Route = createFileRoute("/_authenticated/admin/recipes")({
	component: AdminRecipesPage,
	staticData: { breadcrumb: "Recipes" },
});

type Row = Recipe & { id: string };

const recipeName = (r: Row) => r.name;
const recipeCategory = (r: Row) => r.category;

function AdminRecipesPage() {
	const { profile } = useAuth();
	const { recipes, loading } = useRecipes();
	const { rows: inventory } = useInventory();
	const navigate = useNavigate();
	const [view, setView] = useState<Recipe | null>(null);
	const [confirmDel, setConfirmDel] = useState<Recipe | null>(null);

	const actor: Actor = {
		uid: profile?.uid ?? "",
		name: profile?.fullName || profile?.email || "admin",
		role: profile?.role ?? "admin",
	};

	const index = useMemo(() => buildProductIndex(inventory), [inventory]);
	const rows: Row[] = recipes.map((r) => ({ ...r }));

	const { search, setSearch, category, setCategory, categories, filtered } = useTableFilter(
		rows,
		recipeName,
		recipeCategory,
	);
	const { page, setPage, rowsPerPage, pageRows } = usePagination(filtered);

	const canCook = (r: Recipe) => recipeAvailability(r, index, 1).maxServings;

	const columns = [
		{ key: "name", label: "Recipe", render: (r: Row) => <span className="font-semibold">{r.name}</span> },
		{ key: "category", label: "Category", render: (r: Row) => r.category },
		{ key: "ing", label: "Ingredients", render: (r: Row) => r.ingredients.length },
		{
			key: "cook",
			label: "Can cook",
			render: (r: Row) => {
				const n = canCook(r);
				return (
					<AppChip
						color={n === null ? "default" : n === 0 ? "danger" : n < 10 ? "warning" : "success"}
						label={n === null ? "-" : n === 0 ? "Cannot cook" : `${n} servings`}
						size="sm"
						variant="soft"
					/>
				);
			},
		},
		{
			key: "actions",
			label: "",
			render: (r: Row) => (
				<div className="flex justify-end gap-1">
					<Button
						onPress={() => setView(r)}
						size="sm"
						variant="ghost"
					>
						View
					</Button>
					<Button
						onPress={() => navigate({ to: "/admin/recipes/$recipeId/edit", params: { recipeId: r.id } })}
						size="sm"
						variant="ghost"
					>
						Edit
					</Button>
					<Button
						aria-label="Delete"
						isIconOnly
						onPress={() => setConfirmDel(r)}
						size="sm"
						variant="ghost"
					>
						<Trash2 className="h-4 w-4 text-danger" />
					</Button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<ChefHat className="h-7 w-7 text-app-brand" />
					<div>
						<h1 className="text-2xl font-bold text-foreground">Recipes</h1>
						<p className="text-sm text-foreground/60">
							{recipes.length} recipes · “Can cook” is limited by the scarcest ingredient.
						</p>
					</div>
				</div>
				<Button
					onPress={() => navigate({ to: "/admin/recipes/add" })}
					variant="primary"
				>
					<Plus className="mr-1 h-4 w-4" />
					New recipe
				</Button>
			</div>

			<div className="space-y-4">
				<TableFilterBar
					categories={categories}
					category={category}
					onCategoryChange={(v) => {
						setCategory(v);
						setPage(1);
					}}
					onSearchChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					search={search}
					searchPlaceholder="Search recipes..."
				/>

				<div>
					<AppTable
						columns={columns}
						emptyContent="No recipes found."
						isLoading={loading}
						rows={pageRows}
					/>

					<AppPagination
						onPageChange={setPage}
						page={page}
						rowsPerPage={rowsPerPage}
						total={filtered.length}
					/>
				</div>
			</div>

			{/* View */}
			<AppModal
				isOpen={!!view}
				onClose={() => setView(null)}
				size="lg"
				title={view?.name ?? ""}
			>
				{view && (
					<div className="space-y-4">
						<div className="flex flex-wrap gap-2 text-sm text-foreground/60">
							<AppChip
								color="default"
								label={view.category}
								size="sm"
								variant="soft"
							/>
							<AppChip
								color="default"
								label={`Yields ${view.servingSize}`}
								size="sm"
								variant="soft"
							/>
						</div>
						<div>
							<p className="mb-2 flex items-center gap-2 font-semibold">
								<BookOpen className="h-4 w-4" /> Ingredients per serving
							</p>
							<div className="space-y-1">
								{recipeAvailability(view, index, 1).statuses.map((s, i) => (
									<div
										className="flex items-center justify-between text-sm"
										key={i}
									>
										<span>
											{s.ingredient.name}
											{s.ingredient.quantityPerServing
												? ` - ${s.ingredient.quantityPerServing} ${s.ingredient.unit}`
												: ""}{" "}
										</span>
										<AppChip
											color={!s.matched ? "warning" : s.unitMismatch ? "warning" : s.enough ? "success" : "danger"}
											label={
												!s.matched
													? "Unlinked"
													: s.unitMismatch
														? "Unit mismatch"
														: s.enough
															? "In stock"
															: "Not enough"
											}
											size="sm"
											variant="soft"
										/>
									</div>
								))}
							</div>
						</div>
						{view.instructions && (
							<div>
								<p className="mb-1 font-semibold">Instructions</p>
								<p className="whitespace-pre-wrap text-sm text-foreground/70">{view.instructions}</p>
							</div>
						)}
					</div>
				)}
			</AppModal>

			{/* Delete confirm */}
			<AppModal
				footer={
					<div className="flex justify-end gap-2">
						<Button
							onPress={() => setConfirmDel(null)}
							variant="ghost"
						>
							Cancel
						</Button>
						<Button
							onPress={async () => {
								if (!confirmDel) return;
								try {
									await deleteRecipe(confirmDel.id, confirmDel.name, actor);
									notify.success({
										title: "Recipe deleted",
										description: `${confirmDel.name} was removed from your recipes.`,
									});
									setConfirmDel(null);
								} catch (e) {
									notify.danger({
										title: "Delete failed",
										description: e instanceof Error ? e.message : "The recipe could not be deleted. Please try again.",
									});
								}
							}}
							variant="danger"
						>
							Delete
						</Button>
					</div>
				}
				isOpen={!!confirmDel}
				onClose={() => setConfirmDel(null)}
				title="Delete recipe?"
			>
				<p className="text-sm text-foreground/70">Delete “{confirmDel?.name}”? This cannot be undone.</p>
			</AppModal>
		</div>
	);
}
