"use client";

import { LocalizedText } from "@/components/layout/LocalizedText";

import type { ComponentProps } from "react";
import { ListFilter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { KeywordFacets } from "./KeywordFacets";

export function KeywordFiltersSheet({
  active,
  ...facets
}: ComponentProps<typeof KeywordFacets> & { active: number }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <ListFilter aria-hidden />
          Filters
          {active > 0 ? (
            <Badge variant="secondary" className="numeric font-mono">
              {active}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80svh]">
        <SheetHeader>
          <SheetTitle>
            <LocalizedText en="Filters" />
          </SheetTitle>
          <SheetDescription>
            <LocalizedText en="Narrow the keywords by source, bucket, status, grade and position." />
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col items-start gap-2">
          <KeywordFacets {...facets} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
