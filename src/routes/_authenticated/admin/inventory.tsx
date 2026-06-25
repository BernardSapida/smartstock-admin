import { Autocomplete, Button, EmptyState, Input, ListBox, SearchField, useFilter } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { Timestamp } from "firebase/firestore";
import { Layers, PackageSearch, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { notify } from "@/components/feedback";
import { AppSearchField } from "@/components/form/AppSearchField";
import { AppChip } from "@/components/ui/AppChip";
import { AppModal } from "@/components/ui/AppModal";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { AppTabs } from "@/components/ui/AppTabs";
import { StatusChip } from "@/components/ui/StatusChip";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { AddBatchModal } from "@/features/inventory/components/AddBatchModal";
import { UsedStockTab } from "@/features/inventory/components/UsedStockTab";
import {
	type Actor,
	addBatch,
	deleteBatch,
	deleteProduct,
	updateBatchQuantity,
} from "@/features/inventory/firebase/inventory.writes";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { usePagination } from "@/hooks/use-pagination";
import { formatQuantity, fromBaseUnit } from "@/lib/units";
import { type ProductWithBatches, STOCK_STATUS_MAP } from "@/types/inventory";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
	component: InventoryPage,
	staticData: { breadcrumb: "Inventory" },
});

function fmtDate(ts: Timestamp | null): string {
	if (!ts) return "-";
	try {
		return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	} catch {
		return "-";
	}
}

function daysLeft(ts: Timestamp | null): number | null {
	if (!ts) return null;
	return Math.ceil((ts.toMillis() - Date.now()) / 86_400_000);
}

type Row = ProductWithBatches & { id: string };

