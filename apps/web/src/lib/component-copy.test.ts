import { describe, expect, it } from "vitest";
import { componentCopy, componentFilterCopy } from "./component-copy";
import { toastMessageCopy } from "./localized-toast";

describe("component UI translations", () => {
  it("translates a fixed UI label in simplified Chinese", () => {
    expect(componentCopy("zh-CN", "Import keywords from CSV")).toBe(
      "从 CSV 导入关键词",
    );
    expect(componentCopy("zh-CN", "Filters")).toBe("筛选");
  });

  it("preserves the original text in English", () => {
    expect(componentCopy("en", "Import keywords from CSV")).toBe(
      "Import keywords from CSV",
    );
  });

  it("does not translate unknown ASO keywords, user input, or listing metadata", () => {
    expect(componentCopy("zh-CN", "sleep tracker for focus")).toBe(
      "sleep tracker for focus",
    );
    expect(componentCopy("zh-CN", "My Radio Station")).toBe("My Radio Station");
  });

  it("translates only known filter prefixes, preserving the actual keyword", () => {
    expect(componentFilterCopy("zh-CN", "Search: sleep music")).toBe(
      "搜索：sleep music",
    );
    expect(componentFilterCopy("en", "Search: sleep music")).toBe(
      "Search: sleep music",
    );
  });

  it("translates fixed and dynamic notification templates without changing data", () => {
    expect(toastMessageCopy("zh-CN", "App Store Connect connected")).toBe(
      "已连接 App Store Connect",
    );
    expect(toastMessageCopy("zh-CN", "Now tracking Focus Radio")).toBe(
      "已开始跟踪 Focus Radio",
    );
    expect(toastMessageCopy("en", "Now tracking Focus Radio")).toBe(
      "Now tracking Focus Radio",
    );
  });
});
