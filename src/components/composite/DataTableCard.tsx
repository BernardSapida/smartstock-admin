import type { ReactNode } from "react";
import { useState } from "react";
import { AppSearchField } from "@/components/form/AppSearchField";
import { AppPagination } from "@/components/ui/AppPagination";
import { AppTable } from "@/components/ui/AppTable";
import { useDebounce } from "@/hooks/use-debounce";

interface ColumnDef<T> {
	key: string;
	label: string;
	render?: (row: T) => ReactNode;
}

interface DataTableCardProps<T extends { id: string | number }> {
	columns: ColumnDef<T>[];
	queryFn: (params: { page: number; search: string }) => Promise<{ rows: T[]; total: number }>;
	title?: string;
	actions?: ReactNode;
	onRowAction?: (id: string | number) => void;
}

export function DataTableCard<T extends { id: string | number }>({
	columns,
	queryFn,
	title,
	actions,
	onRowAction,
}: DataTableCardProps<T>) {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [rows, setRows] = useState<T[]>([]);
	const [total, setTotal] = useState(0);

	const debouncedSearch = useDebounce(search, 300);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	// Trigger fetch when page or debouncedSearch changes
	const [prevParams, setPrevParams] = useState({ page: 0, search: "" });
	const params = { page, search: debouncedSearch };

	if (params.page !== prevParams.page || params.search !== prevParams.search) {
		setPrevParams(params);
		setIsLoading(true);
		queryFn(params).then(({ rows: newRows, total: newTotal }) => {
			setRows(newRows);
			setTotal(newTotal);
			setIsLoading(false);
		});
	}

	return (
		<div className="flex flex-col gap-4">
			{(title || actions) && (
				<div className="flex items-center justify-between">
					{title && <h3 className="text-lg font-semibold">{title}</h3>}
					{actions && <div className="flex items-center gap-2">{actions}</div>}
				</div>
			)}
			<AppSearchField
				onValueChange={handleSearchChange}
				placeholder="Search..."
				value={search}
			/>
			<div>
				<AppTable
					columns={columns}
					isLoading={isLoading}
					onRowAction={onRowAction}
					rows={rows}
				/>
				<AppPagination
					onPageChange={setPage}
					page={page}
					total={total}
				/>
			</div>
		</div>
	);
}
