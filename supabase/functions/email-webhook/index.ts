import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting email-webhook function");
    console.log("Request method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse the incoming webhook payload from SendGrid
    let formData;
    try {
      formData = await req.formData();
      console.log("Successfully parsed formData from request");
      
      // Log all form data keys to debug
      const formDataEntries = Array.from(formData.entries());
      console.log("Form data keys:", formDataEntries.map(entry => entry[0]));
      
    } catch (error) {
      console.error("Error parsing formData:", error);
      
      // If we can't parse formData, try processing as JSON
      try {
        const jsonBody = await req.json();
        console.log("Processing request as JSON:", JSON.stringify(jsonBody).substring(0, 500));
        
        // Create formData-like structure from JSON
        formData = new FormData();
        if (jsonBody.email) formData.append("email", jsonBody.email);
        if (jsonBody.subject) formData.append("subject", jsonBody.subject);
        if (jsonBody.from) formData.append("from", jsonBody.from);
        if (jsonBody.text) formData.append("text", jsonBody.text);
        if (jsonBody.html) formData.append("html", jsonBody.html);
        if (jsonBody.headers) formData.append("headers", JSON.stringify(jsonBody.headers));
        
        // Log all created form data keys
        const formDataEntries = Array.from(formData.entries());
        console.log("Created form data from JSON:", formDataEntries.map(entry => entry[0]));
        
      } catch (jsonError) {
        console.error("Error processing request as JSON:", jsonError);
        // Log the raw request for debugging
        try {
          const rawText = await req.text();
          console.log("Raw request body:", rawText.substring(0, 1000));
        } catch (textError) {
          console.error("Could not get raw request text:", textError);
        }
        throw new Error("Could not parse request body as formData or JSON");
      }
    }
    
    // Extract email data from the payload
    const email = formData.get("email");
    const subject = formData.get("subject") || "";
    const from = formData.get("from") || "";
    const rawText = formData.get("text") || "";
    const html = formData.get("html") || "";
    const headers = formData.get("headers") || "{}";
    const envelope = formData.get("envelope") || "{}";
    
    console.log("Webhook received email with subject:", subject);
    console.log("From:", from);
    console.log("Text content length:", rawText ? rawText.toString().length : 0);
    console.log("Envelope:", envelope);
    
    // Process the email content to extract only the new reply
    // Common email reply patterns to detect quoted content
    const extractReplyContent = (text: string): string => {
      const textStr = text.toString();
      
      // Common reply delimiters
      const delimiters = [
        /^\s*On.*wrote:[\s\S]*$/m,            // "On DATE, NAME <EMAIL> wrote:"
        /^\s*>.*$/gm,                         // Lines starting with >
        /^\s*From:.*$/m,                      // "From:" header line
        /^\s*Sent:.*$/m,                      // "Sent:" header line
        /^\s*To:.*$/m,                        // "To:" header line
        /^\s*Subject:.*$/m,                   // "Subject:" header line
        /^\s*-{3,}Original Message-{3,}[\s\S]*$/m, // "---Original Message---"
        /^\s*-{4,}[\s\S]*$/m,                // Four or more dashes
        /^.*\d{1,2}\/\d{1,2}\/\d{2,4}.*<.*>.*$/m, // Date patterns with email
      ];
      
      console.log("Extracting reply from content...");
      
      // Try each delimiter pattern
      for (const delimiter of delimiters) {
        if (delimiter.toString().includes('g')) {
          // For global patterns, get the index of the first match
          const matches = Array.from(textStr.matchAll(delimiter));
          if (matches.length > 0) {
            const firstMatchIndex = matches[0].index;
            if (firstMatchIndex !== undefined && firstMatchIndex > 0) {
              const extractedContent = textStr.substring(0, firstMatchIndex).trim();
              console.log("Found delimiter match (global):", delimiter.toString());
              console.log("Extracted content length:", extractedContent.length);
              return extractedContent;
            }
          }
        } else {
          // For non-global patterns, split by the pattern
          const match = textStr.match(delimiter);
          if (match && match.index !== undefined && match.index > 0) {
            const extractedContent = textStr.substring(0, match.index).trim();
            console.log("Found delimiter match:", delimiter.toString());
            console.log("Extracted content length:", extractedContent.length);
            return extractedContent;
          }
        }
      }
      
      // If no known delimiters found, look for lines with obvious quoted content
      const lines = textStr.split('\n');
      let lastContentLine = lines.length;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check for typical quoted content indicators
        if (
          line.startsWith('>') ||
          line.match(/^On .+, .+ wrote:$/) ||
          line.match(/^-{3,}/) ||
          line.match(/^[A-Za-z]+:/) // Headers like "From:", "To:", etc.
        ) {
          lastContentLine = i;
          break;
        }
      }
      
      // Extract only the content before the quoted part
      if (lastContentLine < lines.length) {
        const extractedContent = lines.slice(0, lastContentLine).join('\n').trim();
        console.log("Extracted content by line scanning, length:", extractedContent.length);
        return extractedContent;
      }
      
      // Final fallback: if message is long (probably includes a thread),
      // just take the first few paragraphs
      if (textStr.length > 500) {
        const paragraphs = textStr.split('\n\n');
        const firstParagraphs = paragraphs.slice(0, 2).join('\n\n').trim();
        
        if (firstParagraphs.length > 0) {
          console.log("Couldn't identify reply boundary, using first paragraphs");
          return firstParagraphs;
        }
      }
      
      // If all else fails, return original text with a note
      console.log("Using original text as fallback, no reply boundary found");
      return textStr;
    };
    
    // Extract just the new reply content
    const text = extractReplyContent(rawText);
    console.log("Extracted reply text:", text);
    
    // Look for tracking ID in different places
    let trackingId = null;
    let emailType = "rfx"; // Default to rfx
    
    // 1. Try to extract from subject with pattern [type-123-456-timestamp]
    const trackingIdMatch = subject.toString().match(/\[((?:rfx|negotiation)-\d+-\d+-\d+)\]/);
    if (trackingIdMatch) {
      trackingId = trackingIdMatch[1];
      // Determine email type from tracking ID
      emailType = trackingId.startsWith("negotiation") ? "negotiation" : "rfx";
      console.log(`Found tracking ID in subject: ${trackingId} (type: ${emailType})`);
    } else {
      console.log("No tracking ID found in subject using standard pattern");
    }
    
    // 2. If not found, try alternative formats in subject
    if (!trackingId) {
      const altMatch = subject.toString().match(/((?:rfx|negotiation)-\d+-\d+-\d+)/);
      if (altMatch) {
        trackingId = altMatch[1];
        emailType = trackingId.startsWith("negotiation") ? "negotiation" : "rfx";
        console.log(`Found tracking ID in subject with alternate pattern: ${trackingId} (type: ${emailType})`);
      }
    }
    
    // 3. Try to extract from headers
    if (!trackingId) {
      try {
        const parsedHeaders = typeof headers === 'string' ? JSON.parse(headers.toString()) : headers;
        if (parsedHeaders['X-RFx-ID']) {
          trackingId = parsedHeaders['X-RFx-ID'];
          emailType = parsedHeaders['X-Email-Type'] || (trackingId.startsWith("negotiation") ? "negotiation" : "rfx");
          console.log(`Found tracking ID in headers: ${trackingId} (type: ${emailType})`);
        }
      } catch (e) {
        console.error("Error parsing headers:", e);
      }
    }
    
    // 4. Try to extract from any fields that contain "rfx-" or "negotiation-"
    if (!trackingId) {
      const allValues = [];
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string' && (value.includes('rfx-') || value.includes('negotiation-'))) {
          allValues.push(value);
        }
      }
      
      for (const value of allValues) {
        const match = value.toString().match(/((?:rfx|negotiation)-\d+-\d+-\d+)/);
        if (match) {
          trackingId = match[1];
          emailType = trackingId.startsWith("negotiation") ? "negotiation" : "rfx";
          console.log(`Found tracking ID in field value: ${trackingId} (type: ${emailType})`);
          break;
        }
      }
    }
    
    if (!trackingId) {
      console.log("No tracking ID found in subject or headers:", subject);
      
      // Log all formData keys and values for debugging
      console.log("Available formData entries:");
      try {
        for (const [key, value] of formData.entries()) {
          console.log(`- ${key}: ${typeof value === 'string' ? value.substring(0, 300) : '[non-string value]'}...`);
        }
      } catch (formError) {
        console.error("Error logging form entries:", formError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No tracking ID found", 
          subject: subject.toString(),
          received: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 even for invalid emails to acknowledge receipt
        }
      );
    }
    
    console.log("Looking up tracking ID:", trackingId);
    
    // Look up the original email tracking record
    const { data: trackingData, error: trackingError } = await supabase
      .from("email_tracking")
      .select("*")
      .eq("tracking_id", trackingId)
      .maybeSingle();
    
    if (trackingError) {
      console.error("Error retrieving tracking data:", trackingError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Database error while retrieving tracking data",
          received: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 even for errors to acknowledge receipt
        }
      );
    }
    
    if (!trackingData) {
      console.error("Tracking ID not found in database:", trackingId);
      
      // Attempt to find similar tracking IDs
      const { data: similarTrackingData } = await supabase
        .from("email_tracking")
        .select("tracking_id")
        .limit(5);
        
      console.log("Similar tracking IDs in database:", 
        similarTrackingData ? similarTrackingData.map(t => t.tracking_id).join(", ") : "none found");
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Tracking ID not found in database",
          trackingId,
          received: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 even for errors to acknowledge receipt
        }
      );
    }
    
    console.log("Found tracking data:", JSON.stringify(trackingData));
    console.log(`Email type: ${emailType}`);
    
    // Extract sender email from the "from" field
    const senderEmailMatch = from.toString().match(/<([^>]+)>/);
    const senderEmail = senderEmailMatch 
      ? senderEmailMatch[1] 
      : from.toString().trim();
    
    console.log("Extracted sender email:", senderEmail);
    
    // Clean subject by removing the tracking ID
    const cleanSubject = subject.toString().replace(/\[((?:rfx|negotiation)-\d+-\d+-\d+)\]/g, "").trim();
    
    // Store the reply in the database with type
    try {
      const { data: replyData, error: insertError } = await supabase
        .from("email_replies")
        .insert({
          tracking_id: trackingId,
          rfx_id: trackingData.rfx_id,
          thread_id: trackingData.thread_id,
          user_id: trackingData.user_id,
          sender_email: senderEmail,
          subject: cleanSubject,
          text_content: text.toString(), // Save only the extracted reply content
          html_content: html.toString(),
          received_at: new Date().toISOString(),
          type: emailType // Store the email type
        })
        .select();
      
      if (insertError) {
        console.error("Error storing email reply:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message, received: true }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Return 200 even for errors to acknowledge receipt
          }
        );
      }
      
      console.log("Email reply stored successfully");
    } catch (dbError) {
      console.error("Database error while storing reply:", dbError);
    }

    // Add a new message to the email_messages table with type
    try {
      const { data: messageData, error: messageError } = await supabase
        .from("email_messages")
        .insert({
          thread_id: trackingData.thread_id,
          sender: "vendor",
          text: text.toString(), // Save only the extracted reply content
          timestamp: new Date().toISOString(),
          type: emailType // Store message type
        })
        .select();
        
      if (messageError) {
        console.error("Error adding message from reply:", messageError);
      } else {
        console.log("Message from reply added successfully:", messageData);
      }
    } catch (messageDbError) {
      console.error("Database error while storing message:", messageDbError);
    }
    
    // Update thread status to 'responded' and set unread flag
    try {
      const { data: threadData, error: threadUpdateError } = await supabase
        .from("email_threads")
        .update({
          status: "responded",
          unread: true,
          updated_at: new Date().toISOString(),
          // Set thread type based on email type
          type: emailType
        })
        .eq("id", trackingData.thread_id)
        .select();
        
      if (threadUpdateError) {
        console.error("Error updating thread status:", threadUpdateError);
      } else {
        console.log("Thread status and type updated successfully:", threadData);
      }
    } catch (threadDbError) {
      console.error("Database error while updating thread:", threadDbError);
    }

    console.log(`Successfully processed ${emailType} email reply for tracking ID:`, trackingId);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        trackingId,
        threadId: trackingData.thread_id,
        emailType,
        message: "Reply processed successfully",
        received: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in email-webhook function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 even for errors to acknowledge receipt
      }
    );
  }
});
