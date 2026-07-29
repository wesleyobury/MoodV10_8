"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, className, side = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "absolute z-50 px-3 py-2 text-xs bg-popover border border-border rounded-md shadow-lg max-w-[280px] whitespace-normal",
            positionClasses[side]
          )}
        >
          <div className="text-popover-foreground">{content}</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric definitions for tooltips.
// These are written to match what the backend ACTUALLY computes (audited),
// in plain English. If a metric has a known caveat, the tooltip says so —
// an investor-ready dashboard never makes you guess what a number means.
// ---------------------------------------------------------------------------
export const METRIC_TOOLTIPS = {
  // --- Active users & stickiness ---
  dau: "Daily Active Users: unique signed-in users who opened the app (app_session_start) in the last 24 hours. Rolling window, measured in UTC. Guest sessions are not included.",
  wau: "Weekly Active Users: unique signed-in users who opened the app in the last 7 days (rolling, UTC).",
  mau: "Monthly Active Users: unique signed-in users who opened the app in the last 30 days (rolling, UTC).",
  stickiness: "Stickiness (DAU ÷ MAU): of everyone active this month, the share who were also active today. 20%+ is considered strong for consumer apps — it means users come back often.",
  wauMauRatio: "WAU ÷ MAU: the share of monthly users who were active this week. Higher = users return on a weekly rhythm rather than once a month.",

  // --- Growth ---
  newUsers: "New Users (signups): accounts created in the selected period, based on the account-creation timestamp. Excludes staff/test accounts unless 'Internal included' is on. Note: deleted accounts are removed from history, so past totals can shrink slightly.",
  totalUsers: "Total Users: all registered accounts ever (minus deleted accounts). This is signups, NOT App Store downloads.",
  firstOpens: "First Opens (tracked): unique devices whose first app launch successfully reported to our server. This is always LOWER than App Store 'first-time downloads' because (1) people who download but never open the app can't be counted, (2) tracking only exists since it shipped, (3) a first launch while offline or after opting out of analytics is never reported, and (4) Apple counts per Apple ID while we count per device. Use App Store Connect for true download numbers.",
  guestConversions: "Guest → Account Conversions: devices that browsed as a guest and later created an account (linked by device ID).",
  appStoreDownloads: "App Store Downloads: real download units from Apple's daily Sales reports (new downloads per Apple ID; redownloads and app updates excluded). Synced automatically from the App Store Connect API. Apple publishes each day's report the next day and may restate recent days.",
  downloadsVsFirstOpens: "Two views of the same journey: Apple counts the download; we count the first successful app open that reached our server. The gap between the lines = people who downloaded but haven't opened the app yet (plus tracking losses like offline first launches).",
  signupTrend: "Accounts created per period, bucketed by the selected granularity (UTC calendar days / ISO weeks / months).",

  // --- Workouts / engagement ---
  workoutsStarted: "Workouts Started: total workout_started events in the period (all users, counts repeats).",
  workoutsCompleted: "Workouts Completed: total workout_completed events in the period (all users, counts repeats).",
  completionRate: "Completion Rate: workouts completed ÷ workouts started in the period. Event-based — a workout started at 11:59pm and finished after midnight can land in different buckets.",
  activeUsers: "Active Users: unique signed-in users with at least one tracked event in the period.",
  sessions: "App Sessions: count of app-open events (app_session_start) in the period. One user opening the app 5 times = 5 sessions.",

  // --- Activation ---
  activationRate: "Activation Rate: share of new signups who started their first workout within the period. The single best early predictor of retention.",
  timeToFirstWorkout: "Time to First Workout: median time from account creation to first workout. Shorter = onboarding is doing its job.",

  // --- Retention ---
  retentionCohort: "Each row is a cohort: everyone who signed up in that period. Each column shows the % of that cohort who came back and used the app N days after their individual signup time (so 'Day 1' = 24–48h after signup, not the next calendar day). 'Came back' = any tracked activity.",
  d1Retention: "Day-1 Retention: % of a signup cohort with any tracked activity 24–48 hours after their signup moment.",
  d7Retention: "Day-7 Retention: % of a signup cohort with any tracked activity on the 7th day after signup.",
  d28Retention: "Day-28 Retention: % of a signup cohort active on the 28th day after signup. Cohorts younger than 28 days are excluded from the average (they can't have day-28 data yet).",

  // --- Funnels ---
  funnelConversion: "Conversion: % of users from the previous step who also did this step within the selected period. Steps are matched within the period, not in strict order — treat this as directional.",
  funnelDropoff: "Drop-off: % of users from the previous step who did NOT reach this step in the period.",
  overallConversion: "Overall Conversion: % of users who entered the funnel (step 1) and completed every step through the end.",

  // --- Social ---
  postsCreated: "Posts Created: total post_created events in the period.",
  likes: "Likes: total post_liked events in the period.",
  comments: "Comments: total post_commented events in the period.",
  follows: "Follows: total user_followed events in the period.",
  socialParticipation: "Social Participation: share of active users who did at least one social action (post, like, comment, or follow) in the period.",
  notificationClicks: "Notification Clicks: notification_clicked events — a proxy for push-notification engagement.",

  // --- Features / content ---
  moodSelections: "Times each mood category was selected when starting a workout, in the period.",
  equipmentSelections: "Times each equipment type was selected in workout setup, in the period.",
  difficultySelections: "Times each difficulty level was selected, in the period.",
  exerciseCompletions: "exercise_completed events per exercise — which exercises people actually finish.",

  // --- Monetization ---
  activeSubscriptions: "Active Subscribers: users with an active paid subscription right now. Excludes free trials, comps, and internal accounts. Live snapshot — not affected by the selected date range.",
  freeTrials: "Trials Started: unique users who started a free trial in the selected period.",

  // --- Onboarding ---
  onboardingCompletion: "Completion Rate: of the unique users who entered onboarding in the period, the share who reached the final step (completed ÷ entered).",

  // --- Data quality / filters ---
  dataFreshness: "Last Event: timestamp of the most recent tracked event. If this is old, the tracking pipeline may be down.",
  eventsPerHour: "Events in the last 60 minutes. A sudden drop usually means a tracking or backend issue, not a user issue.",
  includeInternal: "When excluded (default), staff and test accounts (is_internal) are filtered out of metrics wherever the backend supports it, so numbers reflect real users.",
  comparePeriod: "Change vs the previous period of the same length (e.g. last 30 days vs the 30 days before). Green = up, red = down.",
  timezoneNote: "All metrics are computed in UTC. App Store Connect uses your local report timezone, so daily numbers can differ slightly at the edges.",
};

// Short human labels for drilldown views and chart titles.
export const METRIC_LABELS: Record<string, string> = {
  active_users: "Active Users",
  new_users: "New Users",
  workouts_started: "Workouts Started",
  workouts_completed: "Workouts Completed",
  posts_created: "Posts Created",
  social_interactions: "Social Interactions",
  mood_selections: "Mood Selections",
  app_sessions: "App Sessions",
  completion_rate: "Completion Rate",
};
