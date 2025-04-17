
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';

export function RfxSetupForm({ onNext }: { onNext: (data: any) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [volume, setVolume] = useState('');
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
      title,
      description,
      volume,
      unit,
      files,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="step-container">
      <div>
        <h2 className="step-title">What do you want to buy?</h2>
        <p className="step-description">
          Describe the product or service you need to procure
        </p>
      </div>

      <div className="form-control">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g., Office Furniture, IT Equipment"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="form-control">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Provide details about what you're looking to purchase..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <Label htmlFor="volume">Anticipated Purchase Volume</Label>
          <Input
            id="volume"
            type="number"
            placeholder="Enter quantity"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
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

      <div className="form-control">
        <Label htmlFor="attachments">Attachments</Label>
        <div className="flex items-center gap-2">
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
            Upload PDF specifications or additional information
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

      <div className="flex justify-end">
        <Button type="submit">
          Next → Select Vendors
        </Button>
      </div>
    </form>
  );
}
