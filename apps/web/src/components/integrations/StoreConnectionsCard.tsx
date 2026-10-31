"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "@/lib/localized-toast";
import {
  SUPPORTED_STORES,
  type Store,
  type StoreConnectionItem,
} from "@asobeast/shared";
import { useAuth } from "@/components/auth/use-auth";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  closeUnlessPending,
  ConfirmActionFooter,
} from "@/components/ConfirmActionFooter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError, disconnectStore, syncStore, verifyStore } from "@/lib/api";
import { armFocusHandoff, useFocusGroupClaim } from "@/lib/focus-handoff";
import {
  invalidateStoreConnectionMutation,
  storeConnectionsOptions,
} from "@/lib/queries";
import { useSingleFlight } from "@/lib/single-flight";
import {
  connectionStatusLine,
  STORE_CONNECTIONS_SECTION_ID,
  STORE_CONSOLES,
  needsAdminKey,
  replyAccessLine,
} from "@/lib/store-connection-copy";
import { cn } from "@/lib/utils";
import { ConnectAppStoreDialog } from "./ConnectAppStoreDialog";
import { ConnectPlayDialog } from "./ConnectPlayDialog";
import { StoreConnectionApps } from "./StoreConnectionApps";

const OWNER_ONLY = "Only the workspace owner can connect a store.";
const STORE_CONNECT_OFF =
  "Store connections are off on this instance. Set STORE_CONNECT_ENCRYPTION_KEY to turn them on.";

function ConnectDialog({
  store,
  label,
  variant,
}: {
  store: Store;
  label: string;
  variant?: "default" | "outline";
}) {
  const { data } = useSuspenseQuery(storeConnectionsOptions);
  return store === "APP_STORE" ? (
    <ConnectAppStoreDialog label={label} variant={variant} />
  ) : (
    <ConnectPlayDialog
      label={label}
      googleSignIn={data.googleSignIn === true}
    />
  );
}

const connectFocusKey = (store: Store) => `store-connect:${store}`;

const failureOf = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.envelope.message : fallback;

function useConnectionAction<T>(
  action: () => Promise<T>,
  success: string,
  failure: string,
  onDone?: () => void,
) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: action,
    onSuccess: () => {
      onDone?.();
      invalidateStoreConnectionMutation(queryClient);
      toast.success(success);
    },
    onError: (error) => toast.error(failureOf(error, failure)),
  });
  return { pending: mutation.isPending, run: useSingleFlight(mutation) };
}

