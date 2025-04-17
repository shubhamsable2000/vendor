
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Send, MessageSquare, HandshakeIcon, Loader2, FileText } from 'lucide-react';
import { NegotiateModal } from './NegotiateModal';
import { NegotiationTracker } from './NegotiationTracker';
import { AIResponseSuggestion } from './AIResponseSuggestion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
  type?: string | null;
}

interface Thread {
  id: number;
  vendorName: string;
  subject: string;
  status: string;
  unread: boolean;
  rfxId: number;
  messages: Message[];
  negotiation: any | null;
  type?: string | null;
}

const rfxRequests = [
  { id: 1, title: 'Office Furniture' },
  { id: 2, title: 'IT Equipment' },
  { id: 3, title: 'Software Licenses' },
];

interface InboxViewProps {
  hasNewMessages?: boolean;
  unreadThreadIds?: number[];
  onThreadRead?: (threadId: number) => void;
}

export function InboxView({ hasNewMessages, unreadThreadIds = [], onThreadRead }: InboxViewProps) {
  const [selectedRfxId, setSelectedRfxId] = useState(1);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isNegotiateModalOpen, setIsNegotiateModalOpen] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isReplying, setIsReplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [showAIResponseSuggestion, setShowAIResponseSuggestion] = useState(false);
  const { toast } = useToast();
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    if (selectedThreadId && unreadThreadIds.includes(selectedThreadId)) {
      onThreadRead?.(selectedThreadId);
    }
  }, [selectedThreadId, unreadThreadIds, onThreadRead]);
  
  useEffect(() => {
    if (selectedThreadId) {
      scrollToBottom();
    }
  }, [selectedThreadId, threads]);
  
  // Check for vendor reply and show AI suggestion
  useEffect(() => {
    if (selectedThread) {
      const messages = selectedThread.messages;
      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        
        // If the last message is from the vendor, show AI suggestion
        if (lastMessage.sender === 'vendor') {
          setShowAIResponseSuggestion(true);
        } else {
          setShowAIResponseSuggestion(false);
        }
      }
    }
  }, [selectedThreadId, threads]);
  
  const handleNegotiationComplete = (threadId: number, offer: number, message: string) => {
    console.log('Negotiation complete for thread:', threadId, 'with offer:', offer);
    
    setThreads(currentThreads => 
      currentThreads.map(thread => 
        thread.id === threadId 
          ? { 
              ...thread, 
              negotiation: { 
                status: 'inProgress',
                targetBudget: [offer * 0.85, offer],
                currentOffer: offer,
                history: [
                  { 
                    date: new Date().toISOString(),
                    type: 'initial',
                    amount: offer,
                    message: message
                  }
                ]
              } 
            } 
          : thread
      )
    );
    
    if (message) {
      setReplyText(message);
    }
    
    toast({
      title: "Negotiation Started",
      description: `You've started a negotiation with a target price of ${offer * 0.85}`,
    });
  };
  
  const handleManualRefresh = async () => {
    toast({
      title: "Refreshing inbox",
      description: "Retrieving the latest messages...",
    });
    setForceRefresh(prev => prev + 1);
  };
  
  useEffect(() => {
    const fetchThreadsAndMessages = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching threads from Supabase');
        const { data: threadData, error: threadError } = await supabase
          .from('email_threads')
          .select('*')
          .order('updated_at', { ascending: false });
          
        if (threadError) {
          console.error('Error fetching threads:', threadError);
          toast({
            title: "Error fetching data",
            description: "There was a problem loading your inbox data.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        console.log('Fetched threads:', threadData?.length || 0);
        
        if (!threadData || threadData.length === 0) {
          setThreads([]);
          setIsLoading(false);
          return;
        }
        
        const { data: messageData, error: messageError } = await supabase
          .from('email_messages')
          .select('*')
          .in('thread_id', threadData.map(thread => thread.id))
          .order('timestamp', { ascending: true });
          
        if (messageError) {
          console.error('Error fetching messages:', messageError);
          toast({
            title: "Error fetching messages",
            description: "There was a problem loading your message data.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        console.log('Fetched messages:', messageData?.length || 0);

        const { data: trackingData, error: trackingError } = await supabase
          .from('email_tracking')
          .select('*')
          .in('thread_id', threadData.map(thread => thread.id));

        if (trackingError) {
          console.error('Error fetching tracking data:', trackingError);
        }
        
        const threadTypeMap = new Map();
        if (trackingData) {
          trackingData.forEach(tracking => {
            if (tracking.tracking_id && tracking.tracking_id.startsWith('negotiation')) {
              threadTypeMap.set(tracking.thread_id, 'negotiation');
            } else if (tracking.type) {
              threadTypeMap.set(tracking.thread_id, tracking.type);
            } else {
              threadTypeMap.set(tracking.thread_id, 'rfx');
            }
          });
        }
        
        const completeThreads: Thread[] = threadData.map(thread => {
          const threadMessages = messageData
            ? messageData.filter(msg => msg.thread_id === thread.id)
            : [];
            
          const threadType = threadTypeMap.get(thread.id) || 'rfx';
          
          const hasVendorMessages = threadMessages.some(msg => msg.sender === 'vendor');
          
          const threadStatus = hasVendorMessages ? 'responded' : thread.status;
          
          return {
            id: thread.id,
            vendorName: thread.vendor_name,
            subject: thread.subject,
            status: threadStatus,
            unread: thread.unread,
            rfxId: thread.rfx_id,
            messages: threadMessages.map(msg => ({
              id: msg.id,
              sender: msg.sender,
              text: msg.text || "",
              timestamp: msg.timestamp || new Date().toISOString(),
              type: msg.type || 'rfx'
            })),
            negotiation: null,
            type: threadType
          };
        });
        
        console.log('Constructed threads:', completeThreads.length);
        setThreads(completeThreads);
        
        if (completeThreads.length > 0 && !selectedThreadId) {
          setSelectedThreadId(completeThreads[0].id);
        }
      } catch (error) {
        console.error('Error in fetchThreadsAndMessages:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading your inbox.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchThreadsAndMessages();
  }, [toast, forceRefresh]);
  
  useEffect(() => {
    const channel = supabase
      .channel('email-replies')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_replies' },
        async (payload) => {
          console.log('New email reply received:', payload);
          
          try {
            const replyData = payload.new;
            
            const threadId = replyData.thread_id;
            
            await supabase
              .from('email_threads')
              .update({ status: 'responded' })
              .eq('id', threadId);
            
            const { data: refreshedThreadData, error: refreshError } = await supabase
              .from('email_threads')
              .select('*')
              .order('updated_at', { ascending: false });
              
            if (refreshError || !refreshedThreadData) {
              console.error('Error refreshing thread data:', refreshError);
              return;
            }
            
            const { data: refreshedMessageData, error: refreshMessageError } = await supabase
              .from('email_messages')
              .select('*')
              .in('thread_id', refreshedThreadData.map(thread => thread.id))
              .order('timestamp', { ascending: true });
              
            if (refreshMessageError || !refreshedMessageData) {
              console.error('Error refreshing message data:', refreshMessageError);
              return;
            }
            
            const { data: threadData } = await supabase
              .from('email_threads')
              .select('*')
              .eq('id', threadId)
              .single();
                
            const updatedThreads: Thread[] = refreshedThreadData.map(thread => {
              const threadMessages = refreshedMessageData.filter(msg => msg.thread_id === thread.id);
              
              const messageType = replyData.type || 'rfx';
              
              const threadStatus = thread.id === threadId ? 'responded' : thread.status;
              
              return {
                id: thread.id,
                vendorName: thread.vendor_name,
                subject: thread.subject,
                status: threadStatus,
                unread: thread.unread || (unreadThreadIds && unreadThreadIds.includes(thread.id)),
                rfxId: thread.rfx_id,
                messages: threadMessages.map(msg => ({
                  id: msg.id,
                  sender: msg.sender,
                  text: msg.text || "",
                  timestamp: msg.timestamp || new Date().toISOString(),
                  type: msg.type || 'rfx'
                })),
                negotiation: null,
                type: messageType,
              };
            });
            
            setThreads(updatedThreads);
            
            if (threadId === selectedThreadId) {
              setTimeout(scrollToBottom, 100);
            }
            
            if (threadData) {
              toast({
                title: "New Reply Received",
                description: `${threadData.vendor_name} has replied to your message.`
              });
            }
          } catch (error) {
            console.error('Error processing real-time update:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
    
    const messagesChannel = supabase
      .channel('email-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_messages' },
        async (payload) => {
          console.log('New message inserted:', payload);
          
          if (payload.new.sender !== 'you') {
            try {
              const threadId = payload.new.thread_id;
              
              if (payload.new.sender === 'vendor') {
                await supabase
                  .from('email_threads')
                  .update({ status: 'responded' })
                  .eq('id', threadId);
              }
              
              const { data: refreshedThreadData, error: refreshError } = await supabase
                .from('email_threads')
                .select('*')
                .order('updated_at', { ascending: false });
                
              if (refreshError || !refreshedThreadData) {
                console.error('Error refreshing thread data:', refreshError);
                return;
              }
              
              const { data: refreshedMessageData, error: refreshMessageError } = await supabase
                .from('email_messages')
                .select('*')
                .in('thread_id', refreshedThreadData.map(thread => thread.id))
                .order('timestamp', { ascending: true });
                
              if (refreshMessageError || !refreshedMessageData) {
                console.error('Error refreshing message data:', refreshMessageError);
                return;
              }
              
              const updatedThreads = refreshedThreadData.map(thread => {
                const threadMessages = refreshedMessageData.filter(msg => msg.thread_id === thread.id);
                
                const messageTypes = threadMessages
                  .filter(msg => msg.type)
                  .map(msg => msg.type);
                
                let threadType = 'rfx';
                if (messageTypes.includes('negotiation')) {
                  threadType = 'negotiation';
                } else if (messageTypes.length > 0) {
                  threadType = messageTypes[0] || 'rfx';
                }
                
                const hasVendorMessages = threadMessages.some(msg => msg.sender === 'vendor');
                const threadStatus = hasVendorMessages ? 'responded' : thread.status;
                
                return {
                  id: thread.id,
                  vendorName: thread.vendor_name,
                  subject: thread.subject,
                  status: threadStatus,
                  unread: thread.unread || (unreadThreadIds && unreadThreadIds.includes(thread.id)),
                  rfxId: thread.rfx_id,
                  messages: threadMessages.map(msg => ({
                    id: msg.id,
                    sender: msg.sender,
                    text: msg.text || "",
                    timestamp: msg.timestamp || new Date().toISOString(),
                    type: msg.type || 'rfx'
                  })),
                  negotiation: null,
                  type: threadType,
                };
              });
              
              setThreads(updatedThreads);
              
              if (threadId === selectedThreadId) {
                setTimeout(scrollToBottom, 100);
              }
            } catch (error) {
              console.error('Error processing new message update:', error);
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messagesChannel);
    };
  }, [toast, selectedThreadId, unreadThreadIds]);
  
  const filteredThreads = threads.filter(thread => thread.rfxId === selectedRfxId);
  
  const selectedThread = threads.find(thread => thread.id === selectedThreadId);

  const handleRfxChange = (value: string) => {
    const rfxId = parseInt(value);
    setSelectedRfxId(rfxId);
    
    const firstThread = threads.find(thread => thread.rfxId === rfxId);
    setSelectedThreadId(firstThread?.id || null);
  };
  
  const handleThreadSelect = (threadId: number) => {
    setSelectedThreadId(threadId);
    if (unreadThreadIds.includes(threadId)) {
      onThreadRead?.(threadId);
    }
  };
  
  const generateAiReply = () => {
    if (!selectedThread) return;
    
    setTimeout(() => {
      const lastMessage = selectedThread.messages[selectedThread.messages.length - 1];
      let suggestion = '';
      
      if (lastMessage && lastMessage.sender === 'vendor' && lastMessage.text.includes('quote')) {
        suggestion = `Thank you for providing the quote. The pricing seems reasonable, but I would like to discuss the possibility of a volume discount given our ongoing needs. Could you let me know if there's any flexibility in your pricing for a long-term partnership?

Best regards,
[Your Name]`;
      } else {
        suggestion = `Thank you for your response. I appreciate the information provided. Could you please clarify the delivery timeline and any additional costs such as installation or maintenance?

Best regards,
[Your Name]`;
      }
      
      setAiSuggestion(suggestion);
    }, 1000);
  };
  
  const handleSendReply = async () => {
    if (!selectedThread || !replyText.trim()) return;
    
    try {
      setIsReplying(true);
      
      const { data: threadExists, error: threadCheckError } = await supabase
        .from("email_threads")
        .select("id")
        .eq("id", selectedThread.id)
        .single();
      
      if (threadCheckError) {
        console.error("Error checking thread existence:", threadCheckError);
        toast({
          title: "Error Sending Reply",
          description: "There was a problem verifying the conversation thread.",
          variant: "destructive"
        });
        setIsReplying(false);
        return;
      }
      
      const { data: messageData, error: messageError } = await supabase
        .from('email_messages')
        .insert({
          thread_id: selectedThread.id,
          sender: 'you',
          text: replyText,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();
      
      if (messageError) {
        console.error("Error storing message:", messageError);
        toast({
          title: "Failed to Store Message",
          description: "There was an error saving your message. Please try again.",
          variant: "destructive"
        });
        setIsReplying(false);
        return;
      }
      
      const { error: threadError } = await supabase
        .from('email_threads')
        .update({
          status: 'awaiting',
          unread: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedThread.id);
      
      if (threadError) {
        console.error("Error updating thread:", threadError);
      }
      
      const { data: trackingData, error: trackingError } = await supabase
        .from('email_tracking')
        .select('recipient_email')
        .eq('thread_id', selectedThread.id)
        .order('sent_at', { ascending: false })
        .limit(1);
        
      if (trackingError || !trackingData || trackingData.length === 0) {
        console.error("Error fetching recipient email:", trackingError);
        toast({
          title: "Warning",
          description: "Could not determine recipient email. Using fallback email address.",
        });
      }
      
      const recipientEmail = trackingData && trackingData.length > 0 
        ? trackingData[0].recipient_email 
        : `vendor-${selectedThread.id}@example.com`;
      
      console.log("Sending email to recipient:", recipientEmail);
      
      const emailResponse = await supabase.functions.invoke('send-email', {
        body: {
          to: recipientEmail,
          subject: `Re: ${selectedThread.subject}`,
          html: replyText.replace(/\n/g, '<br/>'),
          text: replyText,
          rfxId: selectedThread.rfxId,
          threadId: selectedThread.id,
          userId: 'current-user',
        },
      });
      
      if (emailResponse.error) {
        console.error("Error sending email:", emailResponse.error);
        toast({
          title: "Failed to Send Email",
          description: "There was an error sending your message. The message was saved but not delivered.",
          variant: "destructive"
        });
        setIsReplying(false);
        return;
      }
      
      const { data: refreshedThreadData, error: refreshError } = await supabase
        .from('email_threads')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (refreshError || !refreshedThreadData) {
        console.error('Error refreshing thread data:', refreshError);
        toast({
          title: "Message Sent",
          description: `Your reply has been sent to ${selectedThread.vendorName}.`,
        });
        setReplyText('');
        setAiSuggestion('');
        setIsReplying(false);
        return;
      }
      
      const { data: refreshedMessageData, error: refreshMessageError } = await supabase
        .from('email_messages')
        .select('*')
        .in('thread_id', refreshedThreadData.map(thread => thread.id))
        .order('timestamp', { ascending: true });
        
      if (refreshMessageError || !refreshedMessageData) {
        console.error('Error refreshing message data:', refreshMessageError);
        toast({
          title: "Message Sent",
          description: `Your reply has been sent to ${selectedThread.vendorName}.`,
        });
        setReplyText('');
        setAiSuggestion('');
        setIsReplying(false);
        return;
      }
      
      const updatedThreads: Thread[] = refreshedThreadData.map(thread => {
        const threadMessages = refreshedMessageData.filter(msg => msg.thread_id === thread.id);
        
        const threadType = thread.id === selectedThread.id 
          ? selectedThread.type || 'rfx'
          : 'rfx';
          
        return {
          id: thread.id,
          vendorName: thread.vendor_name,
          subject: thread.subject,
          status: thread.status,
          unread: thread.unread,
          rfxId: thread.rfx_id,
          messages: threadMessages.map(msg => ({
            id: msg.id,
            sender: msg.sender,
            text: msg.text || "",
            timestamp: msg.timestamp || new Date().toISOString(),
            type: msg.type || 'rfx'
          })),
          negotiation: selectedThread.id === thread.id ? selectedThread.negotiation : null,
          type: threadType,
        };
      });
      
      setThreads(updatedThreads);
      setReplyText('');
      setAiSuggestion('');
      
      toast({
        title: "Message Sent",
        description: `Your reply has been sent to ${selectedThread.vendorName}.`
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Failed to Send Message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsReplying(false);
    }
  };
  
  const shouldRenderNegotiationTracker = () => {
    return selectedThread && selectedThread.negotiation;
  };

  const getNegotiationProps = () => {
    if (!selectedThread || !selectedThread.negotiation) {
      return {
        vendorName: '',
        targetBudget: [0, 0] as [number, number],
        currentOffer: 0,
        status: 'inProgress' as 'inProgress' | 'accepted' | 'declined' | 'countered',
        history: []
      };
    }

    const negotiation = selectedThread.negotiation;
    
    return {
      vendorName: selectedThread.vendorName,
      targetBudget: Array.isArray(negotiation.targetBudget) 
        ? negotiation.targetBudget 
        : [negotiation.targetBudget * 0.9, negotiation.targetBudget] as [number, number],
      currentOffer: negotiation.currentOffer || 0,
      status: negotiation.status || 'inProgress',
      history: negotiation.history || []
    };
  };

  const getLastVendorMessage = (): string => {
    if (!selectedThread || !selectedThread.messages || selectedThread.messages.length === 0) {
      return '';
    }
    
    // Find the most recent message from the vendor
    for (let i = selectedThread.messages.length - 1; i >= 0; i--) {
      if (selectedThread.messages[i].sender === 'vendor') {
        return selectedThread.messages[i].text || '';
      }
    }
    
    return '';
  };
  
  const handleApproveAIResponse = (message: string) => {
    setReplyText(message);
    setShowAIResponseSuggestion(false);
    toast({
      title: "AI Response Applied",
      description: "You can edit the message before sending if needed.",
    });
  };
  
  const handleDismissAIResponse = () => {
    setShowAIResponseSuggestion(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManualRefresh}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              Refresh Inbox
            </>
          )}
        </Button>
      </div>
      
      <div className="w-full max-w-xs">
        <Select value={selectedRfxId.toString()} onValueChange={handleRfxChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select RFx" />
          </SelectTrigger>
          <SelectContent>
            {rfxRequests.map((rfx) => (
              <SelectItem key={rfx.id} value={rfx.id.toString()}>
                📂 {rfx.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 overflow-hidden">
          <div className="bg-muted p-3 border-b">
            <div className="font-medium">Vendor Communications</div>
          </div>
          
          <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredThreads.length > 0 ? (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`p-3 cursor-pointer ${
                    selectedThreadId === thread.id ? 'bg-muted' : ''
                  } hover:bg-muted/50`}
                  onClick={() => handleThreadSelect(thread.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium flex items-center gap-2">
                      {thread.vendorName}
                      {(thread.unread || unreadThreadIds.includes(thread.id)) && (
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                      )}
                    </div>
                    <div className={`
                      status-badge text-xs
                      ${thread.status === 'awaiting' ? 'status-badge-awaiting' : ''}
                      ${thread.status === 'responded' ? 'status-badge-responded' : ''}
                      ${thread.status === 'followUp' ? 'status-badge-follow-up' : ''}
                    `}>
                      {{
                        'awaiting': 'Awaiting Reply',
                        'responded': 'Responded',
                        'followUp': 'Needs Follow-up'
                      }[thread.status]}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mt-1 truncate">
                    {thread.subject}
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-muted-foreground">
                      {thread.messages && thread.messages.length > 0 
                        ? `Last message: ${new Date(thread.messages[thread.messages.length - 1].timestamp).toLocaleDateString()}` 
                        : 'No messages yet'}
                    </div>
                    
                    <Badge variant={thread.type === 'negotiation' ? 'default' : 'secondary'}>
                      {thread.type === 'negotiation' ? (
                        <div className="flex items-center gap-1">
                          <HandshakeIcon className="h-3 w-3 mr-1" />
                          Negotiation
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 mr-1" />
                          RFx
                        </div>
                      )}
                    </Badge>
                  </div>
                  
                  {thread.negotiation && (
                    <div className="mt-1 text-xs flex items-center gap-1 text-blue-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                      Negotiation in progress
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No communications found for this RFx
              </div>
            )}
          </div>
        </Card>
        
        <div className="lg:col-span-8 space-y-4">
          {isLoading ? (
            <Card className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Loading conversations...</h3>
            </Card>
          ) : selectedThread ? (
            <>
              <Card className="overflow-hidden">
                <div className="bg-muted p-3 border-b flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {selectedThread.subject}
                      
                      <Badge variant={selectedThread.type === 'negotiation' ? 'default' : 'secondary'}>
                        {selectedThread.type === 'negotiation' ? (
                          <div className="flex items-center gap-1">
                            <HandshakeIcon className="h-3 w-3 mr-1" />
                            Negotiation
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 mr-1" />
                            RFx
                          </div>
                        )}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedThread.vendorName}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsNegotiateModalOpen(true)}
                      className="flex items-center gap-1"
                    >
                      <HandshakeIcon className="h-4 w-4" />
                      Negotiate 🤝
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 max-h-[calc(100vh-450px)] overflow-y-auto space-y-4">
                  {selectedThread.messages && selectedThread.messages.length > 0 ? (
                    selectedThread.messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.sender === 'you' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.sender === 'you' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          {message.type && (
                            <div className={`text-xs mb-1 ${
                              message.sender === 'you'
                                ? 'text-primary-foreground/80'
                                : 'text-muted-foreground/80'
                            }`}>
                              {message.type === 'negotiation' ? (
                                <div className="flex items-center">
                                  <HandshakeIcon className="h-3 w-3 mr-1" />
                                  Negotiation Message
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <FileText className="h-3 w-3 mr-1" />
                                  RFx Message
                                </div>
                              )}
                            </div>
                          )}
                          <div className="whitespace-pre-line">{message.text}</div>
                          <div className={`text-xs mt-1 ${
                            message.sender === 'you' 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      No messages yet in this conversation.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </Card>
              
              {shouldRenderNegotiationTracker() && (
                <NegotiationTracker {...getNegotiationProps()} />
              )}
              
              {showAIResponseSuggestion && selectedThread && (
                <AIResponseSuggestion 
                  vendorMessage={getLastVendorMessage()}
                  threadType={selectedThread.type || 'rfx'}
                  vendorName={selectedThread.vendorName}
                  onApprove={handleApproveAIResponse}
                  onDecline={handleDismissAIResponse}
                />
              )}
              
              <Card>
                <div className="p-4 space-y-4">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Reply to {selectedThread.vendorName}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={generateAiReply}
                      className="text-xs flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      Suggest Reply
                    </Button>
                  </div>
                  
                  <Textarea 
                    placeholder="Type your reply here..." 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[120px]"
                  />
                  
                  {aiSuggestion && !showAIResponseSuggestion && (
                    <div className="bg-muted/50 p-3 rounded border text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          AI Suggested Reply
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setReplyText(aiSuggestion)}
                          className="h-6 text-xs"
                        >
                          Use This
                        </Button>
                      </div>
                      <div className="whitespace-pre-line text-muted-foreground">
                        {aiSuggestion}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || isReplying}
                      className="flex items-center gap-2"
                    >
                      {isReplying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No conversation selected</h3>
              <p className="text-muted-foreground text-center mt-2">
                Select a conversation from the list to view messages
              </p>
            </Card>
          )}
        </div>
      </div>
      
      <NegotiateModal 
        isOpen={isNegotiateModalOpen} 
        onClose={() => setIsNegotiateModalOpen(false)}
        vendorName={selectedThread?.vendorName || ''}
        onNegotiationComplete={(offer, message) => {
          if (selectedThread) {
            handleNegotiationComplete(selectedThread.id, offer, message);
          }
        }}
        currentOffer={selectedThread?.negotiation?.currentOffer}
      />
    </div>
  );
}
