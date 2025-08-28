import axios from "axios";
import * as dotenv from "dotenv";
import type { MetaInterest } from "@/types";

dotenv.config();

const ACCESS_TOKEN = process.env.META_API_KEY;
const BASE_URL = "https://graph.facebook.com/v20.0/search";
const LIMIT = 50;

export async function findMetaInterests(keywords: string[]): Promise<MetaInterest[]> {
  if (!ACCESS_TOKEN) {
    console.warn("Meta access token not found in .env. Skipping interest fetching.");
    return [];
  }

  const allResults: MetaInterest[] = [];

  for (const keyword of keywords) {
    console.log(`🔎 Fetching interests for: ${keyword}`);

    try {
      const response = await axios.get(BASE_URL, {
        params: {
          type: "adinterest",
          q: keyword,
          limit: LIMIT,
          access_token: ACCESS_TOKEN,
        },
      });

      const data = response.data?.data || [];

      const formatted: MetaInterest[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        audience_size: item.audience_size,
        topic: item.topic,
        search_term: keyword,
        link: `https://www.facebook.com/ads/audience-insights/people?interest_ids=${item.id}`,
      }));

      allResults.push(...formatted);
    } catch (error: any) {
      console.error(`❌ Error fetching Meta interests for '${keyword}':`, error.response?.data?.error?.message || error.message);
    }
  }

  return allResults;
}
