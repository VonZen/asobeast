"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import { toast } from "@/lib/localized-toast";
import type { AuthUser } from "@asobeast/shared";
import { logout } from "@/lib/api";
import { invalidateAuth } from "@/lib/queries";
import { planInForceLabel } from "@/lib/plan-in-force";
import { ADMIN_ENTRY, ADMIN_TOOLS } from "@/components/admin/admin-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { useAuth } from "./use-auth";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";

function PlanInForceBadge({ user }: { user: AuthUser }) {
  return (
    <Badge variant="secondary" className="w-fit">
      {planInForceLabel(user, new Date())}
    </Badge>
  );
}

export function UserMenu() {
  const locale = useInterfaceLanguage();
  const t = (value: string) => interfaceCopy(locale, value);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const signOut = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      invalidateAuth(queryClient);
      window.location.replace("/login");
    },
    onError: () => toast.error(t("Could not sign out.")),
  });

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("Account menu")}>
          <User />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="truncate font-medium">{user.email}</span>
          <PlanInForceBadge user={user} />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="sm:hidden">
          <Link href="/settings">
            <Settings />
            {t("Settings")}
          </Link>
        </DropdownMenuItem>
        <ChangePasswordDialog
          trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              {t("Change password")}
            </DropdownMenuItem>
          }
        />
        {user.platformOperator && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("Admin")}
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={ADMIN_ENTRY.href}>
                <ADMIN_ENTRY.icon />
                {t("Admin area")}
              </Link>
            </DropdownMenuItem>
            {ADMIN_TOOLS.map(({ href, label, Icon }) => (
              <DropdownMenuItem key={href} asChild>
                <a href={href} target="_blank" rel="noreferrer">
                  <Icon />
                  {t(label)}
                </a>
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          onSelect={(event) => {
            event.preventDefault();
            signOut.mutate();
          }}
        >
          <LogOut />
          {t("Sign out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
