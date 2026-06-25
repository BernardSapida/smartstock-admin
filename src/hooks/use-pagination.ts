import { useMemo, useState } from "react";

export const PAGE_SIZE_OPTIONS = [5, 10, 25] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export function usePagination<T>(items: T[], defaultSize: PageSize = 10) {
	const [page, setPage] = useState(1);
	const [rowsPerPage, setRowsPerPage_] = useState<PageSize>(defaultSize);

	function setRowsPerPage(n: PageSize) {
		setRowsPerPage_(n);
		setPage(1);
	}

	const pageRows = useMemo(
		() => items.slice((page - 1) * rowsPerPage, page * rowsPerPage),
		[items, page, rowsPerPage],
	);

	return { page, setPage, rowsPerPage, setRowsPerPage, pageRows };
}
