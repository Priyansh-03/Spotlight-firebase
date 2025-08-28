
'use server';

import { AdVariation, GenerateAdCopyOutputSchema, AdVariationSchema, InstagramProfileDataSchema, AnalyzeProfileOutput, AnalyzeProfileOutputSchema, ApiProfileResponseSchema, InstagramProfileData, ProfileAnalysisSchema, ProfileAnalysis, MetaInterestSchema, CampaignFormDataSchema, CampaignFormData, mapApiDataToInternal } from '@/types/ai';
import { z } from 'zod';
import { findMetaInterests } from '@/services/meta-ads';
import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.GEMINI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://spotlight-pro.web.app",
    "X-Title": "Spotlight", 
  },
});

const analysisResultSchema = z.object({
    success: z.boolean(),
    data: AnalyzeProfileOutputSchema.nullable(),
    error: z.string().nullable(),
});

const adGenerationResultSchema = z.object({
  success: z.boolean(),
  data: GenerateAdCopyOutputSchema.nullable(),
  error: z.string().nullable(),
});

const adRefreshResultSchema = z.object({
  success: z.boolean(),
  data: z.object({
    adVariations: z.array(AdVariationSchema),
    metaInterests: z.array(MetaInterestSchema),
  }).nullable(),
  error: z.string().nullable(),
});


type AnalysisActionResult = z.infer<typeof analysisResultSchema>;
type AdGenerationActionResult = z.infer<typeof adGenerationResultSchema>;
type AdRefreshActionResult = z.infer<typeof adRefreshResultSchema>;

function extractUsername(input: string): string | null {
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.hostname.includes('instagram.com')) {
      const pathParts = url.pathname.split('/').filter(p => p);
      if (pathParts.length > 0) {
        return pathParts[0];
      }
    }
  } catch (e) {
    // Not a valid URL, assume it's a username
  }
  return input.startsWith('@') ? input.substring(1) : input;
}


async function analyzeInstagramProfileWithAI(profileData: InstagramProfileData): Promise<ProfileAnalysis> {
    const systemPrompt = `
      You are an expert Instagram profile analyst and marketing strategist. Analyze the provided information to understand the user's brand and business.
      The user's biography is: "${profileData.profile_info.biography}"
      The user's recent post captions are: ${profileData.recent_posts.map(p => `"${p.caption}"`).slice(0, 5).join(', ')}

      Based on this, provide:
      1. A concise summary of the profile.
      2. The profile's niche.
      3. Its primary business focus.
      
      Now, acting as a Meta interest keyword generator, create a list of **MAXIMUM 5** target audience keywords.
      Crucially, these keywords should represent the *potential clients or customers* who would be willing to purchase the services or products from the brand.
      For example, if the brand is a Social Media Marketing agency, the target audience keywords should be its potential clients like 'Resorts', 'Hotels', 'Local Restaurants', 'Real Estate Agents', 'Startups', etc., not generic terms like 'digital marketing'.
      Identify people or groups on Meta platforms (Facebook/Instagram) most likely to become customers of this brand.

      You MUST output ONLY a valid JSON object that satisfies the following Zod schema:
      ${JSON.stringify(ProfileAnalysisSchema.shape)}
    `;

    const response = await openrouter.chat.completions.create({
      model: "google/gemini-flash-1.5",
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
    });

    const analysisJson = JSON.parse(response.choices[0].message.content || '{}');
    return ProfileAnalysisSchema.parse(analysisJson);
}

