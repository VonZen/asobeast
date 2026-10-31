"use client";

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

export const closeUnlessPending =
  (pending: boolean, setOpen: (open: boolean) => void) =>
  (open: boolean): void => {
    if (open || !pending) setOpen(open);
  };

export function ConfirmActionFooter({
  pending,
  label,
  pendingLabel,
  onConfirm,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
  onConfirm: () => void;
}) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  return (
    <AlertDialogFooter>
      <AlertDialogCancel
        aria-disabled={pending || undefined}
        onClick={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        {chinese ? "取消" : "Cancel"}
      </AlertDialogCancel>
      <AlertDialogAction
        variant="destructive"
        aria-disabled={pending || undefined}
        onClick={(event) => {
          event.preventDefault();
          if (!pending) onConfirm();
        }}
      >
        {pending ? pendingLabel : label}
      </AlertDialogAction>
    </AlertDialogFooter>
  );
}
