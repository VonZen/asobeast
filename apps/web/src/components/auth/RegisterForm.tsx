"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PASSWORD_RULE } from "@asobeast/shared";
import { register } from "@/lib/api";
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
import {
  authFieldError,
  fieldErrorProps,
  type AuthFieldError,
} from "./field-error";
import { FieldErrorMessage } from "./FieldErrorMessage";
import { SessionNotKeptAlert } from "./SessionNotKeptAlert";
import { useSessionEntry } from "./use-session-entry";
import { useSingleFlight } from "@/lib/single-flight";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";

export function RegisterForm() {
  const locale = useInterfaceLanguage();
  const t = (value: string) => interfaceCopy(locale, value);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthFieldError | null>(null);

  const { mutation, sessionDropped } = useSessionEntry({
    establish: () =>
      register({
        email,
        password,
        name: name.trim() === "" ? undefined : name.trim(),
      }),
    onFailure: (err) =>
      setError(
        authFieldError(err, t("Could not create the account. Try again.")),
      ),
  });
  const submitOnce = useSingleFlight(mutation);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const problem = passwordError(password);
    if (problem) {
      setError({ field: "password", message: problem });
      return;
    }
    submitOnce();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h1>{t("Create account")}</h1>
          </CardTitle>
          <CardDescription>
            {t("Set up your AsoBeast workspace.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t("Name (optional)")}</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("Email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                {...fieldErrorProps(error, "email", "email-error")}
                required
              />
              <FieldErrorMessage error={error} field="email" id="email-error" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t("Password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                {...fieldErrorProps(
                  error,
                  "password",
                  "password-error",
                  "password-rule",
                )}
                required
              />
              <p id="password-rule" className="text-xs text-muted-foreground">
                {locale === "zh-CN"
                  ? "密码须包含至少 10 个非空白字符。"
                  : PASSWORD_RULE}
              </p>
              <FieldErrorMessage
                error={error}
                field="password"
                id="password-error"
              />
            </div>
            <FieldErrorMessage error={error} field="form" id="form-error" />
            {sessionDropped ? (
              <SessionNotKeptAlert
                outcome="Your account was created."
                offerSignIn
              />
            ) : null}
            <Button
              type="submit"
              disabled={mutation.isPending || sessionDropped}
            >
              {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
              {t("Create account")}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        {t("Already have an account?")}{" "}
        <Link href="/login" className="font-medium underline">
          {t("Sign in")}
        </Link>
      </p>
    </div>
  );
}
