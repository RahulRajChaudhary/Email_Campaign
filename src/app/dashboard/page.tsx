'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Plus,
  Upload as UploadIcon,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Campaign } from '@/types';

interface Stats {
  accounts: { total: number };
  campaigns: { total: number; active: number; completed: number; pending: number };
  emails: {
    totalSent: number;
    totalFailed: number;
    successRate: number;
    todaySent: number;
    todayFailed: number;
  };
  recentCampaigns: Campaign[];
  activeCampaigns: Campaign[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your email campaigns
          </p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Cards with Gradients */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card-blue text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Connected Accounts
            </CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <Mail className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.accounts.total || 0}</div>
            <p className="text-sm text-white/70">
              Gmail accounts connected
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card-green text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Sent</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <Send className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.emails.totalSent || 0}
            </div>
            <p className="text-sm text-white/70">
              +{stats?.emails.todaySent || 0} today
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card-orange text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Success Rate</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.emails.successRate || 0}%
            </div>
            <p className="text-sm text-white/70">
              {stats?.emails.totalFailed || 0} failed total
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card-cyan text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Active Campaigns</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.campaigns.active || 0}
            </div>
            <p className="text-sm text-white/70">
              {stats?.campaigns.total || 0} total campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      {stats?.activeCampaigns && stats.activeCampaigns.length > 0 && (
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.activeCampaigns.map((campaign) => {
              const progress =
                campaign.totalRecipients > 0
                  ? Math.round(
                      (campaign.currentIndex / campaign.totalRecipients) * 100
                    )
                  : 0;

              return (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl border border-primary/10"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium truncate">{campaign.name}</h3>
                      <Badge className="bg-green-500 hover:bg-green-600">Running</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {campaign.sentCount} sent
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-500" />
                        {campaign.failedCount} failed
                      </span>
                      <span>
                        {campaign.currentIndex} / {campaign.totalRecipients}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <Link href={`/dashboard/campaigns/${campaign.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent Campaigns */}
      <Card className="shadow-sm border-0 bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Campaigns</CardTitle>
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
            <div className="space-y-3">
              {stats.recentCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div>
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {campaign.sentCount} / {campaign.totalRecipients} emails
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        campaign.status === 'completed'
                          ? 'bg-green-500 hover:bg-green-600'
                          : campaign.status === 'running'
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : 'bg-gray-500 hover:bg-gray-600'
                      }
                    >
                      {campaign.status}
                    </Badge>
                    <Link href={`/dashboard/campaigns/${campaign.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <Send className="h-8 w-8 text-primary/60" />
              </div>
              <p className="mb-2">No campaigns yet</p>
              <Link href="/dashboard/campaigns/new">
                <Button variant="link" className="text-primary">Create your first campaign</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/accounts">
          <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 bg-white shadow-sm group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium">Connect Account</h3>
                <p className="text-sm text-muted-foreground">
                  Add Gmail account
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/uploads">
          <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 bg-white shadow-sm group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                <UploadIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium">Upload Contacts</h3>
                <p className="text-sm text-muted-foreground">
                  Import from Excel
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/templates">
          <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 bg-white shadow-sm group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium">Email Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Create or edit
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
