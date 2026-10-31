import { Check } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { Progress } from "@/components/ui/progress";
import {
  SETUP_STEPS,
  type SetupStep,
  type SetupStepProgress,
  type SetupStepState,
} from "@asobeast/shared";
import { cn } from "@/lib/utils";
import {
  progressPercent,
  progressSentence,
  progressValueLabel,
  STEP_TITLES,
} from "./setup-progress";

export function SetupProgress({
  name,
  progress,
  states,
}: {
  name: string | null;
  progress: SetupStepProgress;
  states: Record<SetupStep, SetupStepState>;
}) {
  const language = useInterfaceLanguage();
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight text-balance">
        {language === "zh-CN"
          ? `设置 ${name ?? "此 App"} · ${progress.done} / ${progress.total} · ${progress.next === null ? "可以完成" : `下一步：${interfaceCopy(language, STEP_TITLES[progress.next])}`}`
          : progressSentence(name, progress)}
      </h2>
      <Progress
        value={progressPercent(progress)}
        aria-label={language === "zh-CN" ? "设置进度" : "Setup progress"}
        getValueLabel={() =>
          language === "zh-CN"
            ? `${progress.total} 步中已完成 ${progress.done} 步`
            : progressValueLabel(progress)
        }
      />
      <nav aria-label={language === "zh-CN" ? "设置步骤" : "Setup steps"}>
        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {SETUP_STEPS.map((step) => (
            <li key={step}>
              <a
                href={`#setup-${step}`}
                aria-current={progress.next === step ? "step" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 underline-offset-4 hover:underline",
                  progress.next === step
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {states[step] === "done" ? (
                  <Check aria-hidden="true" className="size-4" />
                ) : null}
                {interfaceCopy(language, STEP_TITLES[step])}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
