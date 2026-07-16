import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import type { Timestamp } from "firebase/firestore";
import { AlertTriangle, Download, FileBarChart, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { AppChip } from "@/components/ui/AppChip";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { AppTabs } from "@/components/ui/AppTabs";
import { type DateRange, DateRangeFilter, EMPTY_RANGE, isEmptyRange } from "@/components/ui/DateRangeFilter";
import { TableFilterBar } from "@/components/ui/TableFilterBar";
import { SimpleBarChart } from "@/features/dashboard/SimpleBarChart";
import { flattenExpiring } from "@/features/expiry/expiry";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { usePreparations, useRecipes } from "@/features/recipes/hooks/use-recipes";
import { buildProductIndex, recipeAvailability } from "@/features/recipes/logic/availability";
import { usePagination } from "@/hooks/use-pagination";
import { useTableFilter } from "@/hooks/use-table-filter";
import { downloadCsv } from "@/lib/csv";
import { formatQuantity, fromBaseUnit } from "@/lib/units";

export const Route = createFileRoute("/_authenticated/admin/reports")({
	component: ReportsPage,
	staticData: { breadcrumb: "Reports" },
});

type Tab = "restock" | "cook" | "production" | "expiry";

/**
 * Which reports have a date to filter ON.
 *
 * Production is a log of events (preparedAt) and Expiry is a set of dated batches
 * (expirationDate) - both are genuinely date-scopable. Restock and Can-Cook are
 * derived from *current* on-hand stock; the system keeps no historical snapshot of
 * stock levels, so "restock report for July 1–5" is unanswerable. Rather than show
 * a date picker that quietly changes nothing on those tabs, we hide it and say why.
 */
const DATE_SCOPED: Record<Tab, boolean> = {
	restock: false,
	cook: false,
	production: true,
	expiry: true,
};

const byName = (r: { name: string }) => r.name;
const byCategory = (r: { category: string }) => r.category;

function startOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

function endOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(23, 59, 59, 999);
	return x;
}

function fmtDate(d: Date | null): string {
	return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "…";
}

// Filename-safe local date, "MMM DD, YYYY" (e.g. "Jul 16, 2026"). Comma is legal
// in filenames; we only avoid the chars Windows rejects (\ / : * ? " < > |).
function fileDate(d: Date): string {
	const month = d.toLocaleDateString("en-US", { month: "short" });
	const day = String(d.getDate()).padStart(2, "0");
	return `${month} ${day}, ${d.getFullYear()}`;
}

/**
 * Builds the export filename as "<date> - <Report Name>.csv".
 *
 * Date-scoped tabs (production, expiry) lead with the selected range so the file
 * name matches the data inside it; a partial or empty range degrades gracefully.
 * Live snapshot tabs (restock, cook) have no range, so we stamp the generation
 * date - that's the only date that means anything for a "current stock" report.
 */
function reportFilename(reportName: string, dateScoped: boolean, range: DateRange): string {
	let datePart = fileDate(new Date());
	if (dateScoped && !isEmptyRange(range)) {
		const from = range.start ? fileDate(range.start) : null;
		const to = range.end ? fileDate(range.end) : null;
		if (from && to) datePart = `${from} to ${to}`;
		else if (from) datePart = `from ${from}`;
		else if (to) datePart = `to ${to}`;
	}
	return `${datePart} - ${reportName}.csv`;
}

const STATUS_DISPLAY = {
	out: { label: "Out of stock", color: "danger" as const, Icon: XCircle },
	low: { label: "Low stock", color: "warning" as const, Icon: AlertTriangle },
};

