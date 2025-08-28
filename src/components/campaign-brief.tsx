
'use client';

import type { CampaignFormData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Target, MapPin, Milestone } from 'lucide-react';
import { format } from 'date-fns';

interface CampaignBriefProps {
  campaignData: CampaignFormData;
}

export function CampaignBrief({ campaignData }: CampaignBriefProps) {
  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle>{campaignData.projectName || "Your Campaign"}</CardTitle>
        <CardDescription>A summary of your campaign settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" /> Ad Goal
          </h4>
          <Badge variant="secondary" className="capitalize text-base">
            {campaignData.adGoal === 'other' ? campaignData.customAdGoal || 'Custom' : campaignData.adGoal}
          </Badge>
        </div>
        
        {(campaignData.startDate || campaignData.endDate) && (
            <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" /> Dates
            </h4>
            <div className="text-sm text-muted-foreground">
                {campaignData.startDate && <p><strong>Start:</strong> {format(campaignData.startDate, "PPP")}</p>}
                {campaignData.endDate && <p><strong>End:</strong> {format(campaignData.endDate, "PPP")}</p>}
            </div>
            </div>
        )}

        {campaignData.locations && campaignData.locations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" /> Target Locations
            </h4>
            <div className="flex flex-wrap gap-1">
              {campaignData.locations.map(loc => (
                <Badge key={loc} variant="outline">{loc}</Badge>
              ))}
            </div>
          </div>
        )}

        {campaignData.businessSnapshot && (
            <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Milestone className="w-4 h-4 text-primary" /> Business Snapshot
            </h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {campaignData.businessSnapshot}
            </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

