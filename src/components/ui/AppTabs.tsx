import { Tabs } from "@heroui/react";
import type { ReactNode } from "react";
import { useRef } from "react";

interface TabItem {
	key: string;
	label: string;
	content: ReactNode;
}

interface AppTabsProps {
	items: TabItem[];
	defaultSelectedKey?: string;
	selectedKey?: string;
	onSelectionChange?: (key: string) => void;
	disabledKeys?: string[];
	className?: string;
}

export function AppTabs({
	items,
	defaultSelectedKey,
	selectedKey,
	onSelectionChange,
	disabledKeys,
	className,
}: AppTabsProps) {
	const lastKeyRef = useRef<string | null>(null);

	return (
		<Tabs
			className={className}
			defaultSelectedKey={defaultSelectedKey ?? items[0]?.key}
			disabledKeys={disabledKeys}
			onSelectionChange={(key) => {
				const strKey = String(key);
				if (strKey === lastKeyRef.current) return;
				lastKeyRef.current = strKey;
				onSelectionChange?.(strKey);
			}}
			selectedKey={selectedKey}
		>
			<Tabs.ListContainer>
				<Tabs.List aria-label="Navigation tabs">
					{items.map((item) => (
						<Tabs.Tab
							id={item.key}
							key={item.key}
						>
							{item.label}
							<Tabs.Indicator />
						</Tabs.Tab>
					))}
				</Tabs.List>
			</Tabs.ListContainer>
			{items.map((item) => (
				<Tabs.Panel
					className="pt-4"
					id={item.key}
					key={item.key}
				>
					{item.content}
				</Tabs.Panel>
			))}
		</Tabs>
	);
}