export async function analyzeProfileAction(
  userInput: string
): Promise<AnalysisActionResult> {
  const username = extractUsername(userInput);

  if (!username) {
    return { success: false, data: null, error: 'Please enter a valid Instagram username or profile URL.' };
  }

  try {
    const response = await fetch(`https://appify-insta-scrapper-backend-mn4d.onrender.com/analyze/${username}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
        let error = 'The analysis API returned an error. The external service may be down or the username is invalid.';
        try {
            const errorBody = await response.json();
            if (errorBody.error?.includes("not found")) {
                error = `The Instagram profile for "${username}" was not found. Please check the username and ensure the profile is public.`;
            }
        } catch (e) {
            // failed to parse json, use default error
        }
        return { success: false, data: null, error };
    }

    const apiResult = await response.json();
    const validatedApiData = ApiProfileResponseSchema.parse(apiResult);
    const profileData = mapApiDataToInternal(validatedApiData);
    
    const analysis = await analyzeInstagramProfileWithAI(profileData);

    return { success: true, data: { profileData, analysis }, error: null };
  } catch (error: any) {
    console.error('Error in analyzeProfileAction:', error);
    let errorMessage = 'An unknown error occurred during profile analysis.';
    if (error instanceof z.ZodError) {
        errorMessage = `Data format error: ${error.issues.map(i => i.message).join(', ')}`;
    } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, data: null, error: errorMessage };
  }
}

function getAdGenerationPrompt(
    profileData: InstagramProfileData,
    analysis: ProfileAnalysis,
    campaignData: CampaignFormData
): string {
    const finalAdGoal = campaignData.adGoal === 'other' ? campaignData.customAdGoal : campaignData.adGoal;
    let interpretedObjective = 'Sales';
    if (campaignData.adGoal === 'traffic') interpretedObjective = 'Traffic';
    if (campaignData.adGoal === 'leads') interpretedObjective = 'Lead Generation';

    const recentCaptions = profileData.recent_posts.map(p => `"${p.caption}"`).slice(0, 5).join(', ');

    return `
    You are an expert marketing copywriter and Meta Ads strategist. Your task is to generate a distinct ad concept based on the provided campaign brief and Instagram profile data.
    
    Follow these steps precisely:
    
    **Step 1: Understand the Campaign Brief**
    1.  **🎯 Understanding the Brand (Your Business Snapshot)**:
        Based on the user's description: "${campaignData.businessSnapshot}", the brand appears to be focused on [INSERT YOUR ANALYSIS]. 
        Its unique value lies in [e.g., sustainable design, affordable luxury, etc.].
    
    2.  **📈 Project Goals**:
        The user described the goal as: "${finalAdGoal}".
        Mapped Ad Funnel Stages: Top (Traffic), Middle (Leads), Bottom (Sales).
        Final Interpreted Objective: The primary objective is **${interpretedObjective}**.
    
    3.  **📅 Timeline Strategy (Start Date – End Date)**:
        ${(campaignData.startDate && campaignData.endDate) ? `Use the funnel method across the user-selected date range: From ${campaignData.startDate} to ${campaignData.endDate}` : ''}
    
    4.  **🌍 Cities and Countries to Advertise**:
        Target regions: ${campaignData.locations?.join(', ') || 'pan-India metro regions'}.
        Contextualize your ad for these regions.
    
    **Step 2: Define Tone of Voice**
    Analyze the brand's tone from its Instagram profile.
    -   Profile Biography: "${profileData.profile_info.biography}"
    -   Recent Post Captions: ${recentCaptions}
    -   Identify a tone (e.g., Playful & Quirky, Professional & Trustworthy).
    
    **Step 3: Generate a Single, Unique Ad Variation**
    Generate ONE distinct ad variation tailored to the **Business Snapshot** and **Ad Goal**.
    1.  **Generate a Keyword Pool:** Internally, create a large pool of 25-30 diverse target audience keywords based on the **Business Snapshot** and **Location Analysis**. These keywords must represent the *potential clients or customers*.
    2.  **Create Ad Copy:** From your keyword pool, select a unique group of 5 keywords for a specific customer segment. Write a compelling Headline (under 40 characters), engaging Primary Text (1-3 sentences), and a clear Description for that segment.
    3.  **Output Keywords:** Include the selected 5 keywords in the output.
    
    You MUST output ONLY a valid JSON object that satisfies the following Zod schema. Do not include any conversational text, just the JSON.
    ${JSON.stringify(AdVariationSchema.shape)}
    `;
}

async function generateSingleAdVariation(
  profileData: InstagramProfileData, 
  analysis: ProfileAnalysis,
  campaignData: CampaignFormData
): Promise<AdVariation> {
    const prompt = getAdGenerationPrompt(profileData, analysis, campaignData);
    const response = await openrouter.chat.completions.create({
      model: "google/gemini-flash-1.5",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
    });
    const adJson = JSON.parse(response.choices[0].message.content || '{}');
    return AdVariationSchema.parse(adJson);
}

export async function generateAdsAction(
  input: { 
    profileData: InstagramProfileData, 
    analysis: ProfileAnalysis,
    campaignData: CampaignFormData;
  }
): Promise<AdGenerationActionResult> {
  try {
    const adVariationPromises = Array(5).fill(null).map(() => 
      generateSingleAdVariation(input.profileData, input.analysis, input.campaignData)
    );
    
    const adVariations = await Promise.all(adVariationPromises);
    
    const allKeywords = adVariations.flatMap(v => v.target_audience_keywords);
    const uniqueKeywords = [...new Set(allKeywords)];
    const metaInterests = await findMetaInterests(uniqueKeywords);
    
    return { 
      success: true, 
      data: { 
        adVariations, 
        profileData: input.profileData,
        metaInterests
      }, 
      error: null 
    };

  } catch (error: any) {
    console.error('Error generating ad copy or fetching interests:', error);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to generate ads or fetch interests. Please try again later.';
    return { success: false, data: null, error: errorMessage };
  }
}

export async function fetchInterestsAction(
  input: { 
    profileData: InstagramProfileData, 
    analysis: ProfileAnalysis,
    campaignData: CampaignFormData;
  }
): Promise<AdRefreshActionResult> {
  try {
    const adVariationPromises = Array(5).fill(null).map(() => 
      generateSingleAdVariation(input.profileData, input.analysis, input.campaignData)
    );
    const adVariations = await Promise.all(adVariationPromises);

    const allKeywords = adVariations.flatMap(v => v.target_audience_keywords);
    const uniqueKeywords = [...new Set(allKeywords)];
    const metaInterests = await findMetaInterests(uniqueKeywords);
    
    return { 
      success: true, 
      data: { adVariations, metaInterests }, 
      error: null 
    };
  } catch (error: any) {
    console.error('Error refreshing ads and interests:', error);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to refresh keywords and interests.';
    return { success: false, data: null, error: errorMessage };
  }
}

    
