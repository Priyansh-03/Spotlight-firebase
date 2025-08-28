
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { AdSet, MetaInterest, AdVariation } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { AdPreview } from './ad-preview';
import { AdEditor } from './ad-editor';
import { MetaInterestsDisplay } from './meta-interests-display';
import { BudgetCalculator } from './budget-calculator';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';

interface AdResultsProps {
  adSet: AdSet;
  selectedInterests: MetaInterest[];
  onAdSetUpdate: (updatedAdSet: AdSet) => void;
  onSave: () => void;
  onBack: () => void;
  onRefreshVariation: (index: number) => Promise<void>;
  refreshingVariationIndex: number | null;
  onInterestSelect: (interest: MetaInterest) => void;
}

export function AdResults({ 
  adSet, 
  selectedInterests, 
  onAdSetUpdate, 
  onSave, 
  onBack, 
  onRefreshVariation, 
  refreshingVariationIndex,
  onInterestSelect 
}: AdResultsProps) {
  const [activeTab, setActiveTab] = useState('variation-0');
  const [qualityTiers, setQualityTiers] = useState<Record<number, 'low' | 'medium' | 'high'>>(
    Object.fromEntries(adSet.variations.map((_, i) => [i, 'medium']))
  );
  
  const selectedInterestIds = useMemo(() => new Set(selectedInterests.map(i => i.id)), [selectedInterests]);
  
  const handleQualityTierChange = (index: number, tier: 'low' | 'medium' | 'high') => {
    setQualityTiers(prev => ({...prev, [index]: tier}));
  };

  const activeVariationIndex = parseInt(activeTab.split('-')[1] || '0', 10);
  const activeVariation = adSet.variations[activeVariationIndex];

  // Calculate audience size based on ALL selected interests, not just ones for the active variation
  const activeAudienceSize = useMemo(() => {
    return selectedInterests.reduce((acc, interest) => acc + (interest.audience_size || 0), 0);
  }, [selectedInterests]);
  
  const durationDays = useMemo(() => {
    const { startDate, endDate } = adSet.campaignData;
    if (startDate && endDate) {
      const diff = differenceInDays(endDate, startDate);
      // Ensure duration is at least 1 day
      return diff >= 0 ? diff + 1 : 1;
    }
    // Default duration if not specified, though dates are now mandatory
    return 1;
  }, [adSet.campaignData]);
  
  const handleAdUpdate = (index: number, updatedAd: AdVariation) => {
    const newVariations = [...adSet.variations];
    newVariations[index] = updatedAd;
    const newAdSet = { ...adSet, variations: newVariations };
    onAdSetUpdate(newAdSet);
  };
  
  const handleKeywordsChange = (index: number, keywords: string[]) => {
    const newVariations = [...adSet.variations];
    const updatedAd = { ...newVariations[index], target_audience_keywords: keywords };
    newVariations[index] = updatedAd;
    const newAdSet = { ...adSet, variations: newVariations };
    onAdSetUpdate(newAdSet);
  }

  const filteredInterestsForActiveTab = useMemo(() => {
    if (!activeVariation) return [];
    const activeKeywords = new Set(activeVariation.target_audience_keywords);
    // Show all interests that match any keyword in the active variation
    const allMatchingInterests = adSet.metaInterests.filter(interest => 
      activeKeywords.has(interest.search_term)
    );
     // Deduplicate interests by ID
    return Array.from(new Map(allMatchingInterests.map(i => [i.id, i])).values());
  }, [adSet.metaInterests, activeVariation]);


  const handleRefreshClick = () => {
    onRefreshVariation(activeVariationIndex);
  };

  return (
    <motion.div 
      className="w-full max-w-screen-2xl mx-auto mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
       <div className="text-center mb-8">
            <h1 className="text-5xl font-extrabold tracking-tight animated-gradient-text">You stepped into the spotlight.</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">The world’s watching. Here are your AI-generated ad concepts.</p>
        </div>

      <div className="flex justify-between items-center mb-6 px-1">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft />
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">AdSet for: <span className="text-primary">{adSet.username}</span></h2>
        </div>
        <Button onClick={onSave}><Save className="mr-2" /> Save AdSet</Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="lg:col-span-1">
            <Tabs 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-5 bg-secondary/20">
                {adSet.variations.map((_, index) => (
                    <TabsTrigger key={index} value={`variation-${index}`}>Variation {index + 1}</TabsTrigger>
                ))}
                </TabsList>
                {adSet.variations.map((ad, index) => (
                <TabsContent key={index} value={`variation-${index}`}>
                    <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                        <div className="flex justify-center">
                            <AdPreview ad={ad} profileData={adSet.profileData} />
                        </div>
                        <div>
                            <AdEditor 
                            ad={ad}
                            index={index} 
                            onAdUpdate={handleAdUpdate}
                            />
                        </div>
                    </div>
                </TabsContent>
                ))}
            </Tabs>
        </div>
        
        <div className="lg:col-span-1 lg:sticky top-24 space-y-6">
           {activeVariation && (
            <>
              <BudgetCalculator
                  goal={adSet.campaignData.adGoal}
                  audienceSize={activeAudienceSize > 0 ? activeAudienceSize : 50000} // Pass a default audience if none selected
                  durationDays={durationDays}
                  qualityTier={qualityTiers[activeVariationIndex]}
                  onQualityTierChange={(tier) => handleQualityTierChange(activeVariationIndex, tier)}
              />
              <MetaInterestsDisplay 
                  interests={filteredInterestsForActiveTab}
                  selectedInterests={selectedInterests}
                  selectedInterestIds={selectedInterestIds}
                  onInterestSelect={onInterestSelect}
                  onRefresh={handleRefreshClick}
                  isRefreshing={refreshingVariationIndex === activeVariationIndex}
                  keywords={activeVariation.target_audience_keywords}
                  onKeywordsChange={(keywords) => handleKeywordsChange(activeVariationIndex, keywords)}
                  potentialTargets={activeVariation.potential_targets}
              />
            </>
           )}
        </div>
      </div>
    </motion.div>
  );
}
