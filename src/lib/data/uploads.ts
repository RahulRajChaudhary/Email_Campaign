import { readJsonFile, writeJsonFile, FILES } from './index';
import type { Upload } from '@/types';

// Get all uploads
export async function getUploads(): Promise<Upload[]> {
  return readJsonFile<Upload[]>(FILES.UPLOADS, []);
}

// Get upload by ID
export async function getUploadById(id: string): Promise<Upload | null> {
  const uploads = await getUploads();
  return uploads.find((u) => u.id === id) || null;
}

// Add new upload
export async function addUpload(upload: Upload): Promise<Upload> {
  const uploads = await getUploads();
  uploads.push(upload);
  await writeJsonFile(FILES.UPLOADS, uploads);
  return upload;
}

// Update upload
export async function updateUpload(
  id: string,
  updates: Partial<Upload>
): Promise<Upload | null> {
  const uploads = await getUploads();
  const index = uploads.findIndex((u) => u.id === id);

  if (index === -1) {
    return null;
  }

  uploads[index] = { ...uploads[index], ...updates };
  await writeJsonFile(FILES.UPLOADS, uploads);
  return uploads[index];
}

// Delete upload
export async function deleteUpload(id: string): Promise<boolean> {
  const uploads = await getUploads();
  const index = uploads.findIndex((u) => u.id === id);

  if (index === -1) {
    return false;
  }

  uploads.splice(index, 1);
  await writeJsonFile(FILES.UPLOADS, uploads);
  return true;
}

// Mark upload as used
export async function markUploadUsed(id: string): Promise<void> {
  await updateUpload(id, { lastUsedAt: new Date().toISOString() });
}
