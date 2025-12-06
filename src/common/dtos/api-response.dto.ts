import { ApiProperty } from "@nestjs/swagger";
import { IPaginationMeta } from "../interfaces/api-response.interface";

/**
 * Pagination metadata
 */
export class PaginationMeta implements IPaginationMeta {
	@ApiProperty({ example: 42, description: "Total number of items" })
	total: number;

	@ApiProperty({ example: 1, description: "Current page number" })
	page: number;

	@ApiProperty({ example: 10, description: "Items per page" })
	limit: number;

	@ApiProperty({ example: 5, description: "Total number of pages" })
	totalPages: number;
}

/**
 * Base API response DTO (without pagination)
 */
export class ApiResponseDto<T = unknown> {
	@ApiProperty({ example: 200 })
	statusCode: number;

	@ApiProperty({ example: "Success message" })
	message: string;

	@ApiProperty({ required: false })
	data: T;

	constructor(statusCode: number, message: string, data: T) {
		this.statusCode = statusCode;
		this.message = message;
		this.data = data;
	}

	static success<T>(message: string, data: T): ApiResponseDto<T> {
		return new ApiResponseDto(200, message, data);
	}

	static deleted<T>(message: string, data: T): ApiResponseDto<T> {
		return new ApiResponseDto(200, message, data);
	}

	static created<T>(message: string, data: T): ApiResponseDto<T> {
		return new ApiResponseDto(201, message, data);
	}
}

/**
 * Paginated API response DTO (with pagination metadata)
 */
export class PaginatedResponseDto<T = unknown> extends ApiResponseDto<T> {
	@ApiProperty({ type: PaginationMeta })
	meta: PaginationMeta;

	constructor(
		statusCode: number,
		message: string,
		data: T,
		meta: PaginationMeta,
	) {
		super(statusCode, message, data);
		this.meta = meta;
	}

	static paginated<T>(
		message: string,
		data: T,
		meta: PaginationMeta,
	): PaginatedResponseDto<T> {
		return new PaginatedResponseDto(200, message, data, meta);
	}
}
