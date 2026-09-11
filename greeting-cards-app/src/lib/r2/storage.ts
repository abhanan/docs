import 'server-only';
import { randomUUID } from 'crypto';
import {
  DeleteObjectsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, getR2Bucket } from './client';
import { publicEnv } from '@/lib/env';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export interface PresignResult {
  uploadUrl: string; // PUT here with the raw file bytes
  key: string; // object key stored in R2
  publicUrl: string; // GET url saved into contributors.photo_url
}

/**
 * Create a presigned PUT URL so the browser uploads the photo bytes DIRECTLY to
 * R2 — the file never passes through our server or the database. Returns the key
 * and the public URL to persist alongside the contribution.
 */
export async function presignUpload(params: {
  cardId: string;
  contentType: string;
}): Promise<PresignResult> {
  const { cardId, contentType } = params;
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }
  const ext = EXT[contentType];
  const key = `cards/${cardId}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 60 * 5 });

  return {
    uploadUrl,
    key,
    publicUrl: `${publicEnv.r2PublicBaseUrl}/${key}`,
  };
}

export function isAllowedImageType(contentType: string): boolean {
  return ALLOWED_TYPES.has(contentType);
}

/**
 * Delete a batch of R2 objects by key. Used by the expiry job and by creator
 * moderation (deleting a contribution's photo). Chunks into groups of 1000
 * (S3 DeleteObjects limit).
 */
export async function deleteR2Objects(keys: string[]): Promise<void> {
  const filtered = keys.filter(Boolean);
  if (filtered.length === 0) return;
  const client = getR2Client();
  const bucket = getR2Bucket();
  for (let i = 0; i < filtered.length; i += 1000) {
    const chunk = filtered.slice(i, i + 1000);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}
