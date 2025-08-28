
'use client';

import type { AdSet, MetaInterest } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target } from 'lucide-react';

interface SavedAdSetsProps {
  savedAdSets: AdSet[];
}

const formatAudienceSize = (size: number | null | undefined): string => {
    if (size === null || size === undefined) return 'N/A';
    if (size >= 1_000_000_000) return `${(size / 1_000_000_000).toFixed(1)}B`;
    if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)}M`;
    if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
    return size.toString();
};

export function SavedAdSets({ savedAdSets }: SavedAdSetsProps) {
  if (savedAdSets.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 mb-20">
      <h2 className="text-2xl font-bold tracking-tight mb-4">Saved AdSets</h2>
      <Accordion type="single" collapsible className="w-full">
        {savedAdSets.map((adSet) => (
          <AccordionItem key={adSet.id} value={adSet.id}>
            <AccordionTrigger className="text-lg font-medium hover:no-underline">
              {adSet.campaignData.projectName || `AdSet for: ${adSet.username}`}
              <Badge variant="secondary" className="ml-4">{adSet.variations.length} Variations</Badge>
              <Badge variant="outline" className="ml-2">{adSet.metaInterests.length} Interests Selected</Badge>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 py-4">
                <div>
                    <h4 className="text-lg font-semibold mb-2">Selected Interests</h4>
                     {adSet.metaInterests.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                        {adSet.metaInterests.map((interest) => (
                            <Badge key={interest.id} variant="default" className="flex items-center gap-2 py-1.5 px-3 bg-green-600/20 text-green-200 border-green-600/50">
                                <Target className="w-3.5 h-3.5" />
                                <span>{interest.name}</span>
                                <span className="text-green-400/80 flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {formatAudienceSize(interest.audience_size)}
                                </span>
                            </Badge>
                        ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No interests were selected for this ad set.</p>
                    )}
                </div>

                <div>
                    <h4 className="text-lg font-semibold mb-2 mt-4">Ad Variations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {adSet.variations.map((variation, index) => (
                      <Card key={index} className="bg-card/50">
                        <CardHeader>
                          <CardTitle className="text-base">Variation {index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p><strong className="text-muted-foreground">Headline:</strong> {variation.headline}</p>
                          <p><strong className="text-muted-foreground">Text:</strong> {variation.primaryText}</p>
                          <p><strong className="text-muted-foreground">Description:</strong> {variation.description}</p>
                           <div className="pt-2">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Keywords:</p>
                                <div className="flex flex-wrap gap-1">
                                    {variation.target_audience_keywords.map(kw => <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>)}
                                </div>
                           </div>
                        </CardContent>
                      </Card>
                    ))}
                    </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
