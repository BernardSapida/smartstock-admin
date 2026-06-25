// App-wide settings persisted at system_config/app.

import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

export interface SystemConfig {
	lowStockThreshold: number; // global default (per-product minimumThreshold overrides)
	expiryAlertDays: number; // days-ahead window for expiry alerts
	autoReorder: boolean;
	weeklyReport: boolean;
}

export const DEFAULT_CONFIG: SystemConfig = {
	lowStockThreshold: 5,
	expiryAlertDays: 7,
	autoReorder: false,
	weeklyReport: false,
};

const REF = () => doc(db, "system_config", "app");

export function useSystemConfig() {
	const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		const unsub = onSnapshot(REF(), (snap) => {
			setConfig({ ...DEFAULT_CONFIG, ...(snap.exists() ? (snap.data() as Partial<SystemConfig>) : {}) });
			setLoading(false);
		});
		return unsub;
	}, []);
	return { config, loading };
}

export async function saveSystemConfig(config: SystemConfig): Promise<void> {
	await setDoc(REF(), { ...config, updatedAt: serverTimestamp() }, { merge: true });
}
