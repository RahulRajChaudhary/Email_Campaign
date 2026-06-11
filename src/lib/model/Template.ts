import { Schema, model, models, Model } from 'mongoose';
import type { EmailTemplate } from '@/types';

const TemplateSchema = new Schema<EmailTemplate>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    bodyHtml: { type: String, required: true },
    bodyText: { type: String, default: '' },
    category: {
      type: String,
      enum: ['marketing', 'sales', 'followup', 'introduction', 'newsletter', 'custom'],
      required: true,
    },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false }
);

export const TemplateModel: Model<EmailTemplate> =
  models.Template || model<EmailTemplate>('Template', TemplateSchema);