function ReportsPage() {
	const { rows } = useInventory();
	const { recipes } = useRecipes();
	const { preparations } = usePreparations();
	const [tab, setTab] = useState<Tab>("restock");
	const [range, setRange] = useState<DateRange>(EMPTY_RANGE);

	const index = useMemo(() => buildProductIndex(rows), [rows]);

	// Production is filtered by WHEN IT HAPPENED (preparedAt); Expiry by WHEN THE
	// BATCH EXPIRES. Restock and Can-Cook are live snapshots of current stock --
	// there is no historical stock-level record to filter, so a date range on them
	// would be a control that silently does nothing. See DATE_SCOPED below.
	const inRange = useMemo(() => {
		const from = range.start ? startOfDay(range.start).getTime() : null;
		const to = range.end ? endOfDay(range.end).getTime() : null;
		return (ts: Timestamp | null): boolean => {
			if (from == null && to == null) return true;
			if (!ts) return false; // an undated row can't be inside a bounded range
			const ms = ts.toMillis();
			if (from != null && ms < from) return false;
			if (to != null && ms > to) return false;
			return true;
		};
	}, [range]);

	const restock = useMemo(
		() =>
			rows
				.filter((r) => r.status === "low" || r.status === "out")
				.map((r) => ({
					id: r.product.id,
					name: r.product.name,
					category: r.product.category,
					onHand: formatQuantity(r.onHand, r.product.displayUnit),
					threshold:
						r.product.minimumThreshold != null
							? formatQuantity(r.product.minimumThreshold, r.product.displayUnit)
							: "-",
					status: r.status,
				})),
		[rows],
	);

	const cook = useMemo(
		() =>
			recipes.map((rc) => {
				const a = recipeAvailability(rc, index, 1);
				return {
					id: rc.id,
					name: rc.name,
					category: rc.category,
					canCook: a.maxServings === null ? "-" : a.maxServings,
				};
			}),
		[recipes, index],
	);

	const production = useMemo(() => {
		const byRecipe = new Map<string, { servings: number; category: string }>();
		for (const p of preparations) {
			if (!inRange(p.preparedAt)) continue;
			const cur = byRecipe.get(p.recipeName) ?? { servings: 0, category: p.category };
			cur.servings += p.servings;
			byRecipe.set(p.recipeName, cur);
		}
		return [...byRecipe.entries()]
			.map(([name, { servings, category }], i) => ({ id: String(i), name, category, servings }))
			.sort((a, b) => b.servings - a.servings);
	}, [preparations, inRange]);

	const expiry = useMemo(
		() =>
			flattenExpiring(rows)
				.filter((b) => b.urgency !== "ok" && b.urgency !== "none")
				.filter((b) => inRange(b.batch.expirationDate))
				.map((b) => ({
					id: b.batch.id,
					name: b.productName,
					category: b.category,
					qty: formatQuantity(b.batch.quantity, b.displayUnit),
					daysLeft: b.daysLeft ?? "-",
					urgency: b.urgency,
				})),
		[rows, inRange],
	);

	const restockFilter = useTableFilter(restock, byName, byCategory);
	const cookFilter = useTableFilter(cook, byName, byCategory);
	const productionFilter = useTableFilter(production, byName, byCategory);
	const expiryFilter = useTableFilter(expiry, byName, byCategory);

	const restockPag = usePagination(restockFilter.filtered);
	const cookPag = usePagination(cookFilter.filtered);
	const productionPag = usePagination(productionFilter.filtered);
	const expiryPag = usePagination(expiryFilter.filtered);

	// --- chart datasets (numeric) ---
	const restockChart = useMemo(
		() =>
			rows
				.filter((r) => r.status !== "in")
				.map((r) => ({
					label: r.product.name,
					value: Math.round(fromBaseUnit(r.onHand, r.product.displayUnit) * 100) / 100,
				})),
		[rows],
	);
	const cookChart = useMemo(
		() => cook.filter((c) => typeof c.canCook === "number").map((c) => ({ label: c.name, value: c.canCook as number })),
		[cook],
	);
	const productionChart = useMemo(() => production.map((p) => ({ label: p.name, value: p.servings })), [production]);
	const expiryChart = useMemo(() => {
		const m = new Map<string, number>();
		for (const e of expiry) m.set(e.urgency, (m.get(e.urgency) ?? 0) + 1);
		return [...m.entries()].map(([label, value]) => ({ label, value }));
	}, [expiry]);

	const exportCurrent = () => {
		const name = (base: string) => reportFilename(base, DATE_SCOPED[tab], range);
		if (tab === "restock")
			downloadCsv(
				name("Restock Report"),
				["Product", "On hand", "Threshold", "Status"],
				restock.map((r) => [r.name, r.onHand, r.threshold, r.status]),
			);
		else if (tab === "cook")
			downloadCsv(
				name("Can-Cook Report"),
				["Recipe", "Category", "Can cook"],
				cook.map((r) => [r.name, r.category, r.canCook]),
			);
		else if (tab === "production")
			downloadCsv(
				name("Production Report"),
				["Recipe", "Servings"],
				production.map((r) => [r.name, r.servings]),
			);
		else
			downloadCsv(
				name("Expiry Report"),
				["Product", "Qty", "Days left", "Urgency"],
				expiry.map((r) => [r.name, r.qty, r.daysLeft, r.urgency]),
			);
	};

	const tabItems = [
		{
			key: "restock",
			label: "Restock",
			content: (
				<div className="space-y-6">
					<SimpleBarChart
						data={restockChart}
						title="Low/out stock - on hand"
					/>
					<TableFilterBar
						categories={restockFilter.categories}
						category={restockFilter.category}
						onCategoryChange={(v) => {
							restockFilter.setCategory(v);
							restockPag.setPage(1);
						}}
						onSearchChange={(v) => {
							restockFilter.setSearch(v);
							restockPag.setPage(1);
						}}
						search={restockFilter.search}
						searchPlaceholder="Search products..."
					/>
					<div>
						<AppTable
							columns={[
								{
									key: "name",
									label: "Product",
									render: (r: (typeof restock)[number]) => <span className="font-semibold">{r.name}</span>,
								},
								{ key: "onHand", label: "On hand", render: (r: (typeof restock)[number]) => r.onHand },
								{ key: "threshold", label: "Threshold", render: (r: (typeof restock)[number]) => r.threshold },
								{
									key: "status",
									label: "Status",
									render: (r: (typeof restock)[number]) => {
										const display = STATUS_DISPLAY[r.status as keyof typeof STATUS_DISPLAY];
										return (
											<AppChip
												color={display.color}
												label={display.label}
												size="sm"
												startContent={<display.Icon className="mr-1 h-3.5 w-3.5" />}
												variant="soft"
											/>
										);
									},
								},
							]}
							emptyContent="No products found."
							rows={restockPag.pageRows}
						/>
						<AppPagination
							onPageChange={restockPag.setPage}
							page={restockPag.page}
							rowsPerPage={restockPag.rowsPerPage}
							total={restockFilter.filtered.length}
						/>
					</div>
				</div>
			),
		},
		{
			key: "cook",
			label: "What can we cook",
			content: (
				<div className="space-y-6">
					<SimpleBarChart
						data={cookChart}
						title="Servings cookable per recipe"
					/>
					<TableFilterBar
						categories={cookFilter.categories}
						category={cookFilter.category}
						onCategoryChange={(v) => {
							cookFilter.setCategory(v);
							cookPag.setPage(1);
						}}
						onSearchChange={(v) => {
							cookFilter.setSearch(v);
							cookPag.setPage(1);
						}}
						search={cookFilter.search}
						searchPlaceholder="Search recipes..."
					/>
					<div>
						<AppTable
							columns={[
								{
									key: "name",
									label: "Recipe",
									render: (r: (typeof cook)[number]) => <span className="font-semibold">{r.name}</span>,
								},
								{ key: "category", label: "Category", render: (r: (typeof cook)[number]) => r.category },
								{ key: "canCook", label: "Can cook (servings)", render: (r: (typeof cook)[number]) => r.canCook },
							]}
							emptyContent="No recipes found."
							rows={cookPag.pageRows}
						/>
						<AppPagination
							onPageChange={cookPag.setPage}
							page={cookPag.page}
							rowsPerPage={cookPag.rowsPerPage}
							total={cookFilter.filtered.length}
						/>
					</div>
				</div>
			),
		},
		{
			key: "production",
			label: "Production",
			content: (
				<div className="space-y-6">
					<SimpleBarChart
						data={productionChart}
						title="Total servings prepared per recipe"
					/>
					<TableFilterBar
						categories={productionFilter.categories}
						category={productionFilter.category}
						onCategoryChange={(v) => {
							productionFilter.setCategory(v);
							productionPag.setPage(1);
						}}
						onSearchChange={(v) => {
							productionFilter.setSearch(v);
							productionPag.setPage(1);
						}}
						search={productionFilter.search}
						searchPlaceholder="Search recipes..."
					/>
					<div>
						<AppTable
							columns={[
								{
									key: "name",
									label: "Recipe",
									render: (r: (typeof production)[number]) => <span className="font-semibold">{r.name}</span>,
								},
								{
									key: "servings",
									label: "Total servings prepared",
									render: (r: (typeof production)[number]) => r.servings,
								},
							]}
							emptyContent="No production found."
							rows={productionPag.pageRows}
						/>
						<AppPagination
							onPageChange={productionPag.setPage}
							page={productionPag.page}
							rowsPerPage={productionPag.rowsPerPage}
							total={productionFilter.filtered.length}
						/>
					</div>
				</div>
			),
		},
		{
			key: "expiry",
			label: "Expiry",
			content: (
				<div className="space-y-6">
					<SimpleBarChart
						data={expiryChart}
						title="Expiring batches by urgency"
					/>
					<TableFilterBar
						categories={expiryFilter.categories}
						category={expiryFilter.category}
						onCategoryChange={(v) => {
							expiryFilter.setCategory(v);
							expiryPag.setPage(1);
						}}
						onSearchChange={(v) => {
							expiryFilter.setSearch(v);
							expiryPag.setPage(1);
						}}
						search={expiryFilter.search}
						searchPlaceholder="Search products..."
					/>
					<div>
						<AppTable
							columns={[
								{
									key: "name",
									label: "Product",
									render: (r: (typeof expiry)[number]) => <span className="font-semibold">{r.name}</span>,
								},
								{ key: "qty", label: "Qty", render: (r: (typeof expiry)[number]) => r.qty },
								{ key: "daysLeft", label: "Days left", render: (r: (typeof expiry)[number]) => r.daysLeft },
								{ key: "urgency", label: "Urgency", render: (r: (typeof expiry)[number]) => r.urgency },
							]}
							emptyContent="No expiring batches found."
							rows={expiryPag.pageRows}
						/>
						<AppPagination
							onPageChange={expiryPag.setPage}
							page={expiryPag.page}
							rowsPerPage={expiryPag.rowsPerPage}
							total={expiryFilter.filtered.length}
						/>
					</div>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<FileBarChart className="h-7 w-7 text-app-brand" />
					<div>
						<h1 className="text-2xl font-bold text-foreground">Reports</h1>
						<p className="text-sm text-foreground/60">
							Forecasts use available data; production-based forecasts improve as more is recorded.
						</p>
					</div>
				</div>
				<Button
					onPress={exportCurrent}
					size="sm"
					variant="ghost"
				>
					<Download className="mr-1 h-4 w-4" />
					Export CSV
				</Button>
			</div>

			{DATE_SCOPED[tab] ? (
				<div className="rounded-xl border border-foreground/10 p-4">
					<DateRangeFilter
						label={tab === "production" ? "Prepared between" : "Expiring between"}
						onChange={setRange}
						value={range}
					/>
					{!isEmptyRange(range) && (
						<p className="mt-2 text-xs text-foreground/50">
							Showing {tab === "production" ? "preparations recorded" : "batches expiring"} from{" "}
							<span className="font-semibold text-foreground">{fmtDate(range.start)}</span> to{" "}
							<span className="font-semibold text-foreground">{fmtDate(range.end)}</span>. The CSV export matches this
							range.
						</p>
					)}
				</div>
			) : (
				<p className="text-xs text-foreground/50">
					This report reflects <span className="font-semibold text-foreground">current stock levels</span>, so it has no
					date range - there is no historical stock snapshot to filter. Use the Production or Expiry tab for date-scoped
					reporting.
				</p>
			)}

			<AppTabs
				items={tabItems}
				onSelectionChange={(key) => setTab(key as Tab)}
				selectedKey={tab}
			/>
		</div>
	);
}
