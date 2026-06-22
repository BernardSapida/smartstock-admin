import { Button } from "@heroui/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { useUIStore } from "@/store/ui.store";

export default function ThemeToggle() {
	const { themeMode, setThemeMode } = useUIStore();

	useEffect(() => {
		if (themeMode !== "auto") return;

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => {
			const prefersDark = media.matches;
			const resolved = prefersDark ? "dark" : "light";
			document.documentElement.classList.remove("light", "dark");
			document.documentElement.classList.add(resolved);
			document.documentElement.style.colorScheme = resolved;
		};

		media.addEventListener("change", handler);
		return () => media.removeEventListener("change", handler);
	}, [themeMode]);

	function toggleMode() {
		const modes: ("light" | "dark" | "auto")[] = ["light", "dark", "auto"];
		const currentIndex = modes.indexOf(themeMode);
		const nextMode = modes[(currentIndex + 1) % modes.length];
		setThemeMode(nextMode);
	}

	const label =
		themeMode === "auto"
			? "Theme mode: auto (system). Click to switch to light mode."
			: `Theme mode: ${themeMode}. Click to switch mode.`;

	const ThemeIcon = themeMode === "auto" ? Monitor : themeMode === "dark" ? Moon : Sun;

	return (
		<Button
			aria-label={label}
			className="rounded-full h-11 px-5 border-text-primary/10 hover:border-text-primary/20 bg-app-base/40 backdrop-blur-md text-text-primary transition-all hover:-translate-y-0.5"
			onPress={toggleMode}
			variant="outline"
		>
			<ThemeIcon className="h-4 w-4 mr-2" />
			<span className="font-bold text-sm">
				{themeMode === "auto" ? "Auto" : themeMode === "dark" ? "Dark" : "Light"}
			</span>
		</Button>
	);
}
