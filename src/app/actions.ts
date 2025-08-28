
'use server';
import * as dotenv from 'dotenv';
dotenv.config();

import { AdVariation, GenerateAdCopyOutputSchema, AdVariationSchema, InstagramProfileDataSchema, AnalyzeProfileOutput, AnalyzeProfileOutputSchema, ApiProfileResponseSchema, InstagramProfileData, ProfileAnalysisSchema, ProfileAnalysis, MetaInterestSchema, CampaignFormDataSchema, CampaignFormData, mapApiDataToInternal, AdGenerationOutputSchema } from '@/types/ai';
import { z } from 'zod';
import { findMetaInterests } from '@/services/meta-ads';
import OpenAI from 'openai';
import { format } from 'date-fns';

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

const singleAdRefreshResultSchema = z.object({
  success: z.boolean(),
  data: z.object({
    adVariation: AdVariationSchema,
    metaInterests: z.array(MetaInterestSchema),
  }).nullable(),
  error: z.string().nullable(),
});


type AnalysisActionResult = z.infer<typeof analysisResultSchema>;
type AdGenerationActionResult = z.infer<typeof adGenerationResultSchema>;
type SingleAdRefreshActionResult = z.infer<typeof singleAdRefreshResultSchema>;

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


async function analyzeInstagramProfileWithAI(profileData: InstagramProfileData, campaignData: CampaignFormData): Promise<ProfileAnalysis> {
    const finalAdGoal = campaignData.adGoal === 'other' ? campaignData.customAdGoal : campaignData.adGoal;
    
    const hasBusinessSnapshot = campaignData.businessSnapshot && campaignData.businessSnapshot.trim().length > 0;

    const systemPrompt = `
      You are an expert Instagram profile analyst and marketing strategist.
      Your primary goal is to analyze the user's brand based on the information provided.

      ${hasBusinessSnapshot
        ? `
      **Primary Context (User-Provided - Ground Truth):**
      - **Business Snapshot:** "${campaignData.businessSnapshot}"  <-- THIS IS THE MOST IMPORTANT INFORMATION. Your analysis MUST be consistent with this. Do not contradict it. For example, if the user states they are a 'company', you must use the word 'company' in your analysis, not 'agency'.
      - **Ad Goal:** "${finalAdGoal}"

      **Secondary Context (Scraped from Instagram for style/tone reference):**
      - **Biography:** "${profileData.profile_info.biography}"
      - **Recent Post Captions:** ${profileData.recent_posts.map(p => `"${p.caption}"`).slice(0, 5).join(', ')}

      **Your Tasks:**
      1.  **Synthesize and Summarize:** Based on the **Business Snapshot**, provide a concise summary of the profile and its business. Use the secondary context only for tone and style, not for core business identity.
      2.  **Determine Niche:** Derive the profile's primary business niche directly from the **Business Snapshot**.
      `
        : `
      **Primary Context (Scraped from Instagram):**
      - **Biography:** "${profileData.profile_info.biography}"
      - **Recent Post Captions:** ${profileData.recent_posts.map(p => `"${p.caption}"`).slice(0, 5).join(', ')}

      **Secondary Context:**
      - **Ad Goal:** "${finalAdGoal}"

      **Your Tasks:**
      1.  **Analyze and Summarize:** Based on the Instagram biography and recent posts, provide a concise summary of the profile and its likely business.
      2.  **Determine Niche:** Identify the profile's primary business niche from the content.
      `
      }

      3.  **Generate Target Keywords:** Create a list of **MAXIMUM 5** target audience keywords. These keywords must represent the *potential clients or customers* for the brand. For example, if the brand is a Social Media Marketing agency, target keywords should be its potential clients like 'Resorts', 'Hotels', 'Local Restaurants', 'Real Estate Agents', 'Startups', not generic terms like 'digital marketing'.
      
      4.  **Generate Potential Targets:** Based on your analysis, generate a list of 3-5 potential real-world business categories or audience types that could be targeted. For example: ["Restaurants", "Online Coaches", "Boutique Stores"].

      You MUST output ONLY a valid JSON object that satisfies the following Zod schema:
      ${JSON.stringify(ProfileAnalysisSchema.shape)}
    `;

    try {
        const response = await openrouter.chat.completions.create({
            model: "google/gemini-flash-1.5",
            messages: [{ role: "system", content: systemPrompt }],
            response_format: { type: "json_object" },
        });

        const analysisJson = JSON.parse(response.choices[0].message.content || '{}');
        return ProfileAnalysisSchema.parse(analysisJson);
    } catch (error: any) {
        console.error('Error in analyzeInstagramProfileWithAI:', error);
        throw new Error(error.response?.data?.error?.message || 'Failed to get analysis from AI. The API key might be invalid or the service may be down.');
    }
}

