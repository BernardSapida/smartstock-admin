import {
	Autocomplete,
	Button,
	Calendar,
	DateField,
	DatePicker,
	EmptyState,
	ListBox,
	SearchField,
	useFilter,
} from "@heroui/react";
import { type CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange, ClipboardCheck, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { notify } from "@/components/feedback";
import { AppSearchField } from "@/components/form/AppSearchField";
import { AppChip } from "@/components/ui/AppChip";
import { AppModal } from "@/components/ui/AppModal";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { type DateRange, DateRangeFilter, EMPTY_RANGE, isEmptyRange } from "@/components/ui/DateRangeFilter";
import { useAuth } from "@/features/auth/context/AuthProvider";
import {
	assignInspection,
	cancelInspection,
	disposeInspectedItem,
	type Inspection,
	isDisposable,
	useInspections,
} from "@/features/inspections/inspections";
import type { Actor } from "@/features/inventory/firebase/inventory.writes";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { useUsers } from "@/features/users/users";
import { usePagination } from "@/hooks/use-pagination";
import { formatQuantity, fromBaseUnit, toBaseUnit } from "@/lib/units";
import type { ProductWithBatches } from "@/types/inventory";

export const Route = createFileRoute("/_authenticated/admin/inspections")({
	component: InspectionsPage,
	staticData: { breadcrumb: "Inspections" },
});

const CONDITION_COLOR = {
	good: "success",
	warning: "warning",
	damaged: "danger",
	expired: "default",
} as const;

function fmt(ts: { toDate: () => Date } | null): string {
	if (!ts) return "-";
	try {
		return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	} catch {
		return "-";
	}
}

/** Short "Jul 13 – Jul 20" label for the active date filter button. */
function rangeLabel(r: DateRange): string {
	const one = (d: Date | null) => d?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) ?? "";
	return `${one(r.start)} – ${one(r.end)}`;
}

