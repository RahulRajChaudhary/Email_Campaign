import { v4 as uuidv4 } from 'uuid';
import { dbConnect } from '@/lib/db/mongoose';
import { CampaignModel } from '@/lib/model/Campaign';
import type { Campaign, CampaignStatus } from '@/types';

function clean(doc: any): Campaign {
  const obj: any = { ...doc };
  delete obj._id;
  return obj as Campaign;
}

// Get all campaigns
export async function getCampaigns(): Promise<Campaign[]> {
  await dbConnect();
  const docs = await CampaignModel.find().lean();
  return docs.map(clean);
}

// Get campaign by ID
export async function getCampaignById(id: string): Promise<Campaign | null> {
  await dbConnect();
  const doc = await CampaignModel.findOne({ id }).lean();
  return doc ? clean(doc) : null;
}

// Get campaigns by status
export async function getCampaignsByStatus(status: CampaignStatus): Promise<Campaign[]> {
  await dbConnect();
  const docs = await CampaignModel.find({ status }).lean();
  return docs.map(clean);
}

// Get running campaigns
export async function getRunningCampaigns(): Promise<Campaign[]> {
  return getCampaignsByStatus('running');
}

// Add new campaign
export async function addCampaign(
  campaign: Omit<Campaign, 'id' | 'createdAt'>
): Promise<Campaign> {
  await dbConnect();

  const newCampaign: Campaign = {
    ...campaign,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  await CampaignModel.create(newCampaign);
  return newCampaign;
}

// Update campaign
export async function updateCampaign(
  id: string,
  updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>
): Promise<Campaign | null> {
  await dbConnect();

  const updated = await CampaignModel.findOneAndUpdate(
    { id },
    { $set: updates },
    { new: true }
  ).lean();

  return updated ? clean(updated) : null;
}

// Delete campaign
export async function deleteCampaign(id: string): Promise<boolean> {
  await dbConnect();

  const campaign = await CampaignModel.findOne({ id }).lean();

  if (!campaign) {
    return false;
  }

  if ((campaign as any).status === 'running') {
    return false;
  }

  await CampaignModel.deleteOne({ id });
  return true;
}

// Start campaign
export async function startCampaign(id: string): Promise<Campaign | null> {
  const campaign = await getCampaignById(id);

  if (!campaign || (campaign.status !== 'pending' && campaign.status !== 'paused')) {
    return null;
  }

  const intervalMinutes = parseInt(process.env.EMAIL_SEND_INTERVAL_MINUTES || '5', 10);

  return updateCampaign(id, {
    status: 'running',
    startedAt: campaign.startedAt || new Date().toISOString(),
    pausedAt: null,
    intervalMinutes,
    nextSendAt: new Date().toISOString(),
  });
}

// Pause campaign
export async function pauseCampaign(id: string): Promise<Campaign | null> {
  const campaign = await getCampaignById(id);

  if (!campaign || campaign.status !== 'running') {
    return null;
  }

  return updateCampaign(id, {
    status: 'paused',
    pausedAt: new Date().toISOString(),
    nextSendAt: null,
  });
}

// Resume campaign
export async function resumeCampaign(id: string): Promise<Campaign | null> {
  return startCampaign(id);
}

// Complete campaign
export async function completeCampaign(id: string): Promise<Campaign | null> {
  return updateCampaign(id, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    nextSendAt: null,
  });
}

// Fail campaign
export async function failCampaign(id: string): Promise<Campaign | null> {
  return updateCampaign(id, {
    status: 'failed',
    completedAt: new Date().toISOString(),
    nextSendAt: null,
  });
}

// Increment sent count
export async function incrementSentCount(id: string): Promise<Campaign | null> {
  const campaign = await getCampaignById(id);

  if (!campaign) {
    return null;
  }

  const newSentCount = campaign.sentCount + 1;
  const newCurrentIndex = campaign.currentIndex + 1;

  if (newCurrentIndex >= campaign.totalRecipients) {
    return updateCampaign(id, {
      sentCount: newSentCount,
      currentIndex: newCurrentIndex,
      status: 'completed',
      completedAt: new Date().toISOString(),
      nextSendAt: null,
    });
  }

  const nextSendAt = new Date(Date.now() + campaign.intervalMinutes * 60 * 1000).toISOString();

  return updateCampaign(id, {
    sentCount: newSentCount,
    currentIndex: newCurrentIndex,
    nextSendAt,
  });
}

// Increment failed count
export async function incrementFailedCount(id: string): Promise<Campaign | null> {
  const campaign = await getCampaignById(id);

  if (!campaign) {
    return null;
  }

  const newFailedCount = campaign.failedCount + 1;
  const newCurrentIndex = campaign.currentIndex + 1;

  if (newCurrentIndex >= campaign.totalRecipients) {
    return updateCampaign(id, {
      failedCount: newFailedCount,
      currentIndex: newCurrentIndex,
      status: 'completed',
      completedAt: new Date().toISOString(),
      nextSendAt: null,
    });
  }

  const nextSendAt = new Date(Date.now() + campaign.intervalMinutes * 60 * 1000).toISOString();

  return updateCampaign(id, {
    failedCount: newFailedCount,
    currentIndex: newCurrentIndex,
    nextSendAt,
  });
}
