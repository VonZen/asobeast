"use client";

import * as React from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { componentCopy } from "@/lib/component-copy";

import { cn } from "@/lib/utils";

function Textarea({
  className,
  placeholder,
  title,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<"textarea">) {
  const language = useInterfaceLanguage();
  return (
    <textarea
      placeholder={
        typeof placeholder === "string"
          ? componentCopy(language, placeholder)
          : placeholder
      }
      title={typeof title === "string" ? componentCopy(language, title) : title}
      aria-label={
        typeof ariaLabel === "string"
          ? componentCopy(language, ariaLabel)
          : ariaLabel
      }
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
