
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Check, X, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIResponseSuggestionProps {
  vendorMessage: string;
  threadType: string;
  vendorName: string;
  onApprove: (message: string) => void;
  onDecline: () => void;
}

export const AIResponseSuggestion = ({ 
  vendorMessage, 
  threadType, 
  vendorName,
  onApprove,
  onDecline
}: AIResponseSuggestionProps) => {
  const [suggestedResponse, setSuggestedResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateResponse = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const prompt = `
You are a professional procurement specialist responding to a vendor message.
Based on the following message from vendor "${vendorName}" regarding a ${threadType === 'negotiation' ? 'negotiation' : 'request for quotation (RFx)'},
generate a professional, concise, and helpful response that advances the conversation.

Vendor message:
"${vendorMessage}"

If this is a negotiation, focus on getting a better deal while maintaining a good relationship.
If this is an RFx, focus on getting more detailed information about their offering and specifications.
Keep the response professional and to the point.
`;

      const { data, error } = await supabase.functions.invoke('openai-test', {
        body: { prompt }
      });
      
      if (error) {
        console.error('AI response generation error:', error);
        setError('Failed to generate AI response. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to generate AI response',
          variant: 'destructive',
        });
        return;
      }
      
      setSuggestedResponse(data.message || "Thank you for your message. I'll review and get back to you shortly.");
    } catch (err) {
      console.error('Error generating AI response:', err);
      setError('An unexpected error occurred. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to generate response',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    if (vendorMessage) {
      generateResponse();
    }
  }, [vendorMessage]);

  return (
    <Card className="p-4 border border-blue-200 bg-blue-50/50 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span>AI-Suggested Response</span>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => generateResponse()}
            disabled={isGenerating}
            className="h-7 px-2 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      </div>
      
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Analyzing vendor message and generating response...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 p-3 rounded text-sm">
          <p>{error}</p>
          <Button 
            size="sm" 
            onClick={generateResponse}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-white p-3 rounded border my-2 text-sm whitespace-pre-line">
            {suggestedResponse}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onDecline}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Dismiss
            </Button>
            <Button 
              size="sm"
              onClick={() => onApprove(suggestedResponse)}
              className="flex items-center gap-1"
            >
              <Check className="h-4 w-4" />
              Use This Response
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};
