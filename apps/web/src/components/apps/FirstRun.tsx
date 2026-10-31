import { CheckCircle2 } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { Button } from "@/components/ui/button";
import { ImportAppDialog } from "./ImportAppDialog";

const DELIVERIES = [
  "Positions for the keywords in your title and subtitle, within minutes.",
  "A comparison against every competitor you add, on every keyword you track.",
  "A queue of what to change, once a week of daily captures is in.",
];

export function FirstRun() {
  const language = useInterfaceLanguage();
  const deliveries =
    language === "zh-CN"
      ? [
          "几分钟内获取标题和副标题中关键词的排名。",
          "对每个追踪的关键词，与添加的所有竞品进行比较。",
          "每日采集一周后，生成待改进事项。",
        ]
      : DELIVERIES;
  return (
    <div className="page-reading flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-20 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-display tracking-tight text-balance">
          {language === "zh-CN" ? "追踪你的第一个 App" : "Track your first app"}
        </h1>
        <p className="text-body text-muted-foreground">
          {language === "zh-CN"
            ? "输入 App 名称，或粘贴商店链接。"
            : "Type your app's name or paste its store URL."}
        </p>
      </div>
      <ul
        aria-label="What you get"
        className="flex max-w-md flex-col gap-2 text-left"
      >
        {deliveries.map((delivery) => (
          <li
            key={delivery}
            className="flex items-start gap-2 text-body text-muted-foreground"
          >
            <CheckCircle2
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-success"
            />
            {delivery}
          </li>
        ))}
      </ul>
      <ImportAppDialog>
        <Button size="lg">
          {language === "zh-CN" ? "导入 App" : "Import app"}
        </Button>
      </ImportAppDialog>
    </div>
  );
}
