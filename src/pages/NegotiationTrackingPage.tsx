
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { NegotiationTrackingView } from '@/components/negotiations/NegotiationTrackingView';
import { NegotiationFlow } from '@/components/negotiations/NegotiationFlow';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function NegotiationTrackingPage() {
  const [showNewNegotiation, setShowNewNegotiation] = useState(false);
  const { toast } = useToast();
  
  // Listen for new email replies and messages
  useEffect(() => {
    // Subscribe to realtime changes for email_replies table
    const repliesChannel = supabase
      .channel('email_replies_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_replies' },
        (payload) => {
          // Check if the reply has a type field, otherwise check if the subject contains negotiation-related terms
          const reply = payload.new;
          const replyType = reply.type || 'rfx';
          
          // Only show toast for negotiation type replies on this page
          if (replyType === 'negotiation') {
            toast({
              title: 'New Negotiation Reply Received',
              description: `${reply.sender_email} has responded to your negotiation.`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to realtime changes for email_messages table
    const messagesChannel = supabase
      .channel('email_messages_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_messages' },
        (payload) => {
          const newMessage = payload.new;
          const messageType = newMessage.type || 'rfx';
          
          // Only log negotiation messages on this page
          if (messageType === 'negotiation') {
            console.log('New negotiation message received:', newMessage);
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(repliesChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [toast]);
  
  return (
    <AppLayout>
      {showNewNegotiation ? (
        <div className="container py-6">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowNewNegotiation(false)}
              className="mb-4"
            >
              ← Back to Negotiations
            </Button>
            <h1 className="text-2xl font-bold">Start New Negotiation</h1>
          </div>
          <NegotiationFlow onComplete={() => setShowNewNegotiation(false)} />
        </div>
      ) : (
        <div className="container py-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Negotiations</h1>
            <Button onClick={() => setShowNewNegotiation(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Negotiation
            </Button>
          </div>
          <NegotiationTrackingView />
        </div>
      )}
    </AppLayout>
  );
}
