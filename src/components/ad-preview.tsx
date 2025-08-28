'use client';

import Image from 'next/image';
import type { AdVariation, InstagramProfileData } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

interface AdPreviewProps {
  ad: AdVariation;
  profileData: InstagramProfileData;
}

export function AdPreview({ ad, profileData }: AdPreviewProps) {
  const { profile_info, recent_posts } = profileData;
  const firstPostImage = 'https://placehold.co/1080x1080.png';

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg rounded-xl overflow-hidden bg-card">
      <CardHeader className="flex flex-row items-center gap-3 p-3">
        <Avatar>
          <AvatarImage
            src={profile_info.profile_pic_url}
            alt={profile_info.username}
          />
          <AvatarFallback>
            {profile_info.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="font-bold text-sm">{profile_info.username}</div>
      </CardHeader>
      <CardContent className="p-0">
        <Image
          src={firstPostImage}
          alt="Ad creative"
          width={500}
          height={500}
          className="w-full aspect-square object-cover"
          data-ai-hint="product lifestyle"
        />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 p-3">
        <div className="flex justify-between w-full">
            <div className="flex gap-4">
                <Heart className="h-6 w-6 cursor-pointer hover:text-red-500" />
                <MessageCircle className="h-6 w-6 cursor-pointer hover:text-primary" />
                <Send className="h-6 w-6 cursor-pointer hover:text-primary" />
            </div>
            <Bookmark className="h-6 w-6 cursor-pointer hover:text-primary" />
        </div>
        <div className="px-1 w-full">
            <p className="text-sm text-card-foreground/90 mt-2">
                <span className="font-bold cursor-pointer">{profile_info.username}</span>{' '}
                {ad.primaryText}
            </p>
            <p className="text-sm font-bold mt-1 text-primary">{ad.headline}</p>
            <p className="text-xs text-muted-foreground mt-1">{ad.description}</p>
            <p className="text-xs text-muted-foreground mt-2 cursor-pointer">View all 1,234 comments</p>
        </div>
      </CardFooter>
    </Card>
  );
}
