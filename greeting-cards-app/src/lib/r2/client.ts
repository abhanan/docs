import 'server-only';
import { S3Client } from '@aws-sdk/client-s3';
import { requireServerEnv } from '@/lib/env';

let cached: S3Client | null = null;

/**
 * S3 client pointed at Cloudflare R2. R2 is S3-compatible, so the AWS SDK talks
 * to it directly. Region is fixed to 'auto' per R2's convention.
 */
export function getR2Client(): S3Client {
  if (cached) return cached;
  const env = requireServerEnv();
  cached = new S3Client({
    region: 'auto',
    endpoint: env.r2Endpoint,
    credentials: {
      accessKeyId: env.r2AccessKeyId,
      secretAccessKey: env.r2SecretAccessKey,
    },
  });
  return cached;
}

export function getR2Bucket(): string {
  return requireServerEnv().r2Bucket;
}
