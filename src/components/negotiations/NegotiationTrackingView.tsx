
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NegotiationTracker } from '../inbox/NegotiationTracker';
import { BarChart2, TrendingUp, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for RFx requests
const rfxRequests = [
  { id: 1, title: 'Office Furniture' },
  { id: 2, title: 'IT Equipment' },
  { id: 3, title: 'Software Licenses' },
];

// Define the type for negotiation status
type NegotiationStatus = 'inProgress' | 'accepted' | 'declined' | 'countered';

// Mock negotiation data
const mockNegotiations = [
  {
    id: 1,
    vendorName: 'SupplyCo Inc.',
    rfxId: 1,
    targetBudget: [12000, 14000] as [number, number],
    currentOffer: 14000,
    status: 'inProgress' as NegotiationStatus,
    history: [
      {
        date: '2025-04-08T12:30:00Z',
        type: 'initial' as const,
        amount: 15000,
        message: 'Initial quote for office furniture package.'
      },
      {
        date: '2025-04-09T09:15:00Z',
        type: 'counter' as const,
        amount: 14000,
        message: 'Counter offer based on our budget constraints.'
      }
    ]
  },
  {
    id: 2,
    vendorName: 'TechVendors LLC',
    rfxId: 2,
    targetBudget: [18000, 20000] as [number, number],
    currentOffer: 19500,
    status: 'countered' as NegotiationStatus,
    history: [
      {
        date: '2025-04-06T10:45:00Z',
        type: 'initial' as const,
        amount: 22000,
        message: 'Initial quote for IT equipment.'
      },
      {
        date: '2025-04-07T14:22:00Z',
        type: 'counter' as const,
        amount: 20000,
        message: 'Our budget cap is $20,000.'
      },
      {
        date: '2025-04-08T09:30:00Z',
        type: 'vendor' as const,
        amount: 19500,
        message: 'We can adjust to $19,500 with standard warranty.'
      }
    ]
  },
  {
    id: 3,
    vendorName: 'Software Solutions',
    rfxId: 3,
    targetBudget: [5000, 6000] as [number, number],
    currentOffer: 5800,
    status: 'accepted' as NegotiationStatus,
    history: [
      {
        date: '2025-04-05T11:30:00Z',
        type: 'initial' as const,
        amount: 6500,
        message: 'Quote for 50 software licenses.'
      },
      {
        date: '2025-04-06T09:15:00Z',
        type: 'counter' as const,
        amount: 5800,
        message: 'We are looking for a price point closer to $5,800.'
      },
      {
        date: '2025-04-07T14:00:00Z',
        type: 'accepted' as const,
        amount: 5800,
        message: 'We accept your offer of $5,800 for the annual licenses.'
      }
    ]
  }
];

export function NegotiationTrackingView() {
  const [selectedRfxId, setSelectedRfxId] = useState<number>(1);
  const [view, setView] = useState<'all' | 'active' | 'completed'>('all');
  
  // Filter negotiations by selected RFx and view
  const filteredNegotiations = mockNegotiations.filter(negotiation => {
    if (selectedRfxId !== negotiation.rfxId) return false;
    
    if (view === 'active') {
      return negotiation.status === 'inProgress' || negotiation.status === 'countered';
    }
    if (view === 'completed') {
      return negotiation.status === 'accepted' || negotiation.status === 'declined';
    }
    return true;
  });
  
  const handleRfxChange = (value: string) => {
    setSelectedRfxId(parseInt(value));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Negotiation Tracking</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="w-full max-w-xs">
          <Select value={selectedRfxId.toString()} onValueChange={handleRfxChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select RFx" />
            </SelectTrigger>
            <SelectContent>
              {rfxRequests.map((rfx) => (
                <SelectItem key={rfx.id} value={rfx.id.toString()}>
                  📂 {rfx.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Tabs value={view} onValueChange={(v) => setView(v as 'all' | 'active' | 'completed')}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="space-y-4">
        {filteredNegotiations.length > 0 ? (
          filteredNegotiations.map((negotiation) => (
            <div key={negotiation.id} className="rounded-lg overflow-hidden">
              <NegotiationTracker 
                vendorName={negotiation.vendorName}
                targetBudget={negotiation.targetBudget}
                currentOffer={negotiation.currentOffer}
                status={negotiation.status}
                history={negotiation.history}
              />
            </div>
          ))
        ) : (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <TrendingUp className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">No negotiations found</h3>
              <p className="text-sm text-muted-foreground">
                There are no active negotiations for this RFx request.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
