"use client";

import { Suspense, useState, type FormEvent, type ReactNode } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { ExternalLink, Plus, X } from "lucide-react";
import Link from "next/link";
import {
  SETUP_KEYWORD_TARGET,
  type CompetitorItem,
  type MarketSuggestionsResult,
  type SetupStep,
  type SetupStepState,
  type Store,
  type TrackedKeywordItem,
} from "@asobeast/shared";
import { CountrySelect } from "@/components/CountrySelect";
import { AddCompetitorForm } from "@/components/competitors/AddCompetitorForm";
import { COUNTRY_OPTIONS, marketError } from "@/lib/countries";
import { formatCountry, formatList, localizedCountry } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DiscoveredApps } from "./DiscoveredApps";
import { KeywordPicker } from "./KeywordPicker";
import {
  activeKeywordCount,
  keywordsStepDescription,
  STEP_TITLES,
  stepLabel,
} from "./setup-progress";
import { MarketCostTip, SuggestedMarkets } from "./SuggestedMarkets";

const SKIP_REASON: Record<SetupStep, string> = {
  competitors:
    "Positions are compared against nobody until a competitor is added.",
  keywords: "Only the phrases from your listing are tracked.",
  countries: "Keywords are tracked in your home storefront only.",
};

export interface StepProps {
  state: SetupStepState;
  onSkip: (skipped: boolean) => void;
}

function StepCard({
  step,
  state,
  description,
  onSkip,
  children,
}: StepProps & {
  step: SetupStep;
  description: ReactNode;
  children: ReactNode;
}) {
  const language = useInterfaceLanguage();
  return (
    <Card id={`setup-${step}`} className="scroll-mt-20">
      <CardHeader>
        <CardDescription>
          {language === "zh-CN"
            ? {
                competitors: "步骤 1 / 3",
                keywords: "步骤 2 / 3",
                countries: "步骤 3 / 3",
              }[step]
            : stepLabel(step)}
        </CardDescription>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle asChild>
            <h3>{interfaceCopy(language, STEP_TITLES[step])}</h3>
          </CardTitle>
          <StepBadge state={state} />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {children}
        <SkipAction step={step} state={state} onSkip={onSkip} />
      </CardContent>
    </Card>
  );
}

function StepBadge({ state }: { state: SetupStepState }) {
  const language = useInterfaceLanguage();
  if (state === "done")
    return (
      <Badge variant="success">
        {language === "zh-CN" ? "已完成" : "Done"}
      </Badge>
    );
  if (state === "skipped")
    return (
      <Badge variant="outline">
        {language === "zh-CN" ? "已跳过" : "Skipped"}
      </Badge>
    );
  return null;
}

function SkipAction({ step, state, onSkip }: StepProps & { step: SetupStep }) {
  const language = useInterfaceLanguage();
  if (state === "skipped") {
    return (
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {language === "zh-CN"
          ? {
              competitors: "已跳过。在添加竞品之前，排名不会与任何竞品比较。",
              keywords: "已跳过。只会追踪商品页中的词语。",
              countries: "已跳过。关键词只会在主市场追踪。",
            }[step]
          : `Skipped. ${SKIP_REASON[step]}`}
        <Button
          variant="link"
          className="h-auto px-0"
          onClick={() => onSkip(false)}
        >
          {language === "zh-CN" ? "撤销跳过" : "Undo skip"}
        </Button>
      </p>
    );
  }
  if (state !== "open") return null;
  return (
    <Button
      variant="link"
      className="h-auto w-fit px-0"
      onClick={() => onSkip(true)}
    >
      {language === "zh-CN" ? "跳过此步骤" : "Skip this step"}
    </Button>
  );
}

const competitorName = (competitor: CompetitorItem): string =>
  competitor.name ?? competitor.latestSnapshot?.title ?? "Unnamed app";

function competitorsLine(
  competitors: CompetitorItem[] | null,
  error: boolean,
): string {
  if (error) return "Competitor count is temporarily unavailable.";
  if (competitors === null) return "Loading competitors…";
  if (competitors.length === 0) return "No competitor yet";
  return `${competitors.length} tracked: ${formatList(competitors.map(competitorName))}`;
}

