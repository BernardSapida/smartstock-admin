import { Pagination } from "@heroui/react";

interface AppPaginationProps {
	page: number;
	total: number;
	onPageChange: (page: number) => void;
	rowsPerPage?: number;
	className?: string;
}

export function AppPagination({ page, total, onPageChange, rowsPerPage = 10, className }: AppPaginationProps) {
	const totalPages = Math.ceil(total / rowsPerPage);

	if (total <= rowsPerPage) return null;

	const from = (page - 1) * rowsPerPage + 1;
	const to = Math.min(page * rowsPerPage, total);

	const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

	return (
		<div className={className ?? "flex flex-col sm:flex-row items-center justify-between gap-3 pt-4"}>
			<span className="text-sm text-muted">
				Showing {from}–{to} of {total}
			</span>
			<Pagination className="justify-center">
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
					{pageNumbers.map((p) => (
						<Pagination.Item key={p}>
							<Pagination.Link
								isActive={p === page}
								onPress={() => onPageChange(p)}
							>
								{p}
							</Pagination.Link>
						</Pagination.Item>
					))}
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
			</Pagination>
		</div>
	);
}
