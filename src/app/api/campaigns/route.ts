import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getCampaigns,
  getCampaignById,
  addCampaign,
  deleteCampaign,
} from '@/lib/data/campaigns';
import { getUploadById } from '@/lib/data/uploads';
import { getTemplateById } from '@/lib/data/templates';
import { getAccountById } from '@/lib/data/accounts';
import {
  withErrorHandling,
  successResponse,
  errorResponse,
  validateBody,
} from '@/lib/api-utils';

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  templateId: z.string().min(1, 'Template is required'),
  uploadId: z.string().min(1, 'Upload is required'),
  emailAccountId: z.string().min(1, 'Email account is required'),
});

// GET /api/campaigns - Get all campaigns or single campaign
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const campaign = await getCampaignById(id);
      if (!campaign) {
        return errorResponse('Campaign not found', 404);
      }

      // Get related data
      const [template, upload, account] = await Promise.all([
        getTemplateById(campaign.templateId),
        getUploadById(campaign.uploadId),
        getAccountById(campaign.emailAccountId),
      ]);

      return successResponse({
        ...campaign,
        template: template ? { id: template.id, name: template.name } : null,
        upload: upload ? { id: upload.id, name: upload.name, rowCount: upload.rowCount } : null,
        account: account ? { id: account.id, email: account.email } : null,
      });
    }

    const campaigns = await getCampaigns();

    // Sort by createdAt descending
    campaigns.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return successResponse(campaigns);
  });
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const validatedData = validateBody(createCampaignSchema, body);

    // Verify template exists
    const template = await getTemplateById(validatedData.templateId);
    if (!template) {
      return errorResponse('Template not found', 400);
    }

    // Verify upload exists
    const upload = await getUploadById(validatedData.uploadId);
    if (!upload) {
      return errorResponse('Upload not found', 400);
    }

    // Verify email account exists
    const account = await getAccountById(validatedData.emailAccountId);
    if (!account) {
      return errorResponse('Email account not found', 400);
    }

    const intervalMinutes = parseInt(process.env.EMAIL_SEND_INTERVAL_MINUTES || '5', 10);

    const campaign = await addCampaign({
      name: validatedData.name,
      templateId: validatedData.templateId,
      uploadId: validatedData.uploadId,
      emailAccountId: validatedData.emailAccountId,
      status: 'pending',
      totalRecipients: upload.rowCount,
      sentCount: 0,
      failedCount: 0,
      currentIndex: 0,
      intervalMinutes,
      nextSendAt: null,
      startedAt: null,
      pausedAt: null,
      completedAt: null,
    });

    return successResponse(campaign, 201);
  });
}

// DELETE /api/campaigns?id=xxx - Delete a campaign
export async function DELETE(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Campaign ID is required', 400);
    }

    const deleted = await deleteCampaign(id);

    if (!deleted) {
      return errorResponse('Campaign not found or is currently running', 404);
    }

    return successResponse({ deleted: true });
  });
}
