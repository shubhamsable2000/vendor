import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to determine message type based on subject
const determineMessageType = (subject: string): 'negotiation' | 'rfx' => {
  const subjectLower = subject.toLowerCase();
  if (subjectLower.includes('negotiate') || subjectLower.includes('negotiation')) {
    return 'negotiation';
  } else if (subjectLower.includes('request for quotation') || subjectLower.includes('rfx') || subjectLower.includes('rfp') || subjectLower.includes('rfi')) {
    return 'rfx';
  }
  // Default to rfx for any other case
  return 'rfx';
};

// Function to use OpenAI for subject analysis
async function analyzeSubjectWithAI(subject: string, openaiApiKey: string): Promise<'negotiation' | 'rfx'> {
  try {
    console.log('Analyzing subject with OpenAI:', subject);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an AI that analyzes email subject lines and classifies them as either "rfx" (Request for Quotation/Proposal/Information) or "negotiation" (price negotiation, contract negotiation). Only respond with a JSON object with fields: "type" (either "rfx" or "negotiation"), "confidence" (number between 0-1), and "reasoning" (brief explanation).'
          },
          { 
            role: 'user', 
            content: `Analyze this email subject line and classify it: "${subject}"`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return determineMessageType(subject); // Fallback to basic classification
    }

    const data = await response.json();
    let result;
    
    try {
      // Parse the content as JSON
      result = JSON.parse(data.choices[0].message.content);
      console.log('Analyzed subject result:', result);
      
      if (result && result.type && (result.type === 'negotiation' || result.type === 'rfx')) {
        if (result.confidence > 0.7) {
          console.log(`High confidence classification: ${result.type} (${result.confidence})`);
          return result.type;
        }
      }
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e);
    }
    
    // Fallback to basic classification
    return determineMessageType(subject);
  } catch (error) {
    console.error('Error in analyzeSubjectWithAI:', error);
    return determineMessageType(subject); // Fallback to basic classification
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting send-email function");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !sendgridApiKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { to, subject, html, text, rfxId, threadId, userId, type } = await req.json();

    console.log(`Received request to send email to: ${to}, thread: ${threadId}, type: ${type}`);

    if (!to || !subject) {
      throw new Error("Missing required fields");
    }
    
    if (!threadId) {
      throw new Error("Thread ID is required");
    }

    // Determine email type based on subject using AI if available
    let emailType = type;
    
    if (!emailType && openaiApiKey) {
      emailType = await analyzeSubjectWithAI(subject, openaiApiKey);
    } else if (!emailType) {
      // Fall back to basic determination if no type provided and no AI available
      emailType = determineMessageType(subject);
    }
    
    console.log(`Email classified as: ${emailType}`);
    
    // Generate a unique tracking ID for this email with email type included
    const trackingId = `${emailType}-${rfxId}-${threadId}-${Date.now()}`;
    
    // Include tracking ID in the subject line with brackets
    const emailSubject = `${subject} [${trackingId}]`;

    const sendgridUrl = "https://api.sendgrid.com/v3/mail/send";
    const fromEmail = "negotiateai@outlook.com"; // Updated company email
    const fromName = "Henry@NegotiateAI"; // Updated sender name
    const replyToEmail = "parse@parse.getpluck.co"; // Updated to match your inbound parse domain

    // Create email content array with the correct order: text/plain first, then text/html
    const emailContent = [];
    
    // Always add plain text content first
    if (text) {
      emailContent.push({
        type: "text/plain",
        value: text,
      });
    } else {
      // Default plain text if none provided
      emailContent.push({
        type: "text/plain",
        value: "Please see attached RFx request.",
      });
    }
    
    // Then add HTML content if available
    if (html) {
      emailContent.push({
        type: "text/html",
        value: html,
      });
    }

    const payload = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: emailSubject,
        },
      ],
      from: { email: fromEmail, name: fromName },
      reply_to: { email: replyToEmail, name: fromName },
      content: emailContent,
      headers: {
        "X-RFx-ID": trackingId,
        "X-Thread-ID": threadId.toString(),
        "X-RFx-Request": rfxId.toString(),
        "X-Email-Type": emailType, // Add email type header
      },
    };

    console.log(`Sending email via SendGrid with tracking ID: ${trackingId}`);

    const response = await fetch(sendgridUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid API error:", errorText);
      throw new Error(`Failed to send email: ${response.status} ${errorText}`);
    }

    console.log("Email sent successfully via SendGrid");
    
    try {
      // Store the email tracking information in the database with the type
      const { error: trackingError } = await supabase
        .from("email_tracking")
        .insert({
          tracking_id: trackingId,
          rfx_id: rfxId,
          thread_id: threadId,
          user_id: userId,
          recipient_email: to,
          subject: subject,
          sent_at: new Date().toISOString(),
          type: emailType, // Use the determined email type
        });

      if (trackingError) {
        console.error("Error storing email tracking:", trackingError);
      } else {
        console.log("Email tracking information stored successfully");
      }
    } catch (dbError) {
      console.error("Database error while storing tracking data:", dbError);
    }
    
    // Check if thread exists before adding message
    try {
      const { data: threadExists, error: threadCheckError } = await supabase
        .from("email_threads")
        .select("id")
        .eq("id", threadId)
        .single();
      
      if (threadCheckError) {
        console.error("Error checking thread existence:", threadCheckError);
        throw new Error(`Thread with ID ${threadId} does not exist`);
      }
    } catch (threadError) {
      console.error("Error verifying thread exists:", threadError);
      throw new Error(`Failed to verify thread: ${threadError.message}`);
    }
    
    // Add this message to the email_messages table with type
    try {
      const { error: messageError } = await supabase
        .from("email_messages")
        .insert({
          thread_id: threadId,
          sender: "you",
          text: text || html || "No content provided",
          timestamp: new Date().toISOString(),
          type: emailType, // Use the determined email type
        });
      
      if (messageError) {
        console.error("Error storing message:", messageError);
      } else {
        console.log("Message stored successfully in email_messages");
      }
    } catch (messageDbError) {
      console.error("Database error while storing message:", messageDbError);
    }
    
    // Update thread status - check if thread exists first to avoid duplicate key error
    try {
      // First check if the thread exists
      const { data: existingThread } = await supabase
        .from("email_threads")
        .select("id")
        .eq("id", threadId)
        .single();
      
      if (existingThread) {
        // If thread exists, update it
        const { error: threadUpdateError } = await supabase
          .from("email_threads")
          .update({
            status: "awaiting",
            updated_at: new Date().toISOString(),
          })
          .eq("id", threadId);
        
        if (threadUpdateError) {
          console.error("Error updating thread status:", threadUpdateError);
        } else {
          console.log("Thread status updated successfully");
        }
      } else {
        console.log("Thread doesn't exist, not updating");
      }
    } catch (threadDbError) {
      console.error("Database error while updating thread:", threadDbError);
    }

    // Return success even if tracking storage failed
    return new Response(
      JSON.stringify({ success: true, trackingId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
