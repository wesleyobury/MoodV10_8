"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, UserSearchResult, UserTimelineData, UserLifecycleData } from "@/lib/api";
import { CSVExport } from "@/components/CSVExport";
import { Tooltip } from "@/components/Tooltip";
import { redirect, useSearchParams } from "next/navigation";
import {
  Search,
  User,
  Mail,
  Calendar,
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Shield,
  Award,
} from "lucide-react";
import { formatDate, formatDateTime, cn } from "@/lib/utils";

const LIFECYCLE_STAGES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "New", color: "bg-blue-500", icon: <User className="h-4 w-4" /> },
  activated: { label: "Activated", color: "bg-green-500", icon: <Zap className="h-4 w-4" /> },
  engaged: { label: "Engaged", color: "bg-emerald-500", icon: <Target className="h-4 w-4" /> },
  power_user: { label: "Power User", color: "bg-purple-500", icon: <Award className="h-4 w-4" /> },
  at_risk: { label: "At Risk", color: "bg-yellow-500", icon: <AlertTriangle className="h-4 w-4" /> },
  churned: { label: "Churned", color: "bg-red-500", icon: <TrendingDown className="h-4 w-4" /> },
};

function UsersPageContent() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userTimeline, setUserTimeline] = useState<UserTimelineData | null>(null);
  const [userLifecycle, setUserLifecycle] = useState<UserLifecycleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview");

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      redirect("/");
    }
  }, [isLoading, isAuthenticated, isAdmin]);

  const runSearch = async (query: string) => {
    if (query.length < 2) return;
    setLoading(true);
    const result = await api.searchUsers(query);
    if (result.data) {
      setSearchResults(result.data);
    }
    setLoading(false);
  };

  const handleSearch = () => runSearch(searchQuery);

  // Prefill from ?q= (drilldown drawer links here as /users?q={id}) and run
  // the search once auth is confirmed.
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    const q = searchParams.get("q");
    if (q && q.length >= 2) {
      setSearchQuery(q);
      runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, searchParams]);

  const handleSelectUser = async (userId: string) => {
    setSelectedUser(userId);
    setTimelineLoading(true);
    
    // Fetch both timeline and lifecycle data in parallel
    const [timelineResult, lifecycleResult] = await Promise.all([
      api.getUserTimeline(userId),
      api.getUserLifecycle(userId),
    ]);
    
    if (timelineResult.data) {
      setUserTimeline(timelineResult.data);
    }
    if (lifecycleResult.data) {
      setUserLifecycle(lifecycleResult.data);
    }
    setTimelineLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getExportData = () => {
    if (!searchResults) return [];
    return searchResults.users.map((u) => ({
      Username: u.username,
      Email: u.email,
      Name: u.name,
      "Created At": u.created_at,
      "Last Active": u.last_active,
      "Auth Provider": u.auth_provider,
      "Sessions (30d)": u.activity_30d.sessions,
      "Workouts Started (30d)": u.activity_30d.workouts_started,
      "Workouts Completed (30d)": u.activity_30d.workouts_completed,
      "Posts (30d)": u.activity_30d.posts,
      Followers: u.followers_count,
      Following: u.following_count,
      Streak: u.current_streak,
    }));
  };

  const getChurnRiskColor = (level: string) => {
    switch (level) {
      case "high": return "text-red-500 bg-red-500/10";
      case "medium": return "text-yellow-500 bg-yellow-500/10";
      default: return "text-green-500 bg-green-500/10";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Explorer</h1>
          <p className="text-muted-foreground">Search users, view lifecycle and churn risk</p>
        </div>
        {searchResults && searchResults.users.length > 0 && (
          <CSVExport data={getExportData()} filename={`users-search-${searchQuery}.csv`} />
        )}
      </div>

      {/* Search Box */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search by username, email, or user ID..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searchQuery.length < 2 || loading}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Results */}
        <div className="lg:col-span-1">
          {searchResults && (
            <div className="bg-card border border-border rounded-lg">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium">Results ({searchResults.total})</h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {searchResults.users.length > 0 ? (
                  searchResults.users.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => handleSelectUser(user.user_id)}
                      className={`w-full p-4 text-left border-b border-border last:border-0 hover:bg-accent transition-colors ${
                        selectedUser === user.user_id ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">@{user.username}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{user.activity_30d.workouts_completed} workouts</span>
                            <span>•</span>
                            <span>{user.current_streak} streak</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">No users found</div>
                )}
              </div>
            </div>
          )}

          {!searchResults && (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Search for users to explore</p>
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="lg:col-span-2">
          {timelineLoading ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading user details...</p>
            </div>
          ) : userTimeline && userLifecycle ? (
            <div className="space-y-6">
              {/* User Profile Card with Lifecycle */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    {userTimeline.user.avatar ? (
                      <img
                        src={userTimeline.user.avatar}
                        alt={userTimeline.user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold">@{userTimeline.user.username}</h2>
                      {userTimeline.user.is_admin && (
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">Admin</span>
                      )}
                      {/* Lifecycle Stage Badge */}
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded flex items-center gap-1 text-white",
                        LIFECYCLE_STAGES[userLifecycle.lifecycle.stage]?.color || "bg-gray-500"
                      )}>
                        {LIFECYCLE_STAGES[userLifecycle.lifecycle.stage]?.icon}
                        {LIFECYCLE_STAGES[userLifecycle.lifecycle.stage]?.label || userLifecycle.lifecycle.stage}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{userTimeline.user.email}</p>
                    {userTimeline.user.name && <p className="text-sm">{userTimeline.user.name}</p>}
                  </div>
                </div>

                {/* Churn Risk Indicator */}
                <div className={cn(
                  "mt-4 p-3 rounded-lg flex items-center justify-between",
                  getChurnRiskColor(userLifecycle.churn_risk.level)
                )}>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">Churn Risk: {userLifecycle.churn_risk.level.toUpperCase()}</span>
                  </div>
                  <span className="text-2xl font-bold">{userLifecycle.churn_risk.score}/100</span>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{userLifecycle.current_streak}</p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-sm text-muted-foreground">Current Streak</p>
                      <Tooltip content="Consecutive days with a completed workout, as stored on the user record." />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{userLifecycle.lifetime_stats.total_workouts_completed}</p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-sm text-muted-foreground">Total Workouts</p>
                      <Tooltip content="Lifetime workout_completed events for this user (repeats counted)." />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{userLifecycle.lifetime_stats.completion_rate}%</p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <Tooltip content="Lifetime workouts completed ÷ workouts started for this user." />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{userLifecycle.lifecycle.account_age_days}d</p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-sm text-muted-foreground">Account Age</p>
                      <Tooltip content="Days since the account was created." />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {userTimeline.user.created_at ? formatDate(userTimeline.user.created_at) : "N/A"}</span>
                  </div>
                  {userLifecycle.lifecycle.days_since_last_session !== null && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Last seen {userLifecycle.lifecycle.days_since_last_session}d ago</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={cn(
                    "px-4 py-2 text-sm rounded-md transition-colors",
                    activeTab === "overview"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:bg-accent"
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={cn(
                    "px-4 py-2 text-sm rounded-md transition-colors",
                    activeTab === "timeline"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:bg-accent"
                  )}
                >
                  Activity Timeline
                </button>
              </div>

              {activeTab === "overview" && (
                <>
                  {/* Churn Risk Factors */}
                  {userLifecycle.churn_risk.factors.length > 0 && (
                    <div className="bg-card border border-border rounded-lg">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          Churn Risk Factors
                        </h3>
                      </div>
                      <div className="divide-y divide-border">
                        {userLifecycle.churn_risk.factors.map((factor, idx) => (
                          <div key={idx} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium capitalize">{factor.factor.replace(/_/g, " ")}</p>
                              <p className="text-sm text-muted-foreground">{factor.detail}</p>
                            </div>
                            <span className="text-red-500 font-bold">+{factor.impact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestones */}
                  {userLifecycle.milestones.length > 0 && (
                    <div className="bg-card border border-border rounded-lg">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">User Milestones</h3>
                      </div>
                      <div className="p-4">
                        <div className="relative">
                          {userLifecycle.milestones.map((milestone, idx) => (
                            <div key={idx} className="flex items-center gap-4 mb-4 last:mb-0">
                              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium">{milestone.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDateTime(milestone.date)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {userLifecycle.time_to_first_workout_hours !== null && (
                          <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
                            Time to first workout: <span className="font-medium">{userLifecycle.time_to_first_workout_hours}h</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Activity Trends */}
                  <div className="bg-card border border-border rounded-lg">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-medium">Activity Trends</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left p-3 text-sm font-medium">Period</th>
                            <th className="text-right p-3 text-sm font-medium">Sessions</th>
                            <th className="text-right p-3 text-sm font-medium">Workouts</th>
                            <th className="text-right p-3 text-sm font-medium">Completed</th>
                            <th className="text-right p-3 text-sm font-medium">Posts</th>
                            <th className="text-right p-3 text-sm font-medium">Social</th>
                          </tr>
                        </thead>
                        <tbody>
                          {["7d", "14d", "30d", "90d"].map((period) => (
                            <tr key={period} className="border-b border-border last:border-0">
                              <td className="p-3 font-medium">Last {period}</td>
                              <td className="p-3 text-right">{userLifecycle.activity_trends[period]?.sessions || 0}</td>
                              <td className="p-3 text-right">{userLifecycle.activity_trends[period]?.workouts_started || 0}</td>
                              <td className="p-3 text-right">{userLifecycle.activity_trends[period]?.workouts_completed || 0}</td>
                              <td className="p-3 text-right">{userLifecycle.activity_trends[period]?.posts || 0}</td>
                              <td className="p-3 text-right">{userLifecycle.activity_trends[period]?.social_actions || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "timeline" && (
                <>
                  {/* Login History */}
                  {userTimeline.login_history.length > 0 && (
                    <div className="bg-card border border-border rounded-lg">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">Recent Logins</h3>
                      </div>
                      <div className="divide-y divide-border">
                        {userTimeline.login_history.slice(0, 5).map((login, index) => (
                          <div key={index} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium capitalize">{login.method}</p>
                              <p className="text-sm text-muted-foreground">{formatDateTime(login.timestamp)}</p>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-xs rounded ${
                                login.success ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                              }`}
                            >
                              {login.success ? "Success" : "Failed"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Event Timeline */}
                  <div className="bg-card border border-border rounded-lg">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-medium">Activity Timeline ({userTimeline.total_events} events)</h3>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
                      {userTimeline.events.slice(0, 50).map((event) => (
                        <div key={event.event_id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{event.event_label}</p>
                              <p className="text-xs text-muted-foreground">{event.event_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{formatDateTime(event.timestamp)}</p>
                              <span className="text-xs px-2 py-0.5 bg-muted rounded capitalize">{event.category}</span>
                            </div>
                          </div>
                          {Object.keys(event.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(event.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Next 14 requires useSearchParams to live under a Suspense boundary.
export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
