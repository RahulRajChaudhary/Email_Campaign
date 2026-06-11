// ============================================
// Email Campaign System Types
// ============================================

// Campaign Status
export type CampaignStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed';

// Email Send Status
export type SendStatus = 'pending' | 'sent' | 'failed';

// Template Category
export type TemplateCategory =
  | 'marketing'
  | 'sales'
  | 'followup'
  | 'introduction'
  | 'newsletter'
  | 'custom';

// ============================================
// Data Entities
// ============================================

export interface EmailAccount {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiresAt: string;
  connectedAt: string;
  isDefault: boolean;
}

export interface Upload {
  id: string;
  name: string;
  originalName: string;
  columns: string[];
  rowCount: number;
  data: Record<string, string>[];
  uploadedAt: string;
  lastUsedAt: string | null;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  category: TemplateCategory;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  templateId: string;
  uploadId: string;
  emailAccountId: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  currentIndex: number;
  intervalMinutes: number;
  nextSendAt: string | null;
  startedAt: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface SendHistory {
  id: string;
  campaignId: string;
  campaignName: string;
  recipientEmail: string;
  recipientData: Record<string, string>;
  subject: string;
  status: SendStatus;
  errorMessage: string | null;
  sentAt: string;
  gmailMessageId: string | null;
}

// ============================================
// Gmail Types
// ============================================

export interface GmailTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
  token_type: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// Dashboard Stats
// ============================================

export interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  successRate: number;
  recentCampaigns: Campaign[];
}

// ============================================
// Component Props
// ============================================

export interface UploadDropzoneProps {
  onUpload: (upload: Upload) => void;
  isLoading?: boolean;
}

export interface TemplateEditorProps {
  template?: EmailTemplate;
  availableVariables?: string[];
  onSave: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export interface CampaignWizardProps {
  onComplete: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}
