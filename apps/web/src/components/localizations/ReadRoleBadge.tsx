"use client";

import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type {
  LocalizationReader,
  LocalizationReadRole,
} from "@asobeast/shared";
import { Badge } from "@/components/ui/badge";
import { READ_ROLE_LABELS } from "@/lib/app-localizations";

const ROLE_VARIANT = {
  default: "info",
  additional: "secondary",
} as const satisfies Record<LocalizationReadRole, "info" | "secondary">;

export function ReadRoleBadge({
  role,
  prefix,
}: {
  role: LocalizationReadRole;
  prefix?: string;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const label = zh
    ? role === "default"
      ? "默认"
      : "额外"
    : READ_ROLE_LABELS[role];
  return (
    <Badge variant={ROLE_VARIANT[role]}>
      {prefix === undefined ? label : `${prefix} · ${label}`}
    </Badge>
  );
}

export function ReaderChips({
  readers,
}: {
  readers: readonly LocalizationReader[];
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  if (readers.length === 0) {
    return (
      <Badge variant="outline">
        {zh ? "当前市场不读取" : "Not read in your markets"}
      </Badge>
    );
  }
  return (
    <>
      {readers.map((reader) => (
        <ReadRoleBadge
          key={reader.country}
          role={reader.role}
          prefix={reader.country.toUpperCase()}
        />
      ))}
    </>
  );
}
