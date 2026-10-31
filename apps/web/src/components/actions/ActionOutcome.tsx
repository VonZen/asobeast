import type { ActionOutcome as Outcome } from "@asobeast/shared";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { Badge } from "@/components/ui/badge";
import { DeltaChip, PositionDeltaChip } from "@/components/ui/delta-chip";
import {
  OUTCOME_CAVEAT,
  OUTCOME_VERDICT_LABEL,
  outcomeSentence,
} from "./action-outcome-copy";

const PERIOD = "since you marked it done";

function ChangeChip({ outcome }: { outcome: Outcome }) {
  if (outcome.change === null) return null;
  if (outcome.metric === "position") {
    return <PositionDeltaChip value={outcome.change} period={PERIOD} />;
  }
  return (
    <DeltaChip
      value={outcome.change}
      period={PERIOD}
      polarity={
        outcome.direction === "lower_is_better"
          ? "lower-is-better"
          : "higher-is-better"
      }
    />
  );
}

export function ActionOutcome({
  outcome,
  depth,
}: {
  outcome: Outcome;
  depth: number | null;
}) {
  const language = useInterfaceLanguage();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-body">{outcomeSentence(outcome, depth, language)}</p>
      <div className="flex items-center gap-2">
        {outcome.verdict === "pending" ? null : (
          <ChangeChip outcome={outcome} />
        )}
        <Badge variant="outline">
          {interfaceCopy(language, OUTCOME_VERDICT_LABEL[outcome.verdict])}
        </Badge>
      </div>
      <p className="text-caption text-muted-foreground">{language === "zh-CN" ? "同期的其他变更也可能影响此数值。" : OUTCOME_CAVEAT}</p>
    </div>
  );
}
