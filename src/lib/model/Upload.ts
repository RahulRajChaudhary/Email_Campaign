import { Schema, model, models, Model } from 'mongoose';
import type { Upload } from '@/types';

const UploadSchema = new Schema<Upload>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    originalName: { type: String, required: true },
    columns: { type: [String], required: true },
    rowCount: { type: Number, required: true },
    data: { type: [{ type: Schema.Types.Mixed }], required: true },
    uploadedAt: { type: String, required: true },
    lastUsedAt: { type: String, default: null },
  },
  { versionKey: false }
);

export const UploadModel: Model<Upload> =
  models.Upload || model<Upload>('Upload', UploadSchema);
