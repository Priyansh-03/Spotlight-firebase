
'use client';

import { useState, useEffect } from 'react';
import type { ProfileAnalysis } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { KeywordEditor } from './keyword-editor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Info } from 'lucide-react';

interface EditableAnalysisCardProps {
  analysis: ProfileAnalysis;
  onAnalysisUpdate: (updatedAnalysis: ProfileAnalysis) => void;
}

export function EditableAnalysisCard({ analysis, onAnalysisUpdate }: EditableAnalysisCardProps) {
  const [editedAnalysis, setEditedAnalysis] = useState(analysis);

  useEffect(() => {
    setEditedAnalysis(analysis);
  }, [analysis]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updated = { ...editedAnalysis, [name]: value };
    setEditedAnalysis(updated);
    onAnalysisUpdate(updated);
  };
  
  const handleKeywordsChange = (field: 'target_audience_keywords' | 'potential_targets', keywords: string[]) => {
    const updated = { ...editedAnalysis, [field]: keywords };
    setEditedAnalysis(updated);
    onAnalysisUpdate(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Profile Analysis</CardTitle>
        <CardDescription>
          Review and refine the AI's analysis. Your changes will guide the ad generation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <TooltipProvider>
        <div className="grid gap-2">
          <Label htmlFor="summary" className="flex items-center gap-2">
            Profile Summary
             <Tooltip>
                <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                <TooltipContent>
                    <p>The AI's understanding of the profile. Edit this to correct any misunderstandings.</p>
                </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id="summary"
            name="summary"
            value={editedAnalysis.summary}
            onChange={handleChange}
            placeholder="A brief summary of the profile."
            className="min-h-[100px] text-base"
          />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="niche" className="flex items-center gap-2">
                AI Niche
                 <Tooltip>
                    <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                    <TooltipContent>
                        <p>The business category identified by the AI. Correct this if it's wrong.</p>
                    </TooltipContent>
                </Tooltip>
            </Label>
            <Input
              id="niche"
              name="niche"
              value={editedAnalysis.niche}
              onChange={handleChange}
              placeholder="e.g., Fitness Coach"
              className="text-base"
            />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="target_audience_keywords" className="flex items-center gap-2">
                Target Audience Keywords
                <Tooltip>
                    <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                    <TooltipContent>
                        <p>Keywords describing your ideal customers. These will be used to find ad interests.</p>
                    </TooltipContent>
                </Tooltip>
            </Label>
            <p className="text-sm text-muted-foreground">
                Edit the keywords the AI will use to generate ad variations.
            </p>
            <KeywordEditor 
              keywords={editedAnalysis.target_audience_keywords}
              onChange={(keywords) => handleKeywordsChange('target_audience_keywords', keywords)}
              placeholder='Add a target keyword...'
            />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="potential_targets" className="flex items-center gap-2">
                Potential Target Categories
                 <Tooltip>
                    <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                    <TooltipContent>
                        <p>Broad business categories you want to target. The AI will use these for inspiration.</p>
                    </TooltipContent>
                </Tooltip>
            </Label>
             <p className="text-sm text-muted-foreground">
                Edit the business categories the AI will use for inspiration.
            </p>
            <KeywordEditor 
              keywords={editedAnalysis.potential_targets}
              onChange={(keywords) => handleKeywordsChange('potential_targets', keywords)}
              placeholder='Add a target category...'
            />
        </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
