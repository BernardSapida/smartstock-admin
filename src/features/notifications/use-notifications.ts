import { useEffect, useState } from "react";
import type { UserRole } from "@/types/user";
import { type AppNotification, watchNotifications } from "./notifications";

export function useNotifications(role: UserRole | undefined) {
	const [notifications, setNotifications] = useState<AppNotification[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!role) return;
		const unsub = watchNotifications(role, (n) => {
			setNotifications(n);
			setLoading(false);
		});
		return unsub;
	}, [role]);

	const unreadCount = notifications.filter((n) => !n.isRead).length;
	return { notifications, unreadCount, loading };
}