export function CompetitorsStep({
  appId,
  competitors,
  error,
  collecting,
  ...step
}: StepProps & {
  appId: string;
  competitors: CompetitorItem[] | null;
  error: boolean;
  collecting: boolean;
}) {
  const language = useInterfaceLanguage();
  return (
    <StepCard
      step="competitors"
      description={
        language === "zh-CN"
          ? "至少追踪一个竞品 App，让每次关键词搜索都能进行比较。通常可选择两到三个。"
          : "Track at least one app you compete with, so every keyword search compares you against it. Two or three is typical."
      }
      {...step}
    >
      <Suspense fallback={<Skeleton className="h-9 w-full" />}>
        <AddCompetitorForm id={appId} />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        {language === "zh-CN"
          ? error
            ? "暂时无法获取竞品数量。"
            : competitors === null
              ? "正在加载竞品…"
              : competitors.length === 0
                ? "暂无竞品"
                : `已追踪 ${competitors.length} 个：${formatList(competitors.map(competitorName))}`
          : competitorsLine(competitors, error)}
      </p>
      <DiscoveredApps appId={appId} collecting={collecting} />
      <Button asChild variant="link" className="h-auto w-fit px-0">
        <Link href={`/apps/${appId}/competitors`}>
          {language === "zh-CN" ? "管理竞品" : "Manage competitors"}
        </Link>
      </Button>
    </StepCard>
  );
}

export interface MarketKeywordCount {
  market: string;
  active: number | null;
  error: boolean;
}

function homeKeywordsLine(
  tracked: TrackedKeywordItem[] | null,
  error: boolean,
  homeMarket: string,
): string {
  if (error) return "Keywords are temporarily unavailable.";
  if (tracked === null) return "Loading keywords…";
  const active = activeKeywordCount(tracked);
  const market = formatCountry(homeMarket);
  return active > SETUP_KEYWORD_TARGET
    ? `${active} tracked in ${market}`
    : `${active} of ${SETUP_KEYWORD_TARGET} tracked in ${market}`;
}

