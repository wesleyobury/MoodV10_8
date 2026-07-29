"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  api,
  TimeSeriesData,
  SocialBreakdownData,
  SocialLoopMetrics,
} from "@/lib/api";
import { useFilters } from "@/lib/filter-context";
import { FilterBar } from "@/components/FilterBar";
import { Tooltip, METRIC_TOOLTIPS } from "@/components/Tooltip";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { KPICard } from "@/components/KPICard";
import { redirect } from "next/navigation";
import {
  FileText,
  Heart,
  MessageCircle,
  UserPlus,
  Users,
  Activity,
  AlertCircle,
} from "lucide-react";

function SectionSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-lg flex items-start gap-3 bg-red-500/10 border border-red-500/20">
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-red-500">{message}</p>
    </div>
  );
}

export default function SocialPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const { days, granularity, includeInternal } = useFilters();

  const [loops, setLoops] = useState<SocialLoopMetrics | null>(null);
  const [postsSeries, setPostsSeries] = useState<TimeSeriesData | null>(null);
  const [breakdown, setBreakdown] = useState<SocialBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      redirect("/");
    }
  }, [isLoading, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const [loopsRes, seriesRes, breakdownRes] = await Promise.all([
        api.getSocialLoops(days, includeInternal),
        api.getTimeSeries("posts_created", granularity, days, includeInternal),
        api.getSocialBreakdown(days),
      ]);

      if (cancelled) return;

      if (loopsRes.data) setLoops(loopsRes.data);
      if (seriesRes.data) setPostsSeries(seriesRes.data);
      if (breakdownRes.data) setBreakdown(breakdownRes.data);

      const firstError = loopsRes.error || seriesRes.error || breakdownRes.error;
      if (firstError && !loopsRes.data && !seriesRes.data && !breakdownRes.data) {
        setError(firstError);
      } else if (firstError) {
        setError(`Some social data failed to load: ${firstError}`);
      }

      setLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin, days, granularity, includeInternal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const actions = loops?.actions;
  const overview = loops?.overview;
  const content = loops?.content;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Social</h1>
        <p className="text-muted-foreground">
          Community activity — every number here is real event data
        </p>
      </div>

      <FilterBar />

      {error && <ErrorBanner message={error} />}

      {/* Activity */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Activity</h2>
        {loading ? (
          <SectionSkeleton cards={4} />
        ) : actions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <KPICard
                title="Posts Created"
                value={actions.posts_created.count}
                tooltip={METRIC_TOOLTIPS.postsCreated}
                icon={<FileText className="h-4 w-4" />}
              />
              <p className="text-xs text-muted-foreground px-4 mt-1">
                {actions.posts_created.unique_users.toLocaleString()} unique posters
              </p>
            </div>
            <div>
              <KPICard
                title="Likes"
                value={actions.likes.count}
                tooltip={METRIC_TOOLTIPS.likes}
                icon={<Heart className="h-4 w-4" />}
              />
              <p className="text-xs text-muted-foreground px-4 mt-1">
                {actions.likes.unique_users.toLocaleString()} unique likers
              </p>
            </div>
            <div>
              <KPICard
                title="Comments"
                value={actions.comments.count}
                tooltip={METRIC_TOOLTIPS.comments}
                icon={<MessageCircle className="h-4 w-4" />}
              />
              <p className="text-xs text-muted-foreground px-4 mt-1">
                {actions.comments.unique_users.toLocaleString()} unique commenters
              </p>
            </div>
            <div>
              <KPICard
                title="Follows"
                value={actions.follows.count}
                tooltip={METRIC_TOOLTIPS.follows}
                icon={<UserPlus className="h-4 w-4" />}
              />
              <p className="text-xs text-muted-foreground px-4 mt-1">
                {actions.follows.unique_users.toLocaleString()} unique followers
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No activity data available.</p>
        )}

        {loading ? (
          <div className="animate-pulse bg-muted rounded-lg h-72" />
        ) : postsSeries ? (
          <TimeSeriesChart
            title="Posts created"
            data={postsSeries.labels.map((label, i) => ({
              name: label,
              value: postsSeries.values[i],
            }))}
            type="bar"
            color="hsl(var(--chart-1))"
          />
        ) : (
          <p className="text-muted-foreground text-sm">No posts trend data available.</p>
        )}
      </section>

      {/* Participation */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Participation</h2>
        {loading ? (
          <SectionSkeleton cards={3} />
        ) : overview && content ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard
                title="Social Participants"
                value={overview.social_participants}
                tooltip={METRIC_TOOLTIPS.socialParticipation}
                icon={<Users className="h-4 w-4" />}
              />
              <KPICard
                title="Total Social Actions"
                value={overview.total_social_actions}
                tooltip="Total posts, likes, comments, and follows in the period, combined."
                icon={<Activity className="h-4 w-4" />}
              />
              <KPICard
                title="Avg Engagement per Post"
                value={content.avg_engagement_per_post.toFixed(2)}
                tooltip="Average likes + comments received per post created in the period."
                icon={<Heart className="h-4 w-4" />}
              />
            </div>
            <p className="text-xs text-muted-foreground px-1">
              {overview.social_participation_rate.toFixed(1)}% of{" "}
              {overview.total_active_users.toLocaleString()} active users did at least one
              social action in this period.
            </p>

            {/* Content performance */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Content performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {content.total_posts.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                    <Tooltip content={METRIC_TOOLTIPS.postsCreated} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {content.posts_with_engagement.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-sm text-muted-foreground">With Engagement</p>
                    <Tooltip content="Posts from the period that received at least one like or comment." />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {content.engagement_rate.toFixed(1)}%
                  </p>
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-sm text-muted-foreground">Engagement Rate</p>
                    <Tooltip content="Share of posts created in the period that received at least one like or comment." />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">No participation data available.</p>
        )}
      </section>

      {/* Top members */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Top members</h2>
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="animate-pulse bg-muted rounded-lg h-48" />
            <div className="animate-pulse bg-muted rounded-lg h-48" />
          </div>
        ) : breakdown ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium">Top Likers</h3>
              </div>
              <div className="p-4">
                {breakdown.top_likers.length > 0 ? (
                  <div className="space-y-3">
                    {breakdown.top_likers.map((user, index) => (
                      <div key={user.user_id} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">@{user.username}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {user.count} likes
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No data available
                  </p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium">Top Commenters</h3>
              </div>
              <div className="p-4">
                {breakdown.top_commenters.length > 0 ? (
                  <div className="space-y-3">
                    {breakdown.top_commenters.map((user, index) => (
                      <div key={user.user_id} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">@{user.username}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {user.count} comments
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No data available
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No breakdown data available.</p>
        )}
      </section>
    </div>
  );
}
