import { ACTION_PRIORITIES, type ActionPriority } from "@asobeast/shared";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { Button } from "@/components/ui/button";
import { formatNumber, pluralize } from "@/lib/format";
import { ACTION_PRIORITY_LABEL } from "./action-copy";

export function PriorityToggles({
  selected,
  counts,
  onChange,
}: {
  selected: readonly ActionPriority[];
  counts: ReadonlyMap<ActionPriority, number>;
  onChange: (next: ActionPriority[]) => void;
}) {
  const language = useInterfaceLanguage();
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">
        {language === "zh-CN" ? "按优先级筛选" : "Filter by priority"}
      </legend>
      {ACTION_PRIORITIES.map((priority) => {
        const pressed = selected.includes(priority);
        const count = counts.get(priority) ?? 0;
        return (
          <Button
            key={priority}
            type="button"
            size="sm"
            variant={pressed ? "default" : "outline"}
            aria-pressed={pressed}
            aria-label={
              language === "zh-CN"
                ? `${interfaceCopy(language, ACTION_PRIORITY_LABEL[priority])}，${count} 项`
                : `${ACTION_PRIORITY_LABEL[priority]}, ${pluralize(count, "action")}`
            }
            onClick={() =>
              onChange(
                pressed
                  ? selected.filter((entry) => entry !== priority)
                  : [...selected, priority],
              )
            }
          >
            {interfaceCopy(language, ACTION_PRIORITY_LABEL[priority])}
            <span aria-hidden className="numeric font-mono">
              {formatNumber(count)}
            </span>
          </Button>
        );
      })}
    </fieldset>
  );
}
