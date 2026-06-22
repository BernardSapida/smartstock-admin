export interface Column<T> {
	name: string;
	uid: keyof T | string;
	sortable?: boolean;
}

export interface SortDescriptor<T> {
	column: keyof T | string;
	direction: "ascending" | "descending";
}

export interface TableFilterConfig<T> {
	searchPlaceholder?: string;
	searchFields?: (keyof T)[];
	statusOptions?: Array<{ name: string; uid: string }>;
	enableStatusFilter?: boolean;
	enableColumnVisibility?: boolean;
}

export interface PaginationConfig {
	rowsPerPageOptions?: number[];
	defaultRowsPerPage?: number;
}
