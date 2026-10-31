import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InterfaceLanguageProvider } from "@/components/layout/InterfaceLanguageProvider";
import { APP_1_COMPETITORS } from "../../../e2e/fixtures.mts";
import { CompetitorList } from "./CompetitorList";

describe("competitor removal", () => {
  it.each(["en", "zh-CN"] as const)(
    "keeps a language-independent focus target in %s",
    (locale) => {
      const markup = renderToStaticMarkup(
        <QueryClientProvider client={new QueryClient()}>
          <InterfaceLanguageProvider locale={locale}>
            <CompetitorList
              id="app-1"
              competitors={[
                APP_1_COMPETITORS[0],
                { ...APP_1_COMPETITORS[0], id: "another" },
              ]}
            />
          </InterfaceLanguageProvider>
        </QueryClientProvider>,
      );
      expect(markup.match(/data-competitor-remove="true"/g)).toHaveLength(2);
    },
  );
});
