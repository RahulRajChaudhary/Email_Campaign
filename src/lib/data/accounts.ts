import { readJsonFile, writeJsonFile, FILES } from './index';
import type { EmailAccount } from '@/types';

// Get all accounts
export async function getAccounts(): Promise<EmailAccount[]> {
  return readJsonFile<EmailAccount[]>(FILES.ACCOUNTS, []);
}

// Get account by ID
export async function getAccountById(id: string): Promise<EmailAccount | null> {
  const accounts = await getAccounts();
  return accounts.find((a) => a.id === id) || null;
}

// Get default account
export async function getDefaultAccount(): Promise<EmailAccount | null> {
  const accounts = await getAccounts();
  return accounts.find((a) => a.isDefault) || accounts[0] || null;
}

// Add new account
export async function addAccount(account: EmailAccount): Promise<EmailAccount> {
  const accounts = await getAccounts();

  // If this is the first account or marked as default, set it as default
  if (accounts.length === 0 || account.isDefault) {
    // Unset other defaults
    accounts.forEach((a) => (a.isDefault = false));
    account.isDefault = true;
  }

  accounts.push(account);
  await writeJsonFile(FILES.ACCOUNTS, accounts);
  return account;
}

// Update account
export async function updateAccount(
  id: string,
  updates: Partial<EmailAccount>
): Promise<EmailAccount | null> {
  const accounts = await getAccounts();
  const index = accounts.findIndex((a) => a.id === id);

  if (index === -1) {
    return null;
  }

  // If setting as default, unset others
  if (updates.isDefault) {
    accounts.forEach((a) => (a.isDefault = false));
  }

  accounts[index] = { ...accounts[index], ...updates };
  await writeJsonFile(FILES.ACCOUNTS, accounts);
  return accounts[index];
}

// Delete account
export async function deleteAccount(id: string): Promise<boolean> {
  const accounts = await getAccounts();
  const index = accounts.findIndex((a) => a.id === id);

  if (index === -1) {
    return false;
  }

  const wasDefault = accounts[index].isDefault;
  accounts.splice(index, 1);

  // If deleted account was default, set first remaining as default
  if (wasDefault && accounts.length > 0) {
    accounts[0].isDefault = true;
  }

  await writeJsonFile(FILES.ACCOUNTS, accounts);
  return true;
}

// Set default account
export async function setDefaultAccount(id: string): Promise<boolean> {
  const accounts = await getAccounts();
  const account = accounts.find((a) => a.id === id);

  if (!account) {
    return false;
  }

  accounts.forEach((a) => (a.isDefault = a.id === id));
  await writeJsonFile(FILES.ACCOUNTS, accounts);
  return true;
}
