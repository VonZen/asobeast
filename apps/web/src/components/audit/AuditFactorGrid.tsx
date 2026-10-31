import type { AppAuditResult } from "@asobeast/shared";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { factorSections } from "./factor-sections";
import { FactorCard } from "./FactorCard";

export function AuditFactorGrid({
  appId,
  audit,
}: {
  appId: string;
  audit: AppAuditResult;
}) {
  const language = useInterfaceLanguage();
  return (
    <>
      {factorSections(audit.factors).map((section) => (
        <section
          key={section.id}
          aria-labelledby={`factors-${section.id}`}
          className="flex flex-col gap-3"
        >
          <h2 id={`factors-${section.id}`} className="text-lg font-medium">
            {interfaceCopy(language, section.label)}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {section.factors.map((factor) => (
              <FactorCard
                key={factor.id}
                appId={appId}
                factor={factor}
                store={audit.store}
                totalWeight={audit.totalWeight}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
