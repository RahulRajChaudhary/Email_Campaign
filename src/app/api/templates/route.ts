import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getTemplates,
  getTemplateById,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
} from '@/lib/data/templates';
import {
  withErrorHandling,
  successResponse,
  errorResponse,
  validateBody,
} from '@/lib/api-utils';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  bodyHtml: z.string().min(1, 'Body HTML is required'),
  bodyText: z.string().default(''),
  category: z.enum(['marketing', 'sales', 'followup', 'introduction', 'newsletter', 'custom']),
  isDefault: z.boolean().default(false),
});

// GET /api/templates - Get all templates or single template
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const template = await getTemplateById(id);
      if (!template) {
        return errorResponse('Template not found', 404);
      }
      return successResponse(template);
    }

    const templates = await getTemplates();
    return successResponse(templates);
  });
}

// POST /api/templates - Create a new template
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // Handle duplicate action
    if (action === 'duplicate') {
      const id = searchParams.get('id');
      if (!id) {
        return errorResponse('Template ID is required for duplication', 400);
      }

      const duplicated = await duplicateTemplate(id);
      if (!duplicated) {
        return errorResponse('Template not found', 404);
      }

      return successResponse(duplicated, 201);
    }

    const body = await request.json();
    const validatedData = validateBody(templateSchema, body);

    const template = await addTemplate({
      name: validatedData.name,
      subject: validatedData.subject,
      bodyHtml: validatedData.bodyHtml,
      bodyText: validatedData.bodyText || '',
      category: validatedData.category,
      isDefault: validatedData.isDefault || false,
    });
    return successResponse(template, 201);
  });
}

// PATCH /api/templates?id=xxx - Update a template
export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Template ID is required', 400);
    }

    const body = await request.json();

    // Partial validation
    const partialSchema = templateSchema.partial();
    const validatedData = validateBody(partialSchema, body);

    const updated = await updateTemplate(id, validatedData);

    if (!updated) {
      return errorResponse('Template not found', 404);
    }

    return successResponse(updated);
  });
}

// DELETE /api/templates?id=xxx - Delete a template
export async function DELETE(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Template ID is required', 400);
    }

    const deleted = await deleteTemplate(id);

    if (!deleted) {
      return errorResponse('Template not found or is a default template', 404);
    }

    return successResponse({ deleted: true });
  });
}
