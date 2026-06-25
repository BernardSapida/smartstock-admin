import { Surface } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppChip } from "@/components/ui/AppChip";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { TableFilterBar } from "@/components/ui/TableFilterBar";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { usePreparations, useRecipes } from "@/features/recipes/hooks/use-recipes";
import { usePagination } from "@/hooks/use-pagination";
import { useTableFilter } from "@/hooks/use-table-filter";
import { formatQuantity, fromBaseUnit, toBaseUnit } from "@/lib/units";

export const Route = createFileRoute("/_authenticated/admin/forecast")({
	component: ForecastPage,
	staticData: { breadcrumb: "Forecast" },
});

const forecastName = (r: ForecastRow) => r.name;
const forecastCategory = (r: ForecastRow) => r.category;

const WINDOW_DAYS = 30;

const BRAND = "#4FB8B2";
const WARNING = "#f59e0b";
const DANGER = "#ef4444";
const GRID = "rgba(255,255,255,0.08)";
const AXIS = "rgba(255,255,255,0.5)";
const tooltipStyle = {
	backgroundColor: "#161616",
	border: "1px solid rgba(255,255,255,0.1)",
	borderRadius: 12,
	color: "#fff",
};

function barColor(days: number): string {
	if (days <= 3) return DANGER;
	if (days <= 7) return WARNING;
	return BRAND;
}

interface ForecastRow {
	id: string;
	name: string;
	category: string;
	onHand: string;
	avgPerDay: string | null;
	daysLeft: number | null;
}