function InventoryPage() {
	const { profile } = useAuth();
	const { rows, loading } = useInventory();
	const navigate = useNavigate();
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("All");

	const [manage, setManage] = useState<ProductWithBatches | null>(null);
	const [addBatchFor, setAddBatchFor] = useState<ProductWithBatches["product"] | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const actor: Actor = {
		uid: profile?.uid ?? "",
		name: profile?.fullName || profile?.email || "admin",
		role: profile?.role ?? "admin",
	};

	const { contains } = useFilter({ sensitivity: "base" });

	const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.product.category))).sort(), [rows]);

	const filtered = useMemo<Row[]>(() => {
		const q = search.trim().toLowerCase();
		return rows
			.filter((r) => (category === "All" ? true : r.product.category === category))
			.filter((r) => (q ? r.product.name.toLowerCase().includes(q) : true))
			.map((r) => ({ ...r, id: r.product.id }));
	}, [rows, search, category]);

	const stats = useMemo(
		() => ({
			total: rows.length,
			low: rows.filter((r) => r.status === "low").length,
			out: rows.filter((r) => r.status === "out").length,
		}),
		[rows],
	);

	const { page, setPage, rowsPerPage, pageRows } = usePagination(filtered);

	// Keep the open manage modal in sync with live data.
	const liveManage = manage ? (rows.find((r) => r.product.id === manage.product.id) ?? null) : null;

	const columns = [
		{ key: "name", label: "Product", render: (r: Row) => <span className="font-semibold">{r.product.name}</span> },
		{ key: "category", label: "Category", render: (r: Row) => r.product.category },
		{ key: "onHand", label: "On hand", render: (r: Row) => formatQuantity(r.onHand, r.product.displayUnit) },
		{
			key: "batches",
			label: "Batches",
			render: (r: Row) => (
				<span className="inline-flex items-center gap-1">
					<Layers className="h-3.5 w-3.5 opacity-60" />
					{r.batches.length}
				</span>
			),
		},
		{
			key: "expiry",
			label: "Nearest expiry",
			render: (r: Row) =>
				r.nearestExpiry ? fmtDate(r.nearestExpiry) : <span className="text-foreground/40">No batches</span>,
		},
		{
			key: "status",
			label: "Status",
			render: (r: Row) => (
				<StatusChip
					size="sm"
					status={r.status}
					statusMap={STOCK_STATUS_MAP}
				/>
			),
		},
		{
			key: "actions",
			label: "",
			render: (r: Row) => (
				<Button
					onPress={() => {
						setManage(r);
						setConfirmDelete(false);
					}}
					size="sm"
					variant="ghost"
				>
					Manage
				</Button>
			),
		},
	];

	const handleAddBatch = async (vals: { quantityDisplay: number; expirationDate: Date | null; location: string }) => {
		if (!addBatchFor) return;
		try {
			await addBatch(
				{ productId: addBatchFor.id, displayUnit: addBatchFor.displayUnit, ...vals },
				addBatchFor.name,
				actor,
			);
			notify.success({ title: "Batch added", description: `A new batch was added to ${addBatchFor.name}.` });
		} catch (e) {
			notify.danger({
				title: "Could not add batch",
				description: e instanceof Error ? e.message : "The batch could not be added. Please try again.",
			});
			throw e;
		}
	};

	const handleDeleteProduct = async () => {
		if (!liveManage) return;
		try {
			await deleteProduct(liveManage.product.id, liveManage.product.name, actor);
			notify.success({
				title: "Product deleted",
				description: `${liveManage.product.name} and all its batches were removed.`,
			});
			setManage(null);
			setConfirmDelete(false);
		} catch (e) {
			notify.danger({
				title: "Delete failed",
				description: e instanceof Error ? e.message : "The product could not be deleted. Please try again.",
			});
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<PackageSearch className="h-7 w-7 text-app-brand" />
					<div>
						<h1 className="text-2xl font-bold text-foreground">Inventory</h1>
						<p className="text-sm text-foreground/60">
							{stats.total} products · batch model (each batch keeps its own expiry).
						</p>
					</div>
				</div>
				<Button
					onPress={() => navigate({ to: "/admin/inventory/add" })}
					variant="primary"
				>
					<Plus className="mr-1 h-4 w-4" />
					Add product
				</Button>
			</div>

			<AppTabs
				defaultSelectedKey="stock"
				items={[
					{
						key: "stock",
						label: "Stock",
						content: (
							<div className="space-y-4">
								<div className="flex flex-wrap gap-3">
									<AppChip
										color="default"
										label={`${stats.total} products`}
										variant="soft"
									/>
									<AppChip
										color="warning"
										label={`${stats.low} low`}
										variant="soft"
									/>
									<AppChip
										color="danger"
										label={`${stats.out} out of stock`}
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
														name="category-filter-search"
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

								<div>
									<AppTable
										columns={columns}
										emptyContent="No products found."
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
						),
					},
					{
						key: "used",
						label: "Used Stock",
						content: <UsedStockTab />,
					},
				]}
			/>

			{/* Add batch */}
			{addBatchFor && (
				<AddBatchModal
					isOpen={!!addBatchFor}
					onClose={() => setAddBatchFor(null)}
					onSubmit={handleAddBatch}
					product={addBatchFor}
				/>
			)}

			{/* Manage product (batches + actions) */}
			<AppModal
				footer={
					liveManage ? (
						<div className="flex w-full items-center justify-between gap-2">
							{confirmDelete ? (
								<div className="flex items-center gap-2">
									<span className="text-sm text-danger">Delete product + all batches?</span>
									<Button
										onPress={handleDeleteProduct}
										size="sm"
										variant="danger"
									>
										Confirm
									</Button>
									<Button
										onPress={() => setConfirmDelete(false)}
										size="sm"
										variant="ghost"
									>
										Cancel
									</Button>
								</div>
							) : (
								<Button
									onPress={() => setConfirmDelete(true)}
									size="sm"
									variant="ghost"
								>
									<Trash2 className="mr-1 h-4 w-4 text-danger" />
									Delete product
								</Button>
							)}
							<div className="flex gap-2">
								<Button
									onPress={() => {
										setManage(null);
										navigate({
											to: "/admin/inventory/$productId/edit",
											params: { productId: liveManage.product.id },
										});
									}}
									size="sm"
									variant="ghost"
								>
									Edit
								</Button>
								<Button
									onPress={() => {
										setAddBatchFor(liveManage.product);
									}}
									size="sm"
									variant="primary"
								>
									<Plus className="mr-1 h-4 w-4" />
									Add batch
								</Button>
							</div>
						</div>
					) : undefined
				}
				isOpen={!!liveManage}
				onClose={() => setManage(null)}
				size="lg"
				title={liveManage ? `${liveManage.product.name}` : ""}
			>
				{liveManage && (
					<div className="space-y-3">
						<div className="flex flex-wrap gap-3 text-sm text-foreground/60">
							<span>
								On hand:{" "}
								<span className="font-semibold text-foreground">
									{formatQuantity(liveManage.onHand, liveManage.product.displayUnit)}
								</span>
							</span>
							<StatusChip
								size="sm"
								status={liveManage.status}
								statusMap={STOCK_STATUS_MAP}
							/>
							<span>{liveManage.product.category}</span>
						</div>
						{liveManage.batches.length === 0 ? (
							<p className="text-sm text-foreground/60">No batches on hand. Use “Add batch”.</p>
						) : (
							liveManage.batches.map((b) => (
								<BatchRow
									batch={b}
									daysLeft={daysLeft(b.expirationDate)}
									displayUnit={liveManage.product.displayUnit}
									expiryLabel={fmtDate(b.expirationDate)}
									key={b.id}
									onDelete={async () => {
										try {
											await deleteBatch(liveManage.product.id, b.id, liveManage.product.name, actor);
											notify.success({
												title: "Batch removed",
												description: `A batch of ${liveManage.product.name} was removed.`,
											});
										} catch (e) {
											notify.danger({
												title: "Could not remove batch",
												description:
													e instanceof Error ? e.message : "The batch could not be removed. Please try again.",
											});
										}
									}}
									onSave={async (newQty) => {
										try {
											await updateBatchQuantity(
												liveManage.product.id,
												b.id,
												newQty,
												liveManage.product.displayUnit,
												liveManage.product.name,
												actor,
											);
											notify.success({
												title: "Batch updated",
												description: `The batch quantity for ${liveManage.product.name} was updated.`,
											});
										} catch (e) {
											notify.danger({
												title: "Could not update batch",
												description:
													e instanceof Error ? e.message : "The batch could not be updated. Please try again.",
											});
										}
									}}
								/>
							))
						)}
					</div>
				)}
			</AppModal>
		</div>
	);
}