function DisconnectButton({ store }: { store: Store }) {
  const language = useInterfaceLanguage();
  const [open, setOpen] = useState(false);
  const copy = STORE_CONSOLES[store];
  const disconnect = useConnectionAction(
    () => disconnectStore(store),
    `${copy.name} disconnected`,
    `Could not disconnect ${copy.name}`,
    () => armFocusHandoff(connectFocusKey(store)),
  );

  return (
    <AlertDialog
      open={open}
      onOpenChange={closeUnlessPending(disconnect.pending, setOpen)}
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          {language === "zh-CN" ? "断开连接" : "Disconnect"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {language === "zh-CN"
              ? `断开 ${copy.name}？`
              : `Disconnect ${copy.name}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {language === "zh-CN"
              ? store === "APP_STORE"
                ? "AsoBeast 将删除保存的密钥并停止下载报告。已保存的数据会保留，重新连接密钥后可再次查看。如不再需要，请同时在 App Store Connect 中撤销密钥。"
                : "AsoBeast 将删除保存的服务账号密钥或 Google 登录信息，并停止读取 bucket。已保存的数据会保留，重新连接后可再次查看。如不再需要，请在 Google Cloud 中删除密钥，或在 Google 账号的第三方连接中移除 AsoBeast。"
              : copy.disconnect}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ConfirmActionFooter
          pending={disconnect.pending}
          label={language === "zh-CN" ? "断开连接" : "Disconnect"}
          pendingLabel={language === "zh-CN" ? "正在断开…" : "Disconnecting…"}
          onConfirm={disconnect.run}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConnectionActions({ item }: { item: StoreConnectionItem }) {
  const language = useInterfaceLanguage();
  const copy = STORE_CONSOLES[item.store];
  const verify = useConnectionAction(
    () => verifyStore(item.store),
    copy.verified,
    "Could not verify the key",
  );
  const sync = useConnectionAction(
    () => syncStore(item.store),
    "Sync queued",
    "Could not queue a sync",
  );
  const rejected = item.status === "rejected";

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={rejected ? "default" : "outline"}
        size="sm"
        aria-disabled={verify.pending || undefined}
        onClick={() => verify.run()}
      >
        {language === "zh-CN" ? "验证" : "Verify"}
      </Button>
      {rejected ? null : (
        <Button
          variant="outline"
          size="sm"
          aria-disabled={sync.pending || undefined}
          onClick={() => sync.run()}
        >
          {language === "zh-CN" ? "立即同步" : "Sync now"}
        </Button>
      )}
      <ConnectDialog
        store={item.store}
        label={
          language === "zh-CN"
            ? item.store === "APP_STORE"
              ? "替换密钥"
              : "重新连接"
            : copy.replaceLabel
        }
        variant={needsAdminKey(item) ? "default" : "outline"}
      />
      <DisconnectButton store={item.store} />
    </div>
  );
}

function ConnectionDetails({
  item,
  actions,
}: {
  item: StoreConnectionItem;
  actions: ReactNode;
}) {
  const language = useInterfaceLanguage();
  const status = connectionStatusLine(item);
  const facts = STORE_CONSOLES[item.store].facts(item);
  const replies = replyAccessLine(item);

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        {facts.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-muted-foreground">
              {interfaceCopy(language, term)}
            </dt>
            <dd translate="no" className="min-w-0 font-mono text-xs break-all">
              {value}
            </dd>
          </div>
        ))}
        <dt className="text-muted-foreground">
          {language === "zh-CN" ? "评论回复" : "Review replies"}
        </dt>
        <dd
          className={cn(
            "min-w-0",
            replies.tone === "warning"
              ? "text-warning"
              : "text-muted-foreground",
          )}
        >
          {interfaceCopy(language, replies.text)}
        </dd>
      </dl>
      <p
        role="status"
        className={cn(
          "text-body",
          status.tone === "warning" ? "text-warning" : "text-muted-foreground",
        )}
      >
        {interfaceCopy(language, status.text)}
      </p>
      {actions}
      <StoreConnectionApps store={item.store} apps={item.apps} />
    </div>
  );
}

function StoreConsoleCard({
  store,
  connection,
}: {
  store: Store;
  connection: StoreConnectionItem | undefined;
}) {
  const language = useInterfaceLanguage();
  const { user, isOwner } = useAuth();
  const copy = STORE_CONSOLES[store];
  const owner = Boolean(user) && isOwner;
  const header = useFocusGroupClaim(
    connectFocusKey(store),
    Boolean(connection),
  );

  return (
    <Card>
      <CardHeader
        ref={header}
        className="flex-row items-start justify-between gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <CardDescription>
            {language === "zh-CN" ? "商店控制台" : "Store console"}
          </CardDescription>
          <CardTitle>{copy.name}</CardTitle>
        </div>
        {owner && !connection ? (
          <ConnectDialog
            store={store}
            label={
              language === "zh-CN" ? `连接 ${copy.name}` : copy.connectLabel
            }
          />
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {connection ? (
          <ConnectionDetails
            item={connection}
            actions={owner ? <ConnectionActions item={connection} /> : null}
          />
        ) : (
          <p className="text-body text-muted-foreground">
            {language === "zh-CN"
              ? store === "APP_STORE"
                ? "尚未连接商店。连接 App Store Connect 后，可按市场查看展示次数、产品页浏览量、Get 点击次数和转化率，并在评论页发布回复。"
                : "尚未连接商店。连接 Google Play Console 后，可按市场查看商品页访客、获客数和转化率、各搜索词的安装数，并在评论页发布回复。"
              : copy.empty}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function useScrollIntoViewOnHash() {
  useEffect(() => {
    if (window.location.hash !== `#${STORE_CONNECTIONS_SECTION_ID}`) return;
    document
      .getElementById(STORE_CONNECTIONS_SECTION_ID)
      ?.scrollIntoView({ block: "start" });
  }, []);
}

export function StoreConnectionsCard() {
  const language = useInterfaceLanguage();
  const { user, isOwner } = useAuth();
  const { data } = useSuspenseQuery(storeConnectionsOptions);
  useScrollIntoViewOnHash();

  if (!data.available) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>
            {language === "zh-CN" ? "商店控制台" : "Store console"}
          </CardDescription>
          <CardTitle>
            {language === "zh-CN" ? "商店连接" : "Store connections"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-muted-foreground">
            {language === "zh-CN"
              ? "此实例尚未开启商店连接。请设置 STORE_CONNECT_ENCRYPTION_KEY 以启用。"
              : STORE_CONNECT_OFF}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {SUPPORTED_STORES.map((store) => (
        <StoreConsoleCard
          key={store}
          store={store}
          connection={data.connections.find((item) => item.store === store)}
        />
      ))}
      {user && !isOwner ? (
        <p className="text-body text-muted-foreground">
          {language === "zh-CN" ? "只有工作区所有者可以连接商店。" : OWNER_ONLY}
        </p>
      ) : null}
    </div>
  );
}
