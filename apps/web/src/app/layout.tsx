import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import "@fontsource-variable/ibm-plex-sans/wght.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { CheckoutReturn } from "@/components/billing/CheckoutReturn";
import { STREAMING_SEGMENT_GUARD } from "@/lib/streaming-segment-guard";
import { PRODUCT_NAME } from "@/lib/brand";
import { getInterfaceLanguage } from "@/lib/interface-language-server";
import { InterfaceLanguageProvider } from "@/components/layout/InterfaceLanguageProvider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  applicationName: PRODUCT_NAME,
  title: {
    default: PRODUCT_NAME,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description: "Open source App Store Optimization toolkit",
  appleWebApp: {
    capable: true,
    title: PRODUCT_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getInterfaceLanguage();
  return (
    <html lang={locale} suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: STREAMING_SEGMENT_GUARD }} />
      </head>
      <body className="min-h-full font-sans">
        <a
          href="#main-content"
          className="sr-only rounded-md bg-background px-4 py-2 text-sm font-medium focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none print:hidden"
        >
          {locale === "zh-CN" ? "跳至主要内容" : "Skip to content"}
        </a>
        <InterfaceLanguageProvider locale={locale}>
          <Providers>
            <CheckoutReturn />
            {children}
            <Toaster />
          </Providers>
        </InterfaceLanguageProvider>
      </body>
    </html>
  );
}
