import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import { diskStorage } from 'multer';

const CDN_URL = process.env.CDN_URL || 'http://localhost:3007/static';

const ensureDirectoryExistence = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

@Controller()
export class UploadController {
  @Post('uploads')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        const isImage = file.mimetype.startsWith('image');

        if (isImage) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Only images are allowed.'), false);
        }
      },
      limits: {
        fileSize: 512 * 1024, // 512 KB
      },
      storage: diskStorage({
        destination: (req, file, cb) => {
          ensureDirectoryExistence('./uploads');
          cb(null, './uploads');
        },
        filename: function (req, file, cb) {
          const hrtime = process.hrtime();
          const prefix = `${hrtime[0] * 1e6}`;
          const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
          cb(null, `${prefix}_${sanitizedFilename}`);
        },
      }),
    }),
  )
  uploadFileNew(@UploadedFile() file: Express.Multer.File) {
    return this.handleUpload(file);
  }

  @Post('upload-file')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        const isImage = file.mimetype.startsWith('image');

        if (isImage) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Only images are allowed.'), false);
        }
      },
      limits: {
        fileSize: 512 * 1024, // 512 KB
      },
      storage: diskStorage({
        destination: (req, file, cb) => {
          ensureDirectoryExistence('./uploads');
          cb(null, './uploads');
        },
        filename: function (req, file, cb) {
          const hrtime = process.hrtime();
          const prefix = `${hrtime[0] * 1e6}`;
          const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
          cb(null, `${prefix}_${sanitizedFilename}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.handleUpload(file);
  }

  private handleUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileUploaded = {
      filename: file.originalname,
      url: `${CDN_URL}/${file.filename}`,
      ext: file.originalname.split('.').pop() || '',
      contentType: file.mimetype,
      size: file.size,
    };

    return { data: fileUploaded };
  }
}

