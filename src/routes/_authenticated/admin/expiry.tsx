import { createFileRoute } from "@tanstack/react-router";
import { ExpiryView } from "@/features/expiry/ExpiryView";

export const Route = createFileRoute("/_authenticated/admin/expiry")({
	component: () => <ExpiryView mode="admin" />,
	staticData: { breadcrumb: "Expiry Tracker" },
});
