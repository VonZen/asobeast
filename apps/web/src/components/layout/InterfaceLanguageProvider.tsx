"use client";

import { createContext, useContext } from "react";
import type { InterfaceLanguage } from "@/lib/interface-language";

const InterfaceLanguageContext = createContext<InterfaceLanguage>("en");

export function InterfaceLanguageProvider({
  locale,
  children,
}: {
  locale: InterfaceLanguage;
  children: React.ReactNode;
}) {
  return (
    <InterfaceLanguageContext.Provider value={locale}>
      {children}
    </InterfaceLanguageContext.Provider>
  );
}

export function useInterfaceLanguage() {
  return useContext(InterfaceLanguageContext);
}
