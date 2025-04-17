
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ProductDetailsForm } from './ProductDetailsForm';
import { BudgetDetailsForm } from './BudgetDetailsForm';
import { VendorDetailsForm } from './VendorDetailsForm';
import { MessageReviewForm } from './MessageReviewForm';

const STEPS = ['Product Details', 'Budget', 'Vendor', 'Review'];

interface NegotiationFlowProps {
  onComplete?: () => void;
}

export function NegotiationFlow({ onComplete }: NegotiationFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [productData, setProductData] = useState<any>({});
  const [budgetData, setBudgetData] = useState<any>({});
  const [vendorData, setVendorData] = useState<any>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleProductSubmit = (data: any) => {
    setProductData(data);
    setCurrentStep(1);
  };
  
  const handleBudgetSubmit = (data: any) => {
    setBudgetData(data);
    setCurrentStep(2);
  };
  
  const handleVendorSubmit = (data: any) => {
    setVendorData(data);
    setCurrentStep(3);
  };
  
  const handleMessageSubmit = async (messageData: any) => {
    // In a real app, we would send the message to the vendor
    toast({
      title: 'Negotiation Started',
      description: `Message sent to ${vendorData.vendors.length} vendor(s).`,
    });
    
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete();
    } else {
      // Navigate to negotiations tracking if no callback provided
      navigate('/negotiations');
    }
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
          {currentStep === 0 && <ProductDetailsForm onNext={handleProductSubmit} />}
          {currentStep === 1 && (
            <BudgetDetailsForm 
              onNext={handleBudgetSubmit} 
              onBack={goToPreviousStep} 
            />
          )}
          {currentStep === 2 && (
            <VendorDetailsForm 
              onNext={handleVendorSubmit} 
              onBack={goToPreviousStep} 
            />
          )}
          {currentStep === 3 && (
            <MessageReviewForm 
              productData={productData}
              budgetData={budgetData}
              vendorData={vendorData}
              onBack={goToPreviousStep}
              onComplete={handleMessageSubmit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
