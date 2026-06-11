'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Plus, Trash2, Star, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

interface Account {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  connectedAt: string;
  isDefault: boolean;
}

function AccountsContent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchAccounts();

    // Check for connection result
    const error = searchParams.get('error');
    const connected = searchParams.get('connected');

    if (error) {
      toast({
        title: 'Connection Failed',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });
    } else if (connected) {
      toast({
        title: 'Account Connected',
        description: 'Your Gmail account has been connected successfully.',
      });
    }
  }, [searchParams, toast]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/auth/gmail');
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to start connection process',
          variant: 'destructive',
        });
        setConnecting(false);
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      toast({
        title: 'Error',
        description: 'Failed to start connection process',
        variant: 'destructive',
      });
      setConnecting(false);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setAccounts(accounts.filter((a) => a.id !== id));
        toast({
          title: 'Account Removed',
          description: 'The account has been disconnected.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to remove account',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove account',
        variant: 'destructive',
      });
    }
  };

  const setDefaultAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts(
          accounts.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        );
        toast({
          title: 'Default Updated',
          description: 'Default account has been changed.',
        });
      }
    } catch (error) {
      console.error('Failed to set default:', error);
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
          <h1 className="text-3xl font-bold">Email Accounts</h1>
          <p className="text-muted-foreground">
            Connect and manage your Gmail accounts
          </p>
        </div>
        <Button onClick={connectAccount} disabled={connecting}>
          {connecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connecting...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Connect Gmail
            </>
          )}
        </Button>
      </div>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No accounts connected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect a Gmail account to start sending email campaigns
            </p>
            <Button onClick={connectAccount} disabled={connecting}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Gmail Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={account.picture || undefined} />
                    <AvatarFallback>
                      {account.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{account.name || account.email}</h3>
                      {account.isDefault && (
                        <Badge variant="secondary">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Connected {new Date(account.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!account.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultAccount(account.id)}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to disconnect this account? You won&apos;t be
                          able to send emails from this account until you reconnect it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteAccount(account.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            About Gmail Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Connect your Gmail accounts to send email campaigns. Each account can be
            used to send emails from that specific address.
          </p>
          <p>
            The default account will be pre-selected when creating new campaigns.
          </p>
          <p>
            Gmail has sending limits (around 500 emails per day for personal accounts).
            Consider using multiple accounts for larger campaigns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <AccountsContent />
    </Suspense>
  );
}
