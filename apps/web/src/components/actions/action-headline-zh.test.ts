import { describe, expect, it } from "vitest";
import { actionHeadline, localizedActionHeadline } from "./action-headline";
import { actionItem } from "./action-test-item";
import { chineseEvidenceSummary } from "./evidence-summary-zh";

describe("Chinese action headlines", () => {
  it("keeps a keyword exactly as entered when evidence is unavailable", () => {
    const item = actionItem({ scope: { keywordText: "ASO & Habit Tracker" } });
    expect(localizedActionHeadline(item, "zh-CN")).toContain(
      "ASO & Habit Tracker",
    );
    expect(localizedActionHeadline(item, "zh-CN")).toContain("关键词");
    expect(actionHeadline(item)).toContain("Add a high-opportunity keyword");
  });

  it("explains rank evidence without changing the tracked phrase", () => {
    const item = actionItem({
      rule: "keyword.prune",
      degraded: false,
      evidence: {
        rule: "keyword.prune",
        observedDays: 40,
        checkedDays: 40,
        rankedDays: 2,
        bestPosition: 10,
        volume: 4,
        traffic: null,
        relevance: 20,
        dailyRequestsSaved: 1,
      },
      scope: { keywordText: "focus timer" },
    });
    expect(localizedActionHeadline(item, "zh-CN")).toBe(
      "移除 “focus timer”：在 40 天的检查中有 2 天获得排名",
    );
    expect(chineseEvidenceSummary(item.evidence!)).toContain(
      "40 次检查中有 2 次获得排名",
    );
  });
});
