import { useEffect, useState } from "react";

interface UsePaginationProps {
	meta?: {
		page: number;
		limit: number;
		totalPages: number;
	};
	initialPage?: number;
	initialLimit?: number;
}

export const usePagination = ({ meta, initialPage = 1, initialLimit = 10 }: UsePaginationProps) => {
	const [page, setPage] = useState(initialPage);
	const [limit, setLimit] = useState(initialLimit);

	// Sync with backend page if needed
	useEffect(() => {
		if (meta?.page && meta.page !== page) {
			setPage(meta.page);
		}
	}, [meta?.page]);

	const onChange = (newPage: number) => {
		if (!meta) {
			setPage(newPage);
			return;
		}

		const safePage = Math.max(1, Math.min(newPage, meta.totalPages));
		setPage(safePage);
	};

	return {
		page,
		limit,
		totalPages: meta?.totalPages ?? 1,
		onChange,
		setLimit,
		setPage,
	};
};
