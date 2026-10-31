"use client";

import { LocalizedText } from "@/components/layout/LocalizedText";

import { useState } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, Plus } from "lucide-react";
import { toast } from "@/lib/localized-toast";
import {
  API_TOKEN_SCOPES,
  DEFAULT_API_TOKEN_SCOPE,
  type ApiTokenCreated,
  type ApiTokenScope,
} from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, createApiToken } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { apiTokensOptions, invalidateApiTokenMutation } from "@/lib/queries";
import { useAuth } from "@/components/auth/use-auth";
import { useSingleFlight } from "@/lib/single-flight";
import { RevokeTokenButton } from "./RevokeTokenButton";

const NEVER_EXPIRES = "never";

const EXPIRY_CHOICES = [
  { value: NEVER_EXPIRES, label: "Never expires" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "365 days" },
];

const SCOPE_LABELS: Record<ApiTokenScope, string> = {
  read: "Read only",
  write: "Read and write",
};

function TokenSecret({
  created,
  onDone,
}: {
  created: ApiTokenCreated;
  onDone: () => void;
}) {
  const language = useInterfaceLanguage();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (!navigator.clipboard) {
        throw new Error("clipboard unavailable");
      }
      await navigator.clipboard.writeText(created.token);
      setCopied(true);
      toast.success(language === "zh-CN" ? "token 已复制" : "Token copied");
    } catch {
      toast.error(
        language === "zh-CN"
          ? "复制失败，请选中上方 token 手动复制。"
          : "Copy failed — select the token above and copy it manually.",
      );
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {language === "zh-CN" ? "复制 token" : "Copy your token"}
        </DialogTitle>
        <DialogDescription>
          {language === "zh-CN"
            ? "token 只会显示这一次，请妥善保存，之后将无法再次查看。"
            : "This is the only time the token is shown. Store it somewhere safe — you will not see it again."}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={created.token}
            aria-label="New api token"
            className="font-mono text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Copy token"
            onClick={() => void copy()}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onDone}>
          {language === "zh-CN" ? "完成" : "Done"}
        </Button>
      </DialogFooter>
    </>
  );
}

