import { Button, Surface, Switch } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { notify } from "@/components/feedback";
import { AppNumberField } from "@/components/form/AppNumberField";
import { AppSwitch } from "@/components/form/AppSwitch";
import { AppChip } from "@/components/ui/AppChip";
import { AppModal } from "@/components/ui/AppModal";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { AppTabs } from "@/components/ui/AppTabs";
import { useAuth } from "@/features/auth/context/AuthProvider";
import type { Actor } from "@/features/inventory/firebase/inventory.writes";
import { type SystemConfig, saveSystemConfig, useSystemConfig } from "@/features/settings/settings";
import {
	PERMISSION_KEYS,
	PERMISSION_META,
	updateUserActive,
	updateUserPermissions,
	updateUserRole,
	useUsers,
} from "@/features/users/users";
import { usePagination } from "@/hooks/use-pagination";
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

function PreferencesTab() {
	const { config, loading } = useSystemConfig();

	const { control, handleSubmit, formState } = useForm<SystemConfig>({
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
	const [perms, setPerms] = useState<Record<string, boolean>>({});
	const [saving, setSaving] = useState(false);

	// Reset local draft whenever a different user is opened.
	useEffect(() => {
		if (!user) return;
		setRole(user.role);
		setIsActive(user.isActive);
		setPerms(user.permissions ?? {});
	}, [user]);

	if (!user) return null;
	const name = user.fullName || user.email;

	const save = async () => {
		setSaving(true);
		try {
			if (role !== user.role) await updateUserRole(user.uid, role, actor);
			if (isActive !== user.isActive) await updateUserActive(user.uid, isActive, actor);
			// Permissions only apply to staff; admins always have full access.
			if (role === "staff" && JSON.stringify(perms) !== JSON.stringify(user.permissions ?? {})) {
				await updateUserPermissions(user.uid, perms, actor);
			}
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

				{role === "admin" ? (
					<div className="rounded-xl border border-foreground/10 bg-foreground/3 p-4">
						<p className="text-sm font-medium text-foreground">Full access</p>
						<p className="text-sm text-foreground/60">
							Admins can use every feature. Turn off “Administrator access” to limit this user to specific permissions.
						</p>
					</div>
				) : (
					<div>
						<h3 className="mb-2 text-sm font-semibold text-foreground">Access permissions</h3>
						<div className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
							{PERMISSION_KEYS.map((k) => (
								<ToggleRow
									description={PERMISSION_META[k].description}
									isSelected={Boolean(perms[k])}
									key={k}
									label={PERMISSION_META[k].label}
									onChange={(next) => setPerms((p) => ({ ...p, [k]: next }))}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</AppModal>
	);
}
