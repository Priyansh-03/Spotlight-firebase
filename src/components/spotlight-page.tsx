
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { analyzeProfileAction, generateAdsAction, refreshSingleVariationAction } from '@/app/actions';
import { AdSet, AnalysisResult, ProfileAnalysis, MetaInterest, AdVariation, CampaignFormData } from '@/types';
import { CampaignFormDataSchema } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Instagram, Wand2, Calendar as CalendarIcon, Milestone, MapPin, Edit3, ArrowRight, BrainCircuit, Search, Eye, Sparkles, Info } from 'lucide-react';
import { AdResults } from './ad-results';
import { SavedAdSets } from './saved-adsets';
import { AnalysisSummary } from './analysis-summary';
import { FeaturesShowcase } from './features-showcase';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { KeywordEditor } from './keyword-editor';
import { Textarea } from './ui/textarea';
import { Label } from '@/components/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import { LoadingAnimation } from './loading-animation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const formSchema = CampaignFormDataSchema;

type PageState = 'idle' | 'analyzing' | 'analysis_complete' | 'generating_ads' | 'results';

const analysisSteps = [
    { message: "Scraping your profile URL...", icon: <Search className="h-6 w-6" /> },
    { message: "Fetching your latest posts and bio...", icon: <FileText className="h-6 w-6" /> },
    { message: "Analyzing your brand tone and content...", icon: <BrainCircuit className="h-6 w-6" /> },
    { message: "Hmm... I sense a strong brand personality here.", icon: <Sparkles className="h-6 w-6" /> },
    { message: "Looks like a solid business — let’s build on that.", icon: <Sparkles className="h-6 w-6" /> },
    { message: "Reading between the lines... your niche is coming into focus.", icon: <Sparkles className="h-6 w-6" /> },
];

const generationSteps = [
    { message: "Crafting high-converting captions...", icon: <Wand2 className="h-6 w-6" /> },
    { message: "Designing scroll-stopping headlines...", icon: <Edit3 className="h-6 w-6" /> },
    { message: "Selecting the best keywords and hashtags for your audience...", icon: <BrainCircuit className="h-6 w-6" /> },
    { message: "Finalizing creatives and polishing your pitch...", icon: <Eye className="h-6 w-6" /> },
    { message: "Almost done... reviewing for performance impact.", icon: <Sparkles className="h-6 w-6" /> },
    { message: "Packaging your spotlight moment...", icon: <Sparkles className="h-6 w-6" /> },
];

