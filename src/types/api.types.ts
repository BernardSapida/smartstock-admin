export type ApiResponse<T> = {
	data: T;
	message: string;
	statusCode: number;
	success: boolean;
	timestamp: string;
};

export type ApiError = {
	message: string;
	code: string;
	field?: string;
	statusCode: number;
};

export type PaginationMeta = {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

export type PaginationParams = {
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
};
