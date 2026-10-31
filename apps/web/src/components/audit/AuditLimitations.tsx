import type { AuditLimitation } from "@asobeast/shared";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

export function AuditLimitations({
  limitations,
}: {
  limitations: AuditLimitation[];
}) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  if (limitations.length === 0) return null;

  return (
    <details className="rounded-xl border border-border px-4 py-3">
      <summary className="cursor-pointer text-body font-medium">
        {chinese ? "此诊断无法获取的信息" : "What this audit cannot see"}
      </summary>
      <ul className="mt-3 flex flex-col gap-3">
        {limitations.map((limitation) => (
          <li key={limitation.id} className="flex flex-col text-sm">
            <span className="font-medium">{limitation.label}</span>
            <span className="text-muted-foreground">{limitation.detail}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
