
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    const { subject } = await req.json();
    
    if (!subject) {
      return new Response(
        JSON.stringify({ 
          type: 'rfx', 
          confidence: 0,
          reasoning: 'No subject provided, defaulting to rfx'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log('Sending subject for analysis:', subject);

    // Check if the subject explicitly contains keywords related to negotiations
    const negotiationKeywords = ['negotiate', 'negotiation', 'counter', 'offer', 'proposal', 'price discussion', 'budget'];
    const subjectLower = subject.toLowerCase();
    const containsNegotiationTerm = negotiationKeywords.some(keyword => subjectLower.includes(keyword));
    
    // If it clearly contains negotiation terms, return immediately without calling OpenAI
    if (containsNegotiationTerm) {
      return new Response(
        JSON.stringify({
          type: 'negotiation',
          confidence: 0.95,
          reasoning: 'Subject contains explicit negotiation terms'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
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
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let result;
    
    try {
      // Parse the content as JSON
      result = JSON.parse(data.choices[0].message.content);
      console.log('Analyzed subject result:', result);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e);
      // Fall back to basic classification
      result = {
        type: subjectLower.includes('negotiate') ? 'negotiation' : 'rfx',
        confidence: 0.5,
        reasoning: 'Fallback to basic classification due to parsing error'
      };
    }
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-subject function:', error);
    
    // Fall back to basic classification
    const { subject } = await req.json();
    const subjectLower = subject ? subject.toLowerCase() : '';
    const negotiationKeywords = ['negotiate', 'negotiation', 'counter', 'offer', 'proposal', 'price discussion', 'budget'];
    const containsNegotiationTerm = negotiationKeywords.some(keyword => subjectLower.includes(keyword));
    
    return new Response(
      JSON.stringify({ 
        type: containsNegotiationTerm ? 'negotiation' : 'rfx',
        confidence: 0.3,
        reasoning: `Error occurred, falling back to basic keyword classification: ${error.message}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
