import { Autocomplete, EmptyState, ListBox, SearchField, useFilter } from "@heroui/react";
import { AppSearchField } from "@/components/form/AppSearchField";

interface TableFilterBarProps {
	search: string;
	onSearchChange: (value: string) => void;
	category: string;
	onCategoryChange: (value: string) => void;
	categories: string[];
	searchPlaceholder?: string;
	categoryPlaceholder?: string;
}

/**
 * Search + category filter row, matching the Inventory page style.
 * The search field is debounced; the category Autocomplete is itself searchable.
 */
export function TableFilterBar({
	search,
	onSearchChange,
	category,
	onCategoryChange,
	categories,
	searchPlaceholder = "Search...",
	categoryPlaceholder = "All categories",
}: TableFilterBarProps) {
	const { contains } = useFilter({ sensitivity: "base" });

	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
			<AppSearchField
				onValueChange={onSearchChange}
				placeholder={searchPlaceholder}
				value={search}
			/>
			<div className="lg:w-56">
				<Autocomplete
					onChange={(key) => onCategoryChange(key ? String(key) : "All")}
					placeholder={categoryPlaceholder}
					selectionMode="single"
					value={category === "All" ? null : category}
				>
					<Autocomplete.Trigger>
						<Autocomplete.Value />
						<Autocomplete.ClearButton />
						<Autocomplete.Indicator />
					</Autocomplete.Trigger>
					<Autocomplete.Popover>
						<Autocomplete.Filter filter={contains}>
							<SearchField
								autoFocus
								name="category-filter-search"
								variant="secondary"
							>
								<SearchField.Group>
									<SearchField.SearchIcon />
									<SearchField.Input placeholder="Search categories..." />
									<SearchField.ClearButton />
								</SearchField.Group>
							</SearchField>
							<ListBox renderEmptyState={() => <EmptyState>No results</EmptyState>}>
								{categories.map((c) => (
									<ListBox.Item
										id={c}
										key={c}
										textValue={c}
									>
										{c}
										<ListBox.ItemIndicator />
									</ListBox.Item>
								))}
							</ListBox>
						</Autocomplete.Filter>
					</Autocomplete.Popover>
				</Autocomplete>
			</div>
		</div>
	);
}
