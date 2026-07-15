import { Button, Input, Surface, Switch } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { notify } from "@/components/feedback";
import { AppNumberField } from "@/components/form/AppNumberField";
import { AppSearchField } from "@/components/form/AppSearchField";
import { AppSwitch } from "@/components/form/AppSwitch";
import { AppChip } from "@/components/ui/AppChip";
import { AppModal } from "@/components/ui/AppModal";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { AppTabs } from "@/components/ui/AppTabs";
import { useAuth } from "@/features/auth/context/AuthProvider";
import type { Actor } from "@/features/inventory/firebase/inventory.writes";
import { type SpoonDefault, saveSystemConfig, useSystemConfig } from "@/features/settings/settings";
import { updateUserActive, updateUserRole, useUsers } from "@/features/users/users";
import { usePagination } from "@/hooks/use-pagination";
import { BUILTIN_SPOON_DEFAULTS, SPOON_UNITS, TBSP_ML, unitInfo } from "@/lib/units";
import type { AppUser, UserRole } from "@/types/user";

export const Route = createFileRoute("/_authenticated/admin/settings")({
	component: SettingsPage,
	staticData: { breadcrumb: "Settings" },
});

function SettingsPage() {
	const { profile } = useAuth();
	const actor: Actor = {
		uid: profile?.uid ?? "",
		name: profile?.fullName || profile?.email || "admin",
		role: profile?.role ?? "admin",
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<SettingsIcon className="h-7 w-7 text-app-brand" />
				<h1 className="text-2xl font-bold text-foreground">Settings</h1>
			</div>

			<AppTabs
				items={[
					{ key: "preferences", label: "Preferences", content: <PreferencesTab /> },
					{ key: "conversions", label: "Conversions", content: <ConversionsTab /> },
					{
						key: "users",
						label: "Users",
						content: (
							<UsersTab
								actor={actor}
								selfUid={profile?.uid ?? ""}
							/>
						),
					},
				]}
			/>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Shared: a labeled toggle row (correctly-rendered HeroUI switch)     */
/* ------------------------------------------------------------------ */

function ToggleRow({
	label,
	description,
	isSelected,
	onChange,
	isDisabled,
}: {
	label: string;
	description: string;
	isSelected: boolean;
	onChange: (next: boolean) => void;
	isDisabled?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-4 p-4">
			<div className="min-w-0">
				<p className="text-sm font-medium text-foreground">{label}</p>
				<p className="text-sm text-foreground/60">{description}</p>
			</div>
			<Switch
				aria-label={label}
				isDisabled={isDisabled}
				isSelected={isSelected}
				onChange={onChange}
			>
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
			</Switch>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Preferences tab                                                     */
/* ------------------------------------------------------------------ */

const configSchema = z.object({
	lowStockThreshold: z.number().int("Must be a whole number").nonnegative("Must be 0 or greater"),
	expiryAlertDays: z.number().int("Must be a whole number").nonnegative("Must be 0 or greater"),
	autoReorder: z.boolean(),
	weeklyReport: z.boolean(),
});

// The Preferences form owns only these keys; the conversion table is edited on
// its own tab, so it must not be part of this form's type.
type PreferencesConfig = z.infer<typeof configSchema>;

function PreferencesTab() {
	const { config, loading } = useSystemConfig();

	const { control, handleSubmit, formState } = useForm<PreferencesConfig>({
		resolver: zodResolver(configSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		values: config,
	});

	const save = handleSubmit(async (data) => {
		try {
			await saveSystemConfig(data);
			notify.success({ title: "Preferences saved", description: "Your changes have been applied." });
		} catch (e) {
			notify.danger({
				title: "Save failed",
				description: e instanceof Error ? e.message : "Could not save your changes. Please try again.",
			});
		}
	});

	return (
		<Surface
			className="rounded-2xl p-6"
			variant="secondary"
		>
			<form
				className="space-y-8"
				onSubmit={save}
			>
				<Section
					subtitle="Control when products are flagged for restocking or expiry."
					title="Thresholds"
				>
					<div className="space-y-4">
						<AppNumberField
							control={control}
							description="A product is flagged “low stock” when its quantity drops to this number or below, unless it has its own threshold."
							isRequired
							label="Low stock default threshold"
							minValue={0}
							name="lowStockThreshold"
							step={1}
						/>
						<AppNumberField
							control={control}
							description="Start warning about expiring stock this many days before its expiry date."
							isRequired
							label="Expiry alert window (days)"
							minValue={0}
							name="expiryAlertDays"
							step={1}
						/>
					</div>
				</Section>

				<Section
					subtitle="Let the system act and report on your behalf."
					title="Automation"
				>
					<div className="space-y-3">
						<AppSwitch
							control={control}
							description="Automatically draft a restock order when a product falls below its low-stock threshold."
							label="Auto-reorder"
							name="autoReorder"
						/>
						<AppSwitch
							control={control}
							description="Email a summary of inventory activity and forecasts to admins every Monday."
							label="Weekly report"
							name="weeklyReport"
						/>
					</div>
				</Section>

				<Button
					isDisabled={loading}
					isPending={formState.isSubmitting}
					type="submit"
					variant="primary"
				>
					Save preferences
				</Button>
			</form>
		</Surface>
	);
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
	return (
		<section className="space-y-3">
			<div>
				<h2 className="text-base font-semibold text-foreground">{title}</h2>
				<p className="text-sm text-foreground/60">{subtitle}</p>
			</div>
			{children}
		</section>
	);
}

/* ------------------------------------------------------------------ */
/* Conversions tab (global tbsp/tsp/cup -> grams table)                */
/* ------------------------------------------------------------------ */

// tsp and cup are fixed fractions of a tablespoon BY VOLUME, so their gram
// weights follow from the tablespoon figure - never entered independently.
const TSP_PER_TBSP = unitInfo("tsp").factor / TBSP_ML;
const CUP_PER_TBSP = unitInfo("cup").factor / TBSP_ML;

const round2 = (n: number): number => Math.round(n * 100) / 100;

function ConversionsTab() {
	const { config, loading } = useSystemConfig();
	const [rows, setRows] = useState<SpoonDefault[]>([]);
	const [search, setSearch] = useState("");
	const [saving, setSaving] = useState(false);

	// Reseed the editable draft whenever the saved table loads or changes.
	useEffect(() => {
		setRows(config.spoonDefaults ?? BUILTIN_SPOON_DEFAULTS);
	}, [config.spoonDefaults]);

	const update = (i: number, patch: Partial<SpoonDefault>) =>
		setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
	const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
	const add = () => {
		// Clear the filter so the new blank row (which matches nothing) is visible.
		setSearch("");
		setRows((rs) => [...rs, { name: "", gPerTbsp: 0 }]);
	};

	// Filter for display but keep each row's REAL index, so update/remove still
	// target the right row regardless of what the search hides.
	const q = search.trim().toLowerCase();
	const visible = rows.map((row, i) => ({ row, i })).filter(({ row }) => !q || row.name.toLowerCase().includes(q));

	const save = async () => {
		// Drop blank/invalid rows: a nameless row can't match a product and a
		// non-positive weight can't convert, so keeping them would only add noise.
		const cleaned = rows
			.map((r) => ({ name: r.name.trim(), gPerTbsp: Number(r.gPerTbsp) }))
			.filter((r) => r.name.length > 0 && Number.isFinite(r.gPerTbsp) && r.gPerTbsp > 0);
		setSaving(true);
		try {
			await saveSystemConfig({ ...config, spoonDefaults: cleaned });
			notify.success({
				title: "Conversions saved",
				description: "Recipes on web and mobile now use this table.",
			});
		} catch (e) {
			notify.danger({
				title: "Save failed",
				description: e instanceof Error ? e.message : "Could not save. Please try again.",
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<Surface
			className="rounded-2xl p-6"
			variant="secondary"
		>
			<div className="space-y-6">
				<div>
					<h2 className="text-base font-semibold text-foreground">Spoon measurements</h2>
					<p className="text-sm text-foreground/60">
						Weight of one level tablespoon per ingredient, used to convert tbsp / tsp / cup in recipes into
						stock. Matched on the product name; a product with its own tablespoon weight set overrides this.
						Teaspoon and cup are worked out from the tablespoon ({SPOON_UNITS.join(" / ")}).
					</p>
				</div>

				<div className="flex items-center justify-between gap-3">
					<AppSearchField
						className="w-full max-w-xs"
						onValueChange={setSearch}
						placeholder="Search ingredients…"
						value={search}
					/>
					<span className="shrink-0 text-xs text-foreground/40">
						{rows.length} ingredient{rows.length === 1 ? "" : "s"}
					</span>
				</div>

				<div className="space-y-2">
					{visible.length === 0 ? (
						<p className="rounded-xl border border-dashed border-foreground/15 px-4 py-10 text-center text-sm text-foreground/50">
							{rows.length === 0 ? "No ingredients yet — add one below." : `No ingredients match “${search}”.`}
						</p>
					) : (
						visible.map(({ row, i }) => {
							const g = Number(row.gPerTbsp) || 0;
							return (
								<div
									className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3"
									key={i}
								>
									<div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
										<Input
											aria-label="Ingredient name"
											className="min-w-0 flex-1"
											onChange={(e) => update(i, { name: (e.target as HTMLInputElement).value })}
											placeholder="e.g. sugar"
											value={row.name}
											variant="secondary"
										/>
										<div className="flex items-center gap-2">
											<Input
												aria-label="Grams per tablespoon"
												className="w-24"
												onChange={(e) => update(i, { gPerTbsp: Number((e.target as HTMLInputElement).value) })}
												type="number"
												value={String(row.gPerTbsp)}
												variant="secondary"
											/>
											<span className="whitespace-nowrap text-xs text-foreground/50">g / tbsp</span>
										</div>
										<Button
											aria-label="Remove ingredient"
											className="h-10 w-10 min-w-0 shrink-0 px-0"
											onPress={() => remove(i)}
											size="sm"
											variant="ghost"
										>
											<Trash2 className="h-4 w-4 text-danger" />
										</Button>
									</div>
									{g > 0 && (
										<p className="mt-2 border-t border-foreground/5 pt-2 text-xs text-foreground/40">
											1 tsp ≈ {round2(g * TSP_PER_TBSP)} g&nbsp;&nbsp;·&nbsp;&nbsp;1 cup ≈ {round2(g * CUP_PER_TBSP)} g
										</p>
									)}
								</div>
							);
						})
					)}
				</div>

				<Button
					onPress={add}
					size="sm"
					variant="tertiary"
				>
					<Plus className="mr-1 h-4 w-4" /> Add ingredient
				</Button>

				<div className="flex items-center gap-3 border-t border-foreground/10 pt-5">
					<Button
						isDisabled={loading}
						isPending={saving}
						onPress={save}
						variant="primary"
					>
						Save conversions
					</Button>
					<Button
						onPress={() => setRows(BUILTIN_SPOON_DEFAULTS)}
						variant="ghost"
					>
						Reset to defaults
					</Button>
				</div>
			</div>
		</Surface>
	);
}

/* ------------------------------------------------------------------ */
/* Users tab                                                           */
/* ------------------------------------------------------------------ */

const ROLE_STATUS_MAP = {
	admin: { label: "Admin", color: "accent" as const },
	staff: { label: "Staff", color: "default" as const },
};

function UsersTab({ actor, selfUid }: { actor: Actor; selfUid: string }) {
	const { users, loading } = useUsers();
	const rows = users.map((u) => ({ ...u, id: u.uid }));
	const { page, setPage, rowsPerPage, pageRows } = usePagination(rows);
	const [editing, setEditing] = useState<AppUser | null>(null);

	const columns = [
		{ key: "name", label: "Name", render: (u: AppUser) => <span className="font-semibold">{u.fullName || "-"}</span> },
		{ key: "email", label: "Email", render: (u: AppUser) => u.email },
		{
			key: "role",
			label: "Role",
			render: (u: AppUser) => (
				<AppChip
					color={ROLE_STATUS_MAP[u.role].color}
					label={ROLE_STATUS_MAP[u.role].label}
					size="sm"
					variant="soft"
				/>
			),
		},
		{
			key: "active",
			label: "Status",
			render: (u: AppUser) => (
				<AppChip
					color={u.isActive ? "success" : "danger"}
					label={u.isActive ? "Active" : "Inactive"}
					size="sm"
					variant="soft"
				/>
			),
		},
		{
			key: "manage",
			label: "",
			render: (u: AppUser) => (
				<Button
					onPress={() => setEditing(u)}
					size="sm"
					variant="ghost"
				>
					Manage
				</Button>
			),
		},
	];

	return (
		<div>
			<AppTable
				columns={columns}
				emptyContent="No users."
				isLoading={loading}
				rows={pageRows}
			/>
			<AppPagination
				onPageChange={setPage}
				page={page}
				rowsPerPage={rowsPerPage}
				total={rows.length}
			/>
			<ManageUserModal
				actor={actor}
				isSelf={editing?.uid === selfUid}
				onClose={() => setEditing(null)}
				user={editing}
			/>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Manage-user modal (role + status + access, saved together)         */
/* ------------------------------------------------------------------ */

function ManageUserModal({
	user,
	isSelf,
	actor,
	onClose,
}: {
	user: AppUser | null;
	isSelf: boolean;
	actor: Actor;
	onClose: () => void;
}) {
	const [role, setRole] = useState<UserRole>("staff");
	const [isActive, setIsActive] = useState(true);
	const [saving, setSaving] = useState(false);

	// Reset local draft whenever a different user is opened.
	useEffect(() => {
		if (!user) return;
		setRole(user.role);
		setIsActive(user.isActive);
	}, [user]);

	if (!user) return null;
	const name = user.fullName || user.email;

	const save = async () => {
		setSaving(true);
		try {
			if (role !== user.role) await updateUserRole(user.uid, role, actor);
			if (isActive !== user.isActive) await updateUserActive(user.uid, isActive, actor);
			notify.success({ title: "User updated", description: `Changes to ${name} have been saved.` });
			onClose();
		} catch (e) {
			notify.danger({
				title: "Save failed",
				description: e instanceof Error ? e.message : "Could not save the changes. Please try again.",
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<AppModal
			footer={
				<div className="flex justify-end gap-2">
					<Button
						isDisabled={saving}
						onPress={onClose}
						variant="tertiary"
					>
						Cancel
					</Button>
					<Button
						isDisabled={isSelf}
						isPending={saving}
						onPress={save}
						variant="primary"
					>
						Save changes
					</Button>
				</div>
			}
			isOpen={user !== null}
			onClose={onClose}
			size="lg"
			title={`Manage ${name}`}
		>
			<div className="space-y-5">
				<p className="text-sm text-foreground/60">{user.email}</p>

				{isSelf && (
					<div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-foreground/80">
						You can’t change your own role or status.
					</div>
				)}

				<div className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
					<ToggleRow
						description="Inactive users are signed out and can’t sign in until reactivated. Their data is kept."
						isDisabled={isSelf}
						isSelected={isActive}
						label="Active account"
						onChange={setIsActive}
					/>
					<ToggleRow
						description="Admins have full access to everything, including settings, users, and reports."
						isDisabled={isSelf}
						isSelected={role === "admin"}
						label="Administrator access"
						onChange={(next) => setRole(next ? "admin" : "staff")}
					/>
				</div>
			</div>
		</AppModal>
	);
}
