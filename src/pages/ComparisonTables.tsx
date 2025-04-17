
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';

export default function ComparisonTables() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comparison Tables</h1>
          <p className="text-muted-foreground">
            Compare vendor quotes side by side
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Office Furniture</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
        
        <Card>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 font-medium">Vendor</th>
                  <th className="text-left p-3 font-medium">Price</th>
                  <th className="text-left p-3 font-medium">Delivery Time</th>
                  <th className="text-left p-3 font-medium">Warranty</th>
                  <th className="text-left p-3 font-medium">Terms</th>
                  <th className="text-left p-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-muted/50">
                  <td className="p-3">SupplyCo Inc.</td>
                  <td className="p-3">$14,000</td>
                  <td className="p-3">3 weeks</td>
                  <td className="p-3">2 years</td>
                  <td className="p-3">Net 30</td>
                  <td className="p-3">Free installation included</td>
                </tr>
                <tr className="hover:bg-muted/50 bg-green-50">
                  <td className="p-3">OfficePro</td>
                  <td className="p-3">$12,500</td>
                  <td className="p-3">4 weeks</td>
                  <td className="p-3">3 years</td>
                  <td className="p-3">Net 45</td>
                  <td className="p-3">Best overall value</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="p-3">Furniture World</td>
                  <td className="p-3">$15,200</td>
                  <td className="p-3">2 weeks</td>
                  <td className="p-3">1 year</td>
                  <td className="p-3">Net 15</td>
                  <td className="p-3">Premium materials</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="p-3">Office Essentials</td>
                  <td className="p-3">$13,800</td>
                  <td className="p-3">3 weeks</td>
                  <td className="p-3">2 years</td>
                  <td className="p-3">Net 30</td>
                  <td className="p-3">Sustainable materials</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        
        <div className="flex items-center justify-between pt-6">
          <h2 className="text-xl font-semibold">IT Equipment</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
        
        <Card>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 font-medium">Vendor</th>
                  <th className="text-left p-3 font-medium">Price</th>
                  <th className="text-left p-3 font-medium">Delivery Time</th>
                  <th className="text-left p-3 font-medium">Warranty</th>
                  <th className="text-left p-3 font-medium">Terms</th>
                  <th className="text-left p-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-muted/50 bg-green-50">
                  <td className="p-3">TechVendors LLC</td>
                  <td className="p-3">$24,000</td>
                  <td className="p-3">1 week</td>
                  <td className="p-3">3 years</td>
                  <td className="p-3">Net 30</td>
                  <td className="p-3">Best overall value</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="p-3">IT Solutions</td>
                  <td className="p-3">$26,500</td>
                  <td className="p-3">2 weeks</td>
                  <td className="p-3">4 years</td>
                  <td className="p-3">Net 45</td>
                  <td className="p-3">Extended warranty</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="p-3">Tech Direct</td>
                  <td className="p-3">$23,000</td>
                  <td className="p-3">3 weeks</td>
                  <td className="p-3">2 years</td>
                  <td className="p-3">Net 15</td>
                  <td className="p-3">No support plan included</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
