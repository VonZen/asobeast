"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { MetadataDraft } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import {
  applyMetadataPublish,
  getMetadataPublishSetting,
  previewMetadataPublish,
  type MetadataPublishPreview,
} from "@/lib/api";

const fields: Record<string, string> = {
  title: "name",
  subtitle: "subtitle",
  keywordField: "keywords",
  description: "description",
};

export function MetadataPublishPanel({
  appId,
  locale,
  drafts,
}: {
  appId: string;
  locale: string | null;
  drafts: MetadataDraft[];
}) {
  const language = useInterfaceLanguage();
  const zh = language === "zh-CN";
  const [preview, setPreview] = useState<MetadataPublishPreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [approvedFields, setApprovedFields] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const setting = useQuery({
    queryKey: ["metadata-publish-setting", appId],
    queryFn: () => getMetadataPublishSetting(appId),
  });
  const enabled = setting.data?.enabled === true;
  const draftFields = Object.fromEntries(
    drafts
      .map((draft) => [fields[draft.field], draft.value])
      .filter(([key]) => Boolean(key)),
  );
  const inspect = useMutation({
    mutationFn: () => previewMetadataPublish(appId, locale!, draftFields),
    onSuccess: (value) => {
      setPreview(value);
      setApprovedFields([]);
      setConfirmed(false);
      setMessage("");
    },
    onError: (error) => setMessage(String(error)),
  });
  const publish = useMutation({
    mutationFn: () =>
      applyMetadataPublish(appId, locale!, preview!.baselineHash, draftFields),
    onSuccess: (result) => {
      setMessage(
        zh ? `发布结果：${result.status}` : `Publish result: ${result.status}`,
      );
      setPreview(null);
      setConfirmed(false);
    },
    onError: (error) => {
      setMessage(String(error));
      setPreview(null);
      setConfirmed(false);
    },
  });
  if (drafts.length === 0) return null;
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <h3 className="font-medium">
        {zh ? "发布到 App Store Connect" : "Apply to App Store Connect"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {zh
          ? "默认关闭。发布需要 App Manager 或 Admin 权限，不会提交审核。"
          : "Disabled by default. Requires App Manager or Admin. Never submits for review."}
      </p>
      {!enabled ? (
        <a href="/settings#metadata-publishing" className="text-sm underline">
          {zh
            ? "前往设置开启元数据发布"
            : "Enable metadata publishing in Settings"}
        </a>
      ) : null}
      <Button
        disabled={
          !enabled ||
          !locale ||
          inspect.isPending ||
          publish.isPending ||
          drafts.some((draft) => draft.issues.length > 0)
        }
        onClick={() => inspect.mutate()}
        variant="outline"
      >
        {zh ? "预览线上差异" : "Preview store diff"}
      </Button>
      {!locale ? (
        <p className="text-sm text-muted-foreground">
          {zh ? "请先选择具体语言。" : "Select a localization first."}
        </p>
      ) : null}
      {preview ? (
        <div className="space-y-3 border-t pt-3">
          <p className="font-medium">
            {zh ? "逐字段确认" : "Confirm each field"}
          </p>
          {Object.entries(preview.diff).map(([key, value]) => (
            <div key={key} className="space-y-1 text-sm">
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={approvedFields.includes(key)}
                  onChange={(event) =>
                    setApprovedFields((previous) =>
                      event.target.checked
                        ? [...previous, key]
                        : previous.filter((field) => field !== key),
                    )
                  }
                />
                {key}
              </label>
              <p className="whitespace-pre-wrap break-words text-muted-foreground">
                {zh ? "线上：" : "Current: "}
                {preview.current[key] ?? ""}
              </p>
              <p className="whitespace-pre-wrap break-words">
                {zh ? "新值：" : "New: "}
                {value}
              </p>
            </div>
          ))}
          {Object.keys(preview.diff).length ? (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                {zh
                  ? "我已逐字段检查，并确认发布这些更改"
                  : "I reviewed every field and confirm publishing these changes"}
              </label>
              <Button
                disabled={
                  !confirmed ||
                  approvedFields.length !== Object.keys(preview.diff).length ||
                  publish.isPending
                }
                onClick={() => publish.mutate()}
              >
                {zh ? "确认发布" : "Confirm apply"}
              </Button>
            </>
          ) : (
            <p className="text-sm">{zh ? "没有差异" : "No changes"}</p>
          )}
        </div>
      ) : null}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
    </div>
  );
}
