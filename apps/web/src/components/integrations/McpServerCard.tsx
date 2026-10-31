"use client";

import { LocalizedText } from "@/components/layout/LocalizedText";

import { useState } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, Plug } from "lucide-react";
import { useQueryState } from "nuqs";
import { toast } from "@/lib/localized-toast";
import type { ApiTokenCreated } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, createApiToken } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MCP_CLIENTS,
  hostedSnippets,
  isMcpClient,
  localSnippets,
  remoteEndpoint,
  snippetsFor,
  type ConnectSnippet,
} from "@/lib/mcp-snippets";
import { mcpClientParser } from "@/lib/search-params";
import { invalidateApiTokenMutation } from "@/lib/queries";
import { useAuth } from "@/components/auth/use-auth";
import { useSingleFlight } from "@/lib/single-flight";
import {
  MCP_CHANGES_HINT,
  mcpTokenNotice,
  mcpTokenScope,
} from "@/lib/mcp-token-scope";

const DOCS_URL = "https://docs.asobeast.com/mcp/setup";

function CopyBlock({ snippet }: { snippet: ConnectSnippet }) {
  const { label, location, value } = snippet;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed — select the text and copy it manually.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Copy ${label}`}
          onClick={() => void copy()}
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{location}</p>
      <pre className="overflow-x-auto rounded-lg border bg-muted p-3 font-mono text-xs">
        {value}
      </pre>
    </div>
  );
}

function AgentSnippets({
  id,
  snippets,
}: {
  id: string;
  snippets: ConnectSnippet[];
}) {
  const [selected, setSelected] = useQueryState("agent", mcpClientParser);
  const clients = MCP_CLIENTS.filter(
    (candidate) => snippetsFor(snippets, candidate).length > 0,
  );
  const client = clients.includes(selected)
    ? selected
    : (clients[0] ?? selected);

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>
          <LocalizedText en="Agent" />
        </Label>
        <Select
          value={client}
          onValueChange={(next) => {
            if (isMcpClient(next)) void setSelected(next);
          }}
        >
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clients.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {snippetsFor(snippets, client).map((snippet) => (
        <CopyBlock key={snippet.id} snippet={snippet} />
      ))}
    </>
  );
}

function ConnectionSnippets({ token }: { token: string }) {
  const language = useInterfaceLanguage();
  return (
    <Tabs defaultValue="remote">
      <TabsList>
        <TabsTrigger value="remote">
          {language === "zh-CN" ? "托管端点" : "Hosted endpoint"}
        </TabsTrigger>
        <TabsTrigger value="stdio">
          {language === "zh-CN" ? "本地服务器" : "Local server"}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="remote" className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {language === "zh-CN"
            ? "客户端直接连接到此实例，无需安装。"
            : "Your client connects straight to this instance. Nothing to install."}
        </p>
        <AgentSnippets id="mcp-hosted-agent" snippets={hostedSnippets(token)} />
      </TabsContent>
      <TabsContent value="stdio" className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {language === "zh-CN"
            ? "适用于本地检出的代码仓库；托管用户无需配置此项。"
            : "For a checkout of the repository. Hosted users need nothing here."}
        </p>
        <AgentSnippets id="mcp-local-agent" snippets={localSnippets(token)} />
      </TabsContent>
    </Tabs>
  );
}

function ConnectDialog() {
  const language = useInterfaceLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<ApiTokenCreated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowChanges, setAllowChanges] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createApiToken({
        name: name.trim(),
        scope: mcpTokenScope(allowChanges),
      }),
    onSuccess: (result) => {
      invalidateApiTokenMutation(queryClient);
      setCreated(result);
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

  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      setAllowChanges(false);
      setCreated(null);
      setError(null);
    }
  }

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
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plug />
          {language === "zh-CN" ? "连接 agent" : "Connect an agent"}
        </Button>
      </DialogTrigger>
      <DialogContent size={created ? "lg" : "default"}>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {language === "zh-CN" ? "连接 AsoBeast" : "Connect AsoBeast"}
              </DialogTitle>
              <DialogDescription>
                {language === "zh-CN"
                  ? created.scope === "write"
                    ? "此 token 可修改数据且只显示一次。关闭前请复制所需内容，并妥善保密。"
                    : "此 token 为只读且只显示一次。关闭前请复制所需内容。"
                  : mcpTokenNotice(created.scope)}
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <ConnectionSnippets token={created.token} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" onClick={() => reset(false)}>
                {language === "zh-CN" ? "完成" : "Done"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} className="flex min-h-0 flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                {language === "zh-CN" ? "连接 agent" : "Connect an agent"}
              </DialogTitle>
              <DialogDescription>
                {language === "zh-CN"
                  ? "为此 agent 的 token 命名。除非你允许修改，否则 token 为只读；创建后会显示可直接粘贴的连接配置。"
                  : "Name a token for this agent. We mint it read-only unless you allow changes, and show you the ready-to-paste connect snippets."}
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mcp-token-name">
                  {language === "zh-CN" ? "Token 名称" : "Token name"}
                </Label>
                <Input
                  id="mcp-token-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Claude Desktop"
                  aria-invalid={error !== null}
                />
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="mcp-allow-changes"
                  checked={allowChanges}
                  onCheckedChange={(checked) =>
                    setAllowChanges(checked === true)
                  }
                  aria-describedby="mcp-allow-changes-hint"
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <Label htmlFor="mcp-allow-changes">
                    {language === "zh-CN"
                      ? "允许此 agent 修改数据"
                      : "Allow this agent to make changes"}
                  </Label>
                  <p
                    id="mcp-allow-changes-hint"
                    className="text-xs text-muted-foreground"
                  >
                    {language === "zh-CN"
                      ? "将增加追踪或取消追踪关键词、添加或移除竞品、修改待办事项状态的工具。可修改数据的 token 也能通过 API 修改其他内容，请妥善保密。"
                      : MCP_CHANGES_HINT}
                  </p>
                </div>
              </div>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </DialogBody>
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                {language === "zh-CN" ? "创建 token" : "Mint token"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function McpServerCard() {
  const language = useInterfaceLanguage();
  const { status, isLoading } = useAuth();

  if (isLoading || !status?.authenticated) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardDescription>
            {language === "zh-CN" ? "自动化" : "Automation"}
          </CardDescription>
          <CardTitle>
            {language === "zh-CN" ? "MCP 服务器" : "MCP server"}
          </CardTitle>
        </div>
        <ConnectDialog />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {language === "zh-CN"
            ? "将 MCP 客户端连接到此实例后，可以用自然语言查询 App、关键词、排名和审核结果。除非连接时允许 agent 修改数据，否则工具为只读；每次连接都通过个人 API token 验证。"
            : "Point any MCP client at this instance to ask about your apps, keywords, rankings and audits in plain language. Tools are read-only unless you allow an agent to make changes when you connect it, and every connection is authenticated with a personal API token."}{" "}
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-4"
          >
            {language === "zh-CN" ? "阅读设置指南" : "Read the setup guide"}
          </a>
          .
        </p>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">
            {language === "zh-CN" ? "端点" : "Endpoint"}
          </Label>
          <code
            translate="no"
            className="block overflow-x-auto rounded-lg border bg-muted px-3 py-2 font-mono text-xs"
          >
            {remoteEndpoint()}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
