'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileSpreadsheet,
  FileText,
  Mail,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

interface Account {
  id: string;
  email: string;
  name: string | null;
  isDefault: boolean;
}

interface Upload {
  id: string;
  name: string;
  rowCount: number;
  columns: string[];
}

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Selections
  const [campaignName, setCampaignName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedUpload, setSelectedUpload] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, uploadsRes, templatesRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/uploads'),
        fetch('/api/templates'),
      ]);

      const [accountsData, uploadsData, templatesData] = await Promise.all([
        accountsRes.json(),
        uploadsRes.json(),
        templatesRes.json(),
      ]);

      if (accountsData.success) {
        setAccounts(accountsData.data);
        const defaultAccount = accountsData.data.find((a: Account) => a.isDefault);
        if (defaultAccount) {
          setSelectedAccount(defaultAccount.id);
        }
      }

      if (uploadsData.success) {
        setUploads(uploadsData.data);
      }

      if (templatesData.success) {
        setTemplates(templatesData.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return campaignName.trim() !== '' && selectedAccount !== '';
      case 2:
        return selectedUpload !== '';
      case 3:
        return selectedTemplate !== '';
      default:
        return false;
    }
  };

  const createCampaign = async () => {
    if (!canProceed()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          emailAccountId: selectedAccount,
          uploadId: selectedUpload,
          templateId: selectedTemplate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Campaign Created',
          description: 'Your campaign is ready to start.',
        });
        router.push(`/dashboard/campaigns/${data.data.id}`);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create campaign',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="text-muted-foreground">
          Set up a new email campaign in 3 easy steps
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}
          >
            <div
              className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                ${
                  s < step
                    ? 'bg-primary border-primary text-primary-foreground'
                    : s === step
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                }
              `}
            >
              {s < step ? <Check className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-1 mx-2 rounded ${
                  s < step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Campaign Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Name your campaign and select which account to send from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium">Campaign Name *</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., January Newsletter"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Send From Account *
              </label>
              {accounts.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    No accounts connected
                  </p>
                  <Button onClick={() => router.push('/dashboard/accounts')}>
                    Connect Gmail Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => setSelectedAccount(account.id)}
                      className={`
                        flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors
                        ${
                          selectedAccount === account.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{account.email}</p>
                          {account.name && (
                            <p className="text-sm text-muted-foreground">
                              {account.name}
                            </p>
                          )}
                        </div>
                      </div>
                      {account.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Contact List */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Contact List</CardTitle>
            <CardDescription>
              Choose which contacts to send this campaign to
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploads.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  No contact lists uploaded
                </p>
                <Button onClick={() => router.push('/dashboard/uploads')}>
                  Upload Contacts
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {uploads.map((upload) => (
                    <div
                      key={upload.id}
                      onClick={() => setSelectedUpload(upload.id)}
                      className={`
                        flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors
                        ${
                          selectedUpload === upload.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{upload.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {upload.rowCount} contacts
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {upload.columns.slice(0, 3).map((col) => (
                          <Badge key={col} variant="secondary" className="text-xs">
                            {col}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Template */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Email Template</CardTitle>
            <CardDescription>
              Choose the template for your campaign emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  No templates available
                </p>
                <Button onClick={() => router.push('/dashboard/templates')}>
                  Create Template
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`
                        flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors
                        ${
                          selectedTemplate === template.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            Subject: {template.subject}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{template.category}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={createCampaign} disabled={!canProceed() || creating}>
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Create Campaign
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
