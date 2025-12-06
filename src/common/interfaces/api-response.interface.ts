export interface IApiResponse<T> {
	statusCode: number;
	message: string;
	data?: T;
}

export interface IPaginationMeta {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
