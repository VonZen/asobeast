"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { AppLocalizationsResult } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  addableGroups,
  type AddableLocalization,
} from "@/lib/app-localizations";
import { localizationName } from "@/lib/localizations";
import { apiErrorMessage } from "./api-error-message";
import { useAddLocalization } from "./useAddLocalization";

export function AddLocalizationDialog({
  id,
  result,
}: {
  id: string;
  result: AppLocalizationsResult;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const [open, setOpen] = useState(false);
  const { add, pending, error, reset } = useAddLocalization(id, () =>
    setOpen(false),
  );
  const groups = addableGroups(result.localizations, result.markets);
  const message = error
    ? apiErrorMessage(error, "Could not add the localization")
    : null;

  function onOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (!next) reset();
  }

  const option = ({ localization, readIn }: AddableLocalization) => (
    <CommandItem
      key={localization}
      value={`${localizationName(localization)} ${localization}`}
      disabled={pending}
      onSelect={() => add(localization)}
    >
      <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
        <span>{localizationName(localization)}</span>
        {readIn.length > 0 ? (
          <span className="text-caption text-muted-foreground">
            {zh ? "以下市场读取：" : "Read in "}
            {readIn.map((country) => country.toUpperCase()).join(", ")}
          </span>
        ) : null}
      </span>
    </CommandItem>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus aria-hidden />
          {zh ? "添加本地化版本" : "Add localization"}
        </Button>
      </DialogTrigger>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {zh ? "添加本地化版本" : "Add a localization"}
          </DialogTitle>
          <DialogDescription>
            {zh
              ? "选择已在 App Store Connect 中提供的语言。支持该语言的所有市场都会读取对应的关键词字段。"
              : "Pick a language you ship in App Store Connect. Its keyword field is read in every storefront on its list."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Command>
            <CommandInput
              placeholder={zh ? "搜索语言" : "Search languages"}
              autoFocus
            />
            <CommandList>
              <CommandEmpty>
                {zh ? "未找到语言。" : "No language found."}
              </CommandEmpty>
              {groups.read.length > 0 ? (
                <CommandGroup
                  heading={zh ? "当前市场读取" : "Read in your markets"}
                >
                  {groups.read.map(option)}
                </CommandGroup>
              ) : null}
              {groups.other.length > 0 ? (
                <CommandGroup heading={zh ? "其他语言" : "Other languages"}>
                  {groups.other.map(option)}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
          {message ? (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
