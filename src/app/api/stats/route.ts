import { NextRequest } from 'next/server';
import { getCampaigns } from '@/lib/data/campaigns';
import { getHistoryStats } from '@/lib/data/history';
import { getAccounts } from '@/lib/data/accounts';
import {
  withErrorHandling,
  successResponse,
} from '@/lib/api-utils';

// GET /api/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const [campaigns, historyStats, accounts] = await Promise.all([
      getCampaigns(),
      getHistoryStats(),
      getAccounts(),
    ]);

    const activeCampaigns = campaigns.filter((c) => c.status === 'running');
    const completedCampaigns = campaigns.filter((c) => c.status === 'completed');
    const pendingCampaigns = campaigns.filter(
      (c) => c.status === 'pending' || c.status === 'paused'
    );

    // Get recent campaigns (last 5)
    const recentCampaigns = [...campaigns]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return successResponse({
      accounts: {
        total: accounts.length,
      },
      campaigns: {
        total: campaigns.length,
        active: activeCampaigns.length,
        completed: completedCampaigns.length,
        pending: pendingCampaigns.length,
      },
      emails: {
        totalSent: historyStats.totalSent,
        totalFailed: historyStats.totalFailed,
        successRate: historyStats.successRate,
        todaySent: historyStats.todaySent,
        todayFailed: historyStats.todayFailed,
      },
      recentCampaigns,
      activeCampaigns,
    });
  });
}
