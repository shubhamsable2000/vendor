
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function OpenAITest() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setResponse('');
    
    try {
      const { data, error } = await supabase.functions.invoke('openai-test', {
        body: { prompt }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setResponse(data.message);
      
      toast({
        title: "Success",
        description: "OpenAI API response received!",
      });
    } catch (error) {
      console.error('Error testing OpenAI:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response from OpenAI",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">OpenAI API Test</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-1">
            Enter a prompt for OpenAI:
          </label>
          <Input
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask OpenAI something..."
          />
        </div>
        
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Send to OpenAI"
          )}
        </Button>
      </form>
      
      {response && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Response:</h3>
          <Textarea 
            value={response} 
            readOnly 
            className="h-[200px] overflow-auto"
          />
        </div>
      )}
    </Card>
  );
}
