import Link from "next/link";
import type {
  AuditBenchmarkRow,
  AuditBenchmarks as Benchmarks,
} from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/meter";
import { pluralize } from "@/lib/format";
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
  benchmarkRatio,
  comparison,
  COMPARISON_LABEL,
  formatBenchmarkValue,
} from "./benchmark-comparison";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";

function YouCell({ row }: { row: AuditBenchmarkRow }) {
  const locale = useInterfaceLanguage();
  return (
    <TableCell>
      <span className="flex flex-col gap-1">
        <span className="numeric font-mono">
          {formatBenchmarkValue(row.metric, row.you)}
        </span>
        <Meter value={benchmarkRatio(row) * 100} tone="health" />
        <span className="text-caption text-muted-foreground">
          {interfaceCopy(locale, COMPARISON_LABEL[comparison(row)])}
        </span>
      </span>
    </TableCell>
  );
}

export function AuditBenchmarks({
  appId,
  benchmarks,
}: {
  appId: string;
  benchmarks: Benchmarks | null | undefined;
}) {
  const locale = useInterfaceLanguage();
  const chinese = locale === "zh-CN";
  if (!benchmarks || benchmarks.rows.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            title={
              chinese ? "没有可对比的竞品" : "No competitors to compare with"
            }
            body={
              chinese
                ? "跟踪几个竞品后，诊断会对比你和竞品的商店页面。"
                : "Track a few rivals and the audit compares your listing with theirs."
            }
            action={
              <Button asChild variant="outline">
                <Link href={`/apps/${appId}/competitors`}>
                  {chinese ? "添加竞品" : "Add competitors"}
                </Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <h2 className="mb-3 text-lg font-medium">
          {chinese ? "竞品对比" : "Competitor comparison"}
        </h2>
        <Table
          scrollLabel={chinese ? "竞品对比" : "Competitor comparison"}
          scrollFocus="overflow"
        >
          <TableCaption>
            {chinese ? (
              `你的商店页面与 ${benchmarks.competitors} 个竞品的对比`
            ) : (
              <>
                How your listing compares with{" "}
                {pluralize(benchmarks.competitors, "competitor")}
              </>
            )}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{chinese ? "指标" : "Metric"}</TableHead>
              <TableHead>{chinese ? "你" : "You"}</TableHead>
              <TableHead>
                {chinese ? "竞品中位数" : "Competitor median"}
              </TableHead>
              <TableHead>{chinese ? "最佳" : "Best"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {benchmarks.rows.map((row) => (
              <TableRow key={row.metric}>
                <TableCell>{interfaceCopy(locale, row.label)}</TableCell>
                <YouCell row={row} />
                <TableCell className="numeric font-mono">
                  {formatBenchmarkValue(row.metric, row.median)}
                </TableCell>
                <TableCell className="numeric font-mono">
                  {formatBenchmarkValue(row.metric, row.best)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
