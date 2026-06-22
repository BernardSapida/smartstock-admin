import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark" | "auto";

interface UIState {
	themeMode: ThemeMode;
	setThemeMode: (mode: ThemeMode) => void;
	isSidebarOpen: boolean;
	toggleSidebar: () => void;
}

const applyThemeMode = (mode: ThemeMode) => {
	if (typeof window === "undefined") return;

	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;

	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(resolved);
	document.documentElement.setAttribute("data-theme", mode);
	document.documentElement.style.colorScheme = resolved;
};

export const useUIStore = create<UIState>()(
	persist(
		(set) => ({
			themeMode: "auto",
			setThemeMode: (mode) => {
				set({ themeMode: mode });
				applyThemeMode(mode);
			},
			isSidebarOpen: true,
			toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
		}),
		{
			name: "app-ui-storage",
			onRehydrateStorage: () => (state) => {
				if (state) {
					applyThemeMode(state.themeMode);
				}
			},
		},
	),
);
