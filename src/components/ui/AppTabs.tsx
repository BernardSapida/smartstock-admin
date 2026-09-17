import { ListBox, Select, Tabs } from "@heroui/react";
import type { ReactNode } from "react";
import { useState } from "react";

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
	const [internalKey, setInternalKey] = useState(defaultSelectedKey ?? items[0]?.key);
	const activeKey = selectedKey ?? internalKey;

	const handleChange = (key: string) => {
		if (key === activeKey) return;
		setInternalKey(key);
		onSelectionChange?.(key);
	};

	return (
		<Tabs
			className={className}
			disabledKeys={disabledKeys}
			onSelectionChange={(key) => handleChange(String(key))}
			selectedKey={activeKey}
		>
			{/* Tab bar - roomy enough for full labels from `sm` up */}
			<div className="hidden sm:block">
				<Tabs.ListContainer>
					<Tabs.List aria-label="Navigation tabs">
						{items.map((item) => (
							<Tabs.Tab
								id={item.key}
								isDisabled={disabledKeys?.includes(item.key)}
								key={item.key}
							>
								{item.label}
								<Tabs.Indicator />
							</Tabs.Tab>
						))}
					</Tabs.List>
				</Tabs.ListContainer>
			</div>

			{/* Mobile fallback - a tab bar can't fit several full labels below `sm`,
			    so switch to a dropdown instead of truncating/wrapping them. */}
			<div className="sm:hidden">
				<Select
					aria-label="Select section"
					onChange={(key) => key && handleChange(String(key))}
					selectionMode="single"
					value={activeKey}
					variant="secondary"
				>
					<Select.Trigger>
						<Select.Value />
						<Select.Indicator />
					</Select.Trigger>
					<Select.Popover>
						<ListBox>
							{items.map((item) => (
								<ListBox.Item
									id={item.key}
									isDisabled={disabledKeys?.includes(item.key)}
									key={item.key}
									textValue={item.label}
								>
									{item.label}
									<ListBox.ItemIndicator />
								</ListBox.Item>
							))}
						</ListBox>
					</Select.Popover>
				</Select>
			</div>

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
