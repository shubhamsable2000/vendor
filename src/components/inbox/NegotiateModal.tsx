
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CircleDollarSign, Sparkles, Edit, CheckCircle, X } from 'lucide-react';

interface NegotiateModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  onNegotiationComplete: (offer: number, message: string) => void;
  currentOffer?: number;
}

export function NegotiateModal({ 
  isOpen, 
  onClose,
  vendorName,
  onNegotiationComplete,
  currentOffer
}: NegotiateModalProps) {
  const [step, setStep] = useState(1);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleGenerateMessage = () => {
    if (!budgetMin || !budgetMax) {
      toast({
        title: "Missing Fields",
        description: "Please enter both minimum and maximum budget values.",
        variant: "destructive"
      });
      return;
    }

    // Generate AI message based on inputs
    const generatedMessage = `Dear ${vendorName},

Thank you for your offer${currentOffer ? ` of $${currentOffer}` : ''}. We appreciate your proposal, however, our budget for this procurement is in the range of $${budgetMin} to $${budgetMax}${note ? `. ${note}` : ''}.

Would it be possible to revise your quote to better align with our budget constraints? We value your service and would like to find a price point that works for both parties.

Looking forward to your response.

Best regards,
[Your Name]`;

    setMessage(generatedMessage);
    setStep(2);
  };

  const handleApproveAndSend = () => {
    const avgBudget = (parseFloat(budgetMin) + parseFloat(budgetMax)) / 2;
    onNegotiationComplete(avgBudget, message);
    toast({
      title: "Negotiation Message Sent",
      description: `Your counter-offer has been sent to ${vendorName}.`
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(1);
    setBudgetMin('');
    setBudgetMax('');
    setNote('');
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5 text-primary" />
                Set Your Budget Range
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-budget">Minimum Budget ($)</Label>
                  <Input
                    id="min-budget"
                    type="number"
                    placeholder="10000"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-budget">Maximum Budget ($)</Label>
                  <Input
                    id="max-budget"
                    type="number"
                    placeholder="15000"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note">Additional Note (Optional)</Label>
                <Textarea
                  id="note"
                  placeholder="e.g., We're trying to stay within our Q2 budget"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button onClick={handleGenerateMessage}>
                <Sparkles className="h-4 w-4 mr-1" /> Generate AI Message
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Review AI Negotiation Message
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ai-message">Message Preview</Label>
                <div className="relative">
                  <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generated
                  </div>
                  <Textarea
                    id="ai-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={10}
                    className="pt-10"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>
                <Edit className="h-4 w-4 mr-1" /> Edit Budget
              </Button>
              <Button onClick={handleApproveAndSend}>
                <CheckCircle className="h-4 w-4 mr-1" /> Approve & Send
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
