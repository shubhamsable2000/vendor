
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle, PaperclipIcon, MailCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MessageData {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  subject: string;
  body: string;
  attachments: string[];
  approved: boolean;
  sending: boolean;
}

interface MessageReviewFormProps {
  productData: any;
  budgetData: any;
  vendorData: any;
  onBack: () => void;
  onComplete: (messageData: MessageData[]) => void;
}

export function MessageReviewForm({ productData, budgetData, vendorData, onBack, onComplete }: MessageReviewFormProps) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessages, setSendingMessages] = useState(false);
  const { toast } = useToast();

  const generateMessageBody = async (product: any, budget: any, vendor: any) => {
    try {
      const response = await supabase.functions.invoke('openai-test', {
        body: {
          prompt: `Write a professional negotiation email for a procurement request. The email is from NegotiateAI, representing a client seeking to purchase ${product.productName}.

Context:
- Sender: Negotiation Team from NegotiateAI
- Recipient: ${vendor.name} from ${vendor.company || "their company"}
- Product Specifications: 
  ${product.description}
- Quantity: ${product.quantity} ${product.unit}
- Budget target: We're targeting a price of $${budget.targetBudget} per ${product.unit}
${budget.notes ? `- Additional notes: ${budget.notes}` : ''}

Tone: Professional, confident, and collaborative. Focus on building a partnership while clearly communicating our requirements and budget constraints. Use business-appropriate language that sets the stage for a positive negotiation.`
        }
      });

      const generatedMessage = response.data?.message || `Dear ${vendor.name},

I'm reaching out from NegotiateAI regarding a potential order for ${product.productName}.

We're looking to procure the following:
- Item: ${product.productName}
- Description: ${product.description}
- Quantity: ${product.quantity} ${product.unit}

Our target budget for this purchase is $${budget.targetBudget} per ${product.unit}. We believe this reflects fair market value while meeting our budget constraints.

We're interested in establishing a partnership with ${vendor.company || "your company"} and would appreciate your best offer on this request. If you can meet or beat our target price, we'd be eager to move forward quickly.

Please let me know your thoughts and available pricing options. We're open to discussion on terms and can be flexible on delivery timeline if it helps achieve our budget target.

I look forward to your reply.

Best regards,
Negotiation Team
NegotiateAI`;

      return generatedMessage;
    } catch (error) {
      console.error('Error generating message:', error);
      return `Dear ${vendor.name},

I'm writing to inquire about pricing for ${product.productName}.

We need ${product.quantity} ${product.unit} with the following specifications:
${product.description}

Our target budget is $${budget.targetBudget} per ${product.unit}. Please let me know your best offer.

Looking forward to your response.

Best regards,
Negotiation Team
NegotiateAI`;
    }
  };

  useEffect(() => {
    const generateMessages = async () => {
      setLoading(true);
      
      try {
        const generatedMessages = await Promise.all(
          vendorData.vendors.map(async (vendor: any) => {
            const productType = productData.productName;
            const quantity = productData.quantity;
            
            let subject = `Negotiation Request: ${productType} - ${quantity} ${productData.unit}`;
            
            return {
              vendorId: vendor.id,
              vendorName: vendor.name,
              vendorEmail: vendor.email,
              subject: subject,
              body: await generateMessageBody(productData, budgetData, vendor),
              attachments: productData.files ? productData.files.map((file: File) => file.name) : [],
              approved: false,
              sending: false
            };
          })
        );
        
        setMessages(generatedMessages);
      } catch (error) {
        console.error('Error generating messages:', error);
        toast({
          title: "Error",
          description: "There was a problem generating negotiation messages.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    generateMessages();
  }, [productData, budgetData, vendorData]);

  const updateMessageContent = (vendorId: string, field: 'subject' | 'body', value: string) => {
    setMessages(messages.map(message => 
      message.vendorId === vendorId ? { ...message, [field]: value } : message
    ));
  };

  const approveMessage = async (vendorId: string) => {
    try {
      setMessages(messages.map(message => 
        message.vendorId === vendorId ? { ...message, sending: true } : message
      ));

      const messageToApprove = messages.find(message => message.vendorId === vendorId);
      
      if (!messageToApprove) {
        toast({
          title: "Error",
          description: "Could not find the message to approve",
          variant: "destructive",
        });
        return;
      }
      
      // Generate a unique thread ID
      const timestamp = Date.now();
      const vendorHash = messageToApprove.vendorId.split('').reduce((acc, char) => 
        acc + char.charCodeAt(0), 0) % 1000;
      const newThreadId = parseInt(`${vendorHash}${timestamp % 10000}`);
      
      console.log("Attempting to create thread with ID:", newThreadId);
      
      // Create a new thread using the Supabase Edge Function with improved error handling
      const { data: threadData, error: threadError } = await supabase.functions.invoke('create-negotiation-thread', {
        body: {
          thread_id: newThreadId,
          rfx_id: 1, // Default RFX ID since we're not touching the RFX flow
          vendor_name: messageToApprove.vendorName,
          subject: messageToApprove.subject,
          status: "negotiating",
          unread: false
        }
      });
      
      if (threadError) {
        console.error("Error creating thread:", threadError);
        toast({
          title: "Failed to Create Thread",
          description: threadError.message || "There was an error creating a conversation thread.",
          variant: "destructive"
        });
        
        setMessages(messages.map(message => 
          message.vendorId === vendorId ? { ...message, sending: false } : message
        ));
        
        return;
      }
      
      console.log("Thread created successfully:", threadData);
      
      // Create negotiation settings entry
      const { error: settingsError } = await supabase
        .from("negotiation_settings")
        .insert({
          min_budget: budgetData.minBudget,
          max_budget: budgetData.maxBudget,
          target_budget: budgetData.targetBudget,
          thread_id: newThreadId,
          notes: budgetData.notes || null
        });
      
      if (settingsError) {
        console.error("Error saving negotiation settings:", settingsError);
        toast({
          title: "Failed to Save Settings",
          description: settingsError.message || "There was an error saving negotiation settings.",
          variant: "destructive"
        });
      }
      
      // Send the email with type "negotiation"
      const response = await supabase.functions.invoke('send-email', {
        body: {
          to: messageToApprove.vendorEmail,
          subject: messageToApprove.subject,
          html: messageToApprove.body.replace(/\n/g, '<br/>'),
          text: messageToApprove.body,
          rfxId: 1,
          threadId: newThreadId,
          userId: 'current-user',
          type: "negotiation", // Add type field to distinguish from RFX emails
        },
      });
      
      if (response.error) {
        console.error("Error sending email:", response.error);
        setMessages(messages.map(message => 
          message.vendorId === vendorId ? { ...message, sending: false } : message
        ));
        throw new Error(response.error);
      }
      
      setMessages(messages.map(message => 
        message.vendorId === vendorId ? { ...message, approved: true, sending: false } : message
      ));
      
      toast({
        title: "Message Sent",
        description: `Your message to ${messageToApprove.vendorName} has been sent successfully.`,
      });
      
    } catch (error: any) {
      console.error("Error in send-email function:", error);
      toast({
        title: "Failed to Send Message",
        description: error.message || "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
      
      setMessages(messages.map(message => 
        message.vendorId === vendorId ? { ...message, sending: false } : message
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allApproved) {
      toast({
        title: "Not All Messages Approved",
        description: "Please approve all messages before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSendingMessages(true);
      onComplete(messages);
    } catch (error) {
      console.error("Error finalizing messages:", error);
      toast({
        title: "Error",
        description: "There was a problem finalizing your negotiation requests.",
        variant: "destructive",
      });
    } finally {
      setSendingMessages(false);
    }
  };

  const allApproved = messages.length > 0 && messages.every(message => message.approved);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-2">Review AI-Generated Messages</h2>
        <p className="text-muted-foreground">
          Review and approve the personalized negotiation messages for each vendor
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">AI is generating personalized messages...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {messages.map((message, index) => (
              <AccordionItem value={message.vendorId} key={message.vendorId}>
                <AccordionTrigger className="hover:bg-muted/50 px-4 py-2 rounded-md">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {message.approved && (
                        <MailCheck className="h-4 w-4 text-green-500" />
                      )}
                      <span>{message.vendorName}</span>
                      <span className="text-muted-foreground text-sm">({message.vendorEmail})</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {message.approved ? 'Sent' : 'Pending approval'}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 border rounded-md mt-2">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`subject-${message.vendorId}`}>Subject</Label>
                      <Input
                        id={`subject-${message.vendorId}`}
                        value={message.subject}
                        onChange={(e) => updateMessageContent(message.vendorId, 'subject', e.target.value)}
                        disabled={message.approved || message.sending}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`body-${message.vendorId}`}>Message Body</Label>
                      <Textarea
                        id={`body-${message.vendorId}`}
                        value={message.body}
                        onChange={(e) => updateMessageContent(message.vendorId, 'body', e.target.value)}
                        rows={10}
                        disabled={message.approved || message.sending}
                      />
                    </div>
                    
                    {message.attachments.length > 0 && (
                      <div>
                        <Label>Attachments</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {message.attachments.map((attachment, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-1 bg-secondary rounded-md px-2 py-1 text-xs"
                            >
                              <PaperclipIcon className="h-3 w-3" />
                              <span>{attachment}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {!message.approved ? (
                      <Button 
                        type="button" 
                        onClick={() => approveMessage(message.vendorId)}
                        className="w-full"
                        disabled={message.sending}
                      >
                        {message.sending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Approve & Send'
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center p-2 border border-green-200 bg-green-50 text-green-700 rounded-md">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Message sent successfully
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={sendingMessages}>
          Back
        </Button>
        <Button type="submit" disabled={!allApproved || loading || sendingMessages}>
          {sendingMessages ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing...
            </>
          ) : (
            'Finish & View Negotiations'
          )}
        </Button>
      </div>
    </form>
  );
}
