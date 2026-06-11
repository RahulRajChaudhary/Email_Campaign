import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import {
  getUploads,
  addUpload,
  deleteUpload,
  getUploadById,
} from '@/lib/data/uploads';
import {
  withErrorHandling,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';
import type { Upload } from '@/types';

// GET /api/uploads - Get all uploads
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const upload = await getUploadById(id);
      if (!upload) {
        return errorResponse('Upload not found', 404);
      }
      return successResponse(upload);
    }

    const uploads = await getUploads();

    // Return without full data for list view
    const uploadsWithoutData = uploads.map((u) => ({
      id: u.id,
      name: u.name,
      originalName: u.originalName,
      columns: u.columns,
      rowCount: u.rowCount,
      uploadedAt: u.uploadedAt,
      lastUsedAt: u.lastUsedAt,
    }));

    return successResponse(uploadsWithoutData);
  });
}

// POST /api/uploads - Upload a new Excel file
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return errorResponse('Invalid file type. Please upload an Excel or CSV file.', 400);
    }

    // Read the file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });

    if (jsonData.length === 0) {
      return errorResponse('The file appears to be empty', 400);
    }

    // Get columns from the first row
    const columns = Object.keys(jsonData[0]);

    // Check if 'email' column exists (case-insensitive)
    const emailColumn = columns.find(
      (col) => col.toLowerCase() === 'email'
    );

    if (!emailColumn) {
      return errorResponse(
        'The file must contain an "email" column',
        400
      );
    }

    // Convert all values to strings
    const data = jsonData.map((row) => {
      const stringRow: Record<string, string> = {};
      for (const key of columns) {
        stringRow[key] = String(row[key] ?? '');
      }
      return stringRow;
    });

    // Filter out rows without email
    const validData = data.filter((row) => {
      const email = row[emailColumn];
      return email && email.includes('@');
    });

    if (validData.length === 0) {
      return errorResponse('No valid email addresses found in the file', 400);
    }

    // Create upload record
    const upload: Upload = {
      id: uuidv4(),
      name: name || file.name.replace(/\.(xlsx|xls|csv)$/i, ''),
      originalName: file.name,
      columns,
      rowCount: validData.length,
      data: validData,
      uploadedAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    await addUpload(upload);

    // Return without full data
    return successResponse({
      id: upload.id,
      name: upload.name,
      originalName: upload.originalName,
      columns: upload.columns,
      rowCount: upload.rowCount,
      uploadedAt: upload.uploadedAt,
    }, 201);
  });
}

// DELETE /api/uploads?id=xxx - Delete an upload
export async function DELETE(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Upload ID is required', 400);
    }

    const deleted = await deleteUpload(id);

    if (!deleted) {
      return errorResponse('Upload not found', 404);
    }

    return successResponse({ deleted: true });
  });
}
