"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { componentCopy } from "@/lib/component-copy";

export function SelectFilter<T extends string>({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  const language = useInterfaceLanguage();
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const option = options.find((entry) => entry.value === next);
        if (option) onChange(option.value);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={
          language === "zh-CN"
            ? `按${componentCopy(language, title)}筛选`
            : `Filter by ${title.toLowerCase()}`
        }
      >
        <SelectValue>
          {componentCopy(
            language,
            options.find((option) => option.value === value)?.label ?? "",
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {componentCopy(language, option.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
