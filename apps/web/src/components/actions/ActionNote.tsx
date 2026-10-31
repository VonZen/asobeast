"use client";

import { useState } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/localized-toast";
import { ACTION_NOTE_MAX_LENGTH, type ActionItem } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, updateAction } from "@/lib/api";
import { invalidateActionMutation } from "@/lib/queries";
import { limitCounterText, textLimit } from "@/lib/text-limit";
import { cn } from "@/lib/utils";
import { noteRequest } from "./note-request";

export function ActionNote({ item }: { item: ActionItem }) {
  const language = useInterfaceLanguage();
  const queryClient = useQueryClient();
  const saved = item.note ?? "";
  const [draft, setDraft] = useState(saved);
  const request = noteRequest(item, draft.trim());
  const noteLimit = textLimit(draft.trim(), ACTION_NOTE_MAX_LENGTH);

  const save = useMutation({
    mutationFn: () => {
      if (!request) throw new Error("This action cannot take a note");
      return updateAction(item.id, request);
    },
    onSuccess: () =>
      toast.success(language === "zh-CN" ? "备注已保存" : "Note saved"),
    onError: (error) =>
      toast.error(
        error instanceof ApiError
          ? error.message
          : language === "zh-CN"
            ? "无法保存备注"
            : "Could not save the note",
      ),
    onSettled: () => invalidateActionMutation(queryClient, item.scope.appId),
  });

  if (!request) {
    return (
      <div className="flex flex-col gap-2">
        {saved ? (
          <p className="text-body whitespace-pre-line">{saved}</p>
        ) : null}
        <p className="text-caption text-muted-foreground">
          {language === "zh-CN"
            ? "重新打开此事项后即可编辑备注。"
            : "Reopen this action to edit its note."}
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <Textarea
        aria-label={
          language === "zh-CN" ? "此事项的备注" : "Note for this action"
        }
        aria-invalid={noteLimit.over > 0}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="flex items-center justify-between gap-2">
        <span
          aria-live="polite"
          className={cn(
            "numeric font-mono text-caption",
            noteLimit.over > 0
              ? "font-medium text-destructive"
              : "text-muted-foreground",
          )}
        >
          {limitCounterText(noteLimit, ACTION_NOTE_MAX_LENGTH)}
        </span>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={
            draft.trim() === saved || save.isPending || noteLimit.over > 0
          }
        >
          {language === "zh-CN" ? "保存备注" : "Save note"}
        </Button>
      </div>
    </form>
  );
}
