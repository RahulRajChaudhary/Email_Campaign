import { readJsonFile, writeJsonFile, FILES } from './index';
import type { Campaign, CampaignStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Get all campaigns
export async function getCampaigns(): Promise<Campaign[]> {
  return readJsonFile<Campaign[]>(FILES.CAMPAIGNS, []);
}

// Get campaign by ID
export async function getCampaignById(id: string): Promise<Campaign | null> {
  const campaigns = await getCampaigns();
  return campaigns.find((c) => c.id === id) || null;
}

// Get campaigns by status
export async function getCampaignsByStatus(status: CampaignStatus): Promise<Campaign[]> {
  const campaigns = await getCampaigns();
  return campaigns.filter((c) => c.status === status);
}

// Get running campaigns
export async function getRunningCampaigns(): Promise<Campaign[]> {
  return getCampaignsByStatus('running');
}

// Add new campaign
export async function addCampaign(
  campaign: Omit<Campaign, 'id' | 'createdAt'>
): Promise<Campaign> {
  const campaigns = await getCampaigns();

  const newCampaign: Campaign = {
    ...campaign,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  campaigns.push(newCampaign);
  await writeJsonFile(FILES.CAMPAIGNS, campaigns);
  return newCampaign;
}

// Update campaign
export async function updateCampaign(
  id: string,
  updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>
): Promise<Campaign | null> {
  const campaigns = await getCampaigns();
  const index = campaigns.findIndex((c) => c.id === id);

  if (index === -1) {
    return null;
  }

  campaigns[index] = { ...campaigns[index], ...updates };
  await writeJsonFile(FILES.CAMPAIGNS, campaigns);
  return campaigns[index];
}

// Delete campaign
export async function deleteCampaign(id: string): Promise<boolean> {
  const campaigns = await getCampaigns();
  const index = campaigns.findIndex((c) => c.id === id);

  if (index === -1) {
    return false;
  }

  // Only allow deleting pending or completed campaigns
  const campaign = campaigns[index];
  if (campaign.status === 'running') {
    return false;
  }

  campaigns.splice(index, 1);
  await writeJsonFile(FILES.CAMPAIGNS, campaigns);
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

  // Check if campaign is complete
  if (newCurrentIndex >= campaign.totalRecipients) {
    return updateCampaign(id, {
      sentCount: newSentCount,
      currentIndex: newCurrentIndex,
      status: 'completed',
      completedAt: new Date().toISOString(),
      nextSendAt: null,
    });
  }

  // Schedule next send
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

  // Check if campaign is complete
  if (newCurrentIndex >= campaign.totalRecipients) {
    return updateCampaign(id, {
      failedCount: newFailedCount,
      currentIndex: newCurrentIndex,
      status: 'completed',
      completedAt: new Date().toISOString(),
      nextSendAt: null,
    });
  }

  // Schedule next send
  const nextSendAt = new Date(Date.now() + campaign.intervalMinutes * 60 * 1000).toISOString();

  return updateCampaign(id, {
    failedCount: newFailedCount,
    currentIndex: newCurrentIndex,
    nextSendAt,
  });
}
