import { useMemo, useState } from "react";

/**
 * Shared search + category filtering for admin tables, mirroring the Inventory page.
 * `getName` feeds the text search; `getCategory` feeds the category dropdown.
 */
export function useTableFilter<T>(items: T[], getName: (item: T) => string, getCategory: (item: T) => string) {
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("All");

	const categories = useMemo(
		() => Array.from(new Set(items.map(getCategory).filter(Boolean))).sort(),
		[items, getCategory],
	);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return items
			.filter((item) => (category === "All" ? true : getCategory(item) === category))
			.filter((item) => (q ? getName(item).toLowerCase().includes(q) : true));
	}, [items, search, category, getName, getCategory]);

	return { search, setSearch, category, setCategory, categories, filtered };
}
