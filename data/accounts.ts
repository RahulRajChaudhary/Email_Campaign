import { dbConnect } from '@/lib/db/mongoose';
import { AccountModel } from '@/lib/model/Account';
import type { EmailAccount } from '@/types';

function toPlain(doc: any): EmailAccount {
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj._id;
  return obj as EmailAccount;
}

// Get all accounts
export async function getAccounts(): Promise<EmailAccount[]> {
  await dbConnect();
  const docs = await AccountModel.find().lean();
  return docs.map((d) => {
    const obj: any = { ...d };
    delete obj._id;
    return obj as EmailAccount;
  });
}

// Get account by ID
export async function getAccountById(id: string): Promise<EmailAccount | null> {
  await dbConnect();
  const doc = await AccountModel.findOne({ id }).lean();
  if (!doc) return null;
  const obj: any = { ...doc };
  delete obj._id;
  return obj as EmailAccount;
}

// Get default account
export async function getDefaultAccount(): Promise<EmailAccount | null> {
  await dbConnect();
  const accounts = await getAccounts();
  return accounts.find((a) => a.isDefault) || accounts[0] || null;
}

// Add new account
export async function addAccount(account: EmailAccount): Promise<EmailAccount> {
  await dbConnect();

  const count = await AccountModel.countDocuments();

  if (count === 0 || account.isDefault) {
    await AccountModel.updateMany({}, { $set: { isDefault: false } });
    account.isDefault = true;
  }

  const created = await AccountModel.create(account);
  return toPlain(created);
}

// Update account
export async function updateAccount(
  id: string,
  updates: Partial<EmailAccount>
): Promise<EmailAccount | null> {
  await dbConnect();

  if (updates.isDefault) {
    await AccountModel.updateMany({}, { $set: { isDefault: false } });
  }

  const updated = await AccountModel.findOneAndUpdate(
    { id },
    { $set: updates },
    { new: true }
  ).lean();

  if (!updated) return null;
  const obj: any = { ...updated };
  delete obj._id;
  return obj as EmailAccount;
}

// Delete account
export async function deleteAccount(id: string): Promise<boolean> {
  await dbConnect();

  const account = await AccountModel.findOne({ id }).lean();
  if (!account) return false;

  const wasDefault = (account as any).isDefault;
  await AccountModel.deleteOne({ id });

  if (wasDefault) {
    const remaining = await AccountModel.findOne().sort({ _id: 1 });
    if (remaining) {
      remaining.isDefault = true;
      await remaining.save();
    }
  }

  return true;
}

// Set default account
export async function setDefaultAccount(id: string): Promise<boolean> {
  await dbConnect();

  const account = await AccountModel.findOne({ id });
  if (!account) return false;

  await AccountModel.updateMany({}, { $set: { isDefault: false } });
  account.isDefault = true;
  await account.save();

  return true;
}