export default function SpotlightPage() {
  const [pageState, setPageState] = useState<PageState>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignFormData | null>(null);
  const [currentAdSet, setCurrentAdSet] = useState<AdSet | null>(null);
  const [savedAdSets, setSavedAdSets] = useState<AdSet[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<MetaInterest[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDoneLoading, setIsDoneLoading] = useState(false);
  const [refreshingVariationIndex, setRefreshingVariationIndex] = useState<number | null>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      username: '',
      projectName: '',
      businessSnapshot: '',
      adGoal: 'traffic',
      customAdGoal: '',
      locations: [],
      startDate: undefined,
      endDate: undefined,
    },
  });
  
  useEffect(() => {
    setIsLoading(pageState === 'analyzing' || pageState === 'generating_ads');
  }, [pageState]);
  
  useEffect(() => {
    if (isDoneLoading) {
      const timer = setTimeout(() => {
         if (pageState === 'analyzing') {
            setPageState('analysis_complete');
         } else if (pageState === 'generating_ads') {
            setPageState('results');
         }
         setIsDoneLoading(false);
      }, 1000); // 1 second pause
      return () => clearTimeout(timer);
    }
  }, [isDoneLoading, pageState]);

  const watchAdGoal = form.watch('adGoal');

  const handleAnalyze = async (values: z.infer<typeof formSchema>) => {
    setPageState('analyzing');
    setCampaignData(values); 
    const result = await analyzeProfileAction(values);

    if (result.success && result.data) {
      setAnalysisResult(result.data);
      setIsDoneLoading(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Analyzing Profile',
        description: result.error || 'An unknown error occurred.',
      });
      setPageState('idle');
    }
  };
  
  const handleGenerateAds = async () => {
    if (!analysisResult || !campaignData) return;
    
    // Ensure dates are selected before generating ads
    if (!campaignData.startDate || !campaignData.endDate) {
        toast({
            variant: 'destructive',
            title: 'Campaign Dates Required',
            description: 'Please select a start and end date for your campaign before generating ads.',
        });
        return;
    }

    setPageState('generating_ads');
    
    const result = await generateAdsAction({
        profileData: analysisResult.profileData,
        analysis: analysisResult.analysis,
        campaignData: campaignData,
    });

    if (result.success && result.data) {
      setCurrentAdSet({
        id: new Date().toISOString(),
        username: result.data.profileData.profile_info.username,
        profileData: result.data.profileData,
        variations: result.data.adVariations,
        metaInterests: result.data.metaInterests,
        analysis: analysisResult.analysis,
        campaignData: campaignData,
      });
       setSelectedInterests([]);
      setIsDoneLoading(true);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error Generating Ads',
            description: result.error || 'An unknown error occurred.',
        });
        setPageState('analysis_complete');
    }
  };

  const handleSaveAdSet = () => {
    if (currentAdSet) {
      const adSetToSave = { ...currentAdSet, metaInterests: selectedInterests };
      // Avoid saving duplicates by checking ID
      if (!savedAdSets.some(set => set.id === adSetToSave.id)) {
        const newSavedSets = [adSetToSave, ...savedAdSets];
        setSavedAdSets(newSavedSets);
        toast({
            title: 'AdSet Saved!',
            description: `The AdSet for ${currentAdSet.username} has been saved with your selected interests.`,
        });
      } else {
        // If it's already saved, maybe we want to update it
        const updatedSavedSets = savedAdSets.map(set => set.id === adSetToSave.id ? adSetToSave : set);
        setSavedAdSets(updatedSavedSets);
        toast({
            title: 'AdSet Updated!',
            description: `Your AdSet for ${currentAdSet.username} has been updated with the latest selections.`,
        });
      }
    }
  }

  const handleAdSetUpdate = (updatedAdSet: AdSet) => {
    setCurrentAdSet(updatedAdSet);
  }

  const handleAnalysisUpdate = (updatedAnalysis: ProfileAnalysis) => {
    if (analysisResult) {
      const newAnalysisResult = { ...analysisResult, analysis: updatedAnalysis };
      setAnalysisResult(newAnalysisResult);
       if (currentAdSet) {
            setCurrentAdSet({
                ...currentAdSet,
                analysis: updatedAnalysis,
            });
        }
    }
  }
  
  const handleNewAnalysis = () => {
    setPageState('idle');
    setAnalysisResult(null);
    setCurrentAdSet(null);
    setSelectedInterests([]);
    setCampaignData(null);
    form.reset({
      username: '',
      projectName: '',
      businessSnapshot: '',
      adGoal: 'traffic',
      customAdGoal: '',
      locations: [],
      startDate: undefined,
      endDate: undefined,
    });
  }

  const handleBackToAnalysis = () => {
    setPageState('analysis_complete');
  }

  const handleRefreshVariation = async (index: number) => {
    if (!currentAdSet) return;
    setRefreshingVariationIndex(index);
    
    const result = await refreshSingleVariationAction({
      profileData: currentAdSet.profileData,
      analysis: currentAdSet.analysis,
      campaignData: currentAdSet.campaignData,
    });

    if (result.success && result.data) {
      setCurrentAdSet(prev => {
          if (!prev) return null;
          
          const newVariations = [...prev.variations];
          newVariations[index] = result.data.adVariation;

          // Combine and deduplicate interests
          const newInterests = [...prev.metaInterests, ...result.data.metaInterests];
          const uniqueInterests = Array.from(new Map(newInterests.map(i => [i.id, i])).values());
          
          return {
              ...prev,
              variations: newVariations,
              metaInterests: uniqueInterests,
          };
      });
      toast({
        title: `Variation ${index + 1} Refreshed`,
        description: `Found ${result.data.metaInterests.length} new interests.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Refreshing Variation',
        description: result.error || 'An unknown error occurred.',
      });
    }
    setRefreshingVariationIndex(null);
  };

  const handleInterestSelect = (interest: MetaInterest) => {
    setSelectedInterests(prevSelected => {
        const isAlreadySelected = prevSelected.some(i => i.id === interest.id);
        if (isAlreadySelected) {
            return prevSelected.filter(i => i.id !== interest.id);
        } else {
            return [...prevSelected, interest];
        }
    });
  }
  

  const pageVariants = {
    initial: { opacity: 0, y: 30, scale: 0.98 },
    in: { opacity: 1, y: 0, scale: 1 },
    out: { opacity: 0, y: -30, scale: 0.98 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.8
  };

  const renderContent = () => {
    const loadingTitle = pageState === 'analyzing' 
      ? "Spotlight is warming up..." 
      : pageState === 'generating_ads'
      ? "Spotlight is running"
      : "Done! Your brand’s spotlight moment is now just a click away.";
    
    if (pageState === 'analyzing' || pageState === 'generating_ads') {
      return (
        <LoadingAnimation
          key={pageState}
          isDone={isDoneLoading}
          title={loadingTitle}
          steps={pageState === 'analyzing' ? analysisSteps : generationSteps}
        />
      );
    }

    switch (pageState) {
      case 'idle':
        return (
          <motion.div
            key="idle"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 flex flex-col items-center">
                 <div className="max-w-4xl">
                   <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight animated-gradient-text">Let the spotlight find your brand.</h1>
                 </div>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl">
                    In the spotlight, your story begins. Provide an Instagram profile and campaign goals to generate compelling, AI-powered ad concepts.
                </p>
              </div>
              <Card className="shadow-2xl border-primary/20 bg-card/50 backdrop-blur-sm p-4 md:p-8">
                 <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAnalyze)} className="space-y-8">
                  <TooltipProvider>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg flex items-center gap-2">
                                <Instagram className="text-primary"/> Instagram Profile URL *
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                                    <TooltipContent>
                                        <p>Enter the Instagram @username or full profile URL. The AI will analyze this profile.</p>
                                    </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="@username or instagram.com/username" {...field} className="text-base h-12 bg-background/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                       <FormField
                          control={form.control}
                          name="businessSnapshot"
                          render={({ field }) => (
                            <FormItem>
                               <FormLabel className="text-lg flex items-center gap-2">
                                <Milestone className="text-primary" /> Your Business Snapshot
                                 <Tooltip>
                                    <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                                    <TooltipContent>
                                        <p>Describe your business in 1-2 sentences. This provides critical context for the AI.</p>
                                    </TooltipContent>
                                </Tooltip>
                               </FormLabel>
                               <FormControl>
                                  <Textarea
                                      placeholder="E.g., A digital marketing company that helps other brands grow and find leads."
                                      className="min-h-[120px] text-base bg-background/50"
                                      {...field}
                                  />
                              </FormControl>
                              <FormDescription>
                                If you leave this blank, our AI will analyze the profile to determine the business focus.
                               </FormDescription>
                               <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>

                    <div className="lg:col-span-2">
                       <Card className="shadow-lg border-primary/10 bg-secondary/10 p-6">
                        <CardHeader className="p-0 mb-6">
                          <CardTitle className="flex items-center gap-3 text-2xl">
                           <Edit3 className="text-primary"/> Campaign Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <FormField
                                  control={form.control}
                                  name="projectName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-lg flex items-center gap-2">
                                        Project Name
                                        <Tooltip>
                                            <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                                            <TooltipContent>
                                                <p>Give your campaign a name to keep your ad sets organized.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                      </FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., Summer Skincare Campaign" {...field} className="text-base bg-background/50" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                             <FormField
                                  control={form.control}
                                  name="locations"
                                  render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg flex items-center gap-2">
                                            Target Locations
                                            <Tooltip>
                                                <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Enter countries, cities, or regions to help the AI localize ad copy.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </FormLabel>
                                        <FormControl>
                                        <KeywordEditor
                                            keywords={field.value || []}
                                            onChange={field.onChange}
                                            placeholder="e.g., New York, United Kingdom..."
                                        />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                  )}
                                />
                           </div>

                          <FormField
                            control={form.control}
                            name="adGoal"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel className="text-lg flex items-center gap-2">
                                    Primary Ad Goal *
                                     <Tooltip>
                                        <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                                        <TooltipContent>
                                            <p>Select the main objective for your ad campaign to guide the AI's copy.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                                  >
                                    <Label htmlFor="traffic" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-muted/50 transition-all cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                      <RadioGroupItem value="traffic" id="traffic" className="peer sr-only" />
                                      Traffic
                                    </Label>
                                    <Label htmlFor="leads" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-muted/50 transition-all cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                       <RadioGroupItem value="leads" id="leads" className="peer sr-only" />
                                        Leads
                                      </Label>
                                    <Label htmlFor="sales" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-muted/50 transition-all cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                      <RadioGroupItem value="sales" id="sales" className="peer sr-only" />
                                        Sales
                                      </Label>
                                    <Label htmlFor="other" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-muted/50 transition-all cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                      <RadioGroupItem value="other" id="other" className="peer sr-only" />
                                        Other
                                      </Label>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {watchAdGoal === 'other' && (
                            <FormField
                              control={form.control}
                              name="customAdGoal"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Custom Ad Goal *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Increase brand awareness in the tech community" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel className="flex items-center gap-2">
                                    Start Date
                                    <Tooltip>
                                        <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                                        <TooltipContent>
                                            <p>The start date of your ad campaign. Used for budget pacing.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                  </FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal h-11",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel className="flex items-center gap-2">
                                    End Date
                                     <Tooltip>
                                        <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground"/></TooltipTrigger>
                                        <TooltipContent>
                                            <p>The end date of your ad campaign. Used for budget pacing.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                  </FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal h-11",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => form.getValues('startDate') ? date < form.getValues('startDate')! : date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                  <div className="flex justify-center pt-4">
                    <Button type="submit" disabled={isLoading} size="lg" className="w-full max-w-md h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/30 transition-all hover:scale-105">
                      Generate Proposal
                      <ArrowRight className="ml-3" />
                    </Button>
                  </div>
                  </TooltipProvider>
                </form>
              </Form>
              </Card>
            </div>
            <FeaturesShowcase />
            {savedAdSets.length > 0 && <SavedAdSets savedAdSets={savedAdSets} />}
          </motion.div>
        );
      case 'analysis_complete':
        return analysisResult && campaignData && (
            <motion.div
                key="analysis_complete"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
            >
                <AnalysisSummary 
                    analysisResult={analysisResult} 
                    onAnalysisUpdate={handleAnalysisUpdate}
                    campaignData={campaignData}
                />
                
                <div className="flex justify-center gap-4 mt-8">
                    <Button onClick={handleNewAnalysis} variant="outline" size="lg" className="text-lg">
                        Back
                    </Button>
                    <Button onClick={handleGenerateAds} disabled={isLoading} size="lg" className="text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/30 transition-all hover:scale-105">
                       <Wand2 className="mr-2" /> 
                        Generate Ad Variations
                    </Button>
                </div>
            </motion.div>
        );
      case 'results':
        return currentAdSet && (
             <motion.div
                key="results"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
            >
                <AdResults 
                    adSet={currentAdSet}
                    selectedInterests={selectedInterests}
                    onAdSetUpdate={handleAdSetUpdate}
                    onSave={handleSaveAdSet}
                    onBack={handleBackToAnalysis}
                    onRefreshVariation={handleRefreshVariation}
                    refreshingVariationIndex={refreshingVariationIndex}
                    onInterestSelect={handleInterestSelect}
                />
            </motion.div>
        );
      default:
        return null;
    }
  }

  return (
    <motion.div 
      className="flex flex-col min-h-screen bg-background"
      initial={{ y: -300, scale: 1.3, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
    >
      <header className="flex items-center justify-between gap-4 p-4 border-b border-primary/10 bg-background/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex-1 flex justify-start">
        </div>
        {pageState !== 'idle' && (
           <div className="flex-1 flex justify-end">
            <Button variant="outline" onClick={handleNewAnalysis}>Start New Analysis</Button>
           </div>
        )}
      </header>

      <main className="flex-1 p-4 md:p-8">
        <AnimatePresence mode="wait">
            {renderContent()}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
