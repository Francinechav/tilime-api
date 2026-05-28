import { Module } from '@nestjs/common';

import { UploadsController } from './uploads.controller';

import { CloudinaryProvider } from '../../common/cloudinary/cloudinary.provider';

@Module({
  controllers: [UploadsController],

  providers: [CloudinaryProvider],
})
export class UploadsModule {}
