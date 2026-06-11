import { getAuthUrl } from '@/lib/gmail/oauth';
import { withErrorHandling, successResponse } from '@/lib/api-utils';

export async function GET() {
  return withErrorHandling(async () => {
    // Generate OAuth URL with timestamp for state validation
    const state = Buffer.from(
      JSON.stringify({ timestamp: Date.now() })
    ).toString('base64');

    const authUrl = getAuthUrl(state);

    return successResponse({ url: authUrl });
  });
}
