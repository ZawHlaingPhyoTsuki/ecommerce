import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Post,
	UploadedFile,
	UploadedFiles,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CloudinaryService } from "../cloudinary/services/cloudinary.service";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";

@AllowAnonymous()
@ApiTags("Test - Cloudinary")
@Controller("test")
export class TestController {
	constructor(private readonly cloudinaryService: CloudinaryService) {}

	@Post("/cloudinary-upload-single")
	@ApiOperation({ summary: "Test single file upload to Cloudinary" })
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				file: {
					type: "string",
					format: "binary",
				},
				publicId: {
					type: "string",
					description: "Public ID for replacing existing image",
					example: "ecommerce/products/sample_image",
				},
			},
		},
	})
	@UseInterceptors(FileInterceptor("file"))
	async cloudinaryUploadSingle(
		@UploadedFile() file: Express.Multer.File,
		@Body("publicId") publicId: string,
	) {
		if (!file) {
			throw new BadRequestException("No file provided");
		}

		const result = await this.cloudinaryService.uploadSingle(file, "TESTING", {
			width: 800,
			height: 800,
			crop: "limit",
			publicId,
		});

		return {
			publicId: result.public_id,
			url: result.secure_url,
			width: result.width,
			height: result.height,
			format: result.format,
			bytes: result.bytes,
		};
	}

	@Post("/cloudinary-upload-many")
	@ApiOperation({ summary: "Test multiple files upload to Cloudinary" })
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				files: {
					type: "array",
					items: {
						type: "string",
						format: "binary",
					},
				},
			},
		},
	})
	@UseInterceptors(FilesInterceptor("files", 10))
	async cloudinaryUploadMany(@UploadedFiles() files: Express.Multer.File[]) {
		if (!files || files.length === 0) {
			throw new BadRequestException("No files provided");
		}

		const results = await this.cloudinaryService.uploadMany(files, "TESTING", {
			width: 800,
			height: 800,
			crop: "limit",
		});

		return results.map((result) => ({
			publicId: result.public_id,
			url: result.secure_url,
			width: result.width,
			height: result.height,
			format: result.format,
			bytes: result.bytes,
		}));
	}

	@Delete("/cloudinary-delete")
	@ApiOperation({ summary: "Test delete single image from Cloudinary" })
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				publicId: {
					type: "string",
					example: "ecommerce/products/sample_image",
				},
			},
		},
	})
	async cloudinaryDelete(@Body("publicId") publicId: string) {
		const result = await this.cloudinaryService.delete(publicId);

		if (result.result !== "ok") {
			throw new BadRequestException("Image not found");
		}

		return result;
	}

	@Delete("/cloudinary-delete-many")
	@ApiOperation({ summary: "Test delete multiple images from Cloudinary" })
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				publicIds: {
					type: "array",
					items: { type: "string" },
					example: ["ecommerce/products/image1", "ecommerce/products/image2"],
				},
			},
		},
	})
	async cloudinaryDeleteMany(@Body("publicIds") publicIds: string[]) {
		if (!publicIds || publicIds.length === 0) {
			throw new BadRequestException("No public IDs provided");
		}

		const result = await this.cloudinaryService.deleteMany(publicIds);

		// Check if any deletions failed
		const failedDeletions = Object.values(result.deleted).filter(
			(status: any) => status !== "deleted",
		);

		if (failedDeletions.length > 0) {
			throw new BadRequestException("Some images could not be deleted");
		}

		return result;
	}

	@Post("/cloudinary-remove-bg-upload")
	@ApiOperation({
		summary: "Test upload with background removal to Cloudinary",
	})
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				file: {
					type: "string",
					format: "binary",
				},
				publicId: {
					type: "string",
					description: "Public ID for replacing existing image",
					example: "ecommerce/products/sample_image",
				},
			},
		},
	})
	@UseInterceptors(FileInterceptor("file"))
	async cloudinaryRemoveBgUpload(
		@UploadedFile() file: Express.Multer.File,
		@Body("publicId") publicId: string,
	) {
		if (!file) {
			throw new BadRequestException("No file provided");
		}

		const result = await this.cloudinaryService.removeBgUpload(
			file,
			"TESTING",
			{
				width: 800,
				height: 800,
				crop: "limit",
				publicId,
			},
		);

		return {
			publicId: result.public_id,
			url: result.secure_url,
			width: result.width,
			height: result.height,
			format: result.format,
			bytes: result.bytes,
		};
	}
}
