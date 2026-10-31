"use client";

import { useState } from "react";
import type { FormEvent, RefObject } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/localized-toast";
import { STORES, type Store, type StoreSearchResult } from "@asobeast/shared";
import { useRouter } from "next/navigation";
import { CountrySelect } from "@/components/CountrySelect";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsOption } from "@/components/ui/tabs";
import { ApiError, importApp } from "@/lib/api";
import { marketError } from "@/lib/countries";
import { returnFocusTo } from "@/lib/focus-handoff";
import { storeLabel } from "@/lib/format";
import { appKeys, portfolioKey } from "@/lib/queries";
import { useSingleFlight } from "@/lib/single-flight";
import { classifyInput, isStoreAddress } from "./store-search";
import { StoreSearchField } from "./StoreSearchField";
import { useStoreSearch } from "./useStoreSearch";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";

const DEFAULT_STORE: Store = "APP_STORE";
const DEFAULT_COUNTRY = "us";

const PLACEHOLDERS: Record<Store, string> = {
  APP_STORE: "Focus Timer or apps.apple.com/us/app/…/id123",
  GOOGLE_PLAY: "Focus Timer or com.example.app",
};

function StoreTabs({
  store,
  onChange,
}: {
  store: Store;
  onChange: (store: Store) => void;
}) {
  const locale = useInterfaceLanguage();
  return (
    <Tabs value={store} onValueChange={(next) => onChange(next as Store)}>
      <TabsList aria-label={interfaceCopy(locale, "Store")}>
        {STORES.map((option) => (
          <TabsOption key={option} value={option}>
            {storeLabel(option)}
          </TabsOption>
        ))}
      </TabsList>
    </Tabs>
  );
}

function StorefrontField({
  store,
  country,
  onChange,
}: {
  store: Store;
  country: string;
  onChange: (country: string) => void;
}) {
  const locale = useInterfaceLanguage();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="import-country">
        {interfaceCopy(locale, "Home storefront")}
      </Label>
      <p className="text-xs text-muted-foreground">
        {locale === "zh-CN"
          ? "从此市场读取 App 元数据和分类排名。之后可在关键词监控中添加其他市场。"
          : "Where this app’s metadata and category ranks are read. Add other markets later from the keyword monitor."}
      </p>
      <CountrySelect
        id="import-country"
        store={store}
        value={country}
        onChange={onChange}
        ariaLabel={interfaceCopy(locale, "Home storefront")}
      />
    </div>
  );
}

export function ImportAppDialog({
  children,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  returnFocus,
}: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  returnFocus?: RefObject<HTMLElement | null>;
}) {
  const locale = useInterfaceLanguage();
  const t = (value: string) => interfaceCopy(locale, value);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChangeProp ?? setUncontrolledOpen;
  const [value, setValue] = useState("");
  const [store, setStore] = useState<Store>(DEFAULT_STORE);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const search = useStoreSearch(store, country, value);

  const mutation = useMutation({
    mutationFn: ({ url, country }: { url: string; country: string }) =>
      importApp(url, country),
    onSuccess: (app) => {
      void queryClient.invalidateQueries({ queryKey: appKeys.all });
      void queryClient.invalidateQueries({ queryKey: portfolioKey });
      setOpen(false);
      toast.success(
        locale === "zh-CN"
          ? `已导入 ${app.name ?? "App"}`
          : `Imported ${app.name ?? "app"}`,
      );
      router.push(`/apps/${app.id}/setup`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        if (err.envelope.statusCode === 501) {
          setNote(err.envelope.message);
        } else {
          setError(err.envelope.message);
        }
        return;
      }
      setError(
        locale === "zh-CN"
          ? "无法连接 API 以导入此 App。"
          : "Could not reach the api to import this app",
      );
    },
  });
  const importOnce = useSingleFlight(mutation);

  function reset() {
    setValue("");
    setStore(DEFAULT_STORE);
    setCountry(DEFAULT_COUNTRY);
    clearOutcome();
    mutation.reset();
  }

  function clearOutcome() {
    setError(null);
    setNote(null);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
    }
  }

  function onValueChange(next: string) {
    clearOutcome();
    setValue(next);
    const input = classifyInput(next);
    if (input.kind === "url" && isStoreAddress(next)) {
      setStore(input.parsed.store);
      setCountry(input.parsed.country);
    }
  }

  function onStoreChange(next: Store) {
    clearOutcome();
    setStore(next);
  }

  function onCountryChange(next: string) {
    clearOutcome();
    setCountry(next);
  }

  function importFrom(target: Store, url: string) {
    const invalidCountry = marketError(target, country);
    if (invalidCountry) {
      setError(invalidCountry);
      return;
    }
    importOnce({ url, country });
  }

  function pick(result: StoreSearchResult) {
    clearOutcome();
    importFrom(store, result.storeAppId);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearOutcome();
    const { input } = search;
    if (input.kind === "url") return importFrom(input.parsed.store, value);
    if (input.kind === "invalid") return setError(input.message);
    const message = search.enterName(pick);
    if (message) setError(message);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent onCloseAutoFocus={returnFocusTo(returnFocus)}>
        <DialogHeader>
          <DialogTitle>{t("Import an app")}</DialogTitle>
          <DialogDescription>
            {locale === "zh-CN"
              ? "按名称搜索 App Store 或 Google Play，或粘贴商店链接，导入 App 并开始跟踪关键词。"
              : "Search the App Store or Google Play by name, or paste a store URL, to import the app and start tracking its keywords."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-col gap-4">
          <DialogBody>
            <StoreTabs store={store} onChange={onStoreChange} />

            <StoreSearchField
              id="import-url"
              label={t("App name or store URL")}
              hint={t("Type a name to search, or paste a store URL.")}
              placeholder={PLACEHOLDERS[store]}
              store={store}
              country={country}
              value={value}
              onChange={onValueChange}
              onPick={pick}
              search={search}
              error={error}
              note={note}
              autoFocus
            />

            <StorefrontField
              store={store}
              country={country}
              onChange={onCountryChange}
            />
          </DialogBody>

          <DialogFooter>
            <Button
              type="submit"
              disabled={mutation.isPending || value.trim() === ""}
            >
              {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
              {t(mutation.isPending ? "Importing…" : "Import")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
