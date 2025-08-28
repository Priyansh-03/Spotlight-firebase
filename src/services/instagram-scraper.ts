// A service to scrape data from an Instagram profile.

import type { InstagramProfileData } from "@/types/ai";

// This function is a TypeScript translation of the user-provided Python script.
export async function scrapeInstagramProfile(username: string): Promise<InstagramProfileData> {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

  const headers = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "x-ig-app-id": "936619743392459", // This is a public app ID
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "referer": `https://www.instagram.com/${username}/`,
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
  };

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching Instagram data for ${username}. Status: ${response.status}`, errorText);
      throw new Error(`Failed to fetch Instagram profile. Status: ${response.status}. The profile might be private or does not exist.`);
    }

    const jsonResponse = await response.json();
    const user = jsonResponse?.data?.user;

    if (!user) {
      throw new Error("Invalid response structure from Instagram API.");
    }

    const profile_info = {
      username: user.username,
      biography: user.biography || "",
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      num_posts: user.edge_owner_to_timeline_media?.count || 0,
      profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url || "",
      is_verified: user.is_verified || false,
      link_in_bio: (user.bio_links && user.bio_links.length > 0) ? user.bio_links[0].url : "",
    };

    const recent_posts = (user.edge_owner_to_timeline_media?.edges || []).map((edge: any) => {
      const node = edge.node;
      const captionNode = node.edge_media_to_caption?.edges?.[0]?.node;
      return {
        display_url: node.display_url,
        caption: captionNode?.text || "",
        num_likes: node.edge_liked_by?.count || 0,
        num_comments: node.edge_media_to_comment?.count || 0,
        is_video: node.is_video || false,
        video_url: node.video_url || undefined,
        video_view_count: node.video_view_count || undefined,
      };
    });

    return {
      profile_info,
      recent_posts,
    };

  } catch (error) {
    console.error("Exception during Instagram scrape:", error);
    if (error instanceof Error) {
        // Re-throw specific, user-friendly errors
        if (error.message.includes('fetch')) {
            throw new Error('Network error while trying to reach Instagram. Please check your connection.');
        }
        throw error;
    }
    throw new Error("An unknown error occurred during scraping.");
  }
}
