
import React from 'react';
import { Card } from '@/components/ui/card';

interface NegotiationHistory {
  date: string;
  type: 'initial' | 'vendor' | 'counter' | 'accepted' | 'declined';
  amount: number;
  message?: string;
}

interface NegotiationTrackerProps {
  vendorName: string;
  targetBudget: [number, number];
  currentOffer: number;
  status: 'inProgress' | 'accepted' | 'declined' | 'countered';
  history: NegotiationHistory[];
}

export function NegotiationTracker({
  vendorName,
  targetBudget,
  currentOffer,
  status,
  history
}: NegotiationTrackerProps) {
  const getStatusLabel = () => {
    switch (status) {
      case 'inProgress': return 'In Progress';
      case 'accepted': return 'Accepted';
      case 'declined': return 'Declined';
      case 'countered': return 'Countered';
      default: return 'Unknown';
    }
  };
  
  const getStatusColorClass = () => {
    switch (status) {
      case 'inProgress': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'countered': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-lg">Negotiation with {vendorName}</h3>
        <div className={`px-3 py-1 rounded-full text-sm ${getStatusColorClass()}`}>
          {getStatusLabel()}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Your Target Budget</div>
            <div className="font-medium">
              ${targetBudget[0]} - ${targetBudget[1]}
            </div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Current Offer</div>
            <div className="font-medium">${currentOffer}</div>
          </div>
        </div>
        
        {history.length > 0 && (
          <div>
            <div className="text-sm text-muted-foreground mb-2">Negotiation History</div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {history.map((item, index) => (
                <div key={index} className="bg-background border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          item.type === 'vendor' ? 'bg-purple-500' : 
                          item.type === 'counter' ? 'bg-blue-500' :
                          item.type === 'accepted' ? 'bg-green-500' :
                          item.type === 'declined' ? 'bg-red-500' : 'bg-gray-500'
                        }`} 
                      />
                      <div className="text-sm">
                        {item.type === 'vendor' ? 'Vendor Offer' : 
                         item.type === 'counter' ? 'Your Counter' :
                         item.type === 'accepted' ? 'Offer Accepted' :
                         item.type === 'declined' ? 'Offer Declined' : 'Initial Quote'}
                      </div>
                    </div>
                    <div className="text-sm">{new Date(item.date).toLocaleDateString()}</div>
                  </div>
                  <div className="font-medium mt-1">${item.amount}</div>
                  {item.message && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.message}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
