import { ApiProperty } from "@nestjs/swagger";
import { SellerApplicationStatus } from "generated/prisma/client";
import { ApiResponseDto } from "src/common/dtos/api-response.dto";

/**
 * User DTO
 */
export class UserDto {
	@ApiProperty({ description: "User ID" })
	id: string;

	@ApiProperty({ description: "User name" })
	name: string;

	@ApiProperty({ description: "User email" })
	email: string;

	@ApiProperty({ description: "Whether email is verified" })
	emailVerified: boolean;

	@ApiProperty({
		description: "User profile image URL",
		nullable: true,
		type: String,
		example: "https://example.com/avatar.jpg",
	})
	image: string | null;

	@ApiProperty({
		description: "Whether the user is banned",
		nullable: true,
		type: Boolean,
		example: false,
	})
	banned: boolean | null;

	@ApiProperty({
		description: "Reason for the ban",
		nullable: true,
		type: String,
		example: null,
	})
	banReason: string | null;

	@ApiProperty({
		description: "When the ban expires",
		nullable: true,
		type: Date,
		example: null,
	})
	banExpires: Date | null;

	@ApiProperty({ enum: ["BUYER", "SELLER", "ADMIN"], example: "BUYER" })
	role: string;

	@ApiProperty({
		description: "Seller application status",
		enum: ["PENDING", "APPROVED", "REJECTED", "NONE"],
		example: "PENDING",
	})
	sellerApplicationStatus: SellerApplicationStatus;

	@ApiProperty({
		description: "Seller biography",
		nullable: true,
		type: String,
		example: "We sell high quality products.",
	})
	sellerBio: string | null;

	@ApiProperty({
		description: "Business name",
		nullable: true,
		type: String,
		example: "Acme Corp",
	})
	businessName: string | null;

	@ApiProperty({
		description: "Business phone number",
		nullable: true,
		type: String,
		example: "+1234567890",
	})
	phone: string | null;

	@ApiProperty({
		description: "Business address",
		nullable: true,
		type: String,
		example: "123 Market St",
	})
	address: string | null;

	@ApiProperty({
		description: "Date when seller was approved",
		nullable: true,
		type: Date,
		example: null,
	})
	sellerApprovedAt: Date | null;

	@ApiProperty({ description: "User created at" })
	createdAt: Date;

	@ApiProperty({ description: "User updated at" })
	updatedAt: Date;
}

/**
 * User response DTO for Swagger
 */
export class UserResponseDto extends ApiResponseDto<UserDto> {
	@ApiProperty({ example: 200 })
	declare statusCode: number;

	@ApiProperty({ example: "User retrieved successfully" })
	declare message: string;

	@ApiProperty({ type: UserDto })
	declare data: UserDto;
}

/**
 * Users list response DTO for Swagger
 */
export class UsersResponseDto extends ApiResponseDto<UserDto[]> {
	@ApiProperty({ example: 200 })
	declare statusCode: number;

	@ApiProperty({ example: "Users retrieved successfully" })
	declare message: string;

	@ApiProperty({ type: [UserDto] })
	declare data: UserDto[];
}
