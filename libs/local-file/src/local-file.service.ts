import { wrapWhite } from '@/util/console.text-wrapper';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync, lstatSync, ReadStream, WriteStream } from 'fs';
import { lstat, mkdir } from 'fs/promises';
import { createReadStream, createWriteStream, readdirSync, unlink } from 'node:fs';
import { join } from 'path';
import { cwd } from 'process';

@Injectable()
export class LocalFileService implements OnModuleInit {
  private readonly logger = new Logger(LocalFileService.name);

  private readonly PUBLIC_DIR = join(cwd(), '/temp/image_server/res');
  private readonly INIT_CREATE_FOLDER: boolean = false;

  private readonly INVALID_STARTS = ['.', '/', '\\'];
  private readonly INVALID_CHARS = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];

  async onModuleInit(): Promise<void> {
    const isExist = existsSync(this.PUBLIC_DIR);
    const stat = await lstat(this.PUBLIC_DIR).catch((e: Error) => e);
    if (stat instanceof Error) throw new Error('Failed to read stat of directory');

    const isDirectory = isExist && stat.isDirectory();
    if (isDirectory) {
      this.logger.log(`Directory: ${wrapWhite(this.PUBLIC_DIR)}`);
      return;
    }

    if (!this.INIT_CREATE_FOLDER) {
      throw new Error(`Directory Not Found: ${wrapWhite(this.PUBLIC_DIR)}`);
    }

    const mkdirError = await mkdir(this.PUBLIC_DIR, { recursive: false }).catch((e: Error) => e);
    if (mkdirError instanceof Error) throw new Error('Failed to create directory');

    this.logger.log(`Directory Created: ${wrapWhite(this.PUBLIC_DIR)}`);
  }

  async deleteOne(filename: string): Promise<string | null> {
    const validatedFilename = this.validateFilename(filename);
    const isFile = this.isFile(validatedFilename);
    if (!isFile) return null;

    const absolutePath = this.getAbsolutePathOfFilename(validatedFilename);
    return new Promise((resolve, reject) => {
      unlink(absolutePath, (error) => {
        if (error) reject(error);
        else resolve(validatedFilename);
      });
    });
  }

  async getList(fileTypes: string[]): Promise<string[]> {
    const filenames = readdirSync(this.PUBLIC_DIR);
    const supportedFilepaths = filenames.filter((filepath) => {
      for (const fileType of fileTypes) {
        if (filepath.endsWith(fileType)) return true;
      }

      return false;
    });
    return supportedFilepaths.filter((filepath) => {
      const filePath = this.getAbsolutePathOfFilename(filepath);
      return existsSync(filePath) && lstatSync(filePath).isFile();
    });
  }

  async readStreamFilename(filename: string): Promise<ReadStream> {
    const validatedFilename = this.validateFilename(filename);

    const isFile = this.isFile(validatedFilename);
    if (!isFile) throw new Error('no such file');

    const absolutePath = this.getAbsolutePathOfFilename(validatedFilename);
    return createReadStream(absolutePath);
  }

  async writeStreamFilename(filename: string): Promise<WriteStream> {
    const validatedFilename = this.validateFilename(filename);

    const isFile = this.isFile(validatedFilename);
    if (isFile) throw new Error('file already exist');

    const absolutePath = this.getAbsolutePathOfFilename(validatedFilename);
    return createWriteStream(absolutePath);
  }

  isFile(filename: string): boolean {
    const filePath = this.getAbsolutePathOfFilename(filename);
    return existsSync(filePath) && lstatSync(filePath).isFile();
  }

  getAbsolutePathOfFilename(filename: string): string {
    return join(this.PUBLIC_DIR, filename);
  }

  private filenameStartsWiths(filename: string, ...characters: string[]): string {
    for (const character of characters) {
      if (filename.startsWith(character)) return character;
    }
    return '';
  }

  private filenameIncludes(filename: string, ...characters: string[]): string {
    for (const character of characters) {
      if (filename.includes(character)) return character;
    }
    return '';
  }

  validateFilename(filename: string): string {
    const invalidStart = this.filenameStartsWiths(filename, ...this.INVALID_STARTS);
    if (invalidStart) {
      throw new Error(`invalid filename format, ${filename}, ${invalidStart}`);
    }

    const invalidChar = this.filenameIncludes(filename, ...this.INVALID_CHARS);
    if (invalidChar) {
      throw new Error(`invalid filename character, ${filename}, ${invalidChar}`);
    }

    return filename;
  }
}