export function KeywordsStep({
  appId,
  store,
  homeMarket,
  tracked,
  error,
  counts,
  ...step
}: StepProps & {
  appId: string;
  store: Store;
  homeMarket: string;
  tracked: TrackedKeywordItem[] | null;
  error: boolean;
  counts: MarketKeywordCount[];
}) {
  const language = useInterfaceLanguage();
  return (
    <StepCard
      step="keywords"
      description={
        language === "zh-CN"
          ? `在主市场至少追踪 ${SETUP_KEYWORD_TARGET} 个关键词。导入时已追踪${store === "APP_STORE" ? "标题和副标题" : "标题和简短描述"}中的词语。`
          : keywordsStepDescription(store)
      }
      {...step}
    >
      <p className="text-sm text-muted-foreground">
        {language === "zh-CN"
          ? error
            ? "暂时无法获取关键词。"
            : tracked === null
              ? "正在加载关键词…"
              : activeKeywordCount(tracked) > SETUP_KEYWORD_TARGET
                ? `主市场已追踪 ${activeKeywordCount(tracked)} 个关键词`
                : `主市场已追踪 ${activeKeywordCount(tracked)} / ${SETUP_KEYWORD_TARGET} 个关键词`
          : homeKeywordsLine(tracked, error, homeMarket)}
      </p>
      {tracked ? (
        <KeywordPicker appId={appId} country={homeMarket} tracked={tracked} />
      ) : null}
      {counts.length > 1 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {counts.map(({ market, active, error: failed }) => (
            <li
              key={market}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span>{localizedCountry(market, language)}</span>
              <span className="text-muted-foreground">
                {failed
                  ? language === "zh-CN"
                    ? "暂不可用"
                    : "Unavailable"
                  : active === null
                    ? language === "zh-CN"
                      ? "正在加载…"
                      : "Loading…"
                    : language === "zh-CN"
                      ? `${active} 个启用中`
                      : `${active} active`}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <Button asChild variant="link" className="h-auto w-fit px-0">
        <Link href={`/apps/${appId}/keywords?country=${homeMarket}`}>
          {language === "zh-CN" ? "查看关键词" : "Review keywords"}
        </Link>
      </Button>
    </StepCard>
  );
}

const nextCountry = (markets: readonly string[]): string =>
  COUNTRY_OPTIONS.find((code) => !markets.includes(code)) ?? "";

export function CountriesStep({
  appId,
  store,
  homeMarket,
  markets,
  suggestions,
  onSelect,
  onReviewed,
  ...step
}: StepProps & {
  appId: string;
  store: Store;
  homeMarket: string;
  markets: string[];
  suggestions: MarketSuggestionsResult | null;
  onSelect: (market: string, selected: boolean) => void;
  onReviewed: () => void;
}) {
  const language = useInterfaceLanguage();
  const suggested =
    suggestions !== null && suggestions.suggestions.length > 0
      ? suggestions
      : null;
  const [picked, setPicked] = useState(() => nextCountry(markets));
  const value = markets.includes(picked) ? nextCountry(markets) : picked;
  const addable = value !== "" && marketError(store, value) === null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!addable) return;
    onSelect(value, true);
    setPicked(nextCountry([...markets, value]));
  };

  return (
    <StepCard
      step="countries"
      description={
        <>
          {language === "zh-CN"
            ? "已选择主市场。请添加销售所在的国家或地区；每增加一个市场都会增加每日请求量。"
            : "Your home country is selected. Add the countries you sell in; each one adds daily requests."}{" "}
          {suggested ? null : <MarketCostTip store={store} />}
        </>
      }
      {...step}
    >
      {suggested ? (
        <SuggestedMarkets
          appId={appId}
          store={store}
          result={suggested}
          selected={markets}
          onSelect={onSelect}
        />
      ) : null}
      <ul
        aria-label={
          language === "zh-CN" ? "已选国家或地区" : "Selected countries"
        }
        className="flex flex-wrap gap-2"
      >
        {markets.map((market) => (
          <li key={market}>
            <Badge variant="secondary" className="h-7 gap-1 pl-2.5">
              {localizedCountry(market, language)} ({market.toUpperCase()})
              {market !== homeMarket && markets.length > 1 ? (
                <button
                  type="button"
                  aria-label={
                    language === "zh-CN"
                      ? `移除 ${localizedCountry(market, language)}`
                      : `Remove ${formatCountry(market)}`
                  }
                  onClick={() => onSelect(market, false)}
                  className="rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X />
                </button>
              ) : null}
            </Badge>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="flex flex-col gap-1">
        <Label htmlFor="setup-country">
          {language === "zh-CN"
            ? suggested
              ? "添加其他国家或地区"
              : "添加国家或地区"
            : suggested
              ? "Add another country"
              : "Add a country"}
        </Label>
        <div className="flex flex-wrap items-start gap-2">
          <CountrySelect
            id="setup-country"
            store={store}
            value={value}
            onChange={setPicked}
            ariaLabel={
              language === "zh-CN" ? "要添加的国家或地区" : "Country to add"
            }
          />
          <Button type="submit" variant="outline" disabled={!addable}>
            <Plus />
            {language === "zh-CN" ? "添加" : "Add"}
          </Button>
        </div>
      </form>
      <div className="flex flex-wrap gap-2">
        {markets.map((market) => (
          <Button key={market} asChild variant="outline" size="sm">
            <Link href={`/apps/${appId}/keywords?country=${market}`}>
              {language === "zh-CN"
                ? `查看 ${market.toUpperCase()} 关键词`
                : `Review ${market.toUpperCase()} keywords`}
              <ExternalLink />
            </Link>
          </Button>
        ))}
      </div>
      {step.state === "open" ? (
        <Button variant="outline" className="w-fit" onClick={onReviewed}>
          {language === "zh-CN" ? "已检查国家或地区" : "Countries reviewed"}
        </Button>
      ) : null}
    </StepCard>
  );
}
