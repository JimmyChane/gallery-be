import { wrapWhite } from '@/util/console.text-wrapper';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync, lstatSync, ReadStream, WriteStream } from 'fs';
import { lstat, mkdir } from 'fs/promises';
import { createReadStream, createWriteStream, unlink } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'path';
import { cwd } from 'process';

@Injectable()
export class LocalFileService implements OnModuleInit {
  private readonly logger = new Logger(LocalFileService.name);

  private readonly PUBLIC_DIR = join(cwd(), '/temp/gallery-be/res');
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
    if (!fileTypes.length) return [];

    const entries = await readdir(this.PUBLIC_DIR, { withFileTypes: true });

    return entries
      .filter((entry) => {
        if (!entry.isFile()) return false;
        if (!fileTypes.some((ext) => entry.name.endsWith(ext))) return false;
        return true;
      })
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  }

  // TODO: test
  async getListPagable(
    fileTypes: string[],
    page = 0,
    limit = 10,
  ): Promise<{
    items: string[];
    meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  }> {
    const safePage = Math.max(0, Math.floor(page));
    const safeLimit = Math.max(1, Math.floor(limit));

    const allFiles = await this.getList(fileTypes);

    const total = allFiles.length;
    const totalPages = Math.ceil(total / safeLimit);
    const offset = safePage * safeLimit;
    const items = allFiles.slice(offset, offset + safeLimit);
    const hasNext = offset + safeLimit < total;
    const hasPrev = safePage > 0;

    return { items, meta: { total, page: safePage, limit: safeLimit, totalPages, hasNext, hasPrev } };
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
