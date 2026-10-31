"use client";

import { useState } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PASSWORD_RULE } from "@asobeast/shared";
import { ApiError, resetPassword } from "@/lib/api";
import { passwordError } from "@/lib/password";
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
import { useSingleFlight } from "@/lib/single-flight";

export function ResetPasswordForm() {
  const language = useInterfaceLanguage();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => resetPassword(token, password),
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.envelope.message
          : language === "zh-CN"
            ? "无法设置新密码，请重新获取链接。"
            : "Could not set the new password. Ask for a fresh link.",
      );
    },
  });
  const submitOnce = useSingleFlight(mutation);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const problem = passwordError(password);
    if (problem) {
      setError(interfaceCopy(language, problem));
      return;
    }
    submitOnce();
  }

  if (token === "") {
    return (
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle asChild>
            <h1>
              {language === "zh-CN"
                ? "找回链接不完整"
                : "Recovery link incomplete"}
            </h1>
          </CardTitle>
          <CardDescription>
            {language === "zh-CN"
              ? "请打开找回密码邮件中的链接，或重新获取链接。"
              : "Open the link from your recovery email, or ask for a new one."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/forgot-password">
              {language === "zh-CN" ? "重新获取链接" : "Ask for a new link"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h1>
              {language === "zh-CN" ? "设置新密码" : "Choose a new password"}
            </h1>
          </CardTitle>
          <CardDescription>
            {language === "zh-CN"
              ? mutation.isSuccess
                ? "其他所有会话已退出，API token 已撤销。"
                : "设置新密码将退出其他所有已登录设备，并撤销 API token。"
              : mutation.isSuccess
                ? "Every other session has been signed out and your API tokens were revoked."
                : "Setting it signs out every device that was already signed in and revokes your API tokens."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mutation.isSuccess ? (
            <div className="flex flex-col gap-4">
              <p className="text-body" role="status">
                {language === "zh-CN"
                  ? "密码已设置，请使用新密码登录。"
                  : "Your password is set. Sign in with it now."}
              </p>
              <Button asChild>
                <Link href="/login">
                  {language === "zh-CN" ? "登录" : "Sign in"}
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">
                  {language === "zh-CN" ? "新密码" : "New password"}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={error !== null}
                  aria-describedby={
                    error ? "password-rule password-error" : "password-rule"
                  }
                  required
                />
                <p id="password-rule" className="text-xs text-muted-foreground">
                  {language === "zh-CN"
                    ? "密码长度须为 10 至 128 个字符，且至少包含 10 个非空白字符。"
                    : PASSWORD_RULE}
                </p>
              </div>
              {error ? (
                <p id="password-error" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                {language === "zh-CN" ? "设置新密码" : "Set new password"}
              </Button>
              {mutation.isError ? (
                <Button asChild variant="outline">
                  <Link href="/forgot-password">
                    {language === "zh-CN"
                      ? "重新获取链接"
                      : "Ask for a new link"}
                  </Link>
                </Button>
              ) : null}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
