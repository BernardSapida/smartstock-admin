import { Label, Tag, TagGroup } from "@heroui/react";
import type { ComponentProps } from "react";

type TagGroupSelectionMode = ComponentProps<typeof TagGroup>["selectionMode"];
type TagGroupSize = ComponentProps<typeof TagGroup>["size"];

interface TagItem {
	key: string;
	label: string;
}

interface AppTagGroupProps {
	items: TagItem[];
	label?: string;
	selectionMode?: TagGroupSelectionMode;
	selectedKeys?: Set<string> | string[];
	onSelectionChange?: (keys: Set<string>) => void;
	onRemove?: (key: string) => void;
	size?: TagGroupSize;
	className?: string;
}

export function AppTagGroup({
	items,
	label,
	selectionMode = "none",
	selectedKeys,
	onSelectionChange,
	onRemove,
	size,
	className,
}: AppTagGroupProps) {
	return (
		<TagGroup
			className={className}
			onRemove={
				onRemove
					? (keys) => {
							for (const k of keys) onRemove(k as string);
						}
					: undefined
			}
			onSelectionChange={onSelectionChange ? (keys) => onSelectionChange(keys as Set<string>) : undefined}
			selectedKeys={selectedKeys ? new Set(selectedKeys) : undefined}
			selectionMode={selectionMode}
			size={size}
		>
			{label && <Label>{label}</Label>}
			<TagGroup.List>
				{items.map((item) => (
					<Tag
						id={item.key}
						key={item.key}
					>
						{item.label}
						{onRemove && <Tag.RemoveButton />}
					</Tag>
				))}
			</TagGroup.List>
		</TagGroup>
	);
}
