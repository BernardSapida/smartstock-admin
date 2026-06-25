import { Surface } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import type { Timestamp } from "firebase/firestore";
import { Factory } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppChip } from "@/components/ui/AppChip";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { TableFilterBar } from "@/components/ui/TableFilterBar";
import { type PreparationRecord, usePreparations } from "@/features/recipes/hooks/use-recipes";
import { usePagination } from "@/hooks/use-pagination";
import { useTableFilter } from "@/hooks/use-table-filter";

export const Route = createFileRoute("/_authenticated/admin/production")({
	component: ProductionPage,
	staticData: { breadcrumb: "Production" },
});

const prepName = (p: PreparationRecord) => p.recipeName;
const prepCategory = (p: PreparationRecord) => p.category;

const BRAND = "#4FB8B2";
const GRID = "rgba(255,255,255,0.08)";
const AXIS = "rgba(255,255,255,0.5)";
const tooltipStyle = {
	backgroundColor: "#161616",
	border: "1px solid rgba(255,255,255,0.1)",
	borderRadius: 12,
	color: "#fff",
};

function fmt(ts: Timestamp | null): string {
	if (!ts) return "-";
	try {
		return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	} catch {
		return "-";
	}
}

function RoleChip({ role }: { role: string }) {
	const isAdmin = role === "admin";
	return (
		<AppChip
			color={isAdmin ? "accent" : "default"}
			label={isAdmin ? "Admin" : "Staff"}
			size="sm"
			variant="soft"
		/>
	);
}

const TREND_DAYS = 30;

function buildTrend(preparations: PreparationRecord[]) {
	const days: { date: string; label: string; servings: number }[] = [];
	for (let i = TREND_DAYS - 1; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const iso = d.toISOString().slice(0, 10);
		days.push({ date: iso, label: iso.slice(5), servings: 0 });
	}
	const byDate = new Map(days.map((d) => [d.date, d]));
	for (const p of preparations) {
		const slot = byDate.get(p.date);
		if (slot) slot.servings += p.servings;
	}
	return days;
}

function ProductionPage() {
	const { preparations, loading } = usePreparations();

	const totals = useMemo(() => {
		const byRecipe = new Map<string, number>();
		let servings = 0;
		for (const p of preparations) {
			byRecipe.set(p.recipeName, (byRecipe.get(p.recipeName) ?? 0) + p.servings);
			servings += p.servings;
		}
		return {
			count: preparations.length,
			servings,
			recipes: byRecipe.size,
			top: [...byRecipe.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
		};
	}, [preparations]);

	const trend = useMemo(() => buildTrend(preparations), [preparations]);

	const rows = preparations.map((p) => ({ ...p }));
	const { search, setSearch, category, setCategory, categories, filtered } = useTableFilter(
		rows,
		prepName,
		prepCategory,
	);
	const { page, setPage, rowsPerPage, pageRows } = usePagination(filtered);
	const columns = [
		{
			key: "recipeName",
			label: "Recipe",
			render: (r: PreparationRecord) => <span className="font-semibold">{r.recipeName}</span>,
		},
		{ key: "category", label: "Category", render: (r: PreparationRecord) => r.category },
		{ key: "servings", label: "Servings", render: (r: PreparationRecord) => r.servings },
		{ key: "by", label: "Prepared by", render: (r: PreparationRecord) => r.preparedByName },
		{
			key: "role",
			label: "Role",
			render: (r: PreparationRecord) => <RoleChip role={r.preparedByRole} />,
		},
		{ key: "at", label: "When", render: (r: PreparationRecord) => fmt(r.preparedAt) },
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Factory className="h-7 w-7 text-app-brand" />
				<div>
					<h1 className="text-2xl font-bold text-foreground">Production Monitor</h1>
					<p className="text-sm text-foreground/60">
						Read-only - what staff prepared. {totals.count} preparations · {totals.servings} servings.
					</p>
				</div>
			</div>

			{totals.top.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{totals.top.map(([name, n]) => (
						<AppChip
							color="default"
							key={name}
							label={`${name}: ${n}`}
							size="sm"
							variant="soft"
						/>
					))}
				</div>
			)}

			<Surface
				className="rounded-2xl p-5"
				variant="secondary"
			>
				<h2 className="mb-4 font-semibold text-foreground">Servings prepared - last {TREND_DAYS} days</h2>
				<div className="h-64 w-full">
					<ResponsiveContainer
						height="100%"
						width="100%"
					>
						<BarChart
							data={trend}
							margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
						>
							<CartesianGrid
								stroke={GRID}
								vertical={false}
							/>
							<XAxis
								dataKey="label"
								hide={trend.length > 14}
								stroke={AXIS}
								tick={{ fontSize: 10 }}
							/>
							<YAxis
								allowDecimals={false}
								stroke={AXIS}
								tick={{ fontSize: 11 }}
							/>
							<Tooltip
								contentStyle={tooltipStyle}
								cursor={{ fill: "rgba(255,255,255,0.04)" }}
								labelFormatter={(l) => `Date: ${l}`}
							/>
							<Bar
								dataKey="servings"
								fill={BRAND}
								radius={[4, 4, 0, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</Surface>

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
						emptyContent="No preparations found."
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
		</div>
	);
}
