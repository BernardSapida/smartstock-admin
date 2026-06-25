import { Button, Surface } from "@heroui/react";
import type { Timestamp } from "firebase/firestore";
import { Bell, CheckCheck } from "lucide-react";
import { AppChip } from "@/components/ui/AppChip";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { markAllRead, markRead } from "./notifications";
import { useNotifications } from "./use-notifications";

type ChipColor = "default" | "accent" | "success" | "warning" | "danger";

function formatType(type: string): string {
	const spaced = type.replace(/_/g, " ");
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function colorForType(type: string): ChipColor {
	const t = type.toLowerCase();
	if (t.includes("out") && t.includes("stock")) return "danger";
	if (t.includes("expiry") || t.includes("expir")) return "danger";
	if (t.includes("low") && t.includes("stock")) return "warning";
	if (t.includes("inspection") || t.includes("alert")) return "warning";
	if (t.includes("recipe")) return "success";
	if (t.includes("task")) return "accent";
	return "default";
}

function fmt(ts: Timestamp | null): string {
	if (!ts) return "";
	try {
		return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	} catch {
		return "";
	}
}

export function NotificationsView() {
	const { profile } = useAuth();
	const { notifications, unreadCount, loading } = useNotifications(profile?.role);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Bell className="h-7 w-7 text-app-brand" />
					<div>
						<h1 className="text-2xl font-bold text-foreground">Notifications</h1>
						<p className="text-sm text-foreground/60">{unreadCount} unread</p>
					</div>
				</div>
				{unreadCount > 0 && (
					<Button
						onPress={() => markAllRead(notifications)}
						size="sm"
						variant="ghost"
					>
						<CheckCheck className="mr-1 h-4 w-4" />
						Mark all read
					</Button>
				)}
			</div>

			{loading ? (
				<p className="text-sm text-foreground/60">Loading…</p>
			) : notifications.length === 0 ? (
				<p className="text-sm text-foreground/60">You're all caught up.</p>
			) : (
				<div className="space-y-2">
					{notifications.map((n) => (
						<Surface
							className={`flex items-start justify-between gap-3 rounded-2xl p-4 ${n.isRead ? "opacity-70" : ""}`}
							key={n.id}
							variant="secondary"
						>
							<div className="flex-1">
								<div className="flex items-center gap-2">
									{!n.isRead && <span className="h-2 w-2 rounded-full bg-app-brand" />}
									<p className="font-semibold text-foreground">{n.title}</p>
									<AppChip
										color={colorForType(n.type)}
										label={formatType(n.type)}
										size="sm"
										variant="soft"
									/>
								</div>
								<p className="mt-1 text-sm text-foreground/70">{n.message}</p>
								<p className="mt-1 text-xs text-foreground/40">{fmt(n.timestamp)}</p>
							</div>
							{!n.isRead && (
								<Button
									onPress={() => markRead(n.id)}
									size="sm"
									variant="ghost"
								>
									Mark read
								</Button>
							)}
						</Surface>
					))}
				</div>
			)}
		</div>
	);
}
