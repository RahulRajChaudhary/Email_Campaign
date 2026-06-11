import { NextRequest } from 'next/server';
import {
  getCampaignById,
  startCampaign,
  incrementSentCount,
  incrementFailedCount,
} from '@/lib/data/campaigns';
import { getUploadById, markUploadUsed } from '@/lib/data/uploads';
import { getTemplateById } from '@/lib/data/templates';
import { createGmailClient } from '@/lib/gmail/client';
import { addHistoryEntry } from '@/lib/data/history';
import {
  withErrorHandling,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';

// Replace template variables with actual values
function replaceVariables(text: string, data: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    result = result.replace(regex, value);
  }
  return result;
}

// POST /api/campaigns/[id]/start - Start or resume a campaign
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    let campaign = await getCampaignById(id);

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    if (campaign.status !== 'pending' && campaign.status !== 'paused') {
      return errorResponse(
        `Campaign cannot be started. Current status: ${campaign.status}`,
        400
      );
    }

    // Get template and upload
    const [template, upload] = await Promise.all([
      getTemplateById(campaign.templateId),
      getUploadById(campaign.uploadId),
    ]);

    if (!template) {
      return errorResponse('Template not found', 400);
    }

    if (!upload) {
      return errorResponse('Upload not found', 400);
    }

    // Start the campaign
    campaign = await startCampaign(id);

    if (!campaign) {
      return errorResponse('Failed to start campaign', 500);
    }

    // Mark upload as used
    await markUploadUsed(upload.id);

    // Create Gmail client
    let gmailClient;
    try {
      gmailClient = await createGmailClient(campaign.emailAccountId);
    } catch (error) {
      return errorResponse('Failed to connect to Gmail account', 500);
    }

    // Send the first email immediately
    const recipient = upload.data[campaign.currentIndex];

    if (recipient) {
      const emailColumn = upload.columns.find(
        (col) => col.toLowerCase() === 'email'
      ) || 'email';

      const recipientEmail = recipient[emailColumn];

      if (recipientEmail) {
        try {
          const subject = replaceVariables(template.subject, recipient);
          const bodyHtml = replaceVariables(template.bodyHtml, recipient);
          const bodyText = replaceVariables(template.bodyText, recipient);

          const result = await gmailClient.sendEmail(
            recipientEmail,
            subject,
            bodyHtml,
            bodyText
          );

          // Log success
          await addHistoryEntry({
            campaignId: id,
            campaignName: campaign.name,
            recipientEmail,
            recipientData: recipient,
            subject,
            status: 'sent',
            errorMessage: null,
            sentAt: new Date().toISOString(),
            gmailMessageId: result.messageId,
          });

          // Update campaign counts
          campaign = await incrementSentCount(id);
        } catch (error) {
          console.error('Failed to send email:', error);

          // Store campaign name before it might become null
          const campaignName = campaign?.name || 'Unknown Campaign';

          // Log failure
          await addHistoryEntry({
            campaignId: id,
            campaignName,
            recipientEmail,
            recipientData: recipient,
            subject: replaceVariables(template.subject, recipient),
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            sentAt: new Date().toISOString(),
            gmailMessageId: null,
          });

          // Update campaign counts
          campaign = await incrementFailedCount(id);
        }
      }
    }

    // Get updated campaign
    campaign = await getCampaignById(id);

    return successResponse({
      ...campaign,
      message: 'Campaign started. First email sent.',
    });
  });
}
