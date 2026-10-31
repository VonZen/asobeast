import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InterfaceLanguageProvider } from "@/components/layout/InterfaceLanguageProvider";
import { DeleteChannelDialog } from "./DeleteChannelDialog";

describe("delete alert channel", () => {
  it.each([
    ["en", "Delete example@example.com"],
    ["zh-CN", "删除 example@example.com"],
  ] as const)("keeps a stable focus target in %s", (locale, label) => {
    const markup = renderToStaticMarkup(
      <InterfaceLanguageProvider locale={locale}>
        <DeleteChannelDialog
          label="example@example.com"
          title="Delete?"
          description="Delete the channel"
          pending={false}
          onDelete={async () => undefined}
        />
      </InterfaceLanguageProvider>,
    );
    expect(markup).toContain(`aria-label="${label}"`);
    expect(markup).toContain('data-alert-delete="true"');
  });
});