function BatchRow({
	batch,
	displayUnit,
	expiryLabel,
	daysLeft,
	onSave,
	onDelete,
}: {
	batch: { id: string; quantity: number; location: string | null };
	displayUnit: string;
	expiryLabel: string;
	daysLeft: number | null;
	onSave: (newQtyDisplay: number) => Promise<void>;
	onDelete: () => Promise<void>;
}) {
	const [qty, setQty] = useState(String(fromBaseUnit(batch.quantity, displayUnit)));
	const [busy, setBusy] = useState(false);

	const urgency =
		daysLeft === null
			? { label: "No expiry", color: "default" as const }
			: daysLeft <= 0
				? { label: "Expired", color: "danger" as const }
				: daysLeft <= 5
					? { label: `${daysLeft}d left`, color: "warning" as const }
					: { label: `${daysLeft}d left`, color: "success" as const };

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/10 p-3">
			<div className="flex items-center gap-2">
				<Input
					aria-label="Batch quantity"
					className="w-24 rounded-lg px-2 py-1"
					onChange={(e) => setQty((e.target as HTMLInputElement).value)}
					type="number"
					value={qty}
					variant="secondary"
				/>
				<span className="text-sm text-foreground/60">{displayUnit}</span>
				<Button
					isPending={busy}
					onPress={async () => {
						const n = Number(qty);
						if (Number.isNaN(n) || n < 0) return;
						setBusy(true);
						try {
							await onSave(n);
						} finally {
							setBusy(false);
						}
					}}
					size="sm"
					variant="ghost"
				>
					Save
				</Button>
			</div>
			<div className="flex items-center gap-2">
				<span className="text-xs text-foreground/60">
					Exp {expiryLabel}
					{batch.location ? ` · ${batch.location}` : ""}
				</span>
				<AppChip
					color={urgency.color}
					label={urgency.label}
					size="sm"
					variant="soft"
				/>
				<Button
					aria-label="Delete batch"
					isIconOnly
					onPress={onDelete}
					size="sm"
					variant="ghost"
				>
					<Trash2 className="h-4 w-4 text-danger" />
				</Button>
			</div>
		</div>
	);
}
