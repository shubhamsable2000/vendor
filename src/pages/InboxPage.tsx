import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { InboxView } from '@/components/inbox/InboxView';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function InboxPage() {
  const { toast } = useToast();
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [unreadThreadIds, setUnreadThreadIds] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleThreadRead = (threadId: number) => {
    setUnreadThreadIds(prev => prev.filter(id => id !== threadId));
    if (unreadThreadIds.length === 1 && unreadThreadIds[0] === threadId) {
      setHasNewMessages(false);
    }
  };

  const analyzeSubject = async (subject: string): Promise<'negotiation' | 'rfx'> => {
    try {
      setIsAnalyzing(true);
      console.log('Sending subject for AI analysis:', subject);
      
      const { data, error } = await supabase.functions.invoke('analyze-subject', {
        body: { subject },
      });
      
      if (error) {
        console.error('Error analyzing subject:', error);
        return determineMessageType(subject);
      }
      
      console.log('AI analysis result:', data);
      
      if (data && data.type && (data.type === 'negotiation' || data.type === 'rfx')) {
        if (data.confidence > 0.7) {
          console.log(`High confidence classification: ${data.type} (${data.confidence})`);
          return data.type;
        } else {
          console.log(`Low confidence classification, falling back to basic: ${data.type} (${data.confidence})`);
          return determineMessageType(subject);
        }
      }
      
      return determineMessageType(subject);
    } catch (error) {
      console.error('Error in analyzeSubject:', error);
      return determineMessageType(subject);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const determineMessageType = (subject: string): 'negotiation' | 'rfx' => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('negotiate') || subjectLower.includes('negotiation')) {
      return 'negotiation';
    } else if (subjectLower.includes('request for quotation') || subjectLower.includes('rfx') || subjectLower.includes('rfp') || subjectLower.includes('rfi')) {
      return 'rfx';
    }
    return 'rfx';
  };

  const refreshInbox = async () => {
    setIsRefreshing(true);
    try {
      await checkForReplies();
      toast({
        title: "Inbox Refreshed",
        description: "Your inbox has been refreshed with the latest messages.",
      });
    } catch (e) {
      console.error("Error refreshing inbox:", e);
      toast({
        title: "Refresh Failed",
        description: "There was an error refreshing your inbox. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkForReplies = async () => {
    try {
      const { data: replies, error } = await supabase
        .from('email_replies')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(5);
        
      const { data: messages } = await supabase
        .from('email_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
        
      setDebugInfo({
        replies: replies || [],
        messages: messages || [],
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Debug info loaded",
        description: `Found ${replies?.length || 0} replies and ${messages?.length || 0} messages`,
      });

      if (replies && replies.length > 0) {
        const threadIds = [...new Set(replies.map(reply => reply.thread_id))];
        setUnreadThreadIds(prev => {
          const uniqueIds = new Set([...prev, ...threadIds]);
          return Array.from(uniqueIds);
        });
        
        if (threadIds.length > 0) {
          setHasNewMessages(true);
        }
      }
    } catch (e) {
      console.error("Error fetching debug info:", e);
      throw e;
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('public:email_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_messages' },
        async (payload) => {
          console.log('New message received:', payload);
          const threadId = payload.new.thread_id;
          
          const { data, error } = await supabase
            .from('email_threads')
            .select('subject')
            .eq('id', threadId)
            .single();
          
          if (error) {
            console.error('Error fetching thread subject:', error);
            return;
          }
          
          let messageType: 'negotiation' | 'rfx' = 'rfx';
          
          if (data?.subject) {
            messageType = await analyzeSubject(data.subject);
          } else {
            messageType = (payload.new.type as 'negotiation' | 'rfx') || 'rfx';
          }
          
          if (payload.new.sender !== 'you') {
            setHasNewMessages(true);
            setUnreadThreadIds(prev => 
              prev.includes(threadId) ? prev : [...prev, threadId]
            );
            
            toast({
              title: `New ${messageType} message received`,
              description: 'You have received a new message in your inbox.',
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    const repliesChannel = supabase
      .channel('public:email_replies')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_replies' },
        async (payload) => {
          console.log('New email reply received:', payload);
          const threadId = payload.new.thread_id;
          
          const { data, error } = await supabase
            .from('email_threads')
            .select('subject')
            .eq('id', threadId)
            .single();
          
          if (error) {
            console.error('Error fetching thread subject:', error);
            return;
          }
          
          let replyType: 'negotiation' | 'rfx' = 'rfx';
          
          if (payload.new.type && (payload.new.type === 'negotiation' || payload.new.type === 'rfx')) {
            replyType = payload.new.type as 'negotiation' | 'rfx';
          } else if (data?.subject) {
            replyType = await analyzeSubject(data.subject);
          }
          
          setHasNewMessages(true);
          setUnreadThreadIds(prev => 
            prev.includes(threadId) ? prev : [...prev, threadId]
          );
          
          toast({
            title: `New ${replyType === 'negotiation' ? 'negotiation' : 'RFX'} reply received`,
            description: `A vendor has responded to your ${replyType === 'negotiation' ? 'negotiation' : 'RFX'} message.`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    checkForReplies().catch(error => 
      console.error("Error checking for initial replies:", error)
    );

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(repliesChannel);
    };
  }, [toast]);

  return (
    <AppLayout>
      <div className="space-y-8">
        {debugMode && debugInfo && (
          <div className="bg-slate-100 p-4 rounded-md text-xs overflow-auto max-h-60">
            <h3 className="font-bold mb-2">Debug Info ({new Date(debugInfo.timestamp).toLocaleTimeString()})</h3>
            <div className="mb-4">
              <h4 className="font-semibold">Recent Replies ({debugInfo.replies.length})</h4>
              {debugInfo.replies.length === 0 ? (
                <p className="text-red-500">No replies found!</p>
              ) : (
                <ul className="list-disc pl-5">
                  {debugInfo.replies.map((reply: any) => (
                    <li key={reply.id} className="mb-1">
                      Thread {reply.thread_id} - {reply.sender_email} - {new Date(reply.received_at).toLocaleString()} 
                      {reply.type && <span className="ml-1 font-semibold text-blue-600">({reply.type})</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-semibold">Recent Messages ({debugInfo.messages.length})</h4>
              <ul className="list-disc pl-5">
                {debugInfo.messages.map((msg: any) => (
                  <li key={msg.id} className="mb-1">
                    Thread {msg.thread_id} - {msg.sender} - {new Date(msg.timestamp).toLocaleString()}
                    {msg.type && <span className="ml-1 font-semibold text-blue-600">({msg.type})</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <InboxView 
          hasNewMessages={hasNewMessages} 
          unreadThreadIds={unreadThreadIds} 
          onThreadRead={handleThreadRead} 
        />
      </div>
      <Toaster />
    </AppLayout>
  );
}
