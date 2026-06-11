import { Schema, model, models, Model } from 'mongoose';
import type { EmailAccount } from '@/types';

const AccountSchema = new Schema<EmailAccount>(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    name: { type: String, default: null },
    picture: { type: String, default: null },
    accessTokenEncrypted: { type: String, required: true },
    refreshTokenEncrypted: { type: String, required: true },
    tokenExpiresAt: { type: String, required: true },
    connectedAt: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { versionKey: false }
);

export const AccountModel: Model<EmailAccount> =
  models.Account || model<EmailAccount>('Account', AccountSchema);
