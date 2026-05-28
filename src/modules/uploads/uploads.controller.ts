import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { v2 as cloudinary } from 'cloudinary';

import { Readable } from 'stream';

interface UploadedMulterFile {
  buffer: Buffer;

  originalname: string;
}

interface CloudinaryUploadResult {
  secure_url: string;
}

interface CloudinarySearchResult {
  resources: {
    asset_id: string;

    public_id: string;

    secure_url: string;
  }[];
}

@Controller('uploads')
export class UploadsController {
  @Post('product-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(
    @UploadedFile()
    file: UploadedMulterFile,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const uploadedImage = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'tilime-products',
          },

          (error, result) => {
            if (error) {
              reject(new Error(error.message));

              return;
            }

            if (!result) {
              reject(new Error('Upload failed'));

              return;
            }

            resolve({
              secure_url: result.secure_url,
            });
          },
        );

        const readableStream = Readable.from(file.buffer);

        readableStream.pipe(uploadStream);
      },
    );

    return {
      imageUrl: uploadedImage.secure_url,
    };
  }

  @Get('product-images')
  async getProductImages() {
    const result = (await cloudinary.search
      .expression('folder:tilime-products')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute()) as CloudinarySearchResult;

    return result.resources;
  }
}
