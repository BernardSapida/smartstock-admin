import { createFileRoute } from "@tanstack/react-router";
import { NotificationsView } from "@/features/notifications/NotificationsView";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
	component: NotificationsView,
	staticData: { breadcrumb: "Notifications" },
});