export async function analyzeProfileAction(
  campaignData: CampaignFormData
): Promise<AnalysisActionResult> {
  const username = extractUsername(campaignData.username);

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
            } else if (errorBody.error) {
                error = errorBody.error;
            }
        } catch (e) {
            // failed to parse json, use default error
        }
        return { success: false, data: null, error };
    }

    const apiResult = await response.json();
    const validatedApiData = ApiProfileResponseSchema.parse(apiResult);
    const profileData = mapApiDataToInternal(validatedApiData);
    
    const analysis = await analyzeInstagramProfileWithAI(profileData, campaignData);

    return { success: true, data: { profileData, analysis }, error: null };
  } catch (error: any) {
    console.error('Error in analyzeProfileAction:', error);
    let errorMessage = 'An unknown error occurred during profile analysis.';
    if (error instanceof z.ZodError) {
        errorMessage = `Data format error: ${error.issues.map(i => i.message).join(', ')}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, data: null, error: errorMessage };
  }
}

function getBulkAdGenerationPrompt(
    profileData: InstagramProfileData,
    analysis: ProfileAnalysis,
    campaignData: CampaignFormData
): string {
    const finalAdGoal = campaignData.adGoal === 'other' ? campaignData.customAdGoal : campaignData.adGoal;
    
    let interpretedObjective = 'Sales';
    if (campaignData.adGoal === 'traffic') interpretedObjective = 'Traffic';
    if (campaignData.adGoal === 'leads') interpretedObjective = 'Leads';

    const recentCaptions = profileData.recent_posts.map(p => `"${p.caption}"`).slice(0, 5).join(', ');

    return `
    You are an expert Meta ad campaign expert and marketing copywriter. Your task is to generate 5 distinct ad variations based on the provided campaign brief and Instagram profile data.
    
    **CAMPAIGN CONTEXT & GOALS:**
    - **Brand Snapshot:** "${campaignData.businessSnapshot}"
    - **Campaign Goal:** "${finalAdGoal}"
    - **Interpreted Objective:** Your primary goal is to generate ads that drive **${interpretedObjective}**.
    - **Campaign Timeline:** ${(campaignData.startDate && campaignData.endDate) ? `The campaign runs from ${format(campaignData.startDate, "PPP")} to ${format(campaignData.endDate, "PPP")}.` : 'No specific timeline.'}
    - **Target Locations:** ${campaignData.locations?.join(', ') || 'pan-India metro regions'}.
    
    **AI-POWERED ANALYSIS & TONE (USER-APPROVED):**
    - **Profile Summary:** "${analysis.summary}"
    - **Profile Niche:** "${analysis.niche}"
    - **Approved Target Keywords:** [${analysis.target_audience_keywords.join(', ')}]
    - **Approved Potential Targets:** [${analysis.potential_targets.join(', ')}] <-- Use these as inspiration.
    - **Brand Tone (from recent posts):** Analyze the tone from these captions: ${recentCaptions}

    **YOUR TASK: GENERATE 5 UNIQUE AD VARIATIONS**
    
    Create a JSON object containing a list of 5 unique ad variations. Each variation MUST:
    1.  Have a distinct angle or theme.
    2.  Be laser-focused on the campaign objective of **${interpretedObjective}**.
    3.  Contain a unique set of 5 \`target_audience_keywords\` that are different from the other variations, inspired by the Approved Target Keywords.
    4.  Have a compelling \`headline\` (under 40 characters), engaging \`primaryText\` (1-3 sentences), and a clear \`description\`.
    5.  Include a \`potential_targets\` field: a short list of 3-5 real-world business categories or audience types (e.g., ["Restaurants", "Online Coaches", "Boutique Stores"]), inspired by the Approved Potential Targets.

    You MUST output ONLY a valid JSON object that satisfies the following Zod schema. Do not include any conversational text, just the JSON.
    ${JSON.stringify(AdGenerationOutputSchema.shape)}
    `;
}

export async function generateAdsAction(
  input: { 
    profileData: InstagramProfileData, 
    analysis: ProfileAnalysis,
    campaignData: CampaignFormData;
  }
): Promise<AdGenerationActionResult> {
  const prompt = getBulkAdGenerationPrompt(input.profileData, input.analysis, input.campaignData);

  try {
    const response = await openrouter.chat.completions.create({
      model: "google/gemini-flash-1.5",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
    });
    
    const adJson = JSON.parse(response.choices[0].message.content || '{}');
    const { adVariations } = AdGenerationOutputSchema.parse(adJson);
    
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
    const errorMessage = error instanceof z.ZodError 
        ? `AI response format error: ${error.issues.map(i => i.message).join(', ')}`
        : (error.message || 'Failed to generate ads or fetch interests. Please try again later.');
    return { success: false, data: null, error: errorMessage };
  }
}

function getSingleAdGenerationPrompt(
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
    You are an expert marketing copywriter and Meta Ads strategist. Your task is to generate ONE new, distinct ad concept based on the provided campaign brief and Instagram profile data.
    
    **CAMPAIGN CONTEXT & GOALS:**
    - **Brand Snapshot:** "${campaignData.businessSnapshot}"
    - **Campaign Goal:** "${finalAdGoal}"
    - **Interpreted Objective:** Your primary goal is to generate an ad that drives **${interpretedObjective}**.
    - **Campaign Timeline:** ${(campaignData.startDate && campaignData.endDate) ? `The campaign runs from ${format(campaignData.startDate, "PPP")} to ${format(campaignData.endDate, "PPP")}.` : 'No specific timeline.'}
    - **Target Locations:** ${campaignData.locations?.join(', ') || 'pan-India metro regions'}.
    
    **AI-POWERED ANALYSIS & TONE (USER-APPROVED):**
    - **Profile Summary:** "${analysis.summary}"
    - **Profile Niche:** "${analysis.niche}"
    - **Approved Target Keywords:** [${analysis.target_audience_keywords.join(', ')}]
    - **Approved Potential Targets:** [${analysis.potential_targets.join(', ')}] <-- Use these as inspiration.
    - **Brand Tone (from recent posts):** Analyze the tone from these captions: ${recentCaptions}

    **YOUR TASK: GENERATE ONE UNIQUE AD VARIATION**
    
    Create a single JSON object for one new ad variation. This variation MUST:
    1.  Have a distinct angle or theme.
    2.  Be laser-focused on the campaign objective of **${interpretedObjective}**.
    3.  Contain a unique set of 5 \`target_audience_keywords\`.
    4.  Have a compelling \`headline\` (under 40 characters), engaging \`primaryText\` (1-3 sentences), and a clear \`description\`.
    5.  Include a \`potential_targets\` field: a short list of 3-5 real-world business categories or audience types (e.g., ["Restaurants", "Online Coaches", "Boutique Stores"]), inspired by the Approved Potential Targets.

    You MUST output ONLY a valid JSON object that satisfies the following Zod schema. Do not include any conversational text, just the JSON.
    ${JSON.stringify(AdVariationSchema.shape)}
    `;
}

export async function refreshSingleVariationAction(
  input: { 
    profileData: InstagramProfileData, 
    analysis: ProfileAnalysis,
    campaignData: CampaignFormData;
  }
): Promise<SingleAdRefreshActionResult> {
   const prompt = getSingleAdGenerationPrompt(input.profileData, input.analysis, input.campaignData);
  try {
     const response = await openrouter.chat.completions.create({
      model: "google/gemini-flash-1.5",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
    });
    
    const adJson = JSON.parse(response.choices[0].message.content || '{}');
    const adVariation = AdVariationSchema.parse(adJson);

    const metaInterests = await findMetaInterests(adVariation.target_audience_keywords);
    
    return { 
      success: true, 
      data: { adVariation, metaInterests }, 
      error: null 
    };
  } catch (error: any) {
    console.error('Error refreshing single variation:', error);
     const errorMessage = error instanceof z.ZodError 
        ? `AI response format error: ${error.issues.map(i => i.message).join(', ')}`
        : (error.message || 'Failed to refresh keywords and interests.');
    return { success: false, data: null, error: errorMessage };
  }
}
