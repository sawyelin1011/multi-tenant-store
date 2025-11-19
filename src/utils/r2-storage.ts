import { R2Bucket } from '@cloudflare/workers-types';

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export class R2Storage {
  constructor(private bucket: R2Bucket) {}

  async upload(
    key: string,
    data: ArrayBuffer | ReadableStream,
    options?: UploadOptions
  ): Promise<R2.R2Object> {
    return this.bucket.put(key, data, {
      httpMetadata: {
        contentType: options?.contentType,
      },
      customMetadata: options?.metadata,
    });
  }

  async download(key: string): Promise<R2.R2ObjectBody | null> {
    return this.bucket.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    const objects = await Promise.all(keys.map(key => this.bucket.head(key)));
    await this.bucket.delete(objects.filter((o): o is R2.R2Object => !!o));
  }

  async list(options?: { prefix?: string; limit?: number }): Promise<R2.R2Objects> {
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
    data: ArrayBuffer | ReadableStream,
    contentType?: string
  ): Promise<string> {
    const key = `${tenantId}/assets/${filename}`;
    await this.upload(key, data, { contentType });
    return key;
  }

  async downloadAsset(tenantId: string, assetKey: string): Promise<R2.R2ObjectBody | null> {
    const key = `${tenantId}/assets/${assetKey}`;
    return this.download(key);
  }

  async deleteAsset(tenantId: string, assetKey: string): Promise<void> {
    const key = `${tenantId}/assets/${assetKey}`;
    await this.delete(key);
  }

  async listAssets(tenantId: string): Promise<R2.R2Objects> {
    return this.list({ prefix: `${tenantId}/assets/` });
  }
}
