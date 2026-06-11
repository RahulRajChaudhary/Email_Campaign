import { readJsonFile, writeJsonFile, FILES } from './index';
import type { SendHistory, SendStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Get all history
export async function getHistory(): Promise<SendHistory[]> {
  return readJsonFile<SendHistory[]>(FILES.HISTORY, []);
}

// Get history with pagination and filters
export async function getHistoryFiltered(options: {
  page?: number;
  limit?: number;
  campaignId?: string;
  status?: SendStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<{
  items: SendHistory[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> {
  const {
    page = 1,
    limit = 20,
    campaignId,
    status,
    startDate,
    endDate,
    search,
  } = options;

  let history = await getHistory();

  // Sort by sentAt descending (newest first)
  history.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  // Apply filters
  if (campaignId) {
    history = history.filter((h) => h.campaignId === campaignId);
  }

  if (status) {
    history = history.filter((h) => h.status === status);
  }

  if (startDate) {
    const start = new Date(startDate);
    history = history.filter((h) => new Date(h.sentAt) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    history = history.filter((h) => new Date(h.sentAt) <= end);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    history = history.filter(
      (h) =>
        h.recipientEmail.toLowerCase().includes(searchLower) ||
        h.subject.toLowerCase().includes(searchLower) ||
        h.campaignName.toLowerCase().includes(searchLower) ||
        Object.values(h.recipientData).some((v) =>
          v.toLowerCase().includes(searchLower)
        )
    );
  }

  const total = history.length;
  const offset = (page - 1) * limit;
  const items = history.slice(offset, offset + limit);

  return {
    items,
    total,
    page,
    limit,
    hasMore: offset + items.length < total,
  };
}

// Get history by campaign ID
export async function getHistoryByCampaign(campaignId: string): Promise<SendHistory[]> {
  const history = await getHistory();
  return history
    .filter((h) => h.campaignId === campaignId)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

// Add history entry
export async function addHistoryEntry(
  entry: Omit<SendHistory, 'id'>
): Promise<SendHistory> {
  const history = await getHistory();

  const newEntry: SendHistory = {
    ...entry,
    id: uuidv4(),
  };

  history.push(newEntry);
  await writeJsonFile(FILES.HISTORY, history);
  return newEntry;
}

// Update history entry
export async function updateHistoryEntry(
  id: string,
  updates: Partial<Omit<SendHistory, 'id'>>
): Promise<SendHistory | null> {
  const history = await getHistory();
  const index = history.findIndex((h) => h.id === id);

  if (index === -1) {
    return null;
  }

  history[index] = { ...history[index], ...updates };
  await writeJsonFile(FILES.HISTORY, history);
  return history[index];
}

// Delete history entries by campaign
export async function deleteHistoryByCampaign(campaignId: string): Promise<number> {
  const history = await getHistory();
  const filtered = history.filter((h) => h.campaignId !== campaignId);
  const deletedCount = history.length - filtered.length;

  await writeJsonFile(FILES.HISTORY, filtered);
  return deletedCount;
}

// Get stats
export async function getHistoryStats(): Promise<{
  totalSent: number;
  totalFailed: number;
  successRate: number;
  todaySent: number;
  todayFailed: number;
}> {
  const history = await getHistory();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sent = history.filter((h) => h.status === 'sent');
  const failed = history.filter((h) => h.status === 'failed');

  const todaySent = sent.filter((h) => new Date(h.sentAt) >= today);
  const todayFailed = failed.filter((h) => new Date(h.sentAt) >= today);

  const total = sent.length + failed.length;
  const successRate = total > 0 ? (sent.length / total) * 100 : 0;

  return {
    totalSent: sent.length,
    totalFailed: failed.length,
    successRate: Math.round(successRate * 100) / 100,
    todaySent: todaySent.length,
    todayFailed: todayFailed.length,
  };
}
