"use client";

import { useState } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { FormEvent, ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PASSWORD_RULE } from "@asobeast/shared";
import { toast } from "@/lib/localized-toast";
import { changePassword } from "@/lib/api";
import { passwordError } from "@/lib/password";
import { invalidatePasswordChange } from "@/lib/queries";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  authFieldError,
  fieldErrorProps,
  type AuthFieldError,
} from "./field-error";
import { FieldErrorMessage } from "./FieldErrorMessage";
import { useSingleFlight } from "@/lib/single-flight";

export function ChangePasswordDialog({ trigger }: { trigger: ReactNode }) {
  const language = useInterfaceLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<AuthFieldError | null>(null);

  function reset(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setCurrent("");
      setNext("");
      setError(null);
    }
  }

  const mutation = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => {
      invalidatePasswordChange(queryClient);
      toast.success(
        language === "zh-CN"
          ? "密码已修改，其他会话已退出，API token 已撤销。"
          : "Password changed. Other sessions were signed out and API tokens revoked.",
      );
      reset(false);
    },
    onError: (err) =>
      setError(authFieldError(err, "Could not change the password.")),
  });
  const submitOnce = useSingleFlight(mutation);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const problem = passwordError(next);
    if (problem) {
      setError({ field: "password", message: problem });
      return;
    }
    submitOnce();
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="flex min-h-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {language === "zh-CN" ? "修改密码" : "Change password"}
            </DialogTitle>
            <DialogDescription>
              {language === "zh-CN"
                ? "修改密码将退出其他所有会话，并撤销所有 API token。"
                : "Changing your password signs out every other session and revokes every API token."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password">
                {language === "zh-CN" ? "当前密码" : "Current password"}
              </Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
                {...fieldErrorProps(error, "current", "current-password-error")}
                required
              />
              <FieldErrorMessage
                error={error}
                field="current"
                id="current-password-error"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="next-password">
                {language === "zh-CN" ? "新密码" : "New password"}
              </Label>
              <Input
                id="next-password"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
                {...fieldErrorProps(
                  error,
                  "password",
                  "next-password-error",
                  "next-password-rule",
                )}
                required
              />
              <p
                id="next-password-rule"
                className="text-xs text-muted-foreground"
              >
                {language === "zh-CN"
                  ? "密码须包含至少 10 个非空白字符。"
                  : PASSWORD_RULE}
              </p>
              <FieldErrorMessage
                error={error}
                field="password"
                id="next-password-error"
              />
            </div>
            <FieldErrorMessage
              error={error}
              field="form"
              id="change-password-error"
            />
          </DialogBody>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
              {language === "zh-CN" ? "修改密码" : "Change password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
