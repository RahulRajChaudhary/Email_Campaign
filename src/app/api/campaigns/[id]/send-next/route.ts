import { NextRequest } from 'next/server';
import {
  getCampaignById,
  incrementSentCount,
  incrementFailedCount,
} from '@/lib/data/campaigns';
import { getUploadById } from '@/lib/data/uploads';
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

// POST /api/campaigns/[id]/send-next - Send the next email in queue
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

    if (campaign.status !== 'running') {
      return successResponse({
        message: 'Campaign is not running',
        status: campaign.status,
      });
    }

    // Check if all emails have been sent
    if (campaign.currentIndex >= campaign.totalRecipients) {
      return successResponse({
        message: 'Campaign completed',
        status: 'completed',
      });
    }

    // Check if it's time to send the next email
    if (campaign.nextSendAt) {
      const nextSendTime = new Date(campaign.nextSendAt);
      if (new Date() < nextSendTime) {
        return successResponse({
          message: 'Not yet time to send next email',
          nextSendAt: campaign.nextSendAt,
          waitMs: nextSendTime.getTime() - Date.now(),
        });
      }
    }

    // Get template and upload
    const [template, upload] = await Promise.all([
      getTemplateById(campaign.templateId),
      getUploadById(campaign.uploadId),
    ]);

    if (!template || !upload) {
      return errorResponse('Template or upload not found', 400);
    }

    // Create Gmail client
    let gmailClient;
    try {
      gmailClient = await createGmailClient(campaign.emailAccountId);
    } catch (error) {
      return errorResponse('Failed to connect to Gmail account', 500);
    }

    // Get the current recipient
    const recipient = upload.data[campaign.currentIndex];

    if (!recipient) {
      return successResponse({
        message: 'No more recipients',
        status: 'completed',
      });
    }

    const emailColumn = upload.columns.find(
      (col) => col.toLowerCase() === 'email'
    ) || 'email';

    const recipientEmail = recipient[emailColumn];

    if (!recipientEmail) {
      // Skip this recipient and move to next
      await incrementFailedCount(id);
      return successResponse({
        message: 'Skipped recipient with no email',
        skipped: true,
      });
    }

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

      return successResponse({
        message: 'Email sent successfully',
        recipientEmail,
        campaign,
      });
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

      return successResponse({
        message: 'Email failed to send',
        error: error instanceof Error ? error.message : 'Unknown error',
        recipientEmail,
        campaign,
      });
    }
  });
}
