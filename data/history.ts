import { v4 as uuidv4 } from 'uuid';
import { dbConnect } from '@/lib/db/mongoose';
import { HistoryModel } from '@/lib/model/History';
import type { SendHistory, SendStatus } from '@/types';

function clean(doc: any): SendHistory {
  const obj: any = { ...doc };
  delete obj._id;
  return obj as SendHistory;
}

// Get all history
export async function getHistory(): Promise<SendHistory[]> {
  await dbConnect();
  const docs = await HistoryModel.find().lean();
  return docs.map(clean);
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
  await dbConnect();

  const {
    page = 1,
    limit = 20,
    campaignId,
    status,
    startDate,
    endDate,
    search,
  } = options;

  const filter: Record<string, any> = {};

  if (campaignId) filter.campaignId = campaignId;
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.sentAt = {};
    if (startDate) filter.sentAt.$gte = new Date(startDate).toISOString();
    if (endDate) filter.sentAt.$lte = new Date(endDate).toISOString();
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { recipientEmail: regex },
      { subject: regex },
      { campaignName: regex },
    ];
    // Note: searching inside recipientData (a Mixed map) by value isn't
    // efficiently expressible in a Mongo query; fall back to in-memory
    // filtering for that specific case below.
  }

  let query = HistoryModel.find(filter).sort({ sentAt: -1 });

  if (search) {
    // Need to also check recipientData values; fetch all matching the
    // simple filter OR everything, then filter in memory for recipientData.
    const allDocs = await HistoryModel.find({
      ...(campaignId ? { campaignId } : {}),
      ...(status ? { status } : {}),
      ...(filter.sentAt ? { sentAt: filter.sentAt } : {}),
    })
      .sort({ sentAt: -1 })
      .lean();

    const searchLower = search.toLowerCase();
    const filtered = allDocs.filter((h: any) => {
      if (
        h.recipientEmail.toLowerCase().includes(searchLower) ||
        h.subject.toLowerCase().includes(searchLower) ||
        h.campaignName.toLowerCase().includes(searchLower)
      ) {
        return true;
      }
      return Object.values(h.recipientData || {}).some((v: any) =>
        String(v).toLowerCase().includes(searchLower)
      );
    });

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const items = filtered.slice(offset, offset + limit).map(clean);

    return {
      items,
      total,
      page,
      limit,
      hasMore: offset + items.length < total,
    };
  }

  const total = await HistoryModel.countDocuments(filter);
  const offset = (page - 1) * limit;
  const docs = await query.skip(offset).limit(limit).lean();
  const items = docs.map(clean);

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
  await dbConnect();
  const docs = await HistoryModel.find({ campaignId }).sort({ sentAt: -1 }).lean();
  return docs.map(clean);
}

// Add history entry
export async function addHistoryEntry(
  entry: Omit<SendHistory, 'id'>
): Promise<SendHistory> {
  await dbConnect();

  const newEntry: SendHistory = {
    ...entry,
    id: uuidv4(),
  };

  await HistoryModel.create(newEntry);
  return newEntry;
}

// Update history entry
export async function updateHistoryEntry(
  id: string,
  updates: Partial<Omit<SendHistory, 'id'>>
): Promise<SendHistory | null> {
  await dbConnect();

  const updated = await HistoryModel.findOneAndUpdate(
    { id },
    { $set: updates },
    { new: true }
  ).lean();

  return updated ? clean(updated) : null;
}

// Delete history entries by campaign
export async function deleteHistoryByCampaign(campaignId: string): Promise<number> {
  await dbConnect();
  const res = await HistoryModel.deleteMany({ campaignId });
  return res.deletedCount || 0;
}

// Get stats
export async function getHistoryStats(): Promise<{
  totalSent: number;
  totalFailed: number;
  successRate: number;
  todaySent: number;
  todayFailed: number;
}> {
  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [totalSent, totalFailed, todaySent, todayFailed] = await Promise.all([
    HistoryModel.countDocuments({ status: 'sent' }),
    HistoryModel.countDocuments({ status: 'failed' }),
    HistoryModel.countDocuments({ status: 'sent', sentAt: { $gte: todayIso } }),
    HistoryModel.countDocuments({ status: 'failed', sentAt: { $gte: todayIso } }),
  ]);

  const total = totalSent + totalFailed;
  const successRate = total > 0 ? (totalSent / total) * 100 : 0;

  return {
    totalSent,
    totalFailed,
    successRate: Math.round(successRate * 100) / 100,
    todaySent,
    todayFailed,
  };
}
