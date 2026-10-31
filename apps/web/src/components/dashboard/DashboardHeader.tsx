import type { ReactNode } from "react";
import { ImportAppDialog } from "@/components/apps/ImportAppDialog";
import { Button } from "@/components/ui/button";
import { getInterfaceLanguage } from "@/lib/interface-language-server";
import { interfaceCopy } from "@/lib/interface-copy";

export async function DashboardHeader({ children }: { children?: ReactNode }) {
  const { locale } = await getInterfaceLanguage();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-display tracking-tight text-balance">
          {interfaceCopy(locale, "Dashboard")}
        </h1>
        <ImportAppDialog>
          <Button>{interfaceCopy(locale, "Import app")}</Button>
        </ImportAppDialog>
      </div>
      {children}
    </div>
  );
}
