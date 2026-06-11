'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  FileText,
  Send,
  History,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Mail },
  { name: 'Uploads', href: '/dashboard/uploads', icon: Upload },
  { name: 'Templates', href: '/dashboard/templates', icon: FileText },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Send },
  { name: 'History', href: '/dashboard/history', icon: History },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow sidebar-gradient border-r border-border/50 shadow-sm">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 header-gradient">
            <Mail className="h-8 w-8 text-white" />
            <span className="ml-3 text-xl font-bold text-white">Email Campaign</span>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'btn-gradient text-white shadow-md'
                        : 'text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground text-center">
                Send Interval: <span className="font-semibold text-primary">{process.env.EMAIL_SEND_INTERVAL_MINUTES || 5} min</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-4 header-gradient shadow-lg">
        <Mail className="h-6 w-6 text-white" />
        <span className="ml-2 text-lg font-bold text-white">Email Campaign</span>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 border-t border-border bg-white shadow-lg">
        {navigation.slice(0, 5).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 mb-1',
                isActive && 'drop-shadow-sm'
              )} />
              <span className={cn(isActive && 'font-medium')}>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-background p-6 md:pt-6 pt-20 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
