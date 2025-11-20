import { R2Bucket, R2Object, R2ObjectBody, R2Objects } from '@cloudflare/workers-types';

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export class R2Storage {
  constructor(private bucket: R2Bucket) {}

  async upload(
    key: string,
    data: ArrayBuffer | ReadableStream<any>,
    options?: UploadOptions
  ): Promise<R2Object> {
    return this.bucket.put(key, data as any, {
      httpMetadata: {
        contentType: options?.contentType,
      },
      customMetadata: options?.metadata,
    });
  }

  async download(key: string): Promise<R2ObjectBody | null> {
    return this.bucket.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    await this.bucket.delete(keys);
  }

  async list(options?: { prefix?: string; limit?: number }): Promise<R2Objects> {
    return this.bucket.list(options);
  }

  async exists(key: string): Promise<boolean> {
    const obj = await this.bucket.head(key);
    return !!obj;
  }

  getPublicUrl(key: string, domain?: string): string {
    if (domain) {
      return `https://${domain}/${key}`;
    }
    return `/r2/${key}`;
  }
}

export class AssetStore extends R2Storage {
  async uploadAsset(
    tenantId: string,
    filename: string,
    data: ArrayBuffer | ReadableStream<any>,
    contentType?: string
  ): Promise<string> {
    const key = `${tenantId}/assets/${filename}`;
    await this.upload(key, data, { contentType });
    return key;
  }

  async downloadAsset(tenantId: string, assetKey: string): Promise<R2ObjectBody | null> {
    const key = `${tenantId}/assets/${assetKey}`;
    return this.download(key);
  }

  async deleteAsset(tenantId: string, assetKey: string): Promise<void> {
    const key = `${tenantId}/assets/${assetKey}`;
    await this.delete(key);
  }

  async listAssets(tenantId: string): Promise<R2Objects> {
    return this.list({ prefix: `${tenantId}/assets/` });
  }
}
