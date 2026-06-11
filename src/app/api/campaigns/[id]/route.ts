import { NextRequest } from 'next/server';
import {
  getCampaignById,
  pauseCampaign,
  deleteCampaign,
} from '@/lib/data/campaigns';
import { getUploadById } from '@/lib/data/uploads';
import { getTemplateById } from '@/lib/data/templates';
import { getAccountById } from '@/lib/data/accounts';
import { getHistoryByCampaign } from '@/lib/data/history';
import {
  withErrorHandling,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';

// GET /api/campaigns/[id] - Get campaign details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const campaign = await getCampaignById(id);

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    // Get related data
    const [template, upload, account, history] = await Promise.all([
      getTemplateById(campaign.templateId),
      getUploadById(campaign.uploadId),
      getAccountById(campaign.emailAccountId),
      getHistoryByCampaign(id),
    ]);

    return successResponse({
      ...campaign,
      template: template ? { id: template.id, name: template.name, subject: template.subject } : null,
      upload: upload ? { id: upload.id, name: upload.name, rowCount: upload.rowCount, columns: upload.columns } : null,
      account: account ? { id: account.id, email: account.email, name: account.name } : null,
      recentHistory: history.slice(0, 10),
    });
  });
}

// PATCH /api/campaigns/[id] - Pause campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'pause') {
      const campaign = await pauseCampaign(id);

      if (!campaign) {
        return errorResponse('Campaign not found or not running', 400);
      }

      return successResponse(campaign);
    }

    return errorResponse('Invalid action', 400);
  });
}

// DELETE /api/campaigns/[id] - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const deleted = await deleteCampaign(id);

    if (!deleted) {
      return errorResponse('Campaign not found or is currently running', 404);
    }

    return successResponse({ deleted: true });
  });
}
