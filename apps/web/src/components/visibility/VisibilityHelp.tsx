"use client";

import { InfoTip } from "@/components/ui/info-tip";
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
  POSITION_SHARES,
  UNSCORED_POPULARITY,
  VISIBILITY_GUIDE,
} from "./visibility-help";

export function VisibilityHelp({ note }: { note?: string }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  return (
    <InfoTip
      label={zh ? "了解可见度" : "About visibility"}
      title={zh ? "可见度如何计算" : "How visibility is calculated"}
      summary={
        zh
          ? "根据关键词热度加权计算 App 的排名接近第一名的程度。100 表示所有跟踪的关键词都排在第 1 名，0 表示所有关键词均未查到排名。"
          : "How close the app is to ranking first for every keyword it tracks, weighted by popularity. 100 means position 1 for all of them, 0 means none was found."
      }
    >
      <p className="text-muted-foreground">
        {zh
          ? "每个关键词根据其热度和排名计入可见度：排名越靠后，贡献越小。"
          : "Each keyword counts in proportion to its popularity, and less the lower it ranks:"}
      </p>
      <Table className="text-caption">
        <TableCaption className="sr-only">
          {zh
            ? "不同排名位置对应的关键词热度计入比例"
            : "Share of a keyword’s popularity counted at each position"}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">{zh ? "排名" : "Position"}</TableHead>
            <TableHead scope="col" className="text-right">
              {zh ? "计入比例" : "Counts"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {POSITION_SHARES.map(({ position, share }) => (
            <TableRow key={position}>
              <TableCell className="numeric font-mono">
                {zh && position === "Not found" ? "未上榜" : position}
              </TableCell>
              <TableCell className="text-right numeric font-mono">
                {share}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-muted-foreground">
        {zh
          ? `尚无热度评分的关键词暂按热度 ${UNSCORED_POPULARITY} 计算；热度为 0 的关键词不计入。变化值以分数点表示。`
          : `A keyword without a popularity score yet counts as popularity ${UNSCORED_POPULARITY}, and one with popularity 0 does not count. Changes are in points.`}
      </p>
      {note ? (
        <p className="text-muted-foreground">
          {zh && note.startsWith("Here visibility covers only this market")
            ? "此处仅统计该市场在前后两天均完成排名检查的关键词，并使用变更前最近一次检查的热度作为权重，因此可见度变化只由排名变化引起。"
            : note}
        </p>
      ) : null}
      <a
        href={VISIBILITY_GUIDE}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-foreground underline decoration-primary underline-offset-4 hover:decoration-2"
      >
        {zh ? "查看完整计算方法" : "Read the full calculation"}
      </a>
    </InfoTip>
  );
}
