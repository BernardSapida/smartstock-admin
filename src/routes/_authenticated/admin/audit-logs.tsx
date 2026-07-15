import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import type { Timestamp } from "firebase/firestore";
import { CalendarRange, ScrollText, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppSearchField } from "@/components/form/AppSearchField";
import { AppChip } from "@/components/ui/AppChip";
import { AppModal } from "@/components/ui/AppModal";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { type DateRange, DateRangeFilter, EMPTY_RANGE, isEmptyRange } from "@/components/ui/DateRangeFilter";
import { type AuditEntry, useAuditLogs } from "@/features/audit/use-audit";
import { usePagination } from "@/hooks/use-pagination";

const DATE_FMT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

function fmtDate(d: Date | null): string {
	return d ? d.toLocaleDateString("en-US", DATE_FMT) : "…";
}

/** Short "Jul 13 – Jul 20" label for the active date filter button. */
function rangeLabel(r: DateRange): string {
	const one = (d: Date | null) => d?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) ?? "";
	return `${one(r.start)} – ${one(r.end)}`;
}

export const Route = createFileRoute("/_authenticated/admin/audit-logs")({
	component: AuditLogsPage,
	staticData: { breadcrumb: "Audit Logs" },
});

function fmt(ts: Timestamp | null): string {
	if (!ts) return "-";
	try {
		return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	} catch {
		return "-";
	}
}

const ALL_MODULES = "All";

function AuditLogsPage() {
	// The range goes to Firestore, not to a client-side .filter() - see useAuditLogs.
	const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
	const { logs, loading, error } = useAuditLogs(range);
	const [search, setSearch] = useState("");
	const [module, setModule] = useState<string>(ALL_MODULES);
	const [filterOpen, setFilterOpen] = useState(false);

	// Modules present in the data, so the filter can't offer a dead option.
	const modules = useMemo(
		() => [ALL_MODULES, ...Array.from(new Set(logs.map((l) => l.module).filter(Boolean))).sort()],
		[logs],
	);

	const q = search.trim().toLowerCase();
	const filtered = useMemo(
		() =>
			logs
				.filter((l) => module === ALL_MODULES || l.module === module)
				.filter((l) => !q || `${l.user} ${l.action} ${l.module} ${l.description}`.toLowerCase().includes(q)),
		[logs, q, module],
	);

	const { page, setPage, rowsPerPage, pageRows } = usePagination(filtered);

	const columns = [
		{ key: "timestamp", label: "When", render: (l: AuditEntry) => fmt(l.timestamp) },
		{ key: "user", label: "User", render: (l: AuditEntry) => l.user },
		{
			key: "action",
			label: "Action",
			render: (l: AuditEntry) => (
				<AppChip
					color="default"
					label={l.action}
					size="sm"
					variant="soft"
				/>
			),
		},
		{ key: "module", label: "Module", render: (l: AuditEntry) => l.module },
		{ key: "description", label: "Description", render: (l: AuditEntry) => l.description },
		{
			key: "status",
			label: "Status",
			render: (l: AuditEntry) => (
				<AppChip
					color={l.status === "failed" ? "danger" : l.status === "warning" ? "warning" : "success"}
					label={l.status.charAt(0).toUpperCase() + l.status.slice(1)}
					size="sm"
					variant="soft"
				/>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<ScrollText className="h-7 w-7 text-app-brand" />
				<div>
					<h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
					<p className="text-sm text-foreground/60">
						{filtered.length} event{filtered.length === 1 ? "" : "s"}
						{isEmptyRange(range) ? " (most recent)" : ` from ${fmtDate(range.start)} to ${fmtDate(range.end)}`}
					</p>
				</div>
			</div>

			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-3 sm:flex-row">
					<div className="flex-1 w-full">
						<AppSearchField
							onValueChange={(v) => {
								setSearch(v);
								setPage(1);
							}}
							placeholder="Search logs..."
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
				{/* One chip per module: user actions, inventory updates, recipe
				    modifications and the rest, each filterable on its own. */}
				<div className="flex flex-wrap gap-1.5">
					{modules.map((m) => (
						<Button
							key={m}
							onPress={() => {
								setModule(m);
								setPage(1);
							}}
							size="sm"
							variant={module === m ? "primary" : "ghost"}
						>
							{m === ALL_MODULES ? "All modules" : m}
						</Button>
					))}
				</div>
			</div>
			<div>
				{error && <p className="mb-2 text-sm text-danger">Failed to load audit logs: {error.message}</p>}
				<AppTable
					columns={columns}
					emptyContent={
						error
							? "Couldn't load audit logs."
							: isEmptyRange(range)
								? "No audit logs."
								: "No audit logs in this date range."
					}
					isLoading={loading}
					rows={pageRows.map((l) => ({ ...l }))}
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
						label="Logged between"
						onChange={(r) => {
							setRange(r);
							setPage(1);
						}}
						value={range}
					/>
				</AppModal>
			)}
		</div>
	);
}
