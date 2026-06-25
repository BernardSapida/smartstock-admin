import { createFileRoute } from "@tanstack/react-router";
import type { Timestamp } from "firebase/firestore";
import { ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import { AppSearchField } from "@/components/form/AppSearchField";
import { AppChip } from "@/components/ui/AppChip";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { type AuditEntry, useAuditLogs } from "@/features/audit/use-audit";
import { usePagination } from "@/hooks/use-pagination";

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

function AuditLogsPage() {
	const { logs, loading, error } = useAuditLogs();
	const [search, setSearch] = useState("");

	const q = search.trim().toLowerCase();
	const filtered = useMemo(
		() => logs.filter((l) => !q || `${l.user} ${l.action} ${l.module} ${l.description}`.toLowerCase().includes(q)),
		[logs, q],
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
					<p className="text-sm text-foreground/60">{logs.length} most recent events.</p>
				</div>
			</div>
			<div className="lg:max-w-sm">
				<AppSearchField
					onValueChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					placeholder="Search logs..."
					value={search}
				/>
			</div>
			<div>
				{error && (
					<p className="mb-2 text-sm text-danger">Failed to load audit logs: {error.message}</p>
				)}
				<AppTable
					columns={columns}
					emptyContent={error ? "Couldn't load audit logs." : "No audit logs."}
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
		</div>
	);
}
