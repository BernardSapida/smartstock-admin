import { Button, Surface } from "@heroui/react";
import { Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { notify } from "@/components/feedback";
import { AppChip } from "@/components/ui/AppChip";
import { AppModal } from "@/components/ui/AppModal";
import { useAuth } from "@/features/auth/context/AuthProvider";
import type { Actor } from "@/features/inventory/firebase/inventory.writes";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { formatQuantity } from "@/lib/units";
import { type ExpiringBatch, flattenExpiring, URGENCY_META } from "./expiry";
import { markBatchChecked, reportDisposal } from "./firebase";

const DISPOSAL_REASONS = ["Expired", "Spoiled", "Damaged", "Quality issue", "Other"];

export function ExpiryView({ mode }: { mode: "admin" | "staff" }) {
	const { profile } = useAuth();
	const { rows, loading } = useInventory();
	const [tab, setTab] = useState<"all" | "action">("action");
	const [dispose, setDispose] = useState<ExpiringBatch | null>(null);
	const [reason, setReason] = useState(DISPOSAL_REASONS[0]);
	const [note, setNote] = useState("");

	const actor: Actor = {
		uid: profile?.uid ?? "",
		name: profile?.fullName || profile?.email || "user",
		role: profile?.role ?? mode,
	};

	const all = useMemo(() => flattenExpiring(rows), [rows]);
	const stats = useMemo(
		() => ({
			expired: all.filter((b) => b.urgency === "expired").length,
			critical: all.filter((b) => b.urgency === "critical").length,
			warning: all.filter((b) => b.urgency === "warning").length,
		}),
		[all],
	);
	const list =
		tab === "action" ? all.filter((b) => ["expired", "critical", "warning", "watch"].includes(b.urgency)) : all;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Clock className="h-7 w-7 text-app-brand" />
				<div>
					<h1 className="text-2xl font-bold text-foreground">
						{mode === "admin" ? "Expiry Tracker" : "Expiry Checks"}
					</h1>
					<p className="text-sm text-foreground/60">
						Per-batch expiry{mode === "admin" ? " (read-only reporting)." : " - mark checked or report disposal."}
					</p>
				</div>
			</div>

			<div className="flex flex-wrap gap-3">
				<AppChip
					color="danger"
					label={`${stats.expired} expired`}
					variant="soft"
				/>
				<AppChip
					color="danger"
					label={`${stats.critical} critical`}
					variant="soft"
				/>
				<AppChip
					color="warning"
					label={`${stats.warning} warning`}
					variant="soft"
				/>
			</div>

			<div className="flex gap-2">
				<Button
					onPress={() => setTab("action")}
					size="sm"
					variant={tab === "action" ? "primary" : "ghost"}
				>
					Needs action
				</Button>
				<Button
					onPress={() => setTab("all")}
					size="sm"
					variant={tab === "all" ? "primary" : "ghost"}
				>
					All batches
				</Button>
			</div>

			{loading ? (
				<p className="text-sm text-foreground/60">Loading…</p>
			) : list.length === 0 ? (
				<p className="text-sm text-foreground/60">Nothing here.</p>
			) : (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
					{list.map((b) => {
						const meta = URGENCY_META[b.urgency];
						return (
							<Surface
								className="flex flex-col gap-2 rounded-2xl p-4"
								key={b.batch.id}
								variant="secondary"
							>
								<div className="flex items-start justify-between">
									<div>
										<p className="font-semibold text-foreground">{b.productName}</p>
										<p className="text-xs text-foreground/60">{b.category}</p>
									</div>
									<AppChip
										color={meta.color}
										label={meta.label}
										size="sm"
										variant="soft"
									/>
								</div>
								<p className="text-sm text-foreground/70">{formatQuantity(b.batch.quantity, b.displayUnit)}</p>
								<p className="text-xs text-foreground/50">
									{b.daysLeft === null
										? "No expiry date"
										: b.daysLeft <= 0
											? `Expired ${Math.abs(b.daysLeft)}d ago`
											: `${b.daysLeft} days left`}
									{b.batch.location ? ` · ${b.batch.location}` : ""}
								</p>
								{mode === "staff" && (
									<div className="mt-1 flex gap-2">
										<Button
											onPress={async () => {
												try {
													await markBatchChecked(
														{ productId: b.productId, batchId: b.batch.id, productName: b.productName },
														actor,
													);
													notify.success({
														title: "Marked checked",
														description: `${b.productName} batch was confirmed as checked.`,
													});
												} catch (e) {
													notify.danger({
														title: "Could not mark checked",
														description: e instanceof Error ? e.message : "Please try again.",
													});
												}
											}}
											size="sm"
											variant="ghost"
										>
											Checked
										</Button>
										<Button
											onPress={() => setDispose(b)}
											size="sm"
											variant="ghost"
										>
											Report disposal
										</Button>
									</div>
								)}
							</Surface>
						);
					})}
				</div>
			)}

			<AppModal
				footer={
					<div className="flex justify-end gap-2">
						<Button
							onPress={() => setDispose(null)}
							variant="ghost"
						>
							Cancel
						</Button>
						<Button
							onPress={async () => {
								if (!dispose) return;
								try {
									await reportDisposal(
										{
											productId: dispose.productId,
											batchId: dispose.batch.id,
											productName: dispose.productName,
											reason,
											note,
										},
										actor,
									);
									notify.success({
										title: "Disposal reported",
										description: `${dispose.productName} batch was removed from inventory.`,
									});
									setDispose(null);
									setNote("");
								} catch (e) {
									notify.danger({
										title: "Could not report disposal",
										description: e instanceof Error ? e.message : "Please try again.",
									});
								}
							}}
							variant="danger"
						>
							Report & remove batch
						</Button>
					</div>
				}
				isOpen={!!dispose}
				onClose={() => setDispose(null)}
				title={dispose ? `Dispose - ${dispose.productName}` : ""}
			>
				<div className="space-y-3">
					<div className="flex flex-wrap gap-2">
						{DISPOSAL_REASONS.map((r) => (
							<Button
								key={r}
								onPress={() => setReason(r)}
								size="sm"
								variant={r === reason ? "primary" : "ghost"}
							>
								{r}
							</Button>
						))}
					</div>
					<textarea
						className="h-20 w-full rounded-lg border border-foreground/15 bg-app-base px-3 py-2 text-foreground"
						onChange={(e) => setNote(e.target.value)}
						placeholder="Note (optional)"
						value={note}
					/>
				</div>
			</AppModal>
		</div>
	);
}
