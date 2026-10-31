"use client";

import { Plus, Tags, Upload } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { Ref } from "react";
import type { Store } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { localizedCountry } from "@/lib/format";
import { AddKeywordsDialog } from "./AddKeywordsDialog";
import { ImportKeywordsDialog } from "./ImportKeywordsDialog";

export function KeywordsEmptyState({
  appId,
  store,
  country,
  addRef,
}: {
  appId: string;
  store: Store;
  country: string;
  addRef?: Ref<HTMLButtonElement>;
}) {
  const language = useInterfaceLanguage();
  return (
    <EmptyState
      icon={Tags}
      title={
        language === "zh-CN"
          ? `尚未在 ${localizedCountry(country, language)} 追踪关键词`
          : `No keywords tracked in ${localizedCountry(country, language)} yet`
      }
      body={
        language === "zh-CN"
          ? "添加希望此 App 获得排名的词语后，AsoBeast 会在下次每日任务中开始采集排名。"
          : "Add the phrases you want this app to rank for and AsoBeast starts capturing positions on the next daily run."
      }
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <ImportKeywordsDialog appId={appId} store={store} country={country}>
            <Button variant="outline">
              <Upload />
              {language === "zh-CN" ? "导入 CSV" : "Import CSV"}
            </Button>
          </ImportKeywordsDialog>
          <AddKeywordsDialog appId={appId} store={store} country={country}>
            <Button ref={addRef}>
              <Plus />
              {language === "zh-CN" ? "添加关键词" : "Add keywords"}
            </Button>
          </AddKeywordsDialog>
        </div>
      }
    />
  );
}
