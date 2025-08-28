
import { type ProfileAnalysis, type InstagramProfileData, type AdVariation, type AnalysisResult, type MetaInterest, type CampaignFormData, CampaignFormDataSchema } from "./ai";

export type { AdVariation, InstagramProfileData, ProfileAnalysis, AnalysisResult, MetaInterest, CampaignFormData };
export { CampaignFormDataSchema };

export type AdSet = {
  id: string;
  username: string;
  profileData: InstagramProfileData;
  analysis: ProfileAnalysis; // Kept for re-generation context
  variations: AdVariation[];
  metaInterests: MetaInterest[];
  campaignData: CampaignFormData;
};

export type BudgetSuggestion = {
  recommended_total_budget: string;
  recommended_daily_budget: string;
  expected_results: {
    goal: string;
    estimated_cpr: string;
    expected_actions: number;
  };
};
