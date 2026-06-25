import { create } from "zustand";
import { persist } from "zustand/middleware";

// Dark mode only - no light/auto. Theme is forced dark at the document root
// (see THEME_INIT_SCRIPT in __root.tsx). This store only tracks sidebar state.

interface UIState {
	isSidebarOpen: boolean;
	toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
	persist(
		(set) => ({
			isSidebarOpen: true,
			toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
		}),
		{
			name: "app-ui-storage",
		},
	),
);
