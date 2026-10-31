"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ApiError, login } from "@/lib/api";
import { signedInDestination } from "@/lib/auth-routes";
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
import { SessionNotKeptAlert } from "./SessionNotKeptAlert";
import { useAuth } from "./use-auth";
import { useSessionEntry } from "./use-session-entry";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";

export function LoginForm() {
  const locale = useInterfaceLanguage();
  const t = (value: string) => interfaceCopy(locale, value);
  const params = useSearchParams();
  const { status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutation, sessionDropped } = useSessionEntry({
    establish: () => login(email, password),
    destination: () => signedInDestination(params.get("next")),
    onFailure: (err) => {
      setError(
        err instanceof ApiError
          ? t(err.envelope.message)
          : t("Could not sign in. Try again."),
      );
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h1>{t("Sign in")}</h1>
          </CardTitle>
          <CardDescription>
            {t("Sign in to your AsoBeast workspace.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {params.get("registration") === "closed" ? (
            <p className="mb-4 text-sm text-muted-foreground">
              {t(
                "Registration is closed on this deployment. Ask the owner for an account.",
              )}
            </p>
          ) : null}
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("Email")}</Label>
              <Input
                id="email"
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={error !== null}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="password">{t("Password")}</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground underline"
                >
                  {t("Forgot password?")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={error !== null}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {sessionDropped ? (
              <SessionNotKeptAlert outcome="Your password was accepted." />
            ) : null}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
              {t("Sign in")}
            </Button>
          </form>
        </CardContent>
      </Card>
      {status?.registrationOpen ? (
        <p className="text-center text-sm text-muted-foreground">
          {t("Need an account?")}{" "}
          <Link href="/register" className="font-medium underline">
            {t("Create one")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
