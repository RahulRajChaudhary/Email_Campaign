import { dbConnect } from '@/lib/db/mongoose';
import { UploadModel } from '@/lib/model/Upload';
import type { Upload } from '@/types';

function clean(doc: any): Upload {
  const obj: any = { ...doc };
  delete obj._id;
  return obj as Upload;
}

// Get all uploads
export async function getUploads(): Promise<Upload[]> {
  await dbConnect();
  const docs = await UploadModel.find().lean();
  return docs.map(clean);
}

// Get upload by ID
export async function getUploadById(id: string): Promise<Upload | null> {
  await dbConnect();
  const doc = await UploadModel.findOne({ id }).lean();
  return doc ? clean(doc) : null;
}

// Add new upload
export async function addUpload(upload: Upload): Promise<Upload> {
  await dbConnect();
  await UploadModel.create(upload);
  return upload;
}

// Update upload
export async function updateUpload(
  id: string,
  updates: Partial<Upload>
): Promise<Upload | null> {
  await dbConnect();

  const updated = await UploadModel.findOneAndUpdate(
    { id },
    { $set: updates },
    { new: true }
  ).lean();

  return updated ? clean(updated) : null;
}

// Delete upload
export async function deleteUpload(id: string): Promise<boolean> {
  await dbConnect();

  const res = await UploadModel.deleteOne({ id });
  return res.deletedCount === 1;
}

// Mark upload as used
export async function markUploadUsed(id: string): Promise<void> {
  await updateUpload(id, { lastUsedAt: new Date().toISOString() });
}
