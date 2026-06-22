import { Accordion } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface AccordionItem {
	key: string;
	title: string;
	content: ReactNode;
	subtitle?: string;
}

interface AppAccordionProps {
	items: AccordionItem[];
	selectionMode?: "single" | "multiple";
	defaultExpandedKeys?: string[];
	expandedKeys?: string[];
	onExpandedChange?: (keys: string[]) => void;
	className?: string;
}

export function AppAccordion({
	items,
	selectionMode = "single",
	defaultExpandedKeys,
	expandedKeys,
	onExpandedChange,
	className,
}: AppAccordionProps) {
	return (
		<Accordion
			allowsMultipleExpanded={selectionMode === "multiple"}
			className={className}
			defaultExpandedKeys={defaultExpandedKeys}
			expandedKeys={expandedKeys}
			onExpandedChange={(keys) => onExpandedChange?.(Array.from(keys as Set<string>))}
		>
			{items.map((item) => (
				<Accordion.Item
					id={item.key}
					key={item.key}
				>
					<Accordion.Heading>
						<Accordion.Trigger>
							<div className="flex flex-col text-left">
								<span>{item.title}</span>
								{item.subtitle && <span className="text-sm text-muted">{item.subtitle}</span>}
							</div>
							<Accordion.Indicator>
								<ChevronDown className="size-4" />
							</Accordion.Indicator>
						</Accordion.Trigger>
					</Accordion.Heading>
					<Accordion.Panel>
						<Accordion.Body>{item.content}</Accordion.Body>
					</Accordion.Panel>
				</Accordion.Item>
			))}
		</Accordion>
	);
}
