"use client";

import { useQuery } from "@tanstack/react-query";
import { INTEGRATIONS_PATH } from "@asobeast/shared";
import {
  LayoutDashboard,
  ListChecks,
  Plug,
  Search,
  Settings,
  Trophy,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { ADMIN_ENTRY } from "@/components/admin/admin-links";
import { useAuth } from "@/components/auth/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { storeLabel } from "@/lib/format";
import {
  APP_SECTIONS,
  appRouteFrom,
  equivalentSection,
  sectionHref,
} from "@/lib/app-sections";
import { appsOptions } from "@/lib/queries";
import { useInterfaceLanguage } from "./InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";

const GENERAL = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/actions", label: "Action Center", icon: ListChecks },
  { href: "/charts", label: "Top charts", icon: Trophy },
  { href: INTEGRATIONS_PATH, label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function CommandPalette() {
  const locale = useInterfaceLanguage();
  const chinese = locale === "zh-CN";
  const t = (value: string) => interfaceCopy(locale, value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const route = appRouteFrom(pathname);
  const appId = route?.id;
  const { data: apps } = useQuery({ ...appsOptions, enabled: open });
  const { isOperator } = useAuth();
  const general = isOperator ? [...GENERAL, ADMIN_ENTRY] : GENERAL;

  const openRef = useRef(open);

  const handleOpenChange = useCallback((next: boolean) => {
    openRef.current = next;
    setOpen(next);
    if (!next) {
      setQuery("");
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleOpenChange(!openRef.current);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleOpenChange]);

  const go = useCallback(
    (href: string) => {
      handleOpenChange(false);
      router.push(href);
    },
    [handleOpenChange, router],
  );

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={chinese ? "打开命令面板" : "Open command palette"}
            onClick={() => handleOpenChange(true)}
          >
            <Search />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {chinese ? "搜索 — ⌘ K" : "Search — ⌘ K"}
        </TooltipContent>
      </Tooltip>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={chinese ? "命令面板" : "Command palette"}
        description={
          chinese
            ? "跳转到 App、栏目或页面。"
            : "Jump to an app, a section or a page."
        }
      >
        <Command>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={
              chinese ? "搜索 App 和栏目…" : "Search apps and sections…"
            }
          />
          <CommandList>
            <CommandEmpty>
              {chinese ? "没有匹配结果。" : "No matches."}
            </CommandEmpty>

            {apps && apps.length > 0 ? (
              <CommandGroup heading={chinese ? "App" : "Apps"}>
                {apps.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.name ?? "Untitled app"} ${storeLabel(item.store)} ${item.country}`}
                    onSelect={() =>
                      go(
                        sectionHref(
                          item.id,
                          equivalentSection(route?.segment ?? ""),
                        ),
                      )
                    }
                  >
                    <AppIcon src={item.iconUrl} name={item.name} size={20} />
                    <span className="truncate">
                      {item.name ?? (chinese ? "未命名 App" : "Untitled app")}
                    </span>
                    <Badge variant="secondary" className="ml-auto">
                      {storeLabel(item.store)}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {appId ? (
              <CommandGroup heading={chinese ? "栏目" : "Sections"}>
                {APP_SECTIONS.map((section) => (
                  <CommandItem
                    key={section.segment || "overview"}
                    value={
                      chinese
                        ? `section ${section.label} ${t(section.label)}`
                        : `section ${section.label}`
                    }
                    onSelect={() => go(sectionHref(appId, section.segment))}
                  >
                    {t(section.label)}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            <CommandGroup heading={chinese ? "常用" : "General"}>
              {general.map((entry) => (
                <CommandItem
                  key={entry.href}
                  value={
                    chinese ? `${entry.label} ${t(entry.label)}` : entry.label
                  }
                  onSelect={() => go(entry.href)}
                >
                  <entry.icon />
                  {t(entry.label)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