function InspectionsPage() {
	const { profile } = useAuth();
	const { inspections, loading, error } = useInspections();
	const { rows } = useInventory();
	const { users } = useUsers();

	const [search, setSearch] = useState("");
	const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
	const [assignOpen, setAssignOpen] = useState(false);
	const [filterOpen, setFilterOpen] = useState(false);

	const actor: Actor = {
		uid: profile?.uid ?? "",
		name: profile?.fullName || profile?.email || "admin",
		role: profile?.role ?? "admin",
	};

	const staff = useMemo(() => users.filter((u) => u.role === "staff" && u.isActive && !u.isArchived), [users]);
	const byId = useMemo(() => new Map(rows.map((r) => [r.product.id, r])), [rows]);

	const q = search.trim().toLowerCase();
	const filtered = useMemo(() => {
		const from = range.start ? new Date(range.start).setHours(0, 0, 0, 0) : null;
		const to = range.end ? new Date(range.end).setHours(23, 59, 59, 999) : null;
		return inspections
			.filter((i) => !q || `${i.itemName} ${i.staffName} ${i.assignedToName ?? ""}`.toLowerCase().includes(q))
			.filter((i) => {
				if (from == null && to == null) return true;
				// Pending rows have no checkedAt; fall back to the due date so an
				// assignment due in the range still shows up.
				const ms = (i.checkedAt ?? i.dueDate)?.toMillis();
				if (ms == null) return false;
				return (from == null || ms >= from) && (to == null || ms <= to);
			});
	}, [inspections, q, range]);

	const { page, setPage, rowsPerPage, pageRows } = usePagination(filtered);

	// Disposal opens a sheet rather than firing immediately: the amount is a
	// judgement call (only part of a batch may have spoiled), so it has to be typed.
	const [disposing, setDisposing] = useState<Inspection | null>(null);

	const cancel = async (i: Inspection) => {
		try {
			await cancelInspection(i, actor);
			notify.success({
				title: "Inspection cancelled",
				description: `The pending inspection of ${i.itemName} was removed.`,
			});
		} catch (e) {
			notify.danger({ title: "Could not cancel", description: e instanceof Error ? e.message : "Try again." });
		}
	};

	const columns = [
		{ key: "itemName", label: "Item", render: (i: Inspection) => i.itemName },
		{
			key: "status",
			label: "Status",
			render: (i: Inspection) => (
				<AppChip
					color={i.status === "pending" ? "warning" : "success"}
					label={i.status === "pending" ? "Pending" : "Completed"}
					size="sm"
					variant="soft"
				/>
			),
		},
		{
			key: "condition",
			label: "Condition",
			render: (i: Inspection) =>
				i.condition ? (
					<AppChip
						color={CONDITION_COLOR[i.condition]}
						label={i.condition}
						size="sm"
						variant="soft"
					/>
				) : (
					<span className="text-foreground/40">-</span>
				),
		},
		{
			key: "who",
			label: "Assigned to / By",
			render: (i: Inspection) => (i.status === "pending" ? (i.assignedToName ?? "-") : i.staffName || "-"),
		},
		{
			key: "when",
			label: "Due / Checked",
			render: (i: Inspection) => fmt(i.checkedAt ?? i.dueDate),
		},
		{
			key: "actions",
			label: "Action",
			render: (i: Inspection) => {
				if (i.disposed) {
					const unit = byId.get(i.productId ?? "")?.product.displayUnit;
					const amount =
						i.disposedQuantity != null
							? unit
								? formatQuantity(i.disposedQuantity, unit)
								: String(i.disposedQuantity)
							: null;
					return (
						<span className="text-xs text-foreground/50">Disposed{amount ? ` (${amount})` : ""}</span>
					);
				}
				if (i.status === "pending") {
					return (
						<Button
							onPress={() => cancel(i)}
							size="sm"
							variant="ghost"
						>
							<Trash2 className="mr-1 h-3.5 w-3.5" />
							Cancel
						</Button>
					);
				}
				if (isDisposable(i.condition) && i.batchId) {
					return (
						<Button
							className="text-danger"
							onPress={() => setDisposing(i)}
							size="sm"
							variant="ghost"
						>
							<Trash2 className="mr-1 h-3.5 w-3.5" />
							Dispose
						</Button>
					);
				}
				return null;
			},
		},
	];

	const pendingCount = inspections.filter((i) => i.status === "pending").length;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<ClipboardCheck className="h-7 w-7 text-app-brand" />
					<div>
						<h1 className="text-2xl font-bold text-foreground">Inspections</h1>
						<p className="text-sm text-foreground/60">
							{pendingCount} pending · {inspections.length - pendingCount} completed. Staff perform these in the mobile
							app.
						</p>
					</div>
				</div>
				<Button
					className="bg-app-brand"
					onPress={() => setAssignOpen(true)}
					size="sm"
					variant="primary"
				>
					<Plus className="mr-1 h-4 w-4" />
					Assign inspection
				</Button>
			</div>

			<div className="flex flex-col gap-3 rounded-xl sm:flex-row">
				<div className="flex-1 w-full">
					<AppSearchField
						onValueChange={(v) => {
							setSearch(v);
							setPage(1);
						}}
						placeholder="Search by item, staff, or assignee…"
						value={search}
					/>
				</div>
				<Button
					onPress={() => setFilterOpen(true)}
					variant={isEmptyRange(range) ? "ghost" : "primary"}
				>
					<CalendarRange className="mr-1.5 h-4 w-4" />
					{isEmptyRange(range) ? "Filter by date" : rangeLabel(range)}
				</Button>
				{!isEmptyRange(range) && (
					<Button
						aria-label="Clear date filter"
						isIconOnly
						onPress={() => {
							setRange(EMPTY_RANGE);
							setPage(1);
						}}
						variant="ghost"
					>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>

			<div>
				{error && <p className="mb-2 text-sm text-danger">Failed to load inspections: {error.message}</p>}
				<AppTable
					columns={columns}
					emptyContent={
						error
							? "Couldn't load inspections."
							: isEmptyRange(range)
								? "No inspections yet."
								: "No inspections in this date range."
					}
					isLoading={loading}
					rows={pageRows.map((i) => ({ ...i }))}
				/>
				<AppPagination
					onPageChange={setPage}
					page={page}
					rowsPerPage={rowsPerPage}
					total={filtered.length}
				/>
			</div>

			{filterOpen && (
				<AppModal
					footer={
						<div className="flex w-full justify-between gap-2">
							<Button
								isDisabled={isEmptyRange(range)}
								onPress={() => {
									setRange(EMPTY_RANGE);
									setPage(1);
								}}
								variant="ghost"
							>
								Clear
							</Button>
							<Button
								className="bg-app-brand"
								onPress={() => setFilterOpen(false)}
								variant="primary"
							>
								Done
							</Button>
						</div>
					}
					isOpen={filterOpen}
					onClose={() => setFilterOpen(false)}
					title="Filter by date"
				>
					<DateRangeFilter
						label="Due / checked between"
						onChange={(r) => {
							setRange(r);
							setPage(1);
						}}
						value={range}
					/>
				</AppModal>
			)}

			{assignOpen && (
				<AssignModal
					actor={actor}
					isOpen={assignOpen}
					onClose={() => setAssignOpen(false)}
					products={rows}
					staff={staff.map((s) => ({ uid: s.uid, name: s.fullName || s.email }))}
				/>
			)}

			{disposing && (
				<DisposeModal
					actor={actor}
					inspection={disposing}
					onClose={() => setDisposing(null)}
					row={byId.get(disposing.productId ?? "") ?? null}
				/>
			)}
		</div>
	);
}

interface DisposeModalProps {
	inspection: Inspection;
	row: ProductWithBatches | null;
	actor: Actor;
	onClose: () => void;
}

/**
 * Disposal needs an amount, not just a confirmation: only part of a batch may have
 * spoiled. The figure is entered in the product's display unit (kg) and converted to
 * the base unit (g) on the way to Firestore, matching how the mobile app does it.
 */
function DisposeModal({ inspection, row, actor, onClose }: DisposeModalProps) {
	const batch = row?.batches.find((b) => b.id === inspection.batchId) ?? null;
	const unit = row?.product.displayUnit ?? "";
	const maxDisplay = batch ? fromBaseUnit(batch.quantity, unit) : 0;

	// Default to the whole batch - "all of it spoiled" is the common case.
	const [qty, setQty] = useState(String(maxDisplay));
	const [busy, setBusy] = useState(false);

	const entered = Number(qty);
	const valid = Number.isFinite(entered) && entered > 0;
	const qtyBase = valid ? toBaseUnit(entered, unit) : 0;
	const tooMuch = !!batch && qtyBase > batch.quantity;
	const remaining = batch ? batch.quantity - qtyBase : 0;

	const submit = async () => {
		if (!batch || !valid || tooMuch) return;
		setBusy(true);
		try {
			await disposeInspectedItem(inspection, qtyBase, batch.quantity, actor);
			notify.success({
				title: "Item disposed",
				description:
					remaining <= 0
						? `${inspection.itemName} was removed from stock and recorded in inventory history.`
						: `${formatQuantity(qtyBase, unit)} of ${inspection.itemName} written off. ${formatQuantity(remaining, unit)} remains.`,
			});
			onClose();
		} catch (e) {
			notify.danger({ title: "Could not dispose", description: e instanceof Error ? e.message : "Try again." });
		} finally {
			setBusy(false);
		}
	};

	return (
		<AppModal
			footer={
				<div className="flex w-full justify-end gap-2">
					<Button
						onPress={onClose}
						variant="ghost"
					>
						Cancel
					</Button>
					<Button
						className="bg-danger text-white"
						isDisabled={!batch || !valid || tooMuch || busy}
						onPress={submit}
						variant="primary"
					>
						{busy ? "Disposing…" : "Dispose & remove from stock"}
					</Button>
				</div>
			}
			isOpen
			onClose={onClose}
			title="Dispose item"
		>
			{!batch ? (
				<p className="text-sm text-foreground/60">
					That batch no longer exists - it may already have been used or removed.
				</p>
			) : (
				<div className="space-y-4">
					<div>
						<p className="font-semibold text-foreground">{inspection.itemName}</p>
						<p className="text-sm text-foreground/60">
							Marked {inspection.condition} · {formatQuantity(batch.quantity, unit)} in this batch
						</p>
					</div>

					<div>
						<span className="mb-1.5 block text-sm font-medium text-foreground">
							How much is damaged/expired? ({unit})
						</span>
						<input
							className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm text-foreground"
							max={maxDisplay}
							min={0}
							onChange={(e) => setQty(e.target.value)}
							step="any"
							type="number"
							value={qty}
						/>
						<button
							className="mt-2 text-xs text-foreground/60 underline"
							onClick={() => setQty(String(maxDisplay))}
							type="button"
						>
							Dispose entire batch
						</button>
					</div>

					{tooMuch ? (
						<p className="text-sm font-semibold text-danger">
							Only {formatQuantity(batch.quantity, unit)} available in this batch.
						</p>
					) : valid ? (
						<p className="text-sm text-foreground/60">
							{remaining <= 0
								? "Entire batch will be removed from inventory."
								: `${formatQuantity(remaining, unit)} will remain on hand.`}
						</p>
					) : null}
				</div>
			)}
		</AppModal>
	);
}

interface PickerItem {
	value: string;
	label: string;
}

/**
 * Standalone (non-RHF) searchable select. The Assign modal picks from a large,
 * unbounded product list, so a native <select> scroll is unusable - this filters
 * as you type. Mirrors the pattern in TableFilterBar so the two behave alike.
 */
function Picker({
	label,
	placeholder,
	items,
	value,
	onChange,
}: {
	label: string;
	placeholder: string;
	items: PickerItem[];
	value: string | null;
	onChange: (value: string | null) => void;
}) {
	const { contains } = useFilter({ sensitivity: "base" });

	return (
		<Autocomplete
			className="w-full"
			onChange={(key) => onChange(key ? String(key) : null)}
			placeholder={placeholder}
			selectionMode="single"
			value={value}
			variant="secondary"
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
						name={`${label}-search`}
						variant="secondary"
					>
						<SearchField.Group>
							<SearchField.SearchIcon />
							<SearchField.Input placeholder={`Search ${label.toLowerCase()}…`} />
							<SearchField.ClearButton />
						</SearchField.Group>
					</SearchField>
					<ListBox renderEmptyState={() => <EmptyState>No results found</EmptyState>}>
						{items.map((item) => (
							<ListBox.Item
								id={item.value}
								key={item.value}
								textValue={item.label}
							>
								{item.label}
								<ListBox.ItemIndicator />
							</ListBox.Item>
						))}
					</ListBox>
				</Autocomplete.Filter>
			</Autocomplete.Popover>
		</Autocomplete>
	);
}

interface AssignModalProps {
	isOpen: boolean;
	onClose: () => void;
	products: ProductWithBatches[];
	staff: { uid: string; name: string }[];
	actor: Actor;
}

function AssignModal({ isOpen, onClose, products, staff, actor }: AssignModalProps) {
	const [productId, setProductId] = useState<string | null>(null);
	const [batchId, setBatchId] = useState<string | null>(null);
	const [assignee, setAssignee] = useState<string | null>(null);
	const [due, setDue] = useState<CalendarDate | null>(null);
	const [busy, setBusy] = useState(false);

	const product = products.find((p) => p.product.id === productId) ?? null;
	const person = staff.find((s) => s.uid === assignee) ?? null;
	const canSubmit = !!product && !!person && !busy;

	const submit = async () => {
		if (!product || !person) return;
		setBusy(true);
		try {
			await assignInspection(
				{
					productId: product.product.id,
					batchId,
					itemName: product.product.name,
					assignedTo: person.uid,
					assignedToName: person.name,
					dueDate: due ? due.toDate(getLocalTimeZone()) : null,
				},
				actor,
			);
			notify.success({
				title: "Inspection assigned",
				description: `${person.name} will see it in the mobile app.`,
			});
			onClose();
		} catch (e) {
			notify.danger({ title: "Could not assign", description: e instanceof Error ? e.message : "Try again." });
		} finally {
			setBusy(false);
		}
	};

	return (
		<AppModal
			footer={
				<div className="flex w-full justify-end gap-2">
					<Button
						onPress={onClose}
						variant="ghost"
					>
						Cancel
					</Button>
					<Button
						className="bg-app-brand"
						isDisabled={!canSubmit}
						onPress={submit}
						variant="primary"
					>
						{busy ? "Assigning…" : "Assign"}
					</Button>
				</div>
			}
			isOpen={isOpen}
			onClose={onClose}
			title="Assign inspection"
		>
			<div className="space-y-4">
				<div>
					<span className="mb-1.5 block text-sm font-medium text-foreground">Item</span>
					<Picker
						items={products.map((p) => ({
							value: p.product.id,
							label: `${p.product.name} - ${formatQuantity(p.onHand, p.product.displayUnit)} on hand`,
						}))}
						label="Item"
						onChange={(id) => {
							setProductId(id);
							// Default to the FEFO front - the batch most likely to need checking.
							setBatchId(products.find((x) => x.product.id === id)?.batches[0]?.id ?? null);
						}}
						placeholder="Select an item…"
						value={productId}
					/>
				</div>

				{product && product.batches.length > 0 && (
					<div>
						<span className="mb-1.5 block text-sm font-medium text-foreground">Batch</span>
						<Picker
							items={product.batches.map((b) => ({
								value: b.id,
								label: `${formatQuantity(b.quantity, product.product.displayUnit)}${
									b.expirationDate ? ` - expires ${fmt(b.expirationDate)}` : " - no expiry"
								}`,
							}))}
							label="Batch"
							onChange={setBatchId}
							placeholder="No specific batch"
							value={batchId}
						/>
						<p className="mt-1 text-xs text-foreground/50">
							A batch is required if the item may need to be disposed of after inspection.
						</p>
					</div>
				)}

				<div>
					<span className="mb-1.5 block text-sm font-medium text-foreground">Assign to</span>
					<Picker
						items={staff.map((s) => ({ value: s.uid, label: s.name }))}
						label="Staff"
						onChange={setAssignee}
						placeholder="Select a staff member…"
						value={assignee}
					/>
					{staff.length === 0 && <p className="mt-1 text-xs text-warning">No active staff to assign to.</p>}
				</div>

				<div>
					<span className="mb-1.5 block text-sm font-medium text-foreground">Due date (optional)</span>
					<DatePicker
						aria-label="Due date"
						className="w-full"
						minValue={today(getLocalTimeZone())}
						onChange={setDue}
						value={due}
					>
						<DateField.Group
							fullWidth
							variant="secondary"
						>
							<DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
							<DateField.Suffix>
								<DatePicker.Trigger>
									<DatePicker.TriggerIndicator />
								</DatePicker.Trigger>
							</DateField.Suffix>
						</DateField.Group>
						<DatePicker.Popover>
							{/* minValue must be repeated here: the composable Calendar doesn't
							    read it from the DatePicker context, so without it the calendar
							    still lets you click past days. */}
							<Calendar
								aria-label="Due date"
								minValue={today(getLocalTimeZone())}
							>
								<Calendar.Header>
									<Calendar.YearPickerTrigger>
										<Calendar.YearPickerTriggerHeading />
										<Calendar.YearPickerTriggerIndicator />
									</Calendar.YearPickerTrigger>
									<Calendar.NavButton slot="previous" />
									<Calendar.NavButton slot="next" />
								</Calendar.Header>
								<Calendar.Grid>
									<Calendar.GridHeader>
										{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
									</Calendar.GridHeader>
									<Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
								</Calendar.Grid>
							</Calendar>
						</DatePicker.Popover>
					</DatePicker>
				</div>
			</div>
		</AppModal>
	);
}
