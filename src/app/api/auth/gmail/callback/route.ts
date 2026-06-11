import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  exchangeCodeForTokens,
  getUserInfo,
  encryptTokens,
} from '@/lib/gmail/oauth';
import { getAccounts, addAccount, updateAccount } from '@/lib/data/accounts';
import type { EmailAccount } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  // Handle OAuth errors
  if (error) {
    console.error('Gmail OAuth error:', error);
    return NextResponse.redirect(
      `${baseUrl}/accounts?error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/accounts?error=missing_parameters`
    );
  }

  try {
    // Verify state timestamp (expire after 10 minutes)
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const { timestamp } = decodedState;

    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(`${baseUrl}/accounts?error=state_expired`);
    }

    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const tokens = await exchangeCodeForTokens(code);
    console.log('Tokens received successfully');

    // Get user's email and info from Google
    console.log('Getting user info from Google...');
    const googleUser = await getUserInfo(tokens.access_token);
    console.log('Google user email:', googleUser.email);

    // Encrypt tokens
    const { accessTokenEncrypted, refreshTokenEncrypted } = encryptTokens(tokens);

    // Check if account already exists
    const accounts = await getAccounts();
    const existingAccount = accounts.find(
      (a: EmailAccount) => a.email === googleUser.email
    );

    if (existingAccount) {
      // Update existing account
      await updateAccount(existingAccount.id, {
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt: new Date(tokens.expiry_date).toISOString(),
        name: googleUser.name,
        picture: googleUser.picture,
      });
      console.log('Updated existing account:', googleUser.email);
    } else {
      // Create new account
      const isFirstAccount = accounts.length === 0;
      const newAccount: EmailAccount = {
        id: uuidv4(),
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt: new Date(tokens.expiry_date).toISOString(),
        connectedAt: new Date().toISOString(),
        isDefault: isFirstAccount,
      };

      await addAccount(newAccount);
      console.log('Created new account:', googleUser.email);
    }

    // Redirect to dashboard
    return NextResponse.redirect(`${baseUrl}/?connected=true`);
  } catch (err: unknown) {
    console.error('Gmail OAuth callback error:', err);
    const errorMessage = err instanceof Error ? err.message : 'callback_failed';
    return NextResponse.redirect(
      `${baseUrl}/accounts?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
