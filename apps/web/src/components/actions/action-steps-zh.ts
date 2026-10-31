import type { ActionEvidence, ActionItem, ActionRule, ChangeField } from "@asobeast/shared";
import { formatDate, localizedCountry } from "@/lib/format";
import { interfaceCopy } from "@/lib/interface-copy";
import { ACTION_RULE_LABEL } from "./action-copy";

const FIELD_NAMES: Record<ChangeField, string> = {
  title: "标题", subtitle: "副标题", summary: "简短描述", description: "描述", version: "版本", price: "价格", screenshots: "截图", screenshotImages: "截图图片", screenshotCaptions: "截图文字", icon: "图标", whatsNew: "更新说明",
};

const CONFIRMATION: Partial<Record<ActionRule, string>> = {
  "keyword.push_to_top10": "当关键词进入前十或不再符合此规则时，AsoBeast 会确认问题已解决。",
  "listing.ship_update": "商店显示新版本后，AsoBeast 会确认问题已解决。",
  "conversion.investigate_drop": "Get 点击次数相对页面浏览量恢复后，AsoBeast 会确认问题已解决。",
  "listing.cpp_underperforms": "该页面的转化率达到默认产品页的五分之四后，AsoBeast 会确认问题已解决。",
};

function steps(evidence: ActionEvidence, item: ActionItem, keyword: string): string[] {
  const { store, country } = item.scope;
  const apple = store === "APP_STORE";
  switch (evidence.rule) {
    case "keyword.add_uncovered":
      return apple ? ["打开元数据工作台", `将 ${keyword} 放入副标题或关键词字段${evidence.keywordFieldCharsFree !== null && evidence.keywordFieldCharsFree > 0 ? `（剩余 ${evidence.keywordFieldCharsFree} 个字符）` : ""}`, "在下次发布版本时提交更改"] : ["打开元数据工作台", `将 ${keyword} 加入标题或简短描述`, "在完整描述中自然使用该关键词", "在 Play Console 发布商品页更改"];
    case "keyword.defend":
      return [`查看哪些 App 在 ${keyword} 的搜索结果中进入前十`, `比较它们与你的${apple ? "标题和副标题" : "标题和简短描述"}`, `如果排名对你很重要，在最有权重的字段中加强 ${keyword}`];
    case "keyword.prune":
      return [`在关键词监控中检查 ${keyword}`, "暂停追踪可每天节省一次请求；如果该词对你重要，也可以继续追踪"];
    case "rank.investigate_drop":
      return [`查看 ${formatDate(evidence.changedAt, "zh-CN")} 前后的商品页变更`, "将排名下降的关键词与修改过的文本进行比较", "如果下降持续，可撤销或调整该变更"];
    case "serp.hold_volatile":
      return [`暂缓为 ${keyword} 修改元数据`, "等搜索结果稳定后再检查"];
    case "audit.fix_factor":
      return [`打开“${evidence.factorLabel}”的审核结果`, ...(evidence.failingChecks.length ? evidence.failingChecks.map((check) => `修复：${check.label}`) : [`按照审核建议改进“${evidence.factorLabel}”`])];
    case "reviews.investigate_theme":
      return [`阅读提到“${evidence.theme}”的低分评论`, `检查 ${evidence.version ?? "最新版本"} 中发生了什么变化`, "如果已有修复计划，在评论页回复用户"];
    case "market.improve_country":
      return [`打开${localizedCountry(country, "zh-CN")}的关键词监控`, "找出在主市场有排名、在此市场没有排名的关键词", "考虑为此商店市场本地化商品页"];
    case "keyword.push_to_top10":
      return apple ? [`将 ${keyword} 移到副标题或标题`, "保持词语连续且顺序不变", "在下次发布版本时提交更改"] : [`将 ${keyword} 加入标题或简短描述`, "保持词语连续且顺序不变", "在 Play Console 发布商品页更改"];
    case "rank.investigate_unexplained_drop":
      return ["在关键词监控中查看排名下降的词", "查看同期的竞品变更和新进入者", "查明原因前，暂缓修改商品页"];
    case "competitor.investigate_overtake":
      return [`将竞品更改后的${evidence.fields.map((field) => FIELD_NAMES[field]).join("、")}与你的商品页进行比较`, "判断竞品现在针对的关键词是否对你重要", "加强对希望保留的关键词的覆盖"];
    case "reviews.investigate_rating_decline":
      return ["阅读最近的低分评论", `检查 ${evidence.latestVersion ?? "最新版本"} 中发生了什么变化`, "如果已有修复计划，在评论页回复用户"];
    case "reviews.reply_negative":
      return ["打开需要回复的评论，优先处理最低分", `起草或撰写每条回复，复制后粘贴到 ${apple ? "App Store Connect" : "Play Console"}`, "将评论标记为已回复；AsoBeast 也会在次日从商店读取回复"];
    case "listing.ship_update":
      return ["计划一次版本发布，即使只是小更新", "在更新说明中写明变更内容"];
    case "conversion.investigate_drop":
      return ["将概览中的商店转化漏斗与同期商品页变更进行比较", "检查用户在产品页看到的截图、图标、评分和价格", "每次只更改一项，并观察一周的转化率"];
    case "listing.cpp_underperforms":
      return [`在 App Store Connect 中打开“${evidence.pageTitle}”`, "让前几张截图与引流关键词或广告所承诺的内容一致", "或者将这些流量引导到默认产品页"];
    case "metadata.fix_lint":
      return [...evidence.issues.map((issue) => issue.message), "保存并发布商品页更改"];
    default: {
      const never: never = evidence;
      return never;
    }
  }
}

export function chineseActionSteps(item: ActionItem): string[] {
  const confirmation = CONFIRMATION[item.rule] ?? "当此建议不再触发时，AsoBeast 会确认问题已解决。";
  if (item.evidence === null) return [interfaceCopy("zh-CN", ACTION_RULE_LABEL[item.rule]), confirmation];
  const keyword = item.scope.keywordText ? `“${item.scope.keywordText}”` : "该关键词";
  return [...steps(item.evidence, item, keyword), confirmation];
}
