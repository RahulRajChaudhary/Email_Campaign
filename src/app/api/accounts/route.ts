import { NextRequest } from 'next/server';
import {
  getAccounts,
  deleteAccount,
  setDefaultAccount,
} from '@/lib/data/accounts';
import {
  withErrorHandling,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';

// GET /api/accounts - Get all connected accounts
export async function GET() {
  return withErrorHandling(async () => {
    const accounts = await getAccounts();

    // Remove sensitive data before returning
    const safeAccounts = accounts.map((account) => ({
      id: account.id,
      email: account.email,
      name: account.name,
      picture: account.picture,
      connectedAt: account.connectedAt,
      isDefault: account.isDefault,
    }));

    return successResponse(safeAccounts);
  });
}

// DELETE /api/accounts?id=xxx - Delete an account
export async function DELETE(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Account ID is required', 400);
    }

    const deleted = await deleteAccount(id);

    if (!deleted) {
      return errorResponse('Account not found', 404);
    }

    return successResponse({ deleted: true });
  });
}

// PATCH /api/accounts?id=xxx - Update account (set as default)
export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Account ID is required', 400);
    }

    const body = await request.json();

    if (body.isDefault) {
      const success = await setDefaultAccount(id);
      if (!success) {
        return errorResponse('Account not found', 404);
      }
    }

    return successResponse({ updated: true });
  });
}
