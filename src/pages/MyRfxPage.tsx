
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle, ChevronRight, Mail, BarChart2 } from 'lucide-react';

// Mock data
const rfxRequests = [
  { 
    id: 1, 
    title: 'Office Furniture', 
    description: 'Desks, chairs, and conference tables for new office',
    createdDate: '2025-04-08',
    status: 'awaiting',
    vendorCount: 5,
  },
  { 
    id: 2, 
    title: 'IT Equipment', 
    description: '20 laptops for new hires',
    createdDate: '2025-04-07',
    status: 'responded',
    vendorCount: 3,
  },
  { 
    id: 3, 
    title: 'Software Licenses', 
    description: '50 licenses for project management software',
    createdDate: '2025-04-05',
    status: 'followUp',
    vendorCount: 4,
  },
  { 
    id: 4, 
    title: 'Catering Services', 
    description: 'Company retreat catering',
    createdDate: '2025-04-03',
    status: 'completed',
    vendorCount: 6,
  },
];

export default function MyRfxPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My RFx Requests</h1>
            <p className="text-muted-foreground">
              View and manage all your procurement requests
            </p>
          </div>
          <Button asChild>
            <Link to="/create-rfx" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create New RFx
            </Link>
          </Button>
        </div>
        
        <Card>
          <div className="rounded-md border">
            <div className="p-4 bg-muted">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Created Date</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Vendor Count</div>
                <div className="col-span-2">Action</div>
              </div>
            </div>
            
            <div className="divide-y">
              {rfxRequests.map((rfx) => (
                <div key={rfx.id} className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <div className="font-medium">{rfx.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {rfx.description}
                      </div>
                    </div>
                    <div className="col-span-2 text-sm">
                      {new Date(rfx.createdDate).toLocaleDateString()}
                    </div>
                    <div className="col-span-2">
                      <div className={`
                        status-badge 
                        ${rfx.status === 'awaiting' ? 'status-badge-awaiting' : ''}
                        ${rfx.status === 'responded' ? 'status-badge-responded' : ''}
                        ${rfx.status === 'followUp' ? 'status-badge-follow-up' : ''}
                      `}>
                        {{
                          'awaiting': 'Awaiting Reply',
                          'responded': 'Responded',
                          'followUp': 'Needs Follow-up',
                          'completed': 'Completed'
                        }[rfx.status]}
                      </div>
                    </div>
                    <div className="col-span-2">
                      {rfx.vendorCount} vendors
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/inbox" className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            Inbox
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/comparison-tables/${rfx.id}`} className="flex items-center gap-1">
                            <BarChart2 className="h-3.5 w-3.5" />
                            Compare
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
