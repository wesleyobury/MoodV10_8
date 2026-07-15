const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("admin_token", token);
      } else {
        localStorage.removeItem("admin_token");
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("admin_token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.setToken(null);
        return { error: "Unauthorized" };
      }

      if (response.status === 403) {
        return { error: "Admin access required" };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.detail || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("API request error:", error);
      return { error: error instanceof Error ? error.message : "Network error" };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const result = await this.post<{ token: string; user_id: string }>(
      "/auth/login",
      { username, password }
    );
    if (result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  async checkAdmin() {
    return this.get<{
      user_id: string;
      username: string;
      email: string;
      is_admin_effective: boolean;
      admin_matched_by: string;
    }>("/auth/me");
  }

  // Analytics endpoints
  async getEnvInfo() {
    return this.get<{
      environment: string;
      is_staging: boolean;
      git_sha: string;
      deployed_at: string;
      seed_version: string;
      admin_allowlist: string[];
    }>("/analytics/admin/env-info");
  }

  async getDataFreshness() {
    return this.get<DataFreshnessData>("/analytics/admin/data-freshness");
  }

  async getEngagement(includeInternal: boolean = false) {
    const params = includeInternal ? "?include_internal=true" : "";
    return this.get<EngagementData>(`/analytics/admin/engagement${params}`);
  }

  async getLiveSnapshot(includeInternal: boolean = false) {
    const params = includeInternal ? "?include_internal=true" : "";
    return this.get<LiveSnapshotData>(`/analytics/admin/live-snapshot${params}`);
  }

  async getPlatformStats(days: number = 30, includeInternal: boolean = false) {
    const params = new URLSearchParams();
    params.append("days", days.toString());
    if (includeInternal) params.append("include_internal", "true");
    return this.get<PlatformStats>(`/analytics/admin/platform-stats?${params}`);
  }

  async getTimeSeries(
    metricType: string, 
    period: string = "day", 
    limit: number = 30,
    includeInternal: boolean = false
  ) {
    const params = new URLSearchParams();
    params.append("period", period);
    params.append("limit", limit.toString());
    if (includeInternal) params.append("include_internal", "true");
    return this.get<TimeSeriesData>(
      `/analytics/admin/time-series/${metricType}?${params}`
    );
  }

  // Activation metrics
  async getActivation(days: number = 30, includeInternal: boolean = false) {
    const params = new URLSearchParams();
    params.append("days", days.toString());
    if (includeInternal) params.append("include_internal", "true");
    return this.get<ActivationMetrics>(`/analytics/admin/activation?${params}`);
  }

  // Workout quality metrics
  async getWorkoutQuality(days: number = 30, includeInternal: boolean = false) {
    const params = new URLSearchParams();
    params.append("days", days.toString());
    if (includeInternal) params.append("include_internal", "true");
    return this.get<WorkoutQualityMetrics>(`/analytics/admin/workout-quality?${params}`);
  }

  // Social loop metrics
  async getSocialLoops(days: number = 30, includeInternal: boolean = false) {
    const params = new URLSearchParams();
    params.append("days", days.toString());
    if (includeInternal) params.append("include_internal", "true");
    return this.get<SocialLoopMetrics>(`/analytics/admin/social-loops?${params}`);
  }

  // Automated insights
  async getInsights(includeInternal: boolean = false) {
    const params = includeInternal ? "?include_internal=true" : "";
    return this.get<InsightsResponse>(`/analytics/admin/insights${params}`);
  }

  async getComparison(start?: string, end?: string) {
    const params = new URLSearchParams();
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    return this.get<ComparisonData>(`/analytics/admin/comparison?${params}`);
  }

  async getFunnel(
    start?: string,
    end?: string,
    steps?: string[],
    includeUsers: boolean = false
  ) {
    const params = new URLSearchParams();
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    if (steps) params.append("steps", steps.join(","));
    if (includeUsers) params.append("include_users", "true");
    return this.get<FunnelData>(`/analytics/admin/funnel?${params}`);
  }

  async getOnboarding(
    start?: string,
    end?: string,
    includeInternal: boolean = false
  ) {
    const params = new URLSearchParams();
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    if (includeInternal) params.append("include_internal", "true");
    return this.get<OnboardingData>(`/analytics/admin/onboarding?${params}`);
  }

  async getMonetization(
    start?: string,
    end?: string,
    includeInternal: boolean = false
  ) {
    const params = new URLSearchParams();
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    if (includeInternal) params.append("include_internal", "true");
    return this.get<MonetizationData>(`/analytics/admin/monetization?${params}`);
  }

  async getRetention(
    start?: string,
    end?: string,
    cohort: string = "week",
    window: number = 28
  ) {
    const params = new URLSearchParams();
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    params.append("cohort", cohort);
    params.append("window", window.toString());
    return this.get<RetentionData>(`/analytics/admin/retention?${params}`);
  }

  async getBreakdown(metricType: string, days: number = 30) {
    return this.get<BreakdownData>(
      `/analytics/admin/breakdown/${metricType}?days=${days}`
    );
  }

  async getMoodBreakdown(days: number = 30) {
    return this.get<MoodBreakdownData>(`/analytics/admin/moods?days=${days}`);
  }

  async getEquipmentBreakdown(days: number = 30) {
    return this.get<EquipmentBreakdownData>(`/analytics/admin/equipment?days=${days}`);
  }

  async getDifficultyBreakdown(days: number = 30) {
    return this.get<DifficultyBreakdownData>(`/analytics/admin/difficulties?days=${days}`);
  }

  async getExercisesBreakdown(days: number = 30) {
    return this.get<ExercisesBreakdownData>(`/analytics/admin/exercises?days=${days}`);
  }

  async getSocialBreakdown(days: number = 30) {
    return this.get<SocialBreakdownData>(`/analytics/admin/social?days=${days}`);
  }

  async searchUsers(query: string, limit: number = 50) {
    return this.get<UserSearchResult>(
      `/analytics/admin/users/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  async getUserTimeline(userId: string, start?: string, end?: string) {
    const params = new URLSearchParams();
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    return this.get<UserTimelineData>(`/analytics/admin/users/${userId}/timeline?${params}`);
  }

  async getUserLifecycle(userId: string) {
    return this.get<UserLifecycleData>(`/analytics/admin/users/${userId}/lifecycle`);
  }

  // Drilldown endpoints for universal drill-downs
  async getDrilldownUsers(
    metric: string,
    start: string,
    end: string,
    options: {
      value?: string;
      limit?: number;
      skip?: number;
      includeInternal?: boolean;
    } = {}
  ) {
    const params = new URLSearchParams();
    params.append("metric", metric);
    params.append("start", start);
    params.append("end", end);
    if (options.value) params.append("value", options.value);
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.skip) params.append("skip", options.skip.toString());
    if (options.includeInternal) params.append("include_internal", "true");
    return this.get<DrilldownUsersData>(`/analytics/admin/drilldown/users?${params}`);
  }

  async getDrilldownEvents(
    metric: string,
    start: string,
    end: string,
    options: {
      userId?: string;
      value?: string;
      limit?: number;
      skip?: number;
      includeInternal?: boolean;
    } = {}
  ) {
    const params = new URLSearchParams();
    params.append("metric", metric);
    params.append("start", start);
    params.append("end", end);
    if (options.userId) params.append("user_id", options.userId);
    if (options.value) params.append("value", options.value);
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.skip) params.append("skip", options.skip.toString());
    if (options.includeInternal) params.append("include_internal", "true");
    return this.get<DrilldownEventsData>(`/analytics/admin/drilldown/events?${params}`);
  }

  // Saved Views
  async getSavedViews(viewType?: string) {
    const params = viewType ? `?view_type=${viewType}` : "";
    return this.get<SavedViewsResponse>(`/analytics/admin/saved-views${params}`);
  }

  async getSavedView(viewId: string) {
    return this.get<SavedView>(`/analytics/admin/saved-views/${viewId}`);
  }

  async createSavedView(view: SavedViewCreate) {
    return this.post<SavedView>(`/analytics/admin/saved-views`, view);
  }

  async updateSavedView(viewId: string, update: Partial<SavedViewCreate>) {
    return this.put<SavedView>(`/analytics/admin/saved-views/${viewId}`, update);
  }

  async deleteSavedView(viewId: string) {
    return this.delete<{ message: string; id: string }>(`/analytics/admin/saved-views/${viewId}`);
  }

  // Admin actions
  async seedFeaturedWorkouts() {
    return this.post<{ message: string }>("/admin/seed-featured-workouts");
  }

  async grantAccess(username: string) {
    return this.post<{ message: string; user_id: string }>("/admin/grant-access", { username });
  }

  // ── MOOD V2 Phase 1: Comp accounts ───────────────────────────────────
  async listCompUsers() {
    return this.get<{ users: CompUser[]; total: number }>("/admin/comp-users");
  }

  async grantComp(identifier: string) {
    return this.post<{ ok: boolean }>(
      `/admin/users/${encodeURIComponent(identifier)}/comp`
    );
  }

  async revokeComp(identifier: string) {
    return this.delete<{ ok: boolean }>(
      `/admin/users/${encodeURIComponent(identifier)}/comp`
    );
  }

  // ── Creator comp codes ───────────────────────────────────────────────
  async listCreatorCodes() {
    return this.get<{ codes: CreatorCode[]; total: number }>("/admin/creator-codes");
  }

  async createCreatorCode(payload: {
    creator_name: string;
    code?: string;
    creator_contact?: string;
    note?: string;
    max_redemptions?: number;
  }) {
    return this.post<{ ok: boolean; code: string }>("/admin/creator-codes", payload);
  }

  async revokeCreatorCode(code: string, revokeAccess = false) {
    const qs = revokeAccess ? "?revoke_access=true" : "";
    return this.delete<{ ok: boolean; revoked_users: number }>(
      `/admin/creator-codes/${encodeURIComponent(code)}${qs}`
    );
  }

  // ── Creator applications (apply → approve → sign) ────────────────────
  async listCreatorApplications(status?: CreatorAppStatus | "all") {
    const qs = status ? `?status=${status}` : "";
    return this.get<CreatorApplicationsData>(`/admin/creator-applications${qs}`);
  }

  async approveCreatorApplication(
    id: string,
    payload: { code?: string; tier?: string; note?: string } = {}
  ) {
    return this.post<{ ok: boolean; code: string; sign_link: string; emailed: boolean }>(
      `/admin/creator-applications/${encodeURIComponent(id)}/approve`,
      payload
    );
  }

  async rejectCreatorApplication(id: string) {
    return this.post<{ ok: boolean }>(
      `/admin/creator-applications/${encodeURIComponent(id)}/reject`,
      {}
    );
  }

  async getCreatorSignature(id: string) {
    return this.get<{ id: string; signature_image: string }>(
      `/admin/creator-applications/${encodeURIComponent(id)}/signature`
    );
  }

  // ── Subscriber directory (the "who paid" list) ──────────────────────
  async getSubscribers(
    options: {
      status?: "all" | "active" | "trial" | "comp" | "lapsed";
      limit?: number;
      skip?: number;
      search?: string;
      includeInternal?: boolean;
    } = {}
  ) {
    const params = new URLSearchParams();
    params.append("status", options.status || "all");
    params.append("limit", String(options.limit ?? 200));
    params.append("skip", String(options.skip ?? 0));
    if (options.search) params.append("search", options.search);
    if (options.includeInternal) params.append("include_internal", "true");
    return this.get<SubscribersData>(`/analytics/admin/subscribers?${params}`);
  }

  // ── Acquisition funnel (downloads → signup → trial → paid) ──────────
  async getAcquisition(start?: string, end?: string, includeInternal: boolean = false) {
    const params = new URLSearchParams();
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    if (includeInternal) params.append("include_internal", "true");
    return this.get<AcquisitionData>(`/analytics/admin/acquisition?${params}`);
  }

  async getStoreMetricsStatus() {
    return this.get<StoreMetricsStatus>("/analytics/admin/store-metrics/status");
  }

  async syncStoreMetrics(days: number = 14) {
    return this.post<StoreSyncResult>(`/analytics/admin/store-metrics/sync?days=${days}`, {});
  }

  // ── MOOD V2 Phase 1: Forced-update / app config ──────────────────────
  async getAppConfig() {
    return this.get<AppConfig>("/config");
  }

  async updateAppConfig(update: Partial<AppConfig>) {
    return this.put<{ ok: boolean }>("/admin/config", update);
  }
}

export interface CompUser {
  user_id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  comp_granted_at: string | null;
  comp_granted_by?: string | null;
}

export interface CreatorCodeRedemption {
  username: string;
  email: string;
  user_id: string;
  redeemed_at: string | null;
}

export interface CreatorCode {
  code: string;
  creator_name: string;
  creator_contact: string;
  note: string;
  active: boolean;
  max_redemptions: number;
  redemption_count: number;
  redemptions: CreatorCodeRedemption[];
  created_at: string | null;
}

export type CreatorAppStatus = "pending" | "approved" | "signed" | "rejected";

export interface CreatorApplication {
  id: string;
  name: string;
  email: string;
  instagram: string;
  tiktok: string;
  instagram_url: string;
  tiktok_url: string;
  audience: string;
  niche: string;
  link: string;
  why: string;
  status: CreatorAppStatus;
  code: string;
  sign_link: string;
  store_link: string;
  tier: string;
  payout_method: string;
  payout_handle: string;
  signature_name: string;
  agreement_version: string;
  has_signature: boolean;
  source: string;
  created_at: string | null;
  approved_at: string | null;
  signed_at: string | null;
}

export interface CreatorApplicationsData {
  applications: CreatorApplication[];
  total: number;
  counts: Record<CreatorAppStatus, number>;
}

export interface AppConfig {
  min_supported_build_ios: number;
  min_supported_build_android: number;
  latest_build_ios: number;
  latest_build_android: number;
  force_update_message: string;
  ios_store_url: string;
  android_store_url: string;
  update_check_enabled: boolean;
  welcome_video_enabled?: boolean;
  welcome_video_url?: string;
  welcome_video_thumbnail_url?: string;
  welcome_video_caption?: string;
  v2_launch_date?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

export const api = new ApiClient();

export interface AcquisitionStage {
  key: "downloads" | "signups" | "trials" | "paid";
  label: string;
  value: number;
  from_prev_pct: number;
  pct_of_top: number;
}

export interface StorePlatformStatus {
  configured: boolean;
  [k: string]: unknown;
}

export interface AcquisitionDownloads {
  total: number;
  by_platform: { apple?: number; google?: number };
  series: { date: string; apple: number; google: number; total: number }[];
  days_with_data: number;
  configured: { apple?: boolean; google?: boolean };
  status: { apple?: StorePlatformStatus; google?: StorePlatformStatus };
  last_synced_date: string | null;
}

export interface AcquisitionData {
  start_date: string;
  end_date: string;
  stages: AcquisitionStage[];
  downloads: AcquisitionDownloads;
  conversions: {
    download_to_signup?: number;
    signup_to_trial?: number;
    trial_to_paid?: number;
    signup_to_paid?: number;
    download_to_paid?: number;
  };
  paid_split: {
    trial_converted?: number;
    direct?: number;
    trial_converted_pct?: number;
    direct_pct?: number;
  };
  counts: { downloads?: number; signups?: number; trials?: number; paid?: number };
  notes?: string[];
  error?: string;
}

export interface StoreMetricsStatus {
  configured: { apple?: boolean; google?: boolean };
  status: { apple?: StorePlatformStatus; google?: StorePlatformStatus };
  last_synced_date: string | null;
  days_with_data_30d: number;
}

export interface StoreSyncResult {
  synced: { platform: string; date: string; downloads: number }[];
  skipped: { apple: number; google: number };
  errors: { platform: string; date: string; error: string }[];
  configured: { apple?: boolean; google?: boolean };
  ran_at: string;
}

export type SubscriberStatus = "active" | "trial" | "comp" | "lapsed";

export interface SubscriberRow {
  user_id: string;
  username: string;
  email: string;
  avatar: string;
  status: SubscriberStatus;
  raw_status: string | null;
  plan: string | null;
  product_id: string | null;
  price_usd: number;
  net_price_usd: number;
  mrr_usd: number;
  purchase_date: string | null;
  expiration_date: string | null;
  last_validated_at: string | null;
  founding_member: boolean;
  is_comp: boolean;
  platform: string;
  created_at: string | null;
}

export interface SubscribersSummary {
  total: number;
  active: number;
  trial: number;
  comp: number;
  lapsed: number;
  founding_members: number;
  active_annual: number;
  active_monthly: number;
  mrr_usd: number;
  net_mrr_usd: number;
}

export interface SubscribersData {
  summary: SubscribersSummary;
  subscribers: SubscriberRow[];
  total: number;
  status: string;
  limit: number;
  skip: number;
  error?: string;
}

// Types
export interface EngagementData {
  dau: number;
  wau: number;
  mau: number;
  stickiness_dau_mau: number;
  wau_mau_ratio: number;
  computed_at: string;
  note: string;
}

export interface LiveSnapshotData {
  signups: { total: number; today: number };
  downloads: { total: number; today: number; synced: boolean };
  trials: { active: number; today: number };
  subscriptions: { active: number; today: number };
  computed_at: string;
  error?: string;
}

export interface DataFreshnessData {
  last_event_at: string | null;
  last_event_type: string | null;
  events_last_hour: number;
  events_last_24h: number;
  checked_at: string;
  git_sha: string;
  deployed_at: string;
  environment: string;
  error?: string;
}

export interface PlatformStats {
  period_days: number;
  total_users: number;
  active_users: number;
  daily_active_users: number;
  new_users: number;
  total_workouts_started: number;
  total_workouts_completed: number;
  workout_completion_rate: number;
  total_posts_created: number;
  total_likes: number;
  total_comments: number;
  total_follows: number;
  retention_rate: number;
  popular_mood_categories: { mood: string; count: number }[];
}

export interface TimeSeriesData {
  metric_type: string;
  period: string;
  labels: string[];
  values: number[];
  secondary_values: number[];
  total: number;
  average: number;
}

export interface ComparisonData {
  current_period: { start: string; end: string };
  previous_period: { start: string; end: string };
  metrics: Record<string, MetricComparison>;
}

export interface MetricComparison {
  current: number;
  previous: number;
  change: number;
  change_pct: number;
  trend: "up" | "down" | "flat";
  is_percentage: boolean;
}

export interface FunnelData {
  start_date: string;
  end_date: string;
  steps: FunnelStep[];
  overall_conversion: number;
  total_entry_users: number;
  total_completed_users: number;
}

export interface FunnelStep {
  step: string;
  step_index: number;
  step_label: string;
  unique_users: number;
  converted_users: number;
  dropped_users: number;
  conversion_rate: number;
  dropoff_rate: number;
  converted_user_ids?: string[];
  dropped_user_ids?: string[];
}

// ── Onboarding funnel ──
export interface OnboardingFunnelStep {
  step: string;
  step_index: number;
  label: string;
  unique: number;
  converted: number;
  dropped: number;
  step_conversion: number; // vs previous step
  step_dropoff: number;
  pct_of_entry: number; // vs funnel entry
}

export interface OnboardingTiming {
  step: number;
  label: string;
  median_ms: number;
  avg_ms: number;
  samples: number;
}

export interface OnboardingAnswerOption {
  answer: string;
  count: number;
  pct: number;
}

export interface OnboardingAnswers {
  step: number;
  question: string;
  total: number;
  options: OnboardingAnswerOption[];
}

export interface OnboardingCta {
  cta: string;
  count: number;
}

export interface OnboardingAbandon {
  step: number | null;
  label: string;
  count: number;
}

export interface OnboardingData {
  start_date: string;
  end_date: string;
  entry_participants: number;
  completed_participants: number;
  overall_completion_rate: number;
  guest_entries: number;
  auth_entries: number;
  funnel: OnboardingFunnelStep[];
  timing: OnboardingTiming[];
  answers: OnboardingAnswers[];
  reveal_ctas: OnboardingCta[];
  abandonment: OnboardingAbandon[];
  error?: string;
}

// ── Monetization / paywall ──
export interface MonetizationFunnelStep {
  label: string;
  unique: number;
  converted: number;
  step_conversion: number;
  pct_of_top: number;
}
export interface MonetizationStage {
  stage: number;
  viewed: number;
  dismissed: number;
  purchased: number;
  conversion: number;
}
export interface MonetizationTrigger {
  trigger: string;
  viewed: number;
  purchased: number;
  conversion: number;
}
export interface MonetizationPlan {
  plan: string;
  count: number;
  revenue_usd: number;
}
export interface MonetizationData {
  start_date: string;
  end_date: string;
  store_commission_rate: number;
  headline: {
    paywall_viewers: number;
    purchasers: number;
    paying_customers: number;
    conversion_rate: number;
    revenue_usd: number;
    net_revenue_usd: number;
    mrr_usd: number;
    arr_usd: number;
    active_subscribers: number;
    trials_started: number;
    founding_claim_rate: number;
  };
  funnel: MonetizationFunnelStep[];
  by_stage: MonetizationStage[];
  by_trigger: MonetizationTrigger[];
  plan_mix: MonetizationPlan[];
  founding: { shown: number; claimed: number; dismissed: number; claim_rate: number };
  churn: { trial_cancelled: number; subscription_lapsed: number; purchase_failed: number; checkout_abandoned: number };
  error?: string;
}

export interface RetentionData {
  start_date: string;
  end_date: string;
  cohort_period: string;
  retention_window: number;
  retention_days: string[];
  cohorts: RetentionCohort[];
  average_retention: Record<string, number>;
  heatmap_data: { cohort: string; day: string; value: number }[];
  total_users: number;
}

export interface RetentionCohort {
  cohort: string;
  cohort_label: string;
  cohort_size: number;
  retention: Record<string, { retained: number; percentage: number }>;
}

export interface BreakdownData {
  metric_type: string;
  items: { name: string; count: number }[];
  total: number;
}

export interface MoodBreakdownData {
  total_selections: number;
  moods: { mood: string; selection_count: number; unique_users: number; percentage: number }[];
  period_days: number;
}

export interface EquipmentBreakdownData {
  total_selections: number;
  equipment: { equipment: string; selection_count: number; unique_users: number; percentage: number }[];
  period_days: number;
}

export interface DifficultyBreakdownData {
  total_selections: number;
  difficulties: { difficulty: string; selection_count: number; unique_users: number; percentage: number }[];
  period_days: number;
}

export interface ExercisesBreakdownData {
  total_completions: number;
  exercises: { exercise_name: string; completion_count: number; unique_users: number; percentage: number }[];
  period_days: number;
}

export interface SocialBreakdownData {
  top_likers: { user_id: string; username: string; count: number }[];
  top_commenters: { user_id: string; username: string; count: number }[];
  period_days: number;
}

export interface UserSearchResult {
  users: UserSearchItem[];
  total: number;
  query: string;
}

export interface UserSearchItem {
  user_id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  created_at: string;
  last_active: string;
  is_admin: boolean;
  auth_provider: string;
  total_logins: number;
  activity_30d: {
    sessions: number;
    workouts_started: number;
    workouts_completed: number;
    posts: number;
  };
  followers_count: number;
  following_count: number;
  current_streak: number;
}

export interface UserTimelineData {
  user: {
    user_id: string;
    username: string;
    email: string;
    name: string;
    avatar: string;
    created_at: string;
    is_admin: boolean;
    current_streak: number;
    total_workouts: number;
  };
  events: TimelineEvent[];
  events_by_day: Record<string, TimelineEvent[]>;
  total_events: number;
  login_history: {
    timestamp: string;
    method: string;
    success: boolean;
    ip_address: string;
  }[];
  active_sessions: {
    created_at: string;
    last_activity: string;
    device_type: string;
    login_method: string;
  }[];
}

export interface TimelineEvent {
  event_id: string;
  event_type: string;
  event_label: string;
  category: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

// Drilldown types for universal drill-downs
export interface DrilldownUser {
  user_id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  created_at: string | null;
  metric_value: number;
  metric_detail: string;
  first_event?: string | null;
  last_event?: string | null;
}

export interface DrilldownUsersData {
  metric: string;
  start_date: string;
  end_date: string;
  value_filter: string | null;
  users: DrilldownUser[];
  total: number;
  limit: number;
  skip: number;
  include_internal: boolean;
}

export interface DrilldownEvent {
  event_id: string;
  event_type: string;
  user_id: string;
  username: string;
  timestamp: string | null;
  metadata: Record<string, unknown>;
}

export interface DrilldownEventsData {
  metric: string;
  start_date: string;
  end_date: string;
  user_filter: string | null;
  value_filter: string | null;
  events: DrilldownEvent[];
  total: number;
  limit: number;
  skip: number;
  include_internal: boolean;
}

// Activation Metrics types
export interface ActivationMetrics {
  period_days: number;
  total_new_users: number;
  activated_users: number;
  activation_rate: number;
  time_to_first_workout: {
    median_hours: number | null;
    avg_hours: number | null;
    distribution: {
      bucket: string;
      count: number;
      percentage: number;
    }[];
  };
  activation_funnel: {
    step: string;
    users: number;
    rate: number;
  }[];
  include_internal: boolean;
}

// Workout Quality Metrics types
export interface WorkoutQualityMetrics {
  period_days: number;
  overall: {
    total_started: number;
    total_completed: number;
    total_abandoned: number;
    completion_rate: number;
    abandon_rate: number;
  };
  by_mood_category: {
    category: string;
    started: number;
    completed: number;
    abandoned: number;
    completion_rate: number;
    abandon_rate: number;
    unique_users: number;
  }[];
  by_difficulty: {
    difficulty: string;
    started: number;
    completed: number;
    completion_rate: number;
    abandon_rate: number;
  }[];
  by_equipment: {
    equipment: string;
    started: number;
    completed: number;
    completion_rate: number;
  }[];
  include_internal: boolean;
}

// Social Loop Metrics types
export interface SocialLoopMetrics {
  period_days: number;
  overview: {
    total_active_users: number;
    social_participants: number;
    social_participation_rate: number;
    total_social_actions: number;
  };
  content: {
    total_posts: number;
    posts_with_engagement: number;
    engagement_rate: number;
    avg_engagement_per_post: number;
  };
  actions: {
    posts_created: { count: number; unique_users: number };
    likes: { count: number; unique_users: number };
    comments: { count: number; unique_users: number };
    follows: { count: number; unique_users: number };
  };
  network: {
    avg_following_per_user: number;
  };
  include_internal: boolean;
}

// Automated Insights types
export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  metric: string;
  current_value: number;
  previous_value: number;
  change_percent: number;
  recommendation: string | null;
  timestamp: string;
}

export interface InsightsResponse {
  insights: Insight[];
  total: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  generated_at: string;
  comparison_period: string;
  include_internal: boolean;
}

// Saved Views types
export interface SavedView {
  id: string;
  name: string;
  description: string;
  view_type: "overview" | "funnel" | "retention" | "custom";
  config: SavedViewConfig;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// User Lifecycle types
export interface UserLifecycleData {
  user_id: string;
  username: string;
  lifecycle: {
    stage: "new" | "activated" | "engaged" | "power_user" | "at_risk" | "churned";
    account_age_days: number;
    days_since_last_session: number | null;
    days_since_last_workout: number | null;
  };
  churn_risk: {
    score: number;
    level: "low" | "medium" | "high";
    factors: {
      factor: string;
      impact: number;
      detail: string;
    }[];
  };
  milestones: {
    event: string;
    date: string;
    label: string;
  }[];
  time_to_first_workout_hours: number | null;
  lifetime_stats: {
    total_sessions: number;
    total_workouts_started: number;
    total_workouts_completed: number;
    completion_rate: number;
  };
  activity_trends: {
    [period: string]: {
      sessions: number;
      workouts_started: number;
      workouts_completed: number;
      posts: number;
      social_actions: number;
    };
  };
  current_streak: number;
  longest_streak: number;
}

export interface SavedViewConfig {
  // Filter settings
  dateRange?: {
    preset?: string;
    startDate?: string;
    endDate?: string;
  };
  granularity?: "hour" | "day" | "week";
  includeInternal?: boolean;
  // Chart settings
  chartType?: "line" | "bar" | "area";
  showCumulative?: boolean;
  showPrevious?: boolean;
  // Selected metrics
  selectedMetrics?: string[];
  // Custom settings per view type
  [key: string]: unknown;
}

export interface SavedViewsResponse {
  views: SavedView[];
  total: number;
}

export interface SavedViewCreate {
  name: string;
  description?: string;
  view_type: "overview" | "funnel" | "retention" | "custom";
  config: SavedViewConfig;
  is_default?: boolean;
}
