
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Inbox, 
  PlusCircle, 
  ClipboardList, 
  BarChart2, 
  Settings,
  Home,
  Handshake
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Inbox',
    href: '/inbox',
    icon: Inbox,
    showNotification: true, // This item can show notifications
  },
  {
    title: 'My RFx Requests',
    href: '/my-rfx',
    icon: ClipboardList,
  },
  {
    title: 'Create New RFx',
    href: '/create-rfx',
    icon: PlusCircle,
  },
  {
    title: 'Negotiations',
    href: '/negotiations',
    icon: Handshake,
  },
  {
    title: 'Comparison Tables',
    href: '/comparison-tables',
    icon: BarChart2,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function SideNav() {
  const location = useLocation();
  const [hasNewMessages, setHasNewMessages] = useState(false);
  
  // Listen for new messages or replies when the app is outside the inbox page
  useEffect(() => {
    if (location.pathname !== '/inbox') {
      const messagesChannel = supabase
        .channel('sidebar-messages-notification')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'email_messages' },
          (payload) => {
            // Only show notification for incoming messages (not sent by the user)
            if (payload.new.sender !== 'you') {
              setHasNewMessages(true);
            }
          }
        )
        .subscribe();
        
      const repliesChannel = supabase
        .channel('sidebar-replies-notification')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'email_replies' },
          () => {
            setHasNewMessages(true);
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(repliesChannel);
      };
    } else {
      // Reset notification when user is on the inbox page
      setHasNewMessages(false);
    }
  }, [location.pathname]);
  
  return (
    <div className="h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">Vendor Flow</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const showNotificationBadge = item.showNotification && hasNewMessages && !isActive;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
              onClick={() => {
                if (item.href === '/inbox') {
                  setHasNewMessages(false);
                }
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
              {showNotificationBadge && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            VM
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">Vendor Master</p>
            <p className="text-xs text-sidebar-foreground/70">Procurement Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
