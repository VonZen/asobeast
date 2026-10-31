"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import { debounce, type Options } from "nuqs";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { componentCopy } from "@/lib/component-copy";

const SEARCH_DEBOUNCE_MS = 200;

export function SearchInput({
  label,
  value,
  onSearch,
  className,
}: {
  label: string;
  value: string;
  onSearch: (value: string, options: Options) => void;
  className?: string;
}) {
  const locale = useInterfaceLanguage();
  const translatedLabel = componentCopy(locale, label);
  const input = useRef<HTMLInputElement>(null);
  const search = (next: string) =>
    onSearch(next, {
      limitUrlUpdates: next === "" ? undefined : debounce(SEARCH_DEBOUNCE_MS),
    });

  return (
    <InputGroup className={cn("w-full sm:w-64", className)}>
      <InputGroupAddon>
        <Search aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        ref={input}
        aria-label={translatedLabel}
        placeholder={translatedLabel}
        value={value}
        onChange={(event) => search(event.target.value)}
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={componentCopy(locale, "Clear search")}
            onClick={() => {
              search("");
              input.current?.focus();
            }}
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
