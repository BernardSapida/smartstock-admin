import { Pagination } from "@heroui/react";

interface AppPaginationProps {
	page: number;
	total: number;
	onPageChange: (page: number) => void;
	rowsPerPage?: number;
	className?: string;
}

export function AppPagination({
	page,
	total,
	onPageChange,
	rowsPerPage = 10,
	className,
}: AppPaginationProps) {
	if (total === 0) return null;

	const totalPages = Math.ceil(total / rowsPerPage);
	const from = Math.min((page - 1) * rowsPerPage + 1, total);
	const to = Math.min(page * rowsPerPage, total);

	const getPageNumbers = (): (number | "ellipsis")[] => {
		const pages: (number | "ellipsis")[] = [1];

		if (page > 3) pages.push("ellipsis");

		const start = Math.max(2, page - 1);
		const end = Math.min(totalPages - 1, page + 1);
		for (let i = start; i <= end; i++) pages.push(i);

		if (page < totalPages - 2) pages.push("ellipsis");

		pages.push(totalPages);

		return pages;
	};

	return (
		<Pagination className={className ?? "w-full pt-4"}>
			<Pagination.Summary>
				Showing {from}-{to} of {total} results
			</Pagination.Summary>
			{totalPages > 1 && (
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.Previous
							isDisabled={page === 1}
							onPress={() => onPageChange(page - 1)}
						>
							<Pagination.PreviousIcon />
							<span>Previous</span>
						</Pagination.Previous>
					</Pagination.Item>
					{getPageNumbers().map((p, i) =>
						p === "ellipsis" ? (
							<Pagination.Item key={`ellipsis-${i}`}>
								<Pagination.Ellipsis />
							</Pagination.Item>
						) : (
							<Pagination.Item key={p}>
								<Pagination.Link
									isActive={p === page}
									onPress={() => onPageChange(p)}
								>
									{p}
								</Pagination.Link>
							</Pagination.Item>
						),
					)}
					<Pagination.Item>
						<Pagination.Next
							isDisabled={page === totalPages}
							onPress={() => onPageChange(page + 1)}
						>
							<span>Next</span>
							<Pagination.NextIcon />
						</Pagination.Next>
					</Pagination.Item>
				</Pagination.Content>
			)}
		</Pagination>
	);
}
