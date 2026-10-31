import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";

export function FilteredEmpty({
  title,
  body = "Change or clear the filters to see the rows again.",
  onClear,
}: {
  title: string;
  body?: string;
  onClear: () => void;
}) {
  const locale = useInterfaceLanguage();
  return (
    <EmptyState
      icon={SearchX}
      title={interfaceCopy(locale, title)}
      body={interfaceCopy(locale, body)}
      className="border-0"
      action={
        <Button variant="outline" size="sm" onClick={onClear}>
          {interfaceCopy(locale, "Clear filters")}
        </Button>
      }
    />
  );
}
