"use client";

import { useInterfaceLanguage } from "./InterfaceLanguageProvider";
import { componentCopy } from "@/lib/component-copy";

/** Localize fixed JSX copy without translating user-provided ASO keywords or metadata. */
export function LocalizedText({ en }: { en: string }) {
  return <>{componentCopy(useInterfaceLanguage(), en)}</>;
}
