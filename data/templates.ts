import { v4 as uuidv4 } from 'uuid';
import { dbConnect } from '@/lib/db/mongoose';
import { TemplateModel } from '@/lib/model/Template';
import type { EmailTemplate } from '@/types';

// Default templates
const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'template-intro-1',
    name: 'Professional Introduction',
    subject: 'Introduction: {{name}} from {{company}}',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Hi {{name}},</p>

  <p>I hope this email finds you well. My name is [Your Name], and I'm reaching out to introduce myself and explore potential opportunities for collaboration.</p>

  <p>I came across {{company}} and was impressed by your work in the industry. I believe there could be some exciting synergies between our organizations.</p>

  <p>Would you be open to a brief call this week to discuss further?</p>

  <p>Best regards,<br>
  [Your Name]<br>
  [Your Title]</p>
</div>
    `.trim(),
    bodyText: `Hi {{name}},

I hope this email finds you well. My name is [Your Name], and I'm reaching out to introduce myself and explore potential opportunities for collaboration.

I came across {{company}} and was impressed by your work in the industry. I believe there could be some exciting synergies between our organizations.

Would you be open to a brief call this week to discuss further?

Best regards,
[Your Name]
[Your Title]`,
    category: 'introduction',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-followup-1',
    name: 'Friendly Follow-up',
    subject: 'Following up - {{name}}',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Hi {{name}},</p>

  <p>I wanted to follow up on my previous email. I understand you're busy, but I'd love to connect if you have a moment.</p>

  <p>If now isn't the right time, please let me know when might work better for you.</p>

  <p>Looking forward to hearing from you!</p>

  <p>Best,<br>
  [Your Name]</p>
</div>
    `.trim(),
    bodyText: `Hi {{name}},

I wanted to follow up on my previous email. I understand you're busy, but I'd love to connect if you have a moment.

If now isn't the right time, please let me know when might work better for you.

Looking forward to hearing from you!

Best,
[Your Name]`,
    category: 'followup',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-sales-1',
    name: 'Product Announcement',
    subject: 'Exciting News for {{company}}',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear {{name}},</p>

  <p>We're excited to share some news that could benefit {{company}}!</p>

  <p>We've recently launched [Product/Service Name] designed specifically for businesses like yours. Here's what makes it special:</p>

  <ul style="padding-left: 20px;">
    <li>Benefit 1</li>
    <li>Benefit 2</li>
    <li>Benefit 3</li>
  </ul>

  <p>I'd love to show you how this could help {{company}} achieve its goals.</p>

  <p>Would you be interested in a quick demo?</p>

  <p>Best regards,<br>
  [Your Name]</p>
</div>
    `.trim(),
    bodyText: `Dear {{name}},

We're excited to share some news that could benefit {{company}}!

We've recently launched [Product/Service Name] designed specifically for businesses like yours. Here's what makes it special:

- Benefit 1
- Benefit 2
- Benefit 3

I'd love to show you how this could help {{company}} achieve its goals.

Would you be interested in a quick demo?

Best regards,
[Your Name]`,
    category: 'sales',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-meeting-1',
    name: 'Meeting Request',
    subject: 'Meeting Request: {{name}}',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Hi {{name}},</p>

  <p>I hope you're doing well! I'd like to schedule a meeting to discuss [Topic].</p>

  <p>Here are a few time slots that work for me:</p>

  <ul style="padding-left: 20px;">
    <li>Option 1: [Date & Time]</li>
    <li>Option 2: [Date & Time]</li>
    <li>Option 3: [Date & Time]</li>
  </ul>

  <p>Please let me know which works best for you, or suggest an alternative if none of these fit your schedule.</p>

  <p>Looking forward to our conversation!</p>

  <p>Best,<br>
  [Your Name]</p>
</div>
    `.trim(),
    bodyText: `Hi {{name}},

I hope you're doing well! I'd like to schedule a meeting to discuss [Topic].

Here are a few time slots that work for me:

- Option 1: [Date & Time]
- Option 2: [Date & Time]
- Option 3: [Date & Time]

Please let me know which works best for you, or suggest an alternative if none of these fit your schedule.

Looking forward to our conversation!

Best,
[Your Name]`,
    category: 'marketing',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-thankyou-1',
    name: 'Thank You Email',
    subject: 'Thank You, {{name}}!',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear {{name}},</p>

  <p>I wanted to take a moment to express my sincere gratitude for [reason].</p>

  <p>Your [support/time/help] means a lot, and I truly appreciate it.</p>

  <p>If there's ever anything I can do for you or {{company}}, please don't hesitate to reach out.</p>

  <p>Thank you once again!</p>

  <p>Warm regards,<br>
  [Your Name]</p>
