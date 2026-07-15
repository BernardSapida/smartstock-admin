// App-wide settings persisted at system_config/app.

import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { BUILTIN_SPOON_DEFAULTS, setSpoonDefaults, type SpoonDefault } from "@/lib/units";
export type { SpoonDefault };

export interface SystemConfig {
	lowStockThreshold: number; // global default (per-product minimumThreshold overrides)
	expiryAlertDays: number; // days-ahead window for expiry alerts
	autoReorder: boolean;
	weeklyReport: boolean;
	// Global tbsp/tsp/cup conversion table (ingredient name -> g per tablespoon).
	// A product's own density overrides this; read by BOTH web and mobile.
	spoonDefaults: SpoonDefault[];
}

export const DEFAULT_CONFIG: SystemConfig = {
	lowStockThreshold: 5,
	expiryAlertDays: 7,
	autoReorder: false,
	weeklyReport: false,
	spoonDefaults: BUILTIN_SPOON_DEFAULTS,
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

// Partial + merge: callers save only the slice they own (preferences OR the
// conversion table), and the other keys in system_config/app are left intact.
export async function saveSystemConfig(config: Partial<SystemConfig>): Promise<void> {
	await setDoc(REF(), { ...config, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Subscribe to the global spoon-conversion table and push it into the units
 * module so every synchronous resolveDensity() call reflects it. Mount ONCE,
 * app-wide (not just on the settings page), because recipe math runs on the
 * inventory, recipes and production screens too.
 */
export function useSyncSpoonDefaults(): void {
	useEffect(() => {
		const unsub = onSnapshot(REF(), (snap) => {
			const data = snap.exists() ? (snap.data() as Partial<SystemConfig>) : {};
			setSpoonDefaults(data.spoonDefaults ?? null);
		});
		return unsub;
	}, []);
}
