// Alerts = a FILTERED VIEW over live inventory state (out-of-stock, low-stock,
// expiring batches). Not a separate subsystem - derived client-side.
//
// Grouped by severity (and expiry by days-left) so the page reads as a summary:
// each accordion header carries a rollup count + quantity total, and the
// individual items live in the expandable panel.

import { Surface } from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { AppAccordion } from "@/components/ui/AppAccordion";
import { AppChip } from "@/components/ui/AppChip";
import { flattenExpiring } from "@/features/expiry/expiry";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { formatQuantity } from "@/lib/units";

interface StockRow {
	id: string;
	name: string;
	meta: string;
}

interface ExpRow {
	id: string;
	name: string;
	quantity: number;
	displayUnit: string;
	meta: string;
}

/** Sum quantities grouped by display unit (kg + pcs can't be added). */
function rollup(rows: ExpRow[]): string {
	const byUnit = new Map<string, number>();
	for (const r of rows) byUnit.set(r.displayUnit, (byUnit.get(r.displayUnit) ?? 0) + r.quantity);
	return Array.from(byUnit, ([unit, base]) => formatQuantity(base, unit)).join(" · ");
}

function header(color: "danger" | "warning", label: string): ReactNode {
	return (
		<span className="flex items-center gap-2">
			<AppChip
				color={color}
				label={color === "danger" ? "Urgent" : "Warning"}
				size="sm"
				variant="soft"
			/>
			<span className="font-semibold text-foreground">{label}</span>
		</span>
	);
}

function listRow(id: string, name: string, meta: string) {
	return (
		<Surface
			className="flex items-center justify-between gap-3 rounded-xl p-3"
			key={id}
			variant="secondary"
		>
			<span className="font-medium text-foreground">{name}</span>
			<span className="text-right text-xs text-foreground/60">{meta}</span>
		</Surface>
	);
}

function stockList(rows: StockRow[]) {
	return <div className="space-y-2">{rows.map((r) => listRow(r.id, r.name, r.meta))}</div>;
}

function expList(rows: ExpRow[]) {
	return (
		<div className="space-y-2">
			{rows.map((r) =>
				listRow(r.id, r.name, `${formatQuantity(r.quantity, r.displayUnit)}${r.meta ? ` · ${r.meta}` : ""}`),
			)}
		</div>
	);
}

function daySection(label: string, rows: ExpRow[]) {
	if (rows.length === 0) return null;
	return (
		<div className="space-y-2">
			<p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
				{label} · {rows.length} {rows.length === 1 ? "batch" : "batches"} · {rollup(rows)}
			</p>
			{expList(rows)}
		</div>
	);
}

export function AlertsView() {
	const { rows, loading } = useInventory();

	const data = useMemo(() => {
		const outOfStock: StockRow[] = [];
		const lowStock: StockRow[] = [];
		for (const r of rows) {
			if (r.status === "out") {
				outOfStock.push({ id: r.product.id, name: r.product.name, meta: r.product.category });
			} else if (r.status === "low") {
				lowStock.push({
					id: r.product.id,
					name: r.product.name,
					meta: `${formatQuantity(r.onHand, r.product.displayUnit)} on hand`,
				});
			}
		}

		// Expiry alert window: expired through ≤7 days (daysLeft is ceil-based via
		// expiry.ts). Keep in sync with the inventory-native NotificationsScreen so
		// both apps report the same alert count.
		const expired: ExpRow[] = [];
		const day1: ExpRow[] = [];
		const day2: ExpRow[] = [];
		const day37: ExpRow[] = [];
		for (const b of flattenExpiring(rows)) {
			if (b.daysLeft === null) continue;
			const row: ExpRow = {
				id: b.batch.id,
				name: b.productName,
				quantity: b.batch.quantity,
				displayUnit: b.displayUnit,
				meta: b.batch.location ?? b.category,
			};
			if (b.daysLeft <= 0) expired.push(row);
			else if (b.daysLeft === 1) day1.push(row);
			else if (b.daysLeft === 2) day2.push(row);
			else if (b.daysLeft <= 7) day37.push(row);
		}
		const expiring = [...day1, ...day2, ...day37];

		return { outOfStock, lowStock, expired, day1, day2, day37, expiring };
	}, [rows]);

	const total = data.outOfStock.length + data.lowStock.length + data.expired.length + data.expiring.length;

	const items: { key: string; title: ReactNode; subtitle: string; content: ReactNode }[] = [];
	if (data.outOfStock.length) {
		items.push({
			key: "out",
			title: header("danger", "Out of stock"),
			subtitle: `${data.outOfStock.length} ${data.outOfStock.length === 1 ? "item" : "items"}`,
			content: stockList(data.outOfStock),
		});
	}
	if (data.expired.length) {
		items.push({
			key: "expired",
			title: header("danger", "Expired batches"),
			subtitle: `${data.expired.length} ${data.expired.length === 1 ? "batch" : "batches"} · ${rollup(data.expired)}`,
			content: expList(data.expired),
		});
	}
	if (data.expiring.length) {
		items.push({
			key: "expiring",
			title: header("warning", "Expiring soon"),
			subtitle: `${data.expiring.length} ${data.expiring.length === 1 ? "batch" : "batches"} · ${rollup(data.expiring)}`,
			content: (
				<div className="space-y-4">
					{daySection("In 1 day", data.day1)}
					{daySection("In 2 days", data.day2)}
					{daySection("In 3-7 days", data.day37)}
				</div>
			),
		});
	}
	if (data.lowStock.length) {
		items.push({
			key: "low",
			title: header("warning", "Low stock"),
			subtitle: `${data.lowStock.length} ${data.lowStock.length === 1 ? "item" : "items"}`,
			content: stockList(data.lowStock),
		});
	}

	const defaultExpandedKeys = ["out", "expired"].filter((k) => items.some((i) => i.key === k));

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<AlertTriangle className="h-7 w-7 text-app-brand" />
				<div>
					<h1 className="text-2xl font-bold text-foreground">Alerts</h1>
					<p className="text-sm text-foreground/60">{total} active stock & expiry alerts.</p>
				</div>
			</div>

			{loading ? (
				<p className="text-sm text-foreground/60">Loading…</p>
			) : items.length === 0 ? (
				<p className="text-sm text-foreground/60">No active alerts. 🎉</p>
			) : (
				<AppAccordion
					defaultExpandedKeys={defaultExpandedKeys}
					items={items}
					selectionMode="multiple"
				/>
			)}
		</div>
	);
}
