import type { ActionItem } from "@asobeast/shared";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { actionSteps } from "./action-steps";
import { chineseActionSteps } from "./action-steps-zh";

export function ActionSteps({ item }: { item: ActionItem }) {
  const language = useInterfaceLanguage();
  return (
    <ol className="flex list-decimal flex-col gap-1.5 pl-6 text-body">
      {(language === "zh-CN" ? chineseActionSteps(item) : actionSteps(item)).map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}
