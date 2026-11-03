"use client";

import { LocalizedText } from "@/components/layout/LocalizedText";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { componentCopy } from "@/lib/component-copy";

import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/localized-toast";
import { STORE_FUNNEL_GUIDE } from "@/components/overview/FunnelHelp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, connectStore } from "@/lib/api";
import { invalidateStoreConnectionMutation } from "@/lib/queries";
import { useSingleFlight } from "@/lib/single-flight";
import { AlertChannelDialog } from "@/components/settings/alert-channel/AlertChannelDialog";

const ISSUER_ID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const KEY_ID = /^[A-Za-z0-9]{10}$/;
const PRIVATE_KEY_MARKER = "BEGIN PRIVATE KEY";

function problemOf(
  issuerId: string,
  keyId: string,
  privateKey: string,
): string | null {
  if (!ISSUER_ID.test(issuerId)) {
    return "Paste the issuer ID shown above the team keys in App Store Connect.";
  }
  if (!KEY_ID.test(keyId)) return "The key ID is ten letters and digits.";
  if (!privateKey.includes(PRIVATE_KEY_MARKER)) {
    return "Paste the whole contents of the .p8 file, or choose the file.";
  }
  return null;
}

export function ConnectAppStoreDialog({
  label,
  variant = "outline",
}: {
  label: string;
  variant?: "default" | "outline";
}) {
  const locale = useInterfaceLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [issuerId, setIssuerId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset(next: boolean) {
    setOpen(next);
    if (next) return;
    setIssuerId("");
    setKeyId("");
    setPrivateKey("");
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: () =>
      connectStore({
        store: "APP_STORE",
        issuerId: issuerId.trim(),
        keyId: keyId.trim(),
        privateKey,
      }),
    onSuccess: () => {
      invalidateStoreConnectionMutation(queryClient);
      toast.success("App Store Connect connected");
      reset(false);
    },
    onError: (failure) =>
      setError(
        failure instanceof ApiError
          ? failure.envelope.message
          : "Could not connect App Store Connect.",
      ),
  });
  const connectOnce = useSingleFlight(mutation);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = problemOf(issuerId.trim(), keyId.trim(), privateKey);
    setError(problem);
    if (!problem) connectOnce();
  }

  async function choose(file: File | undefined) {
    if (!file) return;
    setPrivateKey(await file.text());
  }

  return (
    <AlertChannelDialog
      open={open}
      onOpenChange={reset}
      label={label}
      description={componentCopy(
        locale,
        "Use an Admin team key from App Store Connect → Users and Access → Integrations. Admin is the recommended default for analytics reports, metadata updates and review replies. Metadata publishing stays disabled until you explicitly enable it in Settings; the key alone never publishes. AsoBeast encrypts the key and never displays it again.",
      )}
      error={error}
      pending={mutation.isPending}
      onSubmit={submit}
      trigger={
        <Button variant={variant} size="sm">
          {label}
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="asc-issuer-id">
          <LocalizedText en="Issuer ID" />
        </Label>
        <Input
          id="asc-issuer-id"
          value={issuerId}
          onChange={(event) => setIssuerId(event.target.value)}
          placeholder="57246542-96fe-1a63-e053-0824d011072a"
          autoComplete="off"
          spellCheck={false}
          className="font-mono text-xs"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="asc-key-id">
          <LocalizedText en="Key ID" />
        </Label>
        <Input
          id="asc-key-id"
          value={keyId}
          onChange={(event) => setKeyId(event.target.value)}
          placeholder="2X9R4HXF34"
          autoComplete="off"
          spellCheck={false}
          className="font-mono text-xs"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="asc-private-key">
          <LocalizedText en="Private key" />
        </Label>
        <Input
          id="asc-private-key"
          type="password"
          value={privateKey}
          onChange={(event) => setPrivateKey(event.target.value)}
          placeholder="Contents of AuthKey_2X9R4HXF34.p8"
          autoComplete="off"
          spellCheck={false}
          data-1p-ignore="true"
          data-lpignore="true"
          data-bwignore="true"
        />
        <Label htmlFor="asc-private-key-file" className="sr-only">
          <LocalizedText en="Private key file" />
        </Label>
        <Input
          id="asc-private-key-file"
          type="file"
          accept=".p8,application/x-pem-file,text/plain"
          className="max-w-xs"
          onChange={(event) => void choose(event.target.files?.[0])}
        />
        <p className="text-xs text-muted-foreground">
          {locale === "zh-CN"
            ? "粘贴密钥，或选择已下载的 .p8 文件。默认使用具有管理员（Admin）权限的团队密钥，以支持报表读取、元数据更新与评论回复；元数据发布仍须在设置中单独开启，不会自动发布。"
            : "Paste the key or choose the .p8 file you downloaded. Use an Admin team key for reports, metadata publishing and replies. Publishing metadata additionally requires explicit activation in Settings."}{" "}
          <a
            href={`${STORE_FUNNEL_GUIDE}#create-the-key`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline decoration-primary underline-offset-4 hover:decoration-2"
          >
            <LocalizedText en="Why an Admin key" />
          </a>
        </p>
      </div>
    </AlertChannelDialog>
  );
}
