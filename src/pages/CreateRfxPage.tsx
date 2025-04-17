
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MultiStepRfxFlow } from '@/components/rfx/MultiStepRfxFlow';

export default function CreateRfxPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New RFx</h1>
          <p className="text-muted-foreground">
            Set up a new request for quote or information to send to vendors
          </p>
        </div>
        
        <MultiStepRfxFlow />
      </div>
    </AppLayout>
  );
}
