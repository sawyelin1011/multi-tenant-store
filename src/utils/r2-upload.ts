import { R2Bucket, R2Object } from '../db/d1.js';

export class R2Storage {
  constructor(private bucket: R2Bucket) {}

  async upload(key: string, data: ArrayBuffer | ReadableStream, metadata?: Record<string, string>): Promise<R2Object> {
    try {
      const result = await this.bucket.put(key, data, {
        customMetadata: metadata,
      });
      console.log(`✓ Uploaded file to R2: ${key}`);
      return result;
    } catch (error: any) {
      console.error('R2 upload error:', { key, error: error.message });
      throw error;
    }
  }

  async download(key: string): Promise<R2Object | null> {
    try {
      const object = await this.bucket.get(key);
      if (!object) {
        console.warn(`File not found in R2: ${key}`);
        return null;
      }
      return object;
    } catch (error: any) {
      console.error('R2 download error:', { key, error: error.message });
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.bucket.delete(key);
      console.log(`✓ Deleted file from R2: ${key}`);
    } catch (error: any) {
      console.error('R2 delete error:', { key, error: error.message });
      throw error;
    }
  }

  async list(prefix?: string, limit?: number): Promise<R2Object[]> {
    try {
      const result = await this.bucket.list({ prefix, limit });
      return result.objects || [];
    } catch (error: any) {
      console.error('R2 list error:', { prefix, error: error.message });
      return [];
    }
  }

  async deletePrefix(prefix: string): Promise<number> {
    try {
      let deleted = 0;
      let cursor: string | undefined;
      let truncated = true;

      while (truncated) {
        const result = await this.bucket.list({ prefix, limit: 1000, cursor });
        for (const obj of result.objects || []) {
          await this.bucket.delete(obj.key);
          deleted++;
        }
        truncated = result.truncated;
        cursor = result.cursor;
      }

      console.log(`✓ Deleted ${deleted} files from R2 with prefix: ${prefix}`);
      return deleted;
    } catch (error: any) {
      console.error('R2 deletePrefix error:', { prefix, error: error.message });
      return 0;
    }
  }

  getPublicUrl(key: string, customDomain?: string): string {
    const domain = customDomain || 'r2.mtc.io';
    return `https://${domain}/${key}`;
  }

  async copyObject(sourceKey: string, destKey: string): Promise<R2Object | null> {
    try {
      const source = await this.bucket.get(sourceKey);
      if (!source) {
        console.warn(`Source file not found in R2: ${sourceKey}`);
        return null;
      }

      const result = await this.bucket.put(destKey, source as any, {
        customMetadata: source.customMetadata,
      });

      console.log(`✓ Copied file in R2: ${sourceKey} -> ${destKey}`);
      return result;
    } catch (error: any) {
      console.error('R2 copy error:', { sourceKey, destKey, error: error.message });
      return null;
    }
  }

  async moveObject(sourceKey: string, destKey: string): Promise<boolean> {
    try {
      const copied = await this.copyObject(sourceKey, destKey);
      if (!copied) {
        return false;
      }

      await this.delete(sourceKey);
      console.log(`✓ Moved file in R2: ${sourceKey} -> ${destKey}`);
      return true;
    } catch (error: any) {
      console.error('R2 move error:', { sourceKey, destKey, error: error.message });
      return false;
    }
  }

  getSize(size: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let sizeValue = size;

    while (sizeValue >= 1024 && unitIndex < units.length - 1) {
      sizeValue /= 1024;
      unitIndex++;
    }

    return `${sizeValue.toFixed(2)} ${units[unitIndex]}`;
  }
}
