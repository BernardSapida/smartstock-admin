import { Autocomplete, EmptyState, ListBox, SearchField, useFilter } from "@heroui/react";
import { useMemo, useState } from "react";
import { AppSearchField } from "@/components/form/AppSearchField";
import { AppChip } from "@/components/ui/AppChip";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { useUsedStock } from "@/features/inventory/hooks/use-used-stock";
import { usePagination } from "@/hooks/use-pagination";
import { toBaseUnit } from "@/lib/units";

// Format a base-unit quantity for human-readable display.
function fmtBase(amount: number, baseUnit: "ml" | "g"): string {
	if (baseUnit === "ml") {
		if (amount >= 1000) return `${(amount / 1000).toFixed(2)} L`;
		return `${Number.isInteger(amount) ? amount : amount.toFixed(1)} ml`;
	}
	if (amount >= 1000) return `${(amount / 1000).toFixed(2)} kg`;
	return `${Math.round(amount)} g`;
}

function fmtDate(iso: string): string {
	if (!iso) return "-";
	try {
		return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	} catch {
		return "-";
	}
}

interface UsedStockRow {
	id: string;
	productName: string;
	category: string;
	onHand: number;
	displayUnit: string;
	remainingBase: number;
	baseUnit: "ml" | "g";
	totalBase: number;
	updatedAt: string;
}

export function UsedStockTab() {
	const { rows: inventoryRows, loading: invLoading } = useInventory();
	const { items: usedStockItems, loading: usedLoading } = useUsedStock();

	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("All");
	const { contains } = useFilter({ sensitivity: "base" });

	// Index used_stock by productId for O(1) lookup.
	const usedStockById = useMemo(() => new Map(usedStockItems.map((u) => [u.id, u])), [usedStockItems]);

	// Only show measurable-pcs products that have an opened unit with remaining amount.
	const allRows = useMemo<UsedStockRow[]>(() => {
		return inventoryRows
			.filter(
				(r) => r.product.measurable && r.product.baseUnit === "piece" && r.product.usageUnit && r.product.unitSize,
			)
			.flatMap((r) => {
				const entry = usedStockById.get(r.product.id);
				if (!entry || entry.remainingBase <= 0) return [];
				const baseUnit = (r.product.usageUnit === "g" || r.product.usageUnit === "kg" ? "g" : "ml") as "ml" | "g";
				const unitSizeBase = toBaseUnit(r.product.unitSize!, r.product.usageUnit!);
				const totalBase = r.onHand * unitSizeBase + entry.remainingBase;
				return [
					{
						id: r.product.id,
						productName: r.product.name,
						category: r.product.category,
						onHand: r.onHand,
						displayUnit: r.product.displayUnit,
						remainingBase: entry.remainingBase,
						baseUnit,
						totalBase,
						updatedAt: entry.updatedAt,
					},
				];
			})
			.sort((a, b) => a.productName.localeCompare(b.productName));
	}, [inventoryRows, usedStockById]);

	const categories = useMemo(() => Array.from(new Set(allRows.map((r) => r.category))).sort(), [allRows]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return allRows
			.filter((r) => (category === "All" ? true : r.category === category))
			.filter((r) => (q ? r.productName.toLowerCase().includes(q) : true));
	}, [allRows, search, category]);

	const { page, setPage, rowsPerPage, pageRows } = usePagination(filtered);

	const totalMeasurablePcs = inventoryRows.filter((r) => r.product.measurable && r.product.baseUnit === "piece").length;

	const columns = [
		{
			key: "productName",
			label: "Product",
			render: (r: UsedStockRow) => <span className="font-semibold">{r.productName}</span>,
		},
		{ key: "category", label: "Category", render: (r: UsedStockRow) => r.category },
		{
			key: "onHand",
			label: "Full stock",
			render: (r: UsedStockRow) => (
				<span className="tabular-nums">
					{r.onHand} {r.displayUnit}
				</span>
			),
		},
		{
			key: "remaining",
			label: "Remaining (opened)",
			render: (r: UsedStockRow) =>
				r.remainingBase > 0 ? (
					<span className="tabular-nums text-warning">{fmtBase(r.remainingBase, r.baseUnit)}</span>
				) : (
					<span className="text-foreground/40">-</span>
				),
		},
		{
			key: "total",
			label: "Total available",
			render: (r: UsedStockRow) => <span className="tabular-nums font-medium">{fmtBase(r.totalBase, r.baseUnit)}</span>,
		},
		{
			key: "updatedAt",
			label: "Last updated",
			render: (r: UsedStockRow) => <span className="text-foreground/60">{fmtDate(r.updatedAt)}</span>,
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-3">
				<AppChip
					color="warning"
					label={`${allRows.length} open units`}
					variant="soft"
				/>
				<AppChip
					color="default"
					label={`${totalMeasurablePcs} bottle/can products total`}
					variant="soft"
				/>
			</div>

			<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
				<AppSearchField
					onValueChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					placeholder="Search products..."
					value={search}
				/>
				<div className="lg:w-56">
					<Autocomplete
						onChange={(key) => {
							setCategory(key ? String(key) : "All");
							setPage(1);
						}}
						placeholder="All categories"
						selectionMode="single"
						value={category === "All" ? null : category}
					>
						<Autocomplete.Trigger>
							<Autocomplete.Value />
							<Autocomplete.ClearButton />
							<Autocomplete.Indicator />
						</Autocomplete.Trigger>
						<Autocomplete.Popover>
							<Autocomplete.Filter filter={contains}>
								<SearchField
									autoFocus
									name="used-category-filter-search"
									variant="secondary"
								>
									<SearchField.Group>
										<SearchField.SearchIcon />
										<SearchField.Input placeholder="Search categories..." />
										<SearchField.ClearButton />
									</SearchField.Group>
								</SearchField>
								<ListBox renderEmptyState={() => <EmptyState>No results</EmptyState>}>
									{categories.map((c) => (
										<ListBox.Item
											id={c}
											key={c}
											textValue={c}
										>
											{c}
											<ListBox.ItemIndicator />
										</ListBox.Item>
									))}
								</ListBox>
							</Autocomplete.Filter>
						</Autocomplete.Popover>
					</Autocomplete>
				</div>
			</div>

			<AppTable
				columns={columns}
				emptyContent="No opened units with remaining stock."
				isLoading={invLoading || usedLoading}
				rows={pageRows}
			/>
			<AppPagination
				onPageChange={setPage}
				page={page}
				rowsPerPage={rowsPerPage}
				total={filtered.length}
			/>
		</div>
	);
}