function TokenForm({ onCreated }: { onCreated: (t: ApiTokenCreated) => void }) {
  const language = useInterfaceLanguage();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [scope, setScope] = useState<ApiTokenScope>(DEFAULT_API_TOKEN_SCOPE);
  const [expiry, setExpiry] = useState(NEVER_EXPIRES);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createApiToken({
        name: name.trim(),
        scope,
        ...(expiry === NEVER_EXPIRES ? {} : { expiresInDays: Number(expiry) }),
      }),
    onSuccess: (result) => {
      invalidateApiTokenMutation(queryClient);
      onCreated(result);
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.envelope.message
          : "Could not create the token.",
      );
    },
  });
  const createOnce = useSingleFlight(mutation);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (name.trim() === "") {
      setError(
        language === "zh-CN" ? "请为 token 命名。" : "Give the token a name.",
      );
      return;
    }
    createOnce();
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-col gap-4">
      <DialogHeader>
        <DialogTitle>
          {language === "zh-CN" ? "新建 API token" : "New API token"}
        </DialogTitle>
        <DialogDescription>
          {language === "zh-CN"
            ? "使用 Bearer 请求头中的 token 为脚本和 MCP 服务器进行身份验证。额度按工作区计算，新建 token 不会增加额度。"
            : "Use a token to authenticate scripts and the MCP server with a Bearer header. Limits are per workspace, so a second token adds no capacity."}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-2">
          <Label htmlFor="token-name">
            {language === "zh-CN" ? "名称" : "Name"}
          </Label>
          <Input
            id="token-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Local script"
            aria-invalid={error !== null}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="token-scope">
            {language === "zh-CN" ? "权限" : "Scope"}
          </Label>
          <Select
            value={scope}
            onValueChange={(next) => setScope(next as ApiTokenScope)}
          >
            <SelectTrigger id="token-scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {API_TOKEN_SCOPES.map((option) => (
                <SelectItem key={option} value={option}>
                  {interfaceCopy(language, SCOPE_LABELS[option])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {language === "zh-CN"
              ? "只读是更安全的默认选项。如需脚本修改数据，或允许 agent 追踪关键词、管理竞品和更新待办事项，请选择读写权限。"
              : "Read only is the safer default. Choose read and write for a script that changes data, or for an agent you allow to track keywords, manage competitors and update actions."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="token-expiry">
            {language === "zh-CN" ? "有效期" : "Expiry"}
          </Label>
          <Select value={expiry} onValueChange={setExpiry}>
            <SelectTrigger id="token-expiry">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPIRY_CHOICES.map((choice) => (
                <SelectItem key={choice.value} value={choice.value}>
                  {interfaceCopy(language, choice.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </DialogBody>
      <DialogFooter>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
          {language === "zh-CN" ? "创建 token" : "Create token"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CreateTokenDialog() {
  const language = useInterfaceLanguage();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<ApiTokenCreated | null>(null);

  function reset(next: boolean) {
    setOpen(next);
    if (!next) setCreated(null);
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          {language === "zh-CN" ? "新建 token" : "New token"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <TokenSecret created={created} onDone={() => reset(false)} />
        ) : (
          <TokenForm onCreated={setCreated} />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ApiTokensCard() {
  const language = useInterfaceLanguage();
  const { status, isLoading } = useAuth();
  const authenticated = Boolean(status?.authenticated);
  const { data } = useQuery({ ...apiTokensOptions, enabled: authenticated });

  if (isLoading || !status?.authenticated) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardDescription>
            {language === "zh-CN" ? "自动化" : "Automation"}
          </CardDescription>
          <CardTitle>
            <LocalizedText en="API tokens" />
          </CardTitle>
        </div>
        <CreateTokenDialog />
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {language === "zh-CN"
              ? "暂无 token。创建 token 后，可通过 Bearer 请求头为脚本或 MCP 服务器进行身份验证。"
              : "No tokens yet. Create one to authenticate scripts or the MCP server with a Bearer header."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableCaption className="sr-only">
                <LocalizedText en="Personal API tokens for automation." />
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {language === "zh-CN" ? "名称" : "Name"}
                  </TableHead>
                  <TableHead>
                    {language === "zh-CN" ? "前缀" : "Prefix"}
                  </TableHead>
                  <TableHead>
                    {language === "zh-CN" ? "权限" : "Scope"}
                  </TableHead>
                  <TableHead>
                    {language === "zh-CN" ? "到期时间" : "Expires"}
                  </TableHead>
                  <TableHead>
                    {language === "zh-CN" ? "上次使用" : "Last used"}
                  </TableHead>
                  <TableHead className="numeric text-right">
                    {language === "zh-CN" ? "请求数" : "Requests"}
                  </TableHead>
                  <TableHead>
                    {language === "zh-CN" ? "创建时间" : "Created"}
                  </TableHead>
                  <TableHead className="w-0">
                    <span className="sr-only">
                      <LocalizedText en="Actions" />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="max-w-48 truncate font-medium">
                      {token.name}
                    </TableCell>
                    <TableCell
                      translate="no"
                      className="numeric font-mono text-xs text-muted-foreground"
                    >
                      {token.prefix}…
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {interfaceCopy(language, SCOPE_LABELS[token.scope])}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {token.expiresAt === null ? (
                        <span className="text-muted-foreground">
                          {language === "zh-CN" ? "永不过期" : "Never"}
                        </span>
                      ) : token.expired ? (
                        <Badge variant="destructive">
                          {language === "zh-CN" ? "已过期" : "Expired"}
                        </Badge>
                      ) : (
                        formatDate(token.expiresAt, language)
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(token.lastUsedAt, language)}
                    </TableCell>
                    <TableCell className="numeric text-right">
                      {formatNumber(token.usageCount)}
                    </TableCell>
                    <TableCell>
                      {formatDate(token.createdAt, language)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <RevokeTokenButton id={token.id} name={token.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
