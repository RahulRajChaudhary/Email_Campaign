import { Schema, model, models, Model } from 'mongoose';
import type { SendHistory } from '@/types';

const HistorySchema = new Schema<SendHistory>(
  {
    id: { type: String, required: true, unique: true, index: true },
    campaignId: { type: String, required: true, index: true },
    campaignName: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    recipientData: { type: Schema.Types.Mixed, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed'], required: true },
    errorMessage: { type: String, default: null },
    sentAt: { type: String, required: true, index: true },
    gmailMessageId: { type: String, default: null },
  },
  { versionKey: false }
);

export const HistoryModel: Model<SendHistory> =
  models.History || model<SendHistory>('History', HistorySchema);
