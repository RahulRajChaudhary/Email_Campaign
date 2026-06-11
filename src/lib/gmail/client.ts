import { google, gmail_v1 } from 'googleapis';
import { createOAuth2Client, refreshAccessToken, decryptTokens, encryptTokens } from './oauth';
import { getAccounts, updateAccount } from '@/lib/data/accounts';
import type { EmailAccount } from '@/types';

export class GmailClient {
  private gmail: gmail_v1.Gmail;
  private account: EmailAccount;
  private accessToken: string;
  private refreshToken: string;

  constructor(account: EmailAccount) {
    this.account = account;

    const { accessToken, refreshToken } = decryptTokens(
      account.accessTokenEncrypted,
      account.refreshTokenEncrypted
    );

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  private async ensureValidToken(): Promise<void> {
    const tokenExpiry = new Date(this.account.tokenExpiresAt);
    // Refresh if token expires in less than 5 minutes
    if (new Date() >= new Date(tokenExpiry.getTime() - 5 * 60 * 1000)) {
      const newTokens = await refreshAccessToken(this.refreshToken);
      this.accessToken = newTokens.access_token;

      // Update tokens in storage
      const { accessTokenEncrypted, refreshTokenEncrypted } = encryptTokens(newTokens);

      await updateAccount(this.account.id, {
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt: new Date(newTokens.expiry_date).toISOString(),
      });

      // Update OAuth2 client
      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({
        access_token: this.accessToken,
        refresh_token: this.refreshToken,
      });
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      this.account.tokenExpiresAt = new Date(newTokens.expiry_date).toISOString();
    }
  }

  async getProfile(): Promise<{ emailAddress: string }> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.getProfile({ userId: 'me' });
    return {
      emailAddress: data.emailAddress!,
    };
  }

  async sendEmail(
    to: string,
    subject: string,
    bodyHtml: string,
    bodyText?: string
  ): Promise<{ messageId: string }> {
    await this.ensureValidToken();

    const profile = await this.getProfile();

    // Create MIME message with HTML support
    const boundary = `boundary_${Date.now()}`;
    const email = [
      `From: ${this.account.name ? `"${this.account.name}" <${profile.emailAddress}>` : profile.emailAddress}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      bodyText || stripHtml(bodyHtml),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      bodyHtml,
      '',
      `--${boundary}--`,
    ].join('\r\n');

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const { data } = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    return { messageId: data.id! };
  }
}

// Helper to strip HTML tags for plain text version
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Create Gmail client from account ID
export async function createGmailClient(accountId: string): Promise<GmailClient> {
  const accounts = await getAccounts();
  const account = accounts.find((a: EmailAccount) => a.id === accountId);

  if (!account) {
    throw new Error('Email account not found');
  }

  return new GmailClient(account);
}
