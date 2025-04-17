
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

interface EmailData {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  subject: string;
  body: string;
  attachments: string[];
  approved: boolean;
  sending: boolean;
}

interface EmailReviewFormProps {
  rfxData: any;
  vendorData: any;
  onBack: () => void;
  onComplete: (emailData: EmailData[]) => void;
}

export function EmailReviewForm({ rfxData, vendorData, onBack, onComplete }: EmailReviewFormProps) {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmails, setSendingEmails] = useState(false);
  const { toast } = useToast();

  const generateEmailBody = async (rfx: any, vendor: any) => {
    try {
      const response = await supabase.functions.invoke('openai-test', {
        body: {
          prompt: `Write a professional B2B email template for a procurement request. The email is from NegotiateAI, representing a client seeking laptop quotes. 

Context:
- Sender: Henry from NegotiateAI
- Recipient: ${vendor.name}
- Product Specifications: 
  ${rfx.description}
- Quantity: ${rfx.volume} units

Tone: Professional, concise, and collaborative. Emphasize that this is a formal request on behalf of a client. Use business-appropriate language that highlights the opportunity for the vendor.`
        }
      });

      const generatedEmail = response.data?.message || `Dear ${vendor.name},

I am Henry from NegotiateAI, reaching out on behalf of our client seeking a competitive quote for enterprise-grade laptops.

Our client is looking to procure the following laptop specifications:

Product Details:
- Processor: Intel Core i7-1360P
- Graphics: NVIDIA GeForce RTX 2050 (30W)
- Display: 16.0", WQXGA (2560 x 1600), 120 Hz, IPS
- Storage: 2000GB SSD
- Memory: 16GB RAM
- Weight: 1.82 kg (4 lbs)

Quantity Required: 10 units

We kindly request a comprehensive quote that includes:
- Detailed pricing
- Estimated delivery timeline
- Any applicable volume discounts
- Warranty and support terms

This is a time-sensitive procurement, and we aim to move quickly. Your prompt response and competitive offer would be greatly appreciated.

If you require any additional information or clarification, please don't hesitate to reach out.

Best regards,
Henry
Procurement Solutions
NegotiateAI`;

      return generatedEmail;
    } catch (error) {
      console.error('Error generating email:', error);
      return `Dear ${vendor.name},

I am Henry from NegotiateAI, reaching out on behalf of our client seeking laptop quotes.

Our client requires 10 units with the following specifications:
${rfx.description}

Please provide a comprehensive quote including pricing, delivery timeline, and terms.

Best regards,
Henry
NegotiateAI`;
    }
  };

  useEffect(() => {
    setLoading(true);
    
    const timeout = setTimeout(async () => {
      const generatedEmails = await Promise.all(
        vendorData.vendors.map(async (vendor: any) => {
          const productType = rfxData.title || "Enterprise Laptops";
          const quantity = rfxData.volume || 10;
          
          let subject = `Request for Quotation: ${productType} - ${quantity} units`;
          
          if (rfxData.companyName) {
            subject = `${rfxData.companyName} - ${subject}`;
          }
          
          return {
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorEmail: vendor.email,
            subject: subject,
            body: await generateEmailBody(rfxData, vendor),
            attachments: rfxData.files ? rfxData.files.map((file: File) => file.name) : [],
            approved: false,
            sending: false
          };
        })
      );
      
      setEmails(generatedEmails);
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [rfxData, vendorData]);

  const updateEmailContent = (vendorId: string, field: 'subject' | 'body', value: string) => {
    setEmails(emails.map(email => 
      email.vendorId === vendorId ? { ...email, [field]: value } : email
    ));
  };

  const approveEmail = async (vendorId: string) => {
    try {
      setEmails(emails.map(email => 
        email.vendorId === vendorId ? { ...email, sending: true } : email
      ));

      const emailToApprove = emails.find(email => email.vendorId === vendorId);
      
      if (!emailToApprove) {
        toast({
          title: "Error",
          description: "Could not find the email to approve",
          variant: "destructive",
        });
        return;
      }
      
      const { data: existingThreadData, error: existingThreadError } = await supabase
        .from("email_threads")
        .select("id")
        .eq("vendor_name", emailToApprove.vendorName)
        .eq("rfx_id", rfxData.id || 1)
        .maybeSingle();
        
      console.log("Checking for existing thread:", existingThreadData);
      
      let threadId;
      
      if (existingThreadData?.id) {
        console.log("Using existing thread ID:", existingThreadData.id);
        threadId = existingThreadData.id;
      } else {
        console.log("Creating new thread for vendor:", emailToApprove.vendorName);
        
        // Generate a unique thread ID based on timestamp to ensure it's never null
        const timestamp = Date.now();
        // Add vendor ID hash component for uniqueness
        const vendorHash = emailToApprove.vendorId.split('').reduce((acc, char) => 
          acc + char.charCodeAt(0), 0) % 1000;
        // Combine RFX ID, timestamp, and vendor hash for a unique ID
        const newThreadId = parseInt(`${rfxData.id || 1}${vendorHash}${timestamp % 10000}`);
        
        console.log("Generated new thread ID:", newThreadId);
        
        const { data: threadData, error: threadError } = await supabase
          .from("email_threads")
          .insert({
            id: newThreadId, // Using the newly generated unique ID
            rfx_id: rfxData.id || 1,
            vendor_name: emailToApprove.vendorName,
            subject: emailToApprove.subject,
            status: "awaiting",
            unread: false
          })
          .select()
          .single();
        
        if (threadError) {
          console.error("Error creating thread:", threadError);
          toast({
            title: "Failed to Create Thread",
            description: threadError.message || "There was an error creating a conversation thread.",
            variant: "destructive"
          });
          
          setEmails(emails.map(email => 
            email.vendorId === vendorId ? { ...email, sending: false } : email
          ));
          
          return;
        }
        
        threadId = threadData.id;
      }
      
      console.log("Sending email with thread ID:", threadId);
      const response = await supabase.functions.invoke('send-email', {
        body: {
          to: emailToApprove.vendorEmail,
          subject: emailToApprove.subject,
          html: emailToApprove.body.replace(/\n/g, '<br/>'),
          text: emailToApprove.body,
          rfxId: rfxData.id || 1,
          threadId: threadId,
          userId: 'current-user',
        },
      });
      
      if (response.error) {
        console.error("Error sending email:", response.error);
        setEmails(emails.map(email => 
          email.vendorId === vendorId ? { ...email, sending: false } : email
        ));
        throw new Error(response.error);
      }
      
      setEmails(emails.map(email => 
        email.vendorId === vendorId ? { ...email, approved: true, sending: false } : email
      ));
      
      toast({
        title: "Email Sent",
        description: `Your email to ${emailToApprove.vendorName} has been sent successfully.`,
      });
      
    } catch (error: any) {
      console.error("Error in send-email function:", error);
      toast({
        title: "Failed to Send Email",
        description: error.message || "There was an error sending your email. Please try again.",
        variant: "destructive",
      });
      
      setEmails(emails.map(email => 
        email.vendorId === vendorId ? { ...email, sending: false } : email
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allApproved) {
      toast({
        title: "Not All Emails Approved",
        description: "Please approve all emails before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSendingEmails(true);
      
      onComplete(emails);
      
    } catch (error) {
      console.error("Error finalizing emails:", error);
      toast({
        title: "Error",
        description: "There was a problem finalizing your email requests.",
        variant: "destructive",
      });
    } finally {
      setSendingEmails(false);
    }
  };

  const allApproved = emails.length > 0 && emails.every(email => email.approved);

  return (
    <form onSubmit={handleSubmit} className="step-container">
      <div>
        <h2 className="step-title">Review AI-Generated Emails</h2>
        <p className="step-description">
          Review and approve the personalized emails for each vendor
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">AI is generating personalized emails...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {emails.map((email, index) => (
              <AccordionItem value={email.vendorId} key={email.vendorId}>
                <AccordionTrigger className="hover:bg-muted/50 px-4 py-2 rounded-md">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {email.approved && (
                        <MailCheck className="h-4 w-4 text-green-500" />
                      )}
                      <span>{email.vendorName}</span>
                      <span className="text-muted-foreground text-sm">({email.vendorEmail})</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {email.approved ? 'Sent' : 'Pending approval'}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 border rounded-md mt-2">
                  <div className="space-y-4">
                    <div className="form-control">
                      <Label htmlFor={`subject-${email.vendorId}`}>Subject</Label>
                      <Input
                        id={`subject-${email.vendorId}`}
                        value={email.subject}
                        onChange={(e) => updateEmailContent(email.vendorId, 'subject', e.target.value)}
                        disabled={email.approved || email.sending}
                      />
                    </div>
                    
                    <div className="form-control">
                      <Label htmlFor={`body-${email.vendorId}`}>Email Body</Label>
                      <Textarea
                        id={`body-${email.vendorId}`}
                        value={email.body}
                        onChange={(e) => updateEmailContent(email.vendorId, 'body', e.target.value)}
                        rows={10}
                        disabled={email.approved || email.sending}
                      />
                    </div>
                    
                    {email.attachments.length > 0 && (
                      <div className="form-control">
                        <Label>Attachments</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {email.attachments.map((attachment, idx) => (
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
                    
                    {!email.approved ? (
                      <Button 
                        type="button" 
                        onClick={() => approveEmail(email.vendorId)}
                        className="w-full"
                        disabled={email.sending}
                      >
                        {email.sending ? (
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
                        Email sent successfully
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onBack} disabled={sendingEmails}>
          ← Back
        </Button>
        <Button type="submit" disabled={!allApproved || loading || sendingEmails}>
          {sendingEmails ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Finish & Go to Dashboard'
          )}
        </Button>
      </div>
    </form>
  );
}
