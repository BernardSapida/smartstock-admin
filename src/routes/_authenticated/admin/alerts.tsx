import { createFileRoute } from "@tanstack/react-router";
import { AlertsView } from "@/features/alerts/AlertsView";

export const Route = createFileRoute("/_authenticated/admin/alerts")({
	component: AlertsView,
	staticData: { breadcrumb: "Alerts" },
});
