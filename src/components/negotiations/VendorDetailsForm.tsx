
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Vendor {
  id: string;
  name: string;
  email: string;
  company: string;
  selected: boolean;
}

interface VendorDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function VendorDetailsForm({ onNext, onBack }: VendorDetailsFormProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    company: ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target || typeof event.target.result !== 'string') return;

      const csvData = event.target.result;
      const lines = csvData.split('\n');
      
      // Skip header row
      const parsedVendors = lines.slice(1).map((line, index) => {
        const [name, email, company] = line.split(',');
        return {
          id: `vendor-${Date.now()}-${index}`,
          name: name?.trim() || '',
          email: email?.trim() || '',
          company: company?.trim() || '',
          selected: true
        };
      }).filter(vendor => vendor.name && vendor.email);

      setVendors([...vendors, ...parsedVendors]);
    };

    reader.readAsText(file);
  };

  const addVendor = () => {
    if (newVendor.name && newVendor.email) {
      setVendors([
        ...vendors,
        {
          id: `vendor-${Date.now()}`,
          ...newVendor,
          selected: true
        }
      ]);
      setNewVendor({ name: '', email: '', company: '' });
      setDialogOpen(false);
    }
  };

  const toggleVendorSelection = (id: string) => {
    setVendors(vendors.map(vendor => 
      vendor.id === id ? { ...vendor, selected: !vendor.selected } : vendor
    ));
  };

  const removeVendor = (id: string) => {
    setVendors(vendors.filter(vendor => vendor.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVendors = vendors.filter(vendor => vendor.selected);
    onNext({ vendors: selectedVendors });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-2">Vendor Details</h2>
        <p className="text-muted-foreground">
          Add vendors you want to negotiate with
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <label htmlFor="csv-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 p-2 border border-dashed rounded-md hover:bg-muted">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Upload CSV</span>
            </div>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Vendor</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="vendorName">Name</Label>
                  <Input
                    id="vendorName"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <Label htmlFor="vendorEmail">Email</Label>
                  <Input
                    id="vendorEmail"
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="vendorCompany">Company</Label>
                  <Input
                    id="vendorCompany"
                    value={newVendor.company}
                    onChange={(e) => setNewVendor({...newVendor, company: e.target.value})}
                    placeholder="Acme Inc."
                  />
                </div>
                
                <Button type="button" onClick={addVendor} className="w-full">
                  Add Vendor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {vendors.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <div className="p-3 bg-muted">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium">
                <div className="col-span-1"></div>
                <div className="col-span-3">Name</div>
                <div className="col-span-4">Email</div>
                <div className="col-span-3">Company</div>
                <div className="col-span-1"></div>
              </div>
            </div>
            
            <div className="divide-y max-h-60 overflow-y-auto">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-muted/50">
                  <div className="col-span-1">
                    <Checkbox
                      checked={vendor.selected}
                      onCheckedChange={() => toggleVendorSelection(vendor.id)}
                    />
                  </div>
                  <div className="col-span-3 truncate">{vendor.name}</div>
                  <div className="col-span-4 truncate">{vendor.email}</div>
                  <div className="col-span-3 truncate">{vendor.company}</div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVendor(vendor.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md">
            <p className="text-muted-foreground text-center">
              No vendors added yet. Upload a CSV file or add vendors manually.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={vendors.filter(v => v.selected).length === 0}>
          Next: Review Message
        </Button>
      </div>
    </form>
  );
}
