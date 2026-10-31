import type { ActionEvidence } from "@asobeast/shared";
import { Badge } from "@/components/ui/badge";
import { GradedNumber } from "@/components/ui/graded";
import { grade } from "@/lib/grade";
import { ACTION_EVIDENCE_UNAVAILABLE } from "./action-copy";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { chineseEvidenceSummary } from "./evidence-summary-zh";
import {
  evidenceSections,
  type EvidenceFact,
  type EvidenceList,
} from "./evidence-sections";

function FactValue({ fact }: { fact: EvidenceFact }) {
  const locale = useInterfaceLanguage();
  if (!fact.grade) return <>{fact.value}</>;
  return (
    <GradedNumber
      value={fact.value}
      grade={grade(fact.grade.metric, fact.grade.value)}
      label={interfaceCopy(locale, fact.label)}
    />
  );
}

function EvidenceLists({ lists }: { lists: EvidenceList[] }) {
  const locale = useInterfaceLanguage();
  return lists.map((list) => (
    <div key={list.label} className="flex flex-col gap-1.5">
      <p className="text-label text-muted-foreground">
        {interfaceCopy(locale, list.label)}
      </p>
      <ul className="flex list-none flex-wrap gap-1.5 p-0">
        {list.items.map((entry) => (
          <li key={`${entry.text}~${entry.detail ?? ""}`}>
            <Badge variant="outline" className="h-auto whitespace-normal">
              {entry.text}
              {entry.detail ? (
                <span className="numeric font-mono text-muted-foreground">
                  {entry.detail}
                </span>
              ) : null}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  ));
}

export function ActionEvidencePanel({
  evidence,
}: {
  evidence: ActionEvidence | null;
}) {
  const locale = useInterfaceLanguage();
  if (!evidence) {
    return (
      <p className="text-sm text-muted-foreground">
        {locale === "zh-CN"
          ? "此已保存行动的依据不可用，将在下次运行时重新生成。"
          : ACTION_EVIDENCE_UNAVAILABLE}
      </p>
    );
  }

  const { facts, lists, summary } = evidenceSections(evidence);

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-body @sm/sheet:grid-cols-3">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex flex-col gap-0.5 border-b border-dashed border-border/60 pb-1"
          >
            <dt className="text-caption text-muted-foreground">
              {interfaceCopy(locale, fact.label)}
            </dt>
            <dd className="numeric font-mono font-medium">
              <FactValue fact={fact} />
            </dd>
          </div>
        ))}
      </dl>
      <EvidenceLists lists={lists} />
      <p className="text-body">
        {locale === "zh-CN" ? chineseEvidenceSummary(evidence) : summary}
      </p>
    </div>
  );
}
