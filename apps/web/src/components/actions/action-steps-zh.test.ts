import { describe, expect, it } from "vitest";
import { actionItem } from "./action-test-item";
import { chineseActionSteps } from "./action-steps-zh";

describe("Chinese action steps", () => {
  it("keeps the tracked keyword and the effect of pausing it", () => {
    const item = actionItem({
      rule: "keyword.prune",
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
      scope: { keywordText: "ASO & Habit Tracker" },
    });
    const steps = chineseActionSteps(item);
    expect(steps[0]).toContain("ASO & Habit Tracker");
    expect(steps[1]).toContain("每天节省一次请求");
    expect(steps.at(-1)).toContain("AsoBeast");
  });

  it("retains a rule title when saved evidence is unavailable", () => {
    const steps = chineseActionSteps(actionItem({ rule: "keyword.prune", evidence: null }));
    expect(steps).toEqual(["建议移除的关键词", "当此建议不再触发时，AsoBeast 会确认问题已解决。"]);
  });
});
