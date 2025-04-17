
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';

export function ProductDetailsForm({ onNext }: { onNext: (data: any) => void }) {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('units');
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      productName,
      description,
      quantity,
      unit,
      files,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-2">Product Details</h2>
        <p className="text-muted-foreground">
          Enter information about the product or service you want to negotiate
        </p>
      </div>

      <div>
        <Label htmlFor="productName">Product Name</Label>
        <Input
          id="productName"
          placeholder="e.g., Office Chairs, IT Services"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Provide details about what you're looking to negotiate..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger id="unit">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="units">Units</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="pieces">Pieces</SelectItem>
              <SelectItem value="licenses">Licenses</SelectItem>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="years">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="attachments">Attachments (Optional)</Label>
        <div className="flex items-center gap-2 mt-2">
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 p-2 border border-dashed rounded-md hover:bg-muted">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Upload files</span>
            </div>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <span className="text-sm text-muted-foreground">
            Upload specifications, requirements, or other supporting documents
          </span>
        </div>
        {files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                <span className="text-sm truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">
          Next: Budget Details
        </Button>
      </div>
    </form>
  );
}
