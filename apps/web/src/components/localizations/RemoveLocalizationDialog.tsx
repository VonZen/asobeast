"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { toast } from "@/lib/localized-toast";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type {
  AppLocalizationItem,
  AppLocalizationsResult,
} from "@asobeast/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { removeAppLocalization } from "@/lib/api";
import {
  removeDescription,
  withoutLocalization,
} from "@/lib/app-localizations";
import { localizationName } from "@/lib/localizations";
import { appKeys, invalidateLocalizationMutation } from "@/lib/queries";
import { fieldLocaleParser } from "@/lib/search-params";
import { useSingleFlight } from "@/lib/single-flight";
import { apiErrorMessage } from "./api-error-message";

export function RemoveLocalizationDialog({
  id,
  item,
}: {
  id: string;
  item: AppLocalizationItem;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fieldLocale, setFieldLocale] = useQueryState(
    "fieldLocale",
    fieldLocaleParser,
  );
  const name = localizationName(item.localization);

  const remove = useMutation({
    mutationFn: () => removeAppLocalization(id, item.localization),
    onSuccess: () => {
      queryClient.setQueryData<AppLocalizationsResult>(
        appKeys.localizations(id),
        (current) => current && withoutLocalization(current, item.localization),
      );
      invalidateLocalizationMutation(queryClient, id);
      setOpen(false);
      if (fieldLocale === item.localization) {
        void setFieldLocale(null, { history: "replace" });
      }
      toast.success(zh ? `已移除${name}` : `Removed ${name}`);
    },
    onError: (err) =>
      toast.error(
        apiErrorMessage(
          err,
          zh ? `无法移除${name}` : `Could not remove ${name}`,
        ),
      ),
  });
  const removeOnce = useSingleFlight(remove);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!remove.isPending) setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          {zh ? "移除本地化版本" : "Remove localization"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {zh ? `移除${name}？` : `Remove ${name}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {zh
              ? item.readBy.length === 0
                ? "将删除此本地化版本的关键词字段；因其他原因跟踪的词组会保留。"
                : `将删除此关键词字段。在${item.readBy.map((reader) => reader.country.toUpperCase()).join("、")}市场中，这些词组不再作为关键词字段词组跟踪；因其他原因跟踪的词组会保留。`
              : removeDescription(item)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>
            {zh ? "取消" : "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={(event) => {
              event.preventDefault();
              removeOnce();
            }}
          >
            {remove.isPending
              ? zh
                ? "正在移除…"
                : "Removing…"
              : zh
                ? "移除"
                : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
