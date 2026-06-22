import { Dropdown, Label } from "@heroui/react";
import type { ReactNode } from "react";

interface DropdownItem {
	key: string;
	label: string;
	color?: "default" | "danger";
	isDisabled?: boolean;
}

interface AppDropdownProps {
	items: DropdownItem[];
	onAction: (key: string) => void;
	trigger: ReactNode;
	disabledKeys?: string[];
	className?: string;
}

export function AppDropdown({ items, onAction, trigger, disabledKeys, className }: AppDropdownProps) {
	return (
		<Dropdown className={className}>
			{trigger}
			<Dropdown.Popover>
				<Dropdown.Menu
					disabledKeys={disabledKeys}
					onAction={(key) => onAction(String(key))}
				>
					{items.map((item) => (
						<Dropdown.Item
							id={item.key}
							isDisabled={item.isDisabled}
							key={item.key}
							textValue={item.label}
							variant={item.color === "danger" ? "danger" : undefined}
						>
							<Label>{item.label}</Label>
						</Dropdown.Item>
					))}
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}
