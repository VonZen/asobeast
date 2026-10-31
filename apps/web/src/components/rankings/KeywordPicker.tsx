"use client";

import { useState } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { keywordsOptions } from "@/lib/queries";
import { DEFAULT_SELECTION, topByOpportunity } from "./selection";

export function KeywordPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const language = useInterfaceLanguage();
  const [open, setOpen] = useState(false);
  const { data: tracked } = useSuspenseQuery(keywordsOptions(id));

  const toggle = (keywordId: string) => {
    onChange(
      value.includes(keywordId)
        ? value.filter((item) => item !== keywordId)
        : [...value, keywordId],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-between gap-2 print:hidden"
        >
          {language === "zh-CN"
            ? `已选择 ${value.length} 个`
            : `${value.length} selected`}
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-label={language === "zh-CN" ? "选择关键词" : "Choose keywords"}
        className="w-72 p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={
              language === "zh-CN" ? "搜索关键词…" : "Search keywords…"
            }
          />
          <CommandList>
            <CommandEmpty>
              {language === "zh-CN" ? "未找到关键词。" : "No keywords found."}
            </CommandEmpty>
            <CommandGroup>
              {tracked.map((keyword) => (
                <CommandItem
                  key={keyword.keywordId}
                  value={keyword.text}
                  onSelect={() => toggle(keyword.keywordId)}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value.includes(keyword.keywordId)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <span className="truncate">{keyword.text}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() =>
                  onChange(topByOpportunity(tracked, DEFAULT_SELECTION))
                }
              >
                {language === "zh-CN"
                  ? `按机会值选择前 ${DEFAULT_SELECTION} 个`
                  : `Top ${DEFAULT_SELECTION} by opportunity`}
              </CommandItem>
              <CommandItem onSelect={() => onChange([])}>
                {language === "zh-CN" ? "清除" : "Clear"}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
