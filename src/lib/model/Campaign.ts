import { Schema, model, models, Model } from 'mongoose';
import type { Campaign } from '@/types';

const CampaignSchema = new Schema<Campaign>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    templateId: { type: String, required: true },
    uploadId: { type: String, required: true },
    emailAccountId: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'paused', 'completed', 'failed'],
      required: true,
    },
    totalRecipients: { type: Number, required: true },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    currentIndex: { type: Number, default: 0 },
    intervalMinutes: { type: Number, required: true },
    nextSendAt: { type: String, default: null },
    startedAt: { type: String, default: null },
    pausedAt: { type: String, default: null },
    completedAt: { type: String, default: null },
    createdAt: { type: String, required: true },
  },
  { versionKey: false }
);

export const CampaignModel: Model<Campaign> =
  models.Campaign || model<Campaign>('Campaign', CampaignSchema);