function ForecastPage() {
	const { rows } = useInventory();
	const { recipes } = useRecipes();
	const { preparations } = usePreparations();

	const forecast = useMemo<ForecastRow[]>(() => {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);
		cutoff.setHours(0, 0, 0, 0);

		const recipeById = new Map(recipes.map((r) => [r.id, r]));

		// Accumulate base-unit consumption per ingredient name over the window
		const consumed = new Map<string, number>();
		for (const prep of preparations) {
			const prepDate = prep.date ? new Date(prep.date) : null;
			if (!prepDate || prepDate < cutoff) continue;
			const recipe = recipeById.get(prep.recipeId);
			if (!recipe) continue;
			for (const ing of recipe.ingredients) {
				if (ing.quantityPerServing <= 0) continue;
				const base = toBaseUnit(ing.quantityPerServing * prep.servings, ing.unit);
				const key = ing.name.trim().toLowerCase();
				consumed.set(key, (consumed.get(key) ?? 0) + base);
			}
		}

		return rows
			.map((r) => {
				const key = r.product.name.trim().toLowerCase();
				const totalBase = consumed.get(key) ?? 0;
				const avgBase = totalBase / WINDOW_DAYS;
				const daysLeft = avgBase > 0 ? Math.floor(r.onHand / avgBase) : null;
				const avgDisplay =
					avgBase > 0
						? `${fromBaseUnit(avgBase, r.product.displayUnit).toFixed(2)} ${r.product.displayUnit}/day`
						: null;
				return {
					id: r.product.id,
					name: r.product.name,
					category: r.product.category,
					onHand: formatQuantity(r.onHand, r.product.displayUnit),
					avgPerDay: avgDisplay,
					daysLeft,
				};
			})
			.filter((r) => r.avgPerDay !== null)
			.sort((a, b) => {
				if (a.daysLeft === null && b.daysLeft === null) return 0;
				if (a.daysLeft === null) return 1;
				if (b.daysLeft === null) return -1;
				return a.daysLeft - b.daysLeft;
			});
	}, [rows, recipes, preparations]);

	const { search, setSearch, category, setCategory, categories, filtered } = useTableFilter(
		forecast,
		forecastName,
		forecastCategory,
	);
	const { page, setPage, rowsPerPage, pageRows } = usePagination(filtered);

	const chartData = useMemo(
		() =>
			forecast
				.filter((r) => r.daysLeft !== null)
				.slice(0, 14)
				.map((r) => ({ label: r.name, value: r.daysLeft as number })),
		[forecast],
	);

	const urgentCount = forecast.filter((r) => r.daysLeft !== null && r.daysLeft <= 3).length;
	const warnCount = forecast.filter((r) => r.daysLeft !== null && r.daysLeft > 3 && r.daysLeft <= 7).length;
	const safeCount = forecast.filter((r) => r.daysLeft !== null && r.daysLeft > 7).length;

	const columns = [
		{
			key: "name",
			label: "Ingredient",
			render: (r: ForecastRow) => <span className="font-semibold">{r.name}</span>,
		},
		{ key: "category", label: "Category", render: (r: ForecastRow) => r.category },
		{ key: "onHand", label: "On hand", render: (r: ForecastRow) => r.onHand },
		{
			key: "avgPerDay",
			label: `Avg use / day (${WINDOW_DAYS}-day window)`,
			render: (r: ForecastRow) => r.avgPerDay ?? "-",
		},
		{
			key: "daysLeft",
			label: "Stock lasts",
			render: (r: ForecastRow) => (
				<AppChip
					color={
						r.daysLeft === null
							? "default"
							: r.daysLeft <= 0
								? "danger"
								: r.daysLeft <= 3
									? "danger"
									: r.daysLeft <= 7
										? "warning"
										: "success"
					}
					label={r.daysLeft === null ? "-" : r.daysLeft <= 0 ? "Out now" : `~${r.daysLeft} days`}
					size="sm"
					variant="soft"
				/>
			),
		},
	];

	const emptyMsg =
		preparations.length === 0
			? "No production history yet - prepare some recipes to generate forecast data."
			: "No ingredient consumption tracked in the last 30 days.";

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<TrendingDown className="h-7 w-7 text-app-brand" />
				<div>
					<h1 className="text-2xl font-bold text-foreground">Forecast</h1>
					<p className="text-sm text-foreground/60">
						Based on {WINDOW_DAYS} days of production history - how long current stock will last at the current
						consumption rate.
					</p>
				</div>
			</div>

			<div className="flex flex-wrap gap-3">
				<AppChip
					color="danger"
					label={`${urgentCount} running out in ≤3 days`}
					variant="soft"
				/>
				<AppChip
					color="warning"
					label={`${warnCount} running out in ≤7 days`}
					variant="soft"
				/>
				<AppChip
					color="success"
					label={`${safeCount} ingredients with 7+ days`}
					variant="soft"
				/>
			</div>

			{chartData.length > 0 && (
				<Surface
					className="rounded-2xl p-5"
					variant="secondary"
				>
					<h2 className="mb-4 font-semibold text-foreground">Days of stock remaining per ingredient</h2>
					<div className="h-72 w-full">
						<ResponsiveContainer
							height="100%"
							width="100%"
						>
							<BarChart
								data={chartData}
								margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
							>
								<CartesianGrid
									stroke={GRID}
									vertical={false}
								/>
								<XAxis
									dataKey="label"
									hide={chartData.length > 8}
									stroke={AXIS}
									tick={{ fontSize: 11 }}
								/>
								<YAxis
									allowDecimals={false}
									stroke={AXIS}
									tick={{ fontSize: 11 }}
								/>
								<Tooltip
									contentStyle={tooltipStyle}
									cursor={{ fill: "rgba(255,255,255,0.04)" }}
									formatter={(v) => [`~${Number(v)} days`, "Stock left"]}
									itemStyle={{ color: "#fff" }}
									labelStyle={{ color: "#fff", fontWeight: 600 }}
								/>
								<Bar
									dataKey="value"
									radius={[6, 6, 0, 0]}
								>
									{chartData.map((d) => (
										<Cell
											fill={barColor(d.value)}
											key={d.label}
										/>
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</Surface>
			)}

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
					searchPlaceholder="Search ingredients..."
				/>

				<div>
					<AppTable
						columns={columns}
						emptyContent={emptyMsg}
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
		</div>
	);
}
