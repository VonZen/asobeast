"use client";

import type { AppLocalizationsResult } from "@asobeast/shared";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { Button } from "@/components/ui/button";
import { unlistedReads } from "@/lib/app-localizations";
import { localizationName } from "@/lib/localizations";
import { apiErrorMessage } from "./api-error-message";
import { ReaderChips } from "./ReadRoleBadge";
import { useAddLocalization } from "./useAddLocalization";

const HEADING_ID = "unlisted-localizations-heading";

export function UnlistedLocalizations({
  id,
  result,
}: {
  id: string;
  result: AppLocalizationsResult;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const { add, pending, error } = useAddLocalization(id);
  const reads = unlistedReads(result);
  if (reads.length === 0) return null;

  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-2">
      <h3 id={HEADING_ID} className="font-medium">
        {zh ? "尚未添加的本地化版本" : "Not listed yet"}
      </h3>
      <p className="text-body text-muted-foreground">
        {zh
          ? "当前跟踪的市场会读取以下本地化版本。若 App 已在 App Store Connect 中提供相应语言，可以添加后填写关键词字段；系统也会在下一次采集市场数据时自动加入商店已提供的本地化版本。"
          : "Your markets read these localizations. Add one your app ships in App Store Connect to type its keyword field; a localization the store serves is added on its own after the next capture of that market."}
      </p>
      <ul
        aria-label={
          zh
            ? "当前市场读取但尚未添加的本地化版本"
            : "Localizations your markets read that are not listed"
        }
        className="flex flex-col divide-y divide-border rounded-lg border border-border px-3"
      >
        {reads.map(({ localization, readIn }) => {
          const name = localizationName(localization);
          return (
            <li
              key={localization}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
            >
              <span className="font-medium">{name}</span>
              <span className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <ReaderChips readers={readIn} />
                <Button
                  variant="outline"
                  size="xs"
                  aria-label={zh ? `添加${name}` : `Add ${name}`}
                  disabled={pending}
                  onClick={() => add(localization)}
                >
                  {zh ? "添加" : "Add"}
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {zh
            ? "无法添加本地化版本，请重试。"
            : apiErrorMessage(error, "Could not add the localization")}
        </p>
      ) : null}
    </section>
  );
}
