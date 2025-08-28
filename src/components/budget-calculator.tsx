
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { IndianRupee, TrendingUp, Calendar, Target, Sparkles, Trophy, Info } from 'lucide-react';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { estimateMetaAdBudget, reverseEstimateFromBudget } from '@/lib/budget-estimator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface BudgetCalculatorProps {
    goal: string;
    audienceSize: number;
    durationDays: number;
    qualityTier: 'low' | 'medium' | 'high';
    onQualityTierChange: (tier: 'low' | 'medium' | 'high') => void;
}

const Stat = ({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string | number, subValue?: string }) => (
    <div className="flex flex-col gap-1 p-3 bg-secondary/10 rounded-lg text-center">
        <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
        <div className="text-xl font-bold text-primary">{value}</div>
        {subValue && <div className="text-xs text-muted-foreground">{subValue}</div>}
    </div>
);

const goalMapping: { [key: string]: string } = {
    traffic: 'traffic',
    leads: 'leads',
    sales: 'conversions',
    other: 'engagement', 
};


export function BudgetCalculator({
  goal,
  audienceSize,
  durationDays,
  qualityTier,
  onQualityTierChange,
}: BudgetCalculatorProps) {
  const [totalBudget, setTotalBudget] = useState(0);
  const [dailyBudget, setDailyBudget] = useState(0);
  const [expectedActions, setExpectedActions] = useState(0);
  const [estimatedCpr, setEstimatedCpr] = useState('');
  
  const [isManualEdit, setIsManualEdit] = useState(false);

  // Main effect to handle all calculations
  useEffect(() => {
    // If user is not manually editing, get AI suggestion
    if (!isManualEdit) {
      const result = estimateMetaAdBudget({
        goal,
        audienceSize,
        durationDays,
        qualityTier,
      });
      if (!('error' in result)) {
        setTotalBudget(result.totalBudget);
        setDailyBudget(result.dailyBudget);
        setExpectedActions(result.expectedActions);
        setEstimatedCpr(result.cpr);
      }
    } 
    // If user IS manually editing, reverse-calculate the metrics
    else {
      const result = reverseEstimateFromBudget({
        goal,
        audienceSize,
        durationDays,
        totalBudget,
        qualityTier,
      });
      if (!('error' in result)) {
        setDailyBudget(result.dailyBudget);
        setExpectedActions(result.expectedActions);
        setEstimatedCpr(result.cpr);
      }
    }
  // isManualEdit is intentionally omitted to avoid loops.
  // We only want this to re-run when external props or the budget changes.
  }, [goal, audienceSize, durationDays, qualityTier, totalBudget]);

  const handleSliderChange = (value: number[]) => {
    setIsManualEdit(true);
    setTotalBudget(value[0] >= 0 ? value[0] : 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualEdit(true);
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
        setTotalBudget(value >= 0 ? value : 0);
    } else {
        setTotalBudget(0);
    }
  };

  const handleQualityTierChange = (tier: 'low' | 'medium' | 'high') => {
    setIsManualEdit(false); // When tier changes, revert to AI suggestion
    onQualityTierChange(tier);
  }

  const maxBudget = Math.max(50000, totalBudget * 2, 1000);
  const displayGoal = goalMapping[goal] || 'engagement';


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="text-primary" /> Budget Estimator
        </CardTitle>
        <CardDescription>
          Select a budget tier for an AI suggestion, then adjust your ad spend based on your goals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <TooltipProvider>
        <div>
          <Label className="font-semibold flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-primary" /> Budget Tier
             <Tooltip>
                <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                <TooltipContent>
                    <p>Select a spending level. 'Low' is for testing, 'Medium' is balanced, and 'High' is for maximum reach.</p>
                </TooltipContent>
            </Tooltip>
          </Label>
          <RadioGroup
            value={qualityTier}
            onValueChange={(value) => handleQualityTierChange(value as 'low' | 'medium' | 'high')}
            className="grid grid-cols-3 gap-4"
          >
            <Label htmlFor="low" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-muted/50 transition-all cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
              <RadioGroupItem value="low" id="low" className="peer sr-only" />
              Low
            </Label>
            <Label htmlFor="medium" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-muted/50 transition-all cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
              <RadioGroupItem value="medium" id="medium" className="peer sr-only" />
              Medium
            </Label>
            <Label htmlFor="high" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-muted/50 transition-all cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
              <RadioGroupItem value="high" id="high" className="peer sr-only" />
              High
            </Label>
          </RadioGroup>
        </div>

        <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className='col-span-2 space-y-2'>
                <Label htmlFor="budget-input" className="flex items-center gap-2">
                    Total Budget (₹)
                     <Tooltip>
                        <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                        <TooltipContent>
                            <p>Adjust the total amount you want to spend for the campaign duration.</p>
                        </TooltipContent>
                    </Tooltip>
                </Label>
                <div className='flex items-center gap-4'>
                    <Slider
                        value={[totalBudget]}
                        onValueChange={handleSliderChange}
                        max={maxBudget}
                        min={0}
                        step={500}
                        className="flex-1"
                    />
                    <Input
                        id="budget-input"
                        type="number"
                        value={totalBudget}
                        onChange={handleInputChange}
                        className="w-28"
                        step={500}
                        min={0}
                    />
                </div>
              </div>
              
               <Stat icon={<IndianRupee className="w-4 h-4" />} label="Total Budget" value={`₹${totalBudget.toLocaleString('en-IN')}`} />
               <Stat icon={<Calendar className="w-4 h-4" />} label="Daily Budget" value={`₹${dailyBudget.toLocaleString('en-IN')}`} />
             </div>
             <div className="p-4 bg-card-foreground/5 rounded-lg space-y-2">
                 <h4 className="font-semibold text-center text-muted-foreground">Expected Results ({durationDays} Days)</h4>
                 <div className="flex justify-around items-center text-center">
                    <div className="flex flex-col items-center">
                        <p className="text-sm text-muted-foreground capitalize flex items-center gap-1"><Target className="w-3 h-3"/> Goal</p>
                        <p className="font-bold text-lg capitalize">{displayGoal}</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-sm text-muted-foreground capitalize flex items-center gap-1"><Sparkles className="w-3 h-3"/> Actions</p>
                        <p className="font-bold text-lg">{typeof expectedActions === 'number' ? expectedActions.toLocaleString('en-IN') : '...'}</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <p className="text-sm text-muted-foreground capitalize flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Est. CPR</p>
                        <p className="font-bold text-lg">{estimatedCpr}</p>
                    </div>
                 </div>
             </div>
          </div>
          </TooltipProvider>
      </CardContent>
    </Card>
  );
}