</div>
    `.trim(),
    bodyText: `Dear {{name}},

I wanted to take a moment to express my sincere gratitude for [reason].

Your [support/time/help] means a lot, and I truly appreciate it.

If there's ever anything I can do for you or {{company}}, please don't hesitate to reach out.

Thank you once again!

Warm regards,
[Your Name]`,
    category: 'followup',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-newsletter-1',
    name: 'Newsletter Template',
    subject: 'Monthly Update from [Company] - {{name}}',
    bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Monthly Newsletter</h1>
  </div>

  <div style="padding: 30px; background: #f9fafb;">
    <p>Hi {{name}},</p>

    <p>Welcome to our monthly newsletter! Here's what's new:</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #667eea; margin-top: 0;">Highlight 1</h3>
      <p>Description of the first highlight or news item.</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #667eea; margin-top: 0;">Highlight 2</h3>
      <p>Description of the second highlight or news item.</p>
    </div>

    <p>Stay tuned for more updates!</p>

    <p>Best,<br>
    The [Company] Team</p>
  </div>
</div>
    `.trim(),
    bodyText: `Hi {{name}},

Welcome to our monthly newsletter! Here's what's new:

HIGHLIGHT 1
Description of the first highlight or news item.

HIGHLIGHT 2
Description of the second highlight or news item.

Stay tuned for more updates!

Best,
The [Company] Team`,
    category: 'newsletter',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function clean(doc: any): EmailTemplate {
  const obj: any = { ...doc };
  delete obj._id;
  return obj as EmailTemplate;
}

// Get all templates
export async function getTemplates(): Promise<EmailTemplate[]> {
  await dbConnect();

  const count = await TemplateModel.countDocuments();

  if (count === 0) {
    await TemplateModel.insertMany(DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  }

  const docs = await TemplateModel.find().lean();
  return docs.map(clean);
}

// Get template by ID
export async function getTemplateById(id: string): Promise<EmailTemplate | null> {
  await dbConnect();
  await getTemplates(); // ensure defaults seeded
  const doc = await TemplateModel.findOne({ id }).lean();
  return doc ? clean(doc) : null;
}

// Add new template
export async function addTemplate(
  template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<EmailTemplate> {
  await dbConnect();
  const now = new Date().toISOString();

  const newTemplate: EmailTemplate = {
    ...template,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  await TemplateModel.create(newTemplate);
  return newTemplate;
}

// Update template
export async function updateTemplate(
  id: string,
  updates: Partial<Omit<EmailTemplate, 'id' | 'createdAt'>>
): Promise<EmailTemplate | null> {
  await dbConnect();

  const updated = await TemplateModel.findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();

  return updated ? clean(updated) : null;
}

// Delete template
export async function deleteTemplate(id: string): Promise<boolean> {
  await dbConnect();

  const template = await TemplateModel.findOne({ id }).lean();

  if (!template || (template as any).isDefault) {
    return false;
  }

  await TemplateModel.deleteOne({ id });
  return true;
}

// Duplicate template
export async function duplicateTemplate(id: string): Promise<EmailTemplate | null> {
  const template = await getTemplateById(id);

  if (!template) {
    return null;
  }

  return addTemplate({
    name: `${template.name} (Copy)`,
    subject: template.subject,
    bodyHtml: template.bodyHtml,
    bodyText: template.bodyText,
    category: template.category,
    isDefault: false,
  });
}
