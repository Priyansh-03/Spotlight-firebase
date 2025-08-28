
'use client';

import { useMemo, useState } from 'react';
import type { MetaInterest } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Users, RefreshCw, Loader2, CheckCircle2, Copy, UserCheck, Target, Info, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { KeywordEditor } from './keyword-editor';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


interface MetaInterestsDisplayProps {
  interests: MetaInterest[];
  selectedInterests: MetaInterest[];
  selectedInterestIds: Set<string>;
  onInterestSelect: (interest: MetaInterest) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  potentialTargets: string[];
}

interface GroupedInterests {
  [key: string]: MetaInterest[];
}

export function MetaInterestsDisplay({ 
    interests, 
    selectedInterests,
    selectedInterestIds, 
    onInterestSelect, 
    onRefresh, 
    isRefreshing,
    keywords,
    onKeywordsChange,
    potentialTargets,
}: MetaInterestsDisplayProps) {
  const { toast } = useToast();

  const groupedInterests = useMemo(() => {
    if (!interests) return {};
    // Deduplicate interests by ID before grouping
    const uniqueInterests = Array.from(new Map(interests.map(i => [i.id, i])).values());
    return uniqueInterests.reduce((acc, interest) => {
      const key = interest.search_term;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(interest);
      return acc;
    }, {} as GroupedInterests);
  }, [interests]);

  const formatAudienceSize = (size: number | null | undefined): string => {
    if (size === null || size === undefined) return 'N/A';
    if (size >= 1_000_000_000) return `${(size / 1_000_000_000).toFixed(1)}B`;
    if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)}M`;
    if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
    return size.toString();
  };

  const handleCopyKeywords = () => {
    const keywordsString = keywords.join(', ');
    navigator.clipboard.writeText(keywordsString).then(() => {
      toast({
        title: 'Keywords Copied!',
        description: 'Keywords for this variation have been copied to your clipboard.',
      });
    }).catch(err => {
      console.error('Failed to copy keywords: ', err);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy keywords to the clipboard.',
      });
    });
  };

  const interestKeywords = Object.keys(groupedInterests);

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="flex flex-col gap-1.5">
          <CardTitle className="text-xl font-bold tracking-tight">Audience Targeting</CardTitle>
          <CardDescription>Refine keywords to generate new interests, then select them for your ad set.</CardDescription>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
          <div className="grid gap-4">

               <div className="grid gap-2 p-4 border rounded-lg bg-card-foreground/5">
                <Label className="flex items-center gap-2 font-semibold">
                    <UserCheck className="w-4 h-4 text-primary" /> Potential Targets
                </Label>
                 <div className="flex flex-wrap gap-2">
                    {potentialTargets.map(target => (
                      <Badge key={target} variant="default" className="text-base">{target}</Badge>
                    ))}
                  </div>
              </div>


              <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="keywords" className="flex items-center gap-2">
                        Target Keywords
                        <Tooltip>
                            <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                            <TooltipContent>
                                <p>These keywords are used to find relevant ad interests. Edit them and click 'Refresh' to see new suggestions.</p>
                            </TooltipContent>
                        </Tooltip>
                    </Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyKeywords}
                        disabled={!keywords || keywords.length === 0}
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                      Edit these keywords to refresh the Meta Ad Interests below.
                  </p>
                  <KeywordEditor
                      keywords={keywords}
                      onChange={onKeywordsChange}
                  />
              </div>
              
              {selectedInterests.length > 0 && (
                 <div className="grid gap-2 p-4 border rounded-lg bg-green-500/10 border-green-500/30">
                    <Label className="flex items-center gap-2 font-semibold text-green-300">
                        <Target className="w-4 h-4 text-green-400" /> Selected Ad Interests
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {selectedInterests.map(interest => (
                            <Badge key={interest.id} variant="default" className="flex items-center gap-2 py-1.5 pl-3 pr-1 bg-green-600/20 text-green-200 border-green-600/50">
                                <span>{interest.name}</span>
                                <span className="text-green-400/80 flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {formatAudienceSize(interest.audience_size)}
                                </span>
                                <button
                                  onClick={() => onInterestSelect(interest)}
                                  className="rounded-full hover:bg-black/20 p-0.5"
                                  aria-label={`Remove ${interest.name}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
              )}


              <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/10">
                <div>
                  <h4 className="font-semibold">Meta Ad Interests</h4>
                  <p className="text-sm text-muted-foreground">Click an interest to select it for your ad set.</p>
                </div>
                <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
                  {isRefreshing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh Interests
                </Button>
              </div>

              {isRefreshing && interests.length === 0 ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !interests || interests.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground px-4">
                    <p>
                    No Meta Interests were found for the current keywords.
                    <br />
                    Try editing the keywords above and clicking "Refresh Interests".
                    </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] w-full">
                  <Accordion type="multiple" className="w-full" defaultValue={interestKeywords}>
                    {interestKeywords.map((keyword) => (
                      <AccordionItem value={keyword} key={keyword}>
                        <AccordionTrigger className="text-lg font-medium hover:no-underline capitalize">
                          {keyword}
                          <Badge variant="secondary" className="ml-4">
                            {groupedInterests[keyword].length} Interests Found
                          </Badge>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            {groupedInterests[keyword].map((interest) => {
                                const isSelected = selectedInterestIds.has(interest.id);
                                return (
                                    <div 
                                        key={interest.id} 
                                        className={cn(
                                            "p-3 bg-card-foreground/5 rounded-md flex justify-between items-center transition-all cursor-pointer ring-2 ring-transparent hover:ring-primary/50",
                                            isSelected && "ring-green-500 bg-green-500/10"
                                        )}
                                        onClick={() => onInterestSelect(interest)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {isSelected ? 
                                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                              :
                                              <div className="h-5 w-5 border-2 border-muted-foreground rounded-full mt-0.5" />
                                            }
                                            <div>
                                                <p className="font-semibold text-base text-primary">{interest.name}</p>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="h-4 w-4" />
                                                        <span>{formatAudienceSize(interest.audience_size)}</span>
                                                    </div>
                                                    {interest.topic && <span>Topic: {interest.topic}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <a href={interest.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                        <ExternalLink className="h-5 w-5" />
                                        </a>
                                    </div>
                                )
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              )}
            </div>
            </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
