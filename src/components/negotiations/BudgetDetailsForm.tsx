
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface BudgetDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function BudgetDetailsForm({ onNext, onBack }: BudgetDetailsFormProps) {
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [targetBudget, setTargetBudget] = useState('');
  const [sliderValue, setSliderValue] = useState([50]);
  const [notes, setNotes] = useState('');
  
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    
    // Update target budget based on slider position between min and max
    if (minBudget && maxBudget) {
      const min = parseFloat(minBudget);
      const max = parseFloat(maxBudget);
      const targetValue = min + ((max - min) * value[0]) / 100;
      setTargetBudget(targetValue.toFixed(2));
    }
  };

  const updateBudgetRange = () => {
    if (minBudget && maxBudget) {
      const min = parseFloat(minBudget);
      const max = parseFloat(maxBudget);
      
      // Set initial target to midpoint
      if (!targetBudget) {
        const midpoint = (min + max) / 2;
        setTargetBudget(midpoint.toFixed(2));
        
        // Set slider to 50% (midpoint)
        setSliderValue([50]);
      } else {
        // Adjust slider to match current target budget
        const target = parseFloat(targetBudget);
        const percentage = ((target - min) / (max - min)) * 100;
        setSliderValue([Math.max(0, Math.min(100, percentage))]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      minBudget: parseFloat(minBudget),
      maxBudget: parseFloat(maxBudget),
      targetBudget: parseFloat(targetBudget),
      notes
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-2">Budget Details</h2>
        <p className="text-muted-foreground">
          Set your budget range and target for this negotiation
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minBudget">Minimum Budget ($)</Label>
          <Input
            id="minBudget"
            type="number"
            placeholder="Lowest acceptable price"
            value={minBudget}
            onChange={(e) => {
              setMinBudget(e.target.value);
              setTimeout(updateBudgetRange, 100);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="maxBudget">Maximum Budget ($)</Label>
          <Input
            id="maxBudget"
            type="number"
            placeholder="Highest price you'd pay"
            value={maxBudget}
            onChange={(e) => {
              setMaxBudget(e.target.value);
              setTimeout(updateBudgetRange, 100);
            }}
            required
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <Label htmlFor="targetBudget">Target Budget ($)</Label>
          <Input
            id="targetBudget"
            type="number"
            value={targetBudget}
            onChange={(e) => setTargetBudget(e.target.value)}
            className="w-24 text-right"
            required
          />
        </div>
        
        {minBudget && maxBudget && (
          <div className="pt-4 px-2">
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              value={sliderValue}
              onValueChange={handleSliderChange}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${minBudget}</span>
              <span>${maxBudget}</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <textarea
          id="notes"
          placeholder="Any special constraints or considerations for this negotiation..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Next: Vendor Details
        </Button>
      </div>
    </form>
  );
}
