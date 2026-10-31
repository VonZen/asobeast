"use client";

import Link from "next/link";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SUGGESTED_COLUMNS,
  type LocalizationGrid,
  type SuggestedMarketHint,
} from "@/lib/app-localizations";
import { formatCountry, formatNumber } from "@/lib/format";
import { localizationName } from "@/lib/localizations";
import { OriginBadge } from "./OriginBadge";
import { ReadRoleBadge } from "./ReadRoleBadge";

function NotRead() {
  const zh = useInterfaceLanguage() === "zh-CN";
  return (
    <>
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      <span className="sr-only">{zh ? "不读取" : "Not read"}</span>
    </>
  );
}

const SUGGESTED_COLUMN = "border-l border-dashed border-border";

export function LocalizationMatrix({
  grid,
  hint,
}: {
  grid: LocalizationGrid;
  hint: SuggestedMarketHint | null;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const columns = [...grid.markets, ...grid.suggested];
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="min-w-0 rounded-lg border border-border">
        <Table
          scrollLabel={zh ? "本地化矩阵" : "Localization matrix"}
          scrollFocus="overflow"
        >
          <TableCaption className="sr-only">
            {grid.suggested.length > 0
              ? zh
                ? `各市场读取哪些本地化版本，以及最多 ${formatNumber(SUGGESTED_COLUMNS)} 个建议市场`
                : `Which of your markets read each localization, and up to ${formatNumber(SUGGESTED_COLUMNS)} suggested markets`
              : zh
                ? "各市场读取哪些本地化版本"
                : "Which of your markets read each localization"}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                {zh ? "由以下市场读取" : "Read in your markets"}
              </TableHead>
              {grid.markets.map((country) => (
                <TableHead
                  key={country}
                  scope="col"
                  title={formatCountry(country)}
                >
                  {country.toUpperCase()}
                  <span className="sr-only"> {formatCountry(country)}</span>
                </TableHead>
              ))}
              {grid.suggested.map((country) => (
                <TableHead
                  key={country}
                  scope="col"
                  title={
                    zh
                      ? `${formatCountry(country)}（建议）`
                      : `${formatCountry(country)}, suggested`
                  }
                  className={SUGGESTED_COLUMN}
                >
                  {country.toUpperCase()}{" "}
                  <span className="font-normal normal-case">
                    {zh ? "建议" : "suggested"}
                  </span>
                  <span className="sr-only"> {formatCountry(country)}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {grid.rows.map((row) => (
              <TableRow key={row.localization}>
                <TableHead
                  scope="row"
                  className="text-body normal-case text-foreground"
                >
                  <span className="mr-2 font-medium">
                    {localizationName(row.localization)}
                  </span>
                  <OriginBadge origin={row.origin} />
                </TableHead>
                {row.cells.map((role, index) => (
                  <TableCell
                    key={columns[index]}
                    className={
                      index >= grid.markets.length
                        ? SUGGESTED_COLUMN
                        : undefined
                    }
                  >
                    {role === null ? (
                      <NotRead />
                    ) : (
                      <ReadRoleBadge role={role} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {hint ? (
        <p className="text-caption text-muted-foreground">
          {zh ? "你还可以为建议市场补充对应的本地化关键词字段。" : hint.text}{" "}
          <Link
            href={hint.href}
            className="font-medium text-foreground underline decoration-primary underline-offset-4 hover:decoration-2"
          >
            {zh ? "查看建议市场" : hint.link}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
