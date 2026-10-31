"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/localized-toast";
import {
  DELETION_CONFIRMATION,
  type WorkspaceDeletionStatus,
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/use-auth";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import {
  ApiError,
  cancelWorkspaceDeletion,
  scheduleWorkspaceDeletion,
} from "@/lib/api";
import { formatDateTime, pluralize } from "@/lib/format";
import {
  invalidateWorkspaceDeletion,
  workspaceDeletionOptions,
} from "@/lib/queries";

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.envelope.message : fallback;
}

function ScheduleDeletionDialog({ graceDays }: { graceDays: number }) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const schedule = useMutation({
    mutationFn: scheduleWorkspaceDeletion,
    onSuccess: () => {
      toast.success(
        chinese ? "已安排删除工作区" : "Workspace scheduled for deletion",
      );
      invalidateWorkspaceDeletion(queryClient);
      setOpen(false);
    },
    onError: (err) =>
      toast.error(
        messageOf(
          err,
          chinese ? "无法安排删除。" : "Could not schedule the deletion.",
        ),
      ),
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setTyped("");
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        {chinese ? "删除工作区" : "Delete workspace"}
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {chinese ? "删除此工作区？" : "Delete this workspace?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {chinese ? (
              `其中的所有 App、关键词和历史记录将在 ${graceDays} 天后删除。在此之前，你可以取消删除。`
            ) : (
              <>
                Every app, keyword and history in it is erased after{" "}
                {pluralize(graceDays, "day")}. You can cancel until then.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="workspace-deletion-confirm">
            {chinese
              ? `输入 ${DELETION_CONFIRMATION} 以确认`
              : `Type ${DELETION_CONFIRMATION} to confirm`}
          </Label>
          <Input
            id="workspace-deletion-confirm"
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={schedule.isPending}>
            {chinese ? "保留工作区" : "Keep workspace"}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={typed !== DELETION_CONFIRMATION || schedule.isPending}
            onClick={(event) => {
              event.preventDefault();
              schedule.mutate();
            }}
          >
            {schedule.isPending
              ? chinese
                ? "正在安排…"
                : "Scheduling…"
              : chinese
                ? "删除工作区"
                : "Delete workspace"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CancelDeletionButton() {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: cancelWorkspaceDeletion,
    onSuccess: () => {
      toast.success(chinese ? "已取消删除" : "Deletion cancelled");
      invalidateWorkspaceDeletion(queryClient);
    },
    onError: (err) =>
      toast.error(
        messageOf(
          err,
          chinese ? "无法取消删除。" : "Could not cancel the deletion.",
        ),
      ),
  });

  return (
    <Button
      variant="outline"
      disabled={cancel.isPending}
      onClick={() => cancel.mutate()}
    >
      {cancel.isPending
        ? chinese
          ? "正在取消…"
          : "Cancelling…"
        : chinese
          ? "取消删除"
          : "Cancel deletion"}
    </Button>
  );
}

function ScheduledStatus({ deletion }: { deletion: WorkspaceDeletionStatus }) {
  const locale = useInterfaceLanguage();
  if (locale === "zh-CN") {
    const requested = deletion.requestedBy ?? "所有者";
    const requestedAt = deletion.requestedAt
      ? `于 ${formatDateTime(deletion.requestedAt, locale)} `
      : "";
    const dueAt = deletion.dueAt
      ? formatDateTime(deletion.dueAt, locale)
      : "到期日";
    return (
      <p className="text-body">
        {requested} {requestedAt}安排删除此工作区。该工作区将在 {dueAt}{" "}
        或之后删除。
      </p>
    );
  }
  return (
    <p className="text-body">
      {deletion.requestedBy ?? "The owner"} scheduled this workspace for
      deletion
      {deletion.requestedAt
        ? ` on ${formatDateTime(deletion.requestedAt)}`
        : ""}
      . It is erased on or after{" "}
      {deletion.dueAt ? formatDateTime(deletion.dueAt) : "the due date"}.
    </p>
  );
}

function OperatorNote() {
  const chinese = useInterfaceLanguage() === "zh-CN";
  return (
    <p className="text-body text-muted-foreground">
      {chinese
        ? "此工作区包含平台管理员。只要还有其他账号，就不能删除此工作区，否则管理后台、队列面板和支持工具也会被删除，且没有账号能够接管。AsoBeast 暂不支持移交管理员。若要清除自己的数据，请删除其中的 App 和关键词。只有你的账号是唯一账号时才能删除此工作区；删除后实例会重置。"
        : "This workspace holds the platform operator. It cannot be deleted while other accounts exist, because the admin area, the queue dashboard and the support tools would go with it and no account could take them over. AsoBeast has no hand over yet. To clear your own data, delete its apps and keywords instead. Deleting this workspace is allowed only while yours is the only account, and it resets the instance."}
    </p>
  );
}

function DeletionControl({
  deletion,
  isOwner,
}: {
  deletion: WorkspaceDeletionStatus;
  isOwner: boolean;
}) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  if (!isOwner) {
    return (
      <p className="text-body text-muted-foreground">
        {chinese ? (
          deletion.scheduled ? (
            "只有工作区所有者可以取消删除。"
          ) : (
            "只有工作区所有者可以删除此工作区。"
          )
        ) : (
          <>
            Only the workspace owner can{" "}
            {deletion.scheduled ? "cancel this" : "delete this workspace"}.
          </>
        )}
      </p>
    );
  }
  return deletion.scheduled ? (
    <CancelDeletionButton />
  ) : (
    <ScheduleDeletionDialog graceDays={deletion.graceDays} />
  );
}

export function WorkspaceDeletionCard() {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const { user, isOperator } = useAuth();
  const { data: deletion } = useQuery(workspaceDeletionOptions);

  if (!deletion || !user) return null;

  const isOwner = user.role === "owner";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chinese ? "删除工作区" : "Delete workspace"}</CardTitle>
        <CardDescription>
          {chinese ? (
            `删除会在 ${deletion.graceDays} 天宽限期后清除工作区中的所有 App、关键词和历史记录。所有者可以在宽限期内取消删除。`
          ) : (
            <>
              Deleting erases every app, keyword and history in this workspace
              after a grace period of {pluralize(deletion.graceDays, "day")},
              during which the owner can cancel it.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        {isOperator ? <OperatorNote /> : null}
        {deletion.scheduled ? <ScheduledStatus deletion={deletion} /> : null}
        <DeletionControl deletion={deletion} isOwner={isOwner} />
      </CardContent>
    </Card>
  );
}
