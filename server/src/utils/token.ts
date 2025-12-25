import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export function generateInviteToken(): string {
  // Generate a random 32-character token that's URL-safe
  const uuid = uuidv4().replace(/-/g, '');
  const random = crypto.randomBytes(16).toString('hex');
  return `${uuid}${random}`.substring(0, 48);
}

export function generateFileName(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}_${random}.${extension}`;
}
