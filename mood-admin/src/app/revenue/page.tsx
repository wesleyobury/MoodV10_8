"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { FilterBar } from "@/components/FilterBar";
import { DataTable, FunnelBars, Gate, MetricGrid, PageHeader, Section, Tabs } from "@/components/v3/ui";
import { Legacy } from "@/components/v3/Legacy";
import { Card, Funnel, fmtValue, humanize, useV3 } from "@/lib/v3";
import MonetizationPage from "../monetization/page";
import SubscribersPage from "../subscribers/page";
import CreatorsPage from "../creators/page";

interface RevenueData {
  headline: Card[];
  w2_funnel: Funnel;
  w2_tracking_since: string | null;
  by_trigger: { trigger: string; viewers: number; converted: number; conversion: number | null }[];
  plans_active: { plan: string; subscribers: number }[];
  plans_trial: { plan: string; trials: number }[];
  plan_mix_paid_events: { plan: string; count: number }[];
  founding: { modal_shown: number; modal_claimed: number; modal_claim_rate: number | null; banner_shown: number; banner_tapped: number; banner_tap_rate: number | null };
  note: string;
}

type Tab = "overview" | "subscribers" | "store" | "creators";
const TABS: { value: Tab; label: string }[] = [
  { value: "overview", label: "Workout #2 & plans" },
  { value: "subscribers", label: "Subscribers" },
  { value: "store", label: "Store, MRR & payouts" },
  { value: "creators", label: "Creator codes" },
];

function Overview() {
  const { data, error, loading } = useV3<RevenueData>("/revenue");
  return (
    <Gate loading={loading} error={error} label="revenue">
      {data && (
        <div className="space-y-5">
          <MetricGrid cards={data.headline} cols={3} />
          <Section title="Does the workout #2 gate convert?"
            note={`${data.w2_funnel.note}${data.w2_tracking_since ? ` Gate tracking since ${data.w2_tracking_since}.` : " Gate tracking starts with the V3 release."}`}>
            <FunnelBars funnel={data.w2_funnel} />
          </Section>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <Section title="Active subscribers by plan" note="Founding Member is tracked as its own plan.">
              <DataTable rows={data.plans_active} columns={[{ key: "plan", label: "Plan", align: "left" }, { key: "subscribers", label: "Paying", fmt: "int" }]} empty="No active subscribers." />
              {data.plans_trial.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">In trial now: {data.plans_trial.map((p) => `${p.plan} ${p.trials}`).join(" · ")}</p>
              )}
            </Section>
            <Section title="Paid starts and renewals in range" note="Store-confirmed paid periods by plan (trial starts excluded).">
              <DataTable rows={data.plan_mix_paid_events} columns={[{ key: "plan", label: "Plan", align: "left" }, { key: "count", label: "Paid periods", fmt: "int" }]} empty="None in this range." />
            </Section>
            <Section title="Founding Member offer" note="People who saw the founding modal or banner, and how many claimed or tapped.">
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-muted-foreground">Modal shown → claimed</span><span className="tabular-nums">{data.founding.modal_shown} → {data.founding.modal_claimed} <span className="text-muted-foreground">({fmtValue(data.founding.modal_claim_rate, "pct")})</span></span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Banner shown → tapped</span><span className="tabular-nums">{data.founding.banner_shown} → {data.founding.banner_tapped} <span className="text-muted-foreground">({fmtValue(data.founding.banner_tap_rate, "pct")})</span></span></p>
              </div>
            </Section>
          </div>
          <Section title="Paywall by trigger" note="Everyone who saw a paywall in the range, by what opened it, and how many started a trial or paid since.">
            <DataTable
              rows={data.by_trigger.map((t) => ({ ...t, trigger: humanize(t.trigger) }))}
              columns={[
                { key: "trigger", label: "Trigger", align: "left" },
                { key: "viewers", label: "Viewers", fmt: "int" },
                { key: "converted", label: "Trial or paid", fmt: "int" },
                { key: "conversion", label: "Conversion", fmt: "pct" },
              ]}
            />
          </Section>
          <p className="text-xs text-muted-foreground">{data.note}</p>
        </div>
      )}
    </Gate>
  );
}

function RevenueInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = (params.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.value === initial) ? initial : "overview");
  useEffect(() => {
    router.replace(tab === "overview" ? "/revenue" : `/revenue?tab=${tab}`, { scroll: false });
  }, [tab, router]);
  return (
    <div className="space-y-5">
      <PageHeader title="Revenue" question="Does the workout #2 monetization strategy work?" />
      <FilterBar showGranularity={tab === "store"} showVersion={tab === "overview"} versionNote="V3 only keeps purchases by people who used the V3 app. Store totals in the other tabs are version-blind." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "overview" && <Overview />}
      {tab === "subscribers" && <Legacy><SubscribersPage /></Legacy>}
      {tab === "store" && <Legacy note="App Store data, MRR history and the Apple payouts ledger (from the previous Monetization page)."><MonetizationPage /></Legacy>}
      {tab === "creators" && <Legacy note="Creator codes, attribution and creator applications."><CreatorsPage /></Legacy>}
    </div>
  );
}

export default function RevenuePage() {
  return (
    <Suspense fallback={null}>
      <RevenueInner />
    </Suspense>
  );
}
