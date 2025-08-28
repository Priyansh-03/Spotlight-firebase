
'use client';

import Image from 'next/image';
import type { AnalysisResult, ProfileAnalysis, InstagramPost, CampaignFormData } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, BarChart, ExternalLink, Heart, MessageCircle, Eye, Play, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EditableAnalysisCard } from './editable-analysis-card';
import { CampaignBrief } from './campaign-brief';


interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

const StatCard = ({ icon, label, value, className }: StatCardProps) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold capitalize">{value}</div>
    </CardContent>
  </Card>
);

interface AnalysisSummaryProps {
  analysisResult: AnalysisResult;
  onAnalysisUpdate: (updatedAnalysis: ProfileAnalysis) => void;
  campaignData: CampaignFormData;
}

export function AnalysisSummary({ analysisResult, onAnalysisUpdate, campaignData }: AnalysisSummaryProps) {
  const { profileData, analysis } = analysisResult;
  const { profile_info, recent_posts } = profileData;

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num;
  };

  const adGoalDisplay = campaignData.adGoal === 'other' ? campaignData.customAdGoal : campaignData.adGoal;

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <header className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="w-24 h-24 border-4 border-primary">
            <AvatarImage src={profile_info.profile_pic_url} alt={profile_info.username} />
            <AvatarFallback>{profile_info.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <h1 className="text-3xl font-bold">{profile_info.username}</h1>
              {profile_info.is_verified && <Badge variant="default" className="bg-blue-500">Verified</Badge>}
              {profile_info.link_in_bio && (
                <a href={profile_info.link_in_bio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
            <p className="mt-2 text-muted-foreground max-w-prose">{profile_info.biography}</p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            icon={<Users className="h-4 w-4 text-muted-foreground" />} 
            label="Followers" 
            value={formatNumber(profile_info.followers)} 
          />
          <StatCard 
            icon={<Users className="h-4 w-4 text-muted-foreground" />} 
            label="Following" 
            value={formatNumber(profile_info.following)} 
          />
          <StatCard 
            icon={<FileText className="h-4 w-4 text-muted-foreground" />} 
            label="Posts" 
            value={formatNumber(profile_info.num_posts)} 
          />
           <StatCard 
            icon={<Target className="h-4 w-4 text-muted-foreground" />} 
            label="Business Focus" 
            value={adGoalDisplay || 'N/A'}
          />
        </div>

        <EditableAnalysisCard 
          analysis={analysis}
          onAnalysisUpdate={onAnalysisUpdate}
        />
      </div>

       <div className="lg:col-span-1">
        <CampaignBrief campaignData={campaignData} />
      </div>


      <div className="lg:col-span-3">
        <h3 className="text-xl font-bold mb-4">Recent Posts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recent_posts.slice(0, 12).map((post: InstagramPost) => (
            <a href={post.url} target="_blank" rel="noopener noreferrer" key={post.url}>
              <Card className="overflow-hidden flex flex-col h-full hover:ring-2 hover:ring-primary transition-all">
                  <div className="relative">
                      <Image
                        src={post.display_url}
                        alt={`Post by ${profile_info.username}`}
                        width={300}
                        height={300}
                        className="w-full aspect-square object-cover"
                        data-ai-hint="social media post"
                      />
                      {post.is_video && <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full"><Play className="w-4 h-4 text-white fill-white" /></div>}
                  </div>
                <CardContent className="p-4 flex flex-col flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">
                    {post.caption}
                  </p>
                  <div className="flex items-center justify-end gap-4 text-muted-foreground mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-red-500/80" />
                          <span className="text-xs font-medium">{formatNumber(post.num_likes)}</span>
                      </div>
                       <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 text-primary/80" />
                          <span className="text-xs font-medium">{formatNumber(post.num_comments)}</span>
                      </div>
                      {post.is_video && typeof post.video_view_count === 'number' && post.video_view_count > 0 && (
                          <div className="flex items-center gap-1.5">
                              <Eye className="w-4 h-4 text-accent/80" />
                              <span className="text-xs font-medium">{formatNumber(post.video_view_count)}</span>
                          </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
