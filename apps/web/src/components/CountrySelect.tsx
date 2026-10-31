"use client";

import { useId } from "react";
import type { Store } from "@asobeast/shared";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRY_OPTIONS, OTHER, marketError } from "@/lib/countries";
import { formatCountry } from "@/lib/format";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

const chineseRegions = new Intl.DisplayNames(["zh-CN"], { type: "region" });

const countryLabel = (code: string, chinese: boolean) =>
  `${code.toUpperCase()} · ${chinese ? (chineseRegions.of(code.toUpperCase()) ?? formatCountry(code)) : formatCountry(code)}`;

export function CountrySelect({
  id,
  store,
  value,
  onChange,
  ariaLabel,
}: {
  id?: string;
  store: Store;
  value: string;
  onChange: (code: string) => void;
  ariaLabel?: string;
}) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const errorId = useId();
  const other = value === "" || !COUNTRY_OPTIONS.includes(value);
  const error = other && value.length === 2 ? marketError(store, value) : null;

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={other ? OTHER : value}
        onValueChange={(next) => onChange(next === OTHER ? "" : next)}
      >
        <SelectTrigger id={id} aria-label={ariaLabel} className="w-[220px]">
          <SelectValue>
            {other
              ? chinese
                ? "其他…"
                : "Other…"
              : countryLabel(value, chinese)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_OPTIONS.map((code) => (
            <SelectItem key={code} value={code}>
              {countryLabel(code, chinese)}
            </SelectItem>
          ))}
          <SelectItem value={OTHER}>{chinese ? "其他…" : "Other…"}</SelectItem>
        </SelectContent>
      </Select>
      {other ? (
        <Input
          aria-label={
            chinese ? "商店市场国家或地区代码" : "Storefront country code"
          }
          value={value}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
          placeholder={
            chinese ? "双字母代码，例如 se" : "two letter code, e.g. se"
          }
          maxLength={2}
          className="w-[220px]"
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
        />
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
