
'use client';

import { useEffect, useState } from 'react';
import type { AdVariation } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface AdEditorProps {
  ad: AdVariation;
  index: number;
  onAdUpdate: (index: number, updatedAd: AdVariation) => void;
}

export function AdEditor({ ad, index, onAdUpdate }: AdEditorProps) {
  const [editedAd, setEditedAd] = useState<AdVariation>(ad);

  useEffect(() => {
    setEditedAd(ad);
  }, [ad]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const updated = { ...editedAd, [name]: value };
    setEditedAd(updated);
    onAdUpdate(index, updated);
  };
  
  return (
    <Card className="w-full h-full border-dashed shadow-none">
      <CardHeader>
        <CardTitle>Edit Ad Variation {index + 1}</CardTitle>
        <CardDescription>Refine the AI-generated copy for this variation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <TooltipProvider>
        <div className="grid gap-2">
          <Label htmlFor={`headline-${index}`} className="flex items-center gap-2">
            Headline
            <Tooltip>
                <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                <TooltipContent>
                    <p>The main title of your ad. Keep it short and catchy (under 40 characters).</p>
                </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id={`headline-${index}`}
            name="headline"
            value={editedAd.headline}
            onChange={handleChange}
            placeholder="Catchy Headline"
            className="text-base"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`primaryText-${index}`} className="flex items-center gap-2">
            Primary Text
             <Tooltip>
                <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                <TooltipContent>
                    <p>The main body of your ad. This is where you explain your offer or story.</p>
                </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id={`primaryText-${index}`}
            name="primaryText"
            value={editedAd.primaryText}
            onChange={handleChange}
            placeholder="Engaging primary text for the ad."
            className="min-h-[120px] text-base"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`description-${index}`} className="flex items-center gap-2">
            Description
            <Tooltip>
                <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                <TooltipContent>
                    <p>Optional text that appears below the headline, often used for a call to action.</p>
                </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id={`description-${index}`}
            name="description"
            value={editedAd.description}
            onChange={handleChange}
            placeholder="Brief description (optional)"
            className="text-base"
          />
        </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
