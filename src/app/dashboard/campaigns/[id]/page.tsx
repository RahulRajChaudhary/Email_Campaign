'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  FileSpreadsheet,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import type { Campaign, SendHistory } from '@/types';

interface CampaignDetail extends Campaign {
  template: { id: string; name: string; subject: string } | null;
  upload: { id: string; name: string; rowCount: number; columns: string[] } | null;
  account: { id: string; email: string; name: string | null } | null;
  recentHistory: SendHistory[];
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [pausing, setPausing] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setCampaign(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // Polling for running campaigns
  useEffect(() => {
    if (campaign?.status === 'running') {
      pollingRef.current = setInterval(async () => {
        // Check if it's time to send next email
        if (campaign.nextSendAt) {
          const nextSendTime = new Date(campaign.nextSendAt);
          if (new Date() >= nextSendTime) {
            // Send next email
            try {
              await fetch(`/api/campaigns/${params.id}/send-next`, {
                method: 'POST',
              });
            } catch (error) {
              console.error('Failed to send next:', error);
            }
          }
        }
        // Refresh campaign data
        fetchCampaign();
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [campaign?.status, campaign?.nextSendAt, params.id, fetchCampaign]);

  const startCampaign = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/campaigns/${params.id}/start`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setCampaign(data.data);
        toast({
          title: 'Campaign Started',
          description: 'Emails are now being sent.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to start campaign',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to start:', error);
      toast({
        title: 'Error',
        description: 'Failed to start campaign',
        variant: 'destructive',
      });
    } finally {
      setStarting(false);
    }
  };

  const pauseCampaign = async () => {
    setPausing(true);
    try {
      const res = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }),
      });
      const data = await res.json();

      if (data.success) {
        setCampaign({ ...campaign!, ...data.data });
        toast({
          title: 'Campaign Paused',
          description: 'You can resume it anytime.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to pause campaign',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to pause:', error);
    } finally {
      setPausing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500">Running</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'completed':
        return <Badge>Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button variant="link" onClick={() => router.push('/campaigns')}>
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const progress =
    campaign.totalRecipients > 0
      ? Math.round((campaign.currentIndex / campaign.totalRecipients) * 100)
      : 0;

  const timeUntilNext = campaign.nextSendAt
    ? Math.max(0, new Date(campaign.nextSendAt).getTime() - Date.now())
    : 0;
  const minutesUntilNext = Math.ceil(timeUntilNext / 60000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/campaigns')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            {getStatusBadge(campaign.status)}
          </div>
          <p className="text-muted-foreground">
            Created {new Date(campaign.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {(campaign.status === 'pending' || campaign.status === 'paused') && (
            <Button onClick={startCampaign} disabled={starting}>
              {starting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {campaign.status === 'paused' ? 'Resume' : 'Start'} Campaign
                </>
              )}
            </Button>
          )}
          {campaign.status === 'running' && (
            <Button variant="outline" onClick={pauseCampaign} disabled={pausing}>
              {pausing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Pausing...
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Campaign
                </>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={fetchCampaign}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{campaign.totalRecipients}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {campaign.sentCount}
              </p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Sent
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">
                {campaign.failedCount}
              </p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <XCircle className="h-3 w-3" />
                Failed
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {campaign.totalRecipients - campaign.currentIndex}
              </p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Remaining
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{campaign.intervalMinutes}m</p>
              <p className="text-sm text-muted-foreground">Interval</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {campaign.status === 'running' && campaign.nextSendAt && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Next email in{' '}
                <span className="font-medium text-foreground">
                  {minutesUntilNext} minute{minutesUntilNext !== 1 ? 's' : ''}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Sending From
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.account ? (
              <div>
                <p className="font-medium">{campaign.account.email}</p>
                {campaign.account.name && (
                  <p className="text-sm text-muted-foreground">
                    {campaign.account.name}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Account not found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Contact List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.upload ? (
              <div>
                <p className="font-medium">{campaign.upload.name}</p>
                <p className="text-sm text-muted-foreground">
                  {campaign.upload.rowCount} contacts
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Upload not found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.template ? (
              <div>
                <p className="font-medium">{campaign.template.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {campaign.template.subject}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Template not found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {campaign.recentHistory && campaign.recentHistory.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {campaign.recentHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {entry.status === 'sent' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{entry.recipientEmail}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.subject}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={entry.status === 'sent' ? 'default' : 'destructive'}
                      >
                        {entry.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.sentAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity yet</p>
              <p className="text-sm">Start the campaign to begin sending emails</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
