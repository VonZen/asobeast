"use client";

import { useQueries, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  canCompleteSetup,
  setupProgress,
  stepStates,
  type AppDetail,
  type AppSetupState,
  type SetupCounts,
  type SetupStep,
} from "@asobeast/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  appDetailOptions,
  competitorsOptions,
  keywordsOptions,
  marketSuggestionsOptions,
} from "@/lib/queries";
import { activeKeywordCount } from "./setup-progress";
import { CompetitorsStep, CountriesStep, KeywordsStep } from "./setup-steps";
import { SetupProgress } from "./SetupProgress";
import {
  beginSetup,
  completeSetup,
  dismissSetup,
  reviewCountries,
  selectMarket,
  skipStep,
  type SetupTransition,
} from "./setup-transitions";
import { useFirstRunDiscovery } from "./use-first-run-discovery";
import { useSetup } from "./use-setup";

type Apply = (transition: SetupTransition, onSaved?: () => void) => void;
type LiveQuery = { data: unknown; isError: boolean; refetch: () => unknown };

const lengthOrNull = <T,>(value: T[] | undefined): number | null =>
  value ? value.length : null;

const activeCount = (
  keywords: { active: boolean }[] | undefined,
): number | null => (keywords ? activeKeywordCount(keywords) : null);

export function SetupChecklist({ id }: { id: string }) {
  const { data: app } = useSuspenseQuery(appDetailOptions(id));
  const { setup, apply } = useSetup(id);
  const start = () => apply(beginSetup(app.country));

  if (setup.status === "in_progress") {
    return <ActiveSetup app={app} setup={setup} apply={apply} />;
  }
  if (setup.status === "not_started") return <StartStatus onStart={start} />;
  return (
    <TerminalStatus
      appId={id}
      completed={setup.status === "completed"}
      onRestart={start}
    />
  );
}

function ActiveSetup({
  app,
  setup,
  apply,
}: {
  app: AppDetail;
  setup: AppSetupState;
  apply: Apply;
}) {
  const language = useInterfaceLanguage();
  const router = useRouter();
  const competitors = useQuery(competitorsOptions(app.id));
  const collecting = useFirstRunDiscovery(app.id);
  const homeKeywords = useQuery(keywordsOptions(app.id, app.country));
  const suggestions = useQuery({
    ...marketSuggestionsOptions(app.id),
    retry: false,
  });
  const keywordQueries = useQueries({
    queries: setup.selectedMarkets.map((market) =>
      keywordsOptions(app.id, market),
    ),
  });
  const countQueries: LiveQuery[] = [competitors, homeKeywords];
  const liveQueries = countQueries.concat(keywordQueries);
  const counts: SetupCounts = {
    competitors: lengthOrNull(competitors.data),
    keywords: activeCount(homeKeywords.data),
  };
  const keywordCounts = setup.selectedMarkets.map((market, index) => ({
    market,
    active: activeCount(keywordQueries[index]?.data),
    error: keywordQueries[index]?.isError ?? false,
  }));
  const ready = countQueries.every((query) => query.data !== undefined);
  const failed = countQueries.some((query) => query.isError);
  const retry = () => {
    for (const query of liveQueries) {
      if (query.isError) void query.refetch();
    }
  };
  const states = stepStates(setup, counts);
  const step = (name: SetupStep) => ({
    state: states[name],
    onSkip: (skipped: boolean) => apply(skipStep(name, skipped)),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SetupProgress
          name={app.name}
          progress={setupProgress(setup, counts)}
          states={states}
        />
        <p className="text-sm text-muted-foreground">
          {language === "zh-CN"
            ? "只需三个简短步骤。达到目标数量即可完成，也可以跳过不适用的步骤。"
            : "Three short steps. Each one is done once its number is reached, or skipped when it does not apply."}
        </p>
      </div>
      <CompetitorsStep
        {...step("competitors")}
        appId={app.id}
        competitors={competitors.data ?? null}
        error={competitors.isError}
        collecting={collecting}
      />
      <KeywordsStep
        {...step("keywords")}
        appId={app.id}
        store={app.store}
        homeMarket={app.country}
        tracked={homeKeywords.data ?? null}
        error={homeKeywords.isError}
        counts={keywordCounts}
      />
      <CountriesStep
        {...step("countries")}
        appId={app.id}
        store={app.store}
        homeMarket={app.country}
        markets={setup.selectedMarkets}
        suggestions={suggestions.data ?? null}
        onSelect={(market, selected) => apply(selectMarket(market, selected))}
        onReviewed={() => apply(reviewCountries())}
      />
      <SetupActions
        ready={ready}
        failed={failed}
        completable={ready && canCompleteSetup(setup, counts)}
        onRetry={retry}
        onDismiss={() => apply(dismissSetup())}
        onComplete={() =>
          apply(completeSetup(), () => router.push(`/apps/${app.id}`))
        }
      />
    </div>
  );
}

function SetupActions({
  ready,
  failed,
  completable,
  onRetry,
  onDismiss,
  onComplete,
}: {
  ready: boolean;
  failed: boolean;
  completable: boolean;
  onRetry: () => void;
  onDismiss: () => void;
  onComplete: () => void;
}) {
  const language = useInterfaceLanguage();
  return (
    <>
      {!ready ? (
        <Alert role="status" className="items-center">
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {language === "zh-CN"
              ? failed
                ? "部分实时数量无法加载。"
                : "完成设置前，请等待所有实时数量加载完成。"
              : failed
                ? "Some live counts could not be loaded."
                : "Finish loading every live count before completing setup."}
            {failed ? (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw />
                {language === "zh-CN" ? "重试" : "Retry"}
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <Button variant="ghost" onClick={onDismiss}>
          {language === "zh-CN" ? "关闭设置向导" : "Dismiss setup"}
        </Button>
        <Button disabled={!completable} onClick={onComplete}>
          <CheckCircle2 />
          {language === "zh-CN" ? "完成设置" : "Complete setup"}
        </Button>
      </div>
    </>
  );
}

function StartStatus({ onStart }: { onStart: () => void }) {
  return (
    <SetupStatus
      title="Start setup for this app"
      description="This checklist helps you reach a first set of positions. Nothing is changed until you add something."
      action="Start this setup"
      onAction={onStart}
    />
  );
}

function TerminalStatus({
  appId,
  completed,
  onRestart,
}: {
  appId: string;
  completed: boolean;
  onRestart: () => void;
}) {
  const language = useInterfaceLanguage();
  if (!completed) {
    return (
      <SetupStatus
        title="Setup dismissed"
        description="The checklist will not resume automatically. You can restart it whenever you need it."
        action="Restart setup"
        onAction={onRestart}
      />
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {language === "zh-CN" ? "设置完成" : "Setup complete"}
        </CardTitle>
        <CardDescription>
          {language === "zh-CN"
            ? "正在采集排名、竞品和国家或地区数据。"
            : "Positions, competitors and countries are being collected."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/apps/${appId}`}>
            {language === "zh-CN" ? "打开概览" : "Open the overview"}
          </Link>
        </Button>
        <Button variant="outline" onClick={onRestart}>
          {language === "zh-CN" ? "重新开始设置" : "Restart setup"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SetupStatus({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  const language = useInterfaceLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{interfaceCopy(language, title)}</CardTitle>
        <CardDescription>
          {interfaceCopy(language, description)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={onAction}>{interfaceCopy(language, action)}</Button>
        <Button asChild variant="outline">
          <Link href="/">
            {language === "zh-CN" ? "返回 App 列表" : "Back to apps"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
