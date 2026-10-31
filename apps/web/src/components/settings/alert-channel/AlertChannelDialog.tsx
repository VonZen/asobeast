"use client";

import type { FormEvent, ReactNode } from "react";
import { Loader2, Plus } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { componentCopy } from "@/lib/component-copy";
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

export function AlertChannelDialog({
  open,
  onOpenChange,
  label,
  submitLabel = label,
  description,
  error,
  pending,
  onSubmit,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  submitLabel?: string;
  description: ReactNode;
  error: string | null;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  trigger?: ReactNode;
  children: ReactNode;
}) {
  const locale = useInterfaceLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Plus />
            {componentCopy(locale, label)}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{componentCopy(locale, label)}</DialogTitle>
            <DialogDescription>
              {typeof description === "string"
                ? componentCopy(locale, description)
                : description}
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            {children}

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {componentCopy(locale, error)}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button type="submit" aria-disabled={pending || undefined}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {componentCopy(locale, submitLabel)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
