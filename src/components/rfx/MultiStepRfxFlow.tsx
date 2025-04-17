
import React, { useState } from 'react';
import { RfxSetupForm } from './RfxSetupForm';
import { VendorSelectionForm } from './VendorSelectionForm';
import { EmailReviewForm } from './EmailReviewForm';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const STEPS = ['Setup', 'Vendors', 'Review'];

export function MultiStepRfxFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [rfxData, setRfxData] = useState<any>({});
  const [vendorData, setVendorData] = useState<any>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSetupSubmit = (data: any) => {
    setRfxData(data);
    setCurrentStep(1);
  };
  
  const handleVendorSubmit = (data: any) => {
    setVendorData(data);
    setCurrentStep(2);
  };
  
  const handleEmailSubmit = (emails: any[]) => {
    // In a real app, we would send these emails
    toast({
      title: 'RFx Created Successfully',
      description: `Emails sent to ${emails.length} vendors.`,
    });
    
    // Navigate to dashboard
    navigate('/dashboard');
  };
  
  const goToPreviousStep = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };
  
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step, index) => (
            <div 
              key={step}
              className={`text-sm font-medium ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && <RfxSetupForm onNext={handleSetupSubmit} />}
          {currentStep === 1 && (
            <VendorSelectionForm 
              onNext={handleVendorSubmit} 
              onBack={goToPreviousStep} 
            />
          )}
          {currentStep === 2 && (
            <EmailReviewForm 
              rfxData={rfxData} 
              vendorData={vendorData} 
              onBack={goToPreviousStep}
              onComplete={handleEmailSubmit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
