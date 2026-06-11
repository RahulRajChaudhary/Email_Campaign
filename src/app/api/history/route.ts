import { NextRequest } from 'next/server';
import {
  getHistoryFiltered,
  getHistoryStats,
} from '@/lib/data/history';
import {
  successResponse,
  handleApiError,
} from '@/lib/api-utils';
import type { SendStatus } from '@/types';

// GET /api/history - Get send history with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Check if requesting stats
    if (searchParams.get('stats') === 'true') {
      const stats = await getHistoryStats();
      return successResponse(stats);
    }

    // Get filters from query params
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const campaignId = searchParams.get('campaignId') || undefined;
    const status = searchParams.get('status') as SendStatus | undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getHistoryFiltered({
      page,
      limit,
      campaignId,
      status,
      startDate,
      endDate,
      search,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
