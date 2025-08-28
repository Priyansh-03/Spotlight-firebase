
import { z } from 'zod';

export const AdVariationSchema = z.object({
  headline: z.string().describe('A compelling headline (under 40 characters).'),
  primaryText: z.string().describe('Engaging primary text for the ad (1-3 sentences).'),
  description: z.string().describe('A brief sentence to add context or a call to action.'),
  target_audience_keywords: z.array(z.string()).length(5).describe("A list of exactly 5 keywords for this specific ad variation's target audience."),
  potential_targets: z.array(z.string()).describe("A short list of real-world business categories or audience types that this ad appeals to (max 3–5)."),
});

// This schema defines the expected output from the AI for generating all ad variations at once.
export const AdGenerationOutputSchema = z.object({
  adVariations: z.array(AdVariationSchema).length(5).describe('An array of exactly 5 distinct ad copy variations.')
});


export const ApiPostSchema = z.object({
  displayUrl: z.string().url().or(z.literal("")),
  caption: z.string().nullable().default(''),
  likesCount: z.number().optional().nullable().default(0),
  commentsCount: z.number().optional().nullable().default(0),
  videoUrl: z.string().url().optional().nullable(),
  videoViewCount: z.number().optional().nullable().default(0),
  isVideo: z.boolean().optional().nullable(),
  id: z.string(),
  shortCode: z.string().optional().nullable(),
  url: z.string().url(),
  timestamp: z.string().or(z.date()).optional().nullable(),
});

export const ApiProfileResponseSchema = z.object({
  profile_data: z.object({
    username: z.string(),
    biography: z.string().nullable().default(''),
    followersCount: z.number().default(0),
    followsCount: z.number().default(0),
    postsCount: z.number().default(0),
    profilePicUrl: z.string().url().or(z.literal("")),
    isVerified: z.boolean().default(false),
    externalUrl: z.string().url().or(z.literal("")).optional().nullable(),
    latestPosts: z.array(ApiPostSchema),
    businessAddress: z.object({}).passthrough().optional().nullable(),
    businessCategoryName: z.string().optional().nullable(),
    fbid: z.string().optional().nullable(),
    fullName: z.string().optional().nullable(),
  }).passthrough(),
});

// INTERNAL REPRESENTATION
export const InstagramPostSchema = z.object({
  display_url: z.string().url(),
  caption: z.string(),
  num_likes: z.number(),
  num_comments: z.number(),
  is_video: z.boolean(),
  video_url: z.string().url().optional(),
  video_view_count: z.number().optional(),
  url: z.string().url(),
});

export const InstagramProfileInfoSchema = z.object({
  username: z.string(),
  biography: z.string(),
  followers: z.number(),
  following: z.number(),
  num_posts: z.number(),
  profile_pic_url: z.string().url().or(z.literal("")),
  is_verified: z.boolean(),
  link_in_bio: z.string().url().or(z.literal("")).optional(),
});

export const InstagramProfileDataSchema = z.object({
  profile_info: InstagramProfileInfoSchema,
  recent_posts: z.array(InstagramPostSchema),
});

export function mapApiDataToInternal(
    apiData: z.infer<typeof ApiProfileResponseSchema>
): z.infer<typeof InstagramProfileDataSchema> {
  const profile = apiData.profile_data;
    if (!profile) {
        throw new Error("API response is missing required 'profile_data'.");
    }

    const safePosts = (profile.latestPosts || []).filter(post => post.displayUrl && post.url);

    return {
        profile_info: {
            username: profile.username,
            biography: profile.biography || '',
            followers: profile.followersCount || 0,
            following: profile.followsCount || 0,
            num_posts: profile.postsCount || 0,
            profile_pic_url: profile.profilePicUrl || '',
            is_verified: profile.isVerified || false,
            link_in_bio: profile.externalUrl || '',
        },
        recent_posts: safePosts.map(post => ({
            display_url: post.displayUrl,
            caption: post.caption || '',
            num_likes: post.likesCount || 0,
            num_comments: post.commentsCount || 0,
            is_video: post.isVideo || !!post.videoUrl,
            video_url: post.videoUrl || undefined,
            video_view_count: post.videoViewCount || undefined,
            url: post.url,
        }))
    };
}

export const ProfileAnalysisSchema = z.object({
    summary: z.string().describe("A brief summary of the AI's understanding of the Instagram profile."),
    niche: z.string().describe("The specific niche or category the profile belongs to (e.g., 'Fitness Coach', 'Travel Blogger', 'Handmade Jewelry')."),
    target_audience_keywords: z.array(z.string()).max(5).describe("A list of up to 5 keywords for the target audience."),
    potential_targets: z.array(z.string()).describe("A list of 3-5 real-world business categories or audience types.").default([]),
});

export const AnalyzeProfileOutputSchema = z.object({
    profileData: InstagramProfileDataSchema.describe('The scraped Instagram profile data.'),
    analysis: ProfileAnalysisSchema.describe('The AI-generated analysis of the profile.'),
});

export const MetaInterestSchema = z.object({
  id: z.string(),
  name: z.string(),
  audience_size: z.number().nullable(),
  topic: z.string().nullable(),
  search_term: z.string(),
  link: z.string().url(),
});

export const GenerateAdCopyOutputSchema = z.object({
  profileData: InstagramProfileDataSchema.describe('The scraped Instagram profile data used for generation.'),
  adVariations: z.array(AdVariationSchema).describe('An array of 5 distinct ad copy variations, each with its own set of 5 keywords.'),
  metaInterests: z.array(MetaInterestSchema).describe('A list of detailed Meta ad interests based on the target audience keywords.'),
});


export const CampaignFormDataSchema = z.object({
  username: z.string().min(1, 'Instagram username or URL is required.'),
  projectName: z.string().optional(),
  businessSnapshot: z.string().optional(),
  adGoal: z.enum(['traffic', 'leads', 'sales', 'other']),
  customAdGoal: z.string().optional().default(''),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  locations: z.array(z.string()).optional(),
}).refine(data => {
    if (data.adGoal === 'other') {
        return !!data.customAdGoal && data.customAdGoal.length > 0;
    }
    return true;
}, {
    message: "Please specify your custom goal.",
    path: ["customAdGoal"],
}).refine(data => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
}, {
    message: "End date cannot be before start date.",
    path: ["endDate"],
});


// Infer TypeScript types from Zod schemas
export type AdVariation = z.infer<typeof AdVariationSchema>;
export type InstagramPost = z.infer<typeof InstagramPostSchema>;
export type InstagramProfileInfo = z.infer<typeof InstagramProfileInfoSchema>;
export type InstagramProfileData = z.infer<typeof InstagramProfileDataSchema>;
export type ProfileAnalysis = z.infer<typeof ProfileAnalysisSchema>;
export type AnalyzeProfileOutput = z.infer<typeof AnalyzeProfileOutputSchema>;
export type MetaInterest = z.infer<typeof MetaInterestSchema>;
export type GenerateAdCopyOutput = z.infer<typeof GenerateAdCopyOutputSchema>;
export type CampaignFormData = z.infer<typeof CampaignFormDataSchema>;


export type AnalysisResult = z.infer<typeof AnalyzeProfileOutputSchema>;
