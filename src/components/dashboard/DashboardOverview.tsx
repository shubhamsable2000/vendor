
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2, Inbox, Clock, Clipboard, ChevronRight, Plus, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data
const recentRfxRequests = [
  { id: 1, title: "Office Furniture", status: "awaiting", vendorCount: 5, date: "2025-04-08" },
  { id: 2, title: "IT Equipment", status: "responded", vendorCount: 3, date: "2025-04-07" },
  { id: 3, title: "Software Licenses", status: "followUp", vendorCount: 4, date: "2025-04-05" },
];

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button asChild>
          <Link to="/create-rfx" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New RFx
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active RFx Requests
            </CardTitle>
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Responses
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 vendors slow to respond
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Messages
            </CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              3 require your attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comparison Tables
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              +1 ready for review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent RFx Requests</CardTitle>
            <CardDescription>
              Your recently created procurement requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRfxRequests.map(rfx => (
                <div 
                  key={rfx.id} 
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted"
                >
                  <div className="flex flex-col">
                    <div className="font-medium">{rfx.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(rfx.date).toLocaleDateString()} · {rfx.vendorCount} vendors
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`
                      status-badge 
                      ${rfx.status === 'awaiting' ? 'status-badge-awaiting' : ''}
                      ${rfx.status === 'responded' ? 'status-badge-responded' : ''}
                      ${rfx.status === 'followUp' ? 'status-badge-follow-up' : ''}
                    `}>
                      {{
                        'awaiting': 'Awaiting Reply',
                        'responded': 'Responded',
                        'followUp': 'Needs Follow-up'
                      }[rfx.status]}
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/my-rfx/${rfx.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" asChild>
              <Link to="/my-rfx">
                View All RFx Requests
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>
              Latest responses from your vendors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">SupplyCo Inc.</div>
                    <div className="text-sm text-muted-foreground">
                      Quote for Office Furniture
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/inbox">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">TechVendors LLC</div>
                    <div className="text-sm text-muted-foreground">
                      RE: IT Equipment Quote
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/inbox">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Software Solutions</div>
                    <div className="text-sm text-muted-foreground">
                      License Quote Request
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/inbox">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-4" asChild>
              <Link to="/inbox">
                View All Messages
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
