import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UploadApiOptions, UploadApiResponse, v2 } from 'cloudinary';
import { CLOUDINARY_FOLDER } from 'src/common/constants/cloudinary-folder';

export type FolderType = keyof typeof CLOUDINARY_FOLDER;

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(@Inject('CLOUDINARY') private cloudinary: typeof v2) {
    this.logger.log('Cloudinary service initialized');
    this.logger.log(`Cloudinary instance: ${!!this.cloudinary}`);
    this.logger.log(`Uploader available: ${!!this.cloudinary?.uploader}`);
  }

  /**
   * Upload single file to Cloudinary
   * - If publicId provided: REPLACE existing image
   * - If no publicId: CREATE new image
   */
  async uploadSingle(
    file: Express.Multer.File,
    folder: FolderType = 'PRODUCTS',
    options?: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'fit' | 'crop' | 'limit';
      publicId?: string; // For replacing existing images
      removeBg?: boolean; // Background removal
    },
  ): Promise<UploadApiResponse> {
    this.validateFile(file);

    const publicId = options?.publicId
      ? this.extractPublicId(options.publicId)
      : undefined;

    return new Promise((resolve, reject) => {
      const uploadOptions: UploadApiOptions = {
        folder: CLOUDINARY_FOLDER[folder],
        public_id: publicId,
        transformation: [
          // Background removal if requested
          ...(options?.removeBg ? [{ effect: 'background_removal' }] : []),

          // Resize if dimensions provided
          ...(options?.width || options?.height
            ? [
                {
                  width: options.width,
                  height: options.height,
                  crop: options.crop || 'limit',
                },
              ]
            : []),

          // Always optimize
          { quality: 'auto', fetch_format: 'auto' },
        ],
      };

      const stream = this.cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            this.logger.error('Upload failed', error);
            return reject(new BadRequestException(error.message));
          }
          if (!result) return reject(new BadRequestException('Upload failed'));

          const action = options?.publicId ? 'Replaced' : 'Uploaded';
          this.logger.log(`${action}: ${result.public_id}`);
          resolve(result);
        },
      );

      stream.end(file.buffer);
    });
  }

  /**
   * Upload multiple files
   * Uses uploadSingle internally
   */
  async uploadMany(
    files: Express.Multer.File[],
    folder: FolderType = 'PRODUCTS',
    options?: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'fit' | 'crop' | 'limit';
      removeBg?: boolean;
    },
  ): Promise<UploadApiResponse[]> {
    if (!files?.length) throw new BadRequestException('No files provided');

    const results = await Promise.all(
      files.map((file) => this.uploadSingle(file, folder, options)),
    );

    this.logger.log(`Uploaded ${results.length} files`);
    return results;
  }

  /**
   * Delete single image by publicId
   */
  async delete(publicId: string) {
    if (!publicId) throw new BadRequestException('No public ID provided');

    try {
      const result = await this.cloudinary.uploader.destroy(publicId);
      this.logger.log(`Deleted: ${publicId}`);
      return result;
    } catch (error) {
      this.logger.error(`Delete failed: ${publicId}`, error);
      throw new BadRequestException('Failed to delete image');
    }
  }

  /**
   * Delete multiple images
   */
  async deleteMany(publicIds: string[]) {
    if (!publicIds?.length) {
      throw new BadRequestException('No public IDs provided');
    }

    try {
      const result = await this.cloudinary.api.delete_resources(publicIds);
      this.logger.log(`Deleted ${publicIds.length} images`);
      return result;
    } catch (error) {
      this.logger.error(`Delete failed for ${publicIds.length} images`, error);
      throw new BadRequestException('Failed to delete images');
    }
  }

  /**
   * Background removal upload (convenience method)
   */
  async removeBgUpload(
    file: Express.Multer.File,
    folder: FolderType = 'PRODUCTS',
    options?: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'fit' | 'crop' | 'limit';
      publicId?: string;
    },
  ): Promise<UploadApiResponse> {
    return this.uploadSingle(file, folder, {
      ...options,
      removeBg: true,
    });
  }

  /**
   * Generate signature for direct unsigned upload (frontend use)
   */
  generateUnsignedSignature(folder: FolderType = 'PRODUCTS') {
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      timestamp,
      folder: CLOUDINARY_FOLDER[folder],
      upload_preset: process.env.CLOUDINARY_UNSIGNED_PRESET!,
    };

    const signature = this.cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!,
    );

    this.logger.log(`Generated signature for ${folder}`);

    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      folder: CLOUDINARY_FOLDER[folder],
      uploadPreset: process.env.CLOUDINARY_UNSIGNED_PRESET!,
    };
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file?.buffer) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPEG, JPG, PNG, WEBP',
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
      );
    }
  }

  /**
   * Extract the public ID from a full public ID (e.g., 'folder/filename')
   */
  private extractPublicId(fullPublicId: string): string {
    if (!fullPublicId) return fullPublicId;

    // If it contains slashes, it's likely a full path - extract just the filename
    if (fullPublicId.includes('/')) {
      return fullPublicId.split('/').pop()!;
    }

    // If no slashes, it's already just the filename
    return fullPublicId;
  }
}
