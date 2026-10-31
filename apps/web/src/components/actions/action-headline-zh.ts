import type { ActionItem, ActionRule, ChangeField } from "@asobeast/shared";
import { formatCountry, formatMeasure } from "@/lib/format";

export const CHINESE_RULE_TITLES: Record<ActionRule, string> = {
  "keyword.add_uncovered": "将高机会关键词加入元数据",
  "keyword.defend": "守住有新竞品进入的关键词",
  "keyword.prune": "移除始终没有排名的关键词",
  "rank.investigate_drop": "调查元数据变更后的排名下降",
  "serp.hold_volatile": "暂缓修改：搜索结果波动异常",
  "audit.fix_factor": "改进表现较弱的诊断项目",
  "reviews.investigate_theme": "调查新的负面评论主题",
  "market.improve_country": "调查表现较弱的市场",
  "keyword.push_to_top10": "推动接近前 10 名的关键词进入前 10",
  "metadata.fix_lint": "修正违反商店规则的文案",
  "rank.investigate_unexplained_drop": "调查自身未作变更时的排名下降",
  "competitor.investigate_overtake": "应对排名领先的竞品",
  "reviews.investigate_rating_decline": "调查评论评分下降",
  "reviews.reply_negative": "回复尚未处理的低分评论",
  "listing.ship_update": "更新长期未更新的商店页面",
  "conversion.investigate_drop": "调查页面浏览量稳定时获取点击减少的原因",
  "listing.cpp_underperforms": "改进转化低于默认页面的自定产品页面",
};

const FIELDS: Record<ChangeField, string> = {
  title: "标题",
  subtitle: "副标题",
  summary: "简短说明",
  description: "描述",
  version: "版本",
  price: "价格",
  screenshots: "截图",
  screenshotImages: "截图图片",
  screenshotCaptions: "截图文案",
  icon: "图标",
  whatsNew: "更新说明",
};

const countryNames = new Intl.DisplayNames(["zh-CN"], { type: "region" });
const country = (code: string) =>
  /^[a-z]{2}$/i.test(code)
    ? (countryNames.of(code.toUpperCase()) ?? formatCountry(code))
    : formatCountry(code);
const fields = (values: readonly ChangeField[]) =>
  values.map((value) => FIELDS[value]).join("、");
const number = (value: number) => formatMeasure(Math.round(value * 10) / 10);

export function chineseActionHeadline(item: ActionItem): string {
  const { evidence } = item;
  const keyword = item.scope.keywordText;
  if (!evidence)
    return keyword
      ? `${CHINESE_RULE_TITLES[item.rule]}： “${keyword}”`
      : CHINESE_RULE_TITLES[item.rule];
  if (
    !keyword &&
    [
      "keyword.add_uncovered",
      "keyword.defend",
      "keyword.prune",
      "serp.hold_volatile",
      "keyword.push_to_top10",
    ].includes(evidence.rule)
  )
    return CHINESE_RULE_TITLES[evidence.rule];
  const subject = `“${keyword ?? ""}”`;
  switch (evidence.rule) {
    case "keyword.add_uncovered":
      return `将 ${subject} 加入元数据`;
    case "keyword.defend":
      return evidence.entrants.length
        ? `守住 ${subject}：${evidence.entrants.length} 个新 App 进入前 10`
        : `守住 ${subject} 的前 10 名排名`;
    case "keyword.prune":
      return `移除 ${subject}：在 ${evidence.checkedDays} 天的检查中有 ${evidence.rankedDays} 天获得排名`;
    case "rank.investigate_drop":
      return evidence.visibilityDelta
        ? `调查${fields(evidence.fields)}变更后可见度下降 ${number(Math.abs(evidence.visibilityDelta))} 点的原因`
        : `调查${fields(evidence.fields)}变更后 ${evidence.droppedKeywords.length} 个关键词排名下降的原因`;
    case "serp.hold_volatile":
      return `${subject} 的搜索结果波动较大，暂缓修改`;
    case "audit.fix_factor":
      return `提高 ${evidence.factorLabel} 的得分（目前 ${number(evidence.score)} / 10）`;
    case "reviews.investigate_theme":
      return `调查${evidence.version ?? "最新版本"}评论中提到的“${evidence.theme}”`;
    case "market.improve_country":
      return `缩小${country(evidence.country)}市场 ${number(evidence.gap)} 点的可见度差距`;
    case "keyword.push_to_top10":
      return `将 ${subject} 从第 ${evidence.latestPosition} 名推进至前 10`;
    case "rank.investigate_unexplained_drop":
      return evidence.visibilityDelta < 1 && evidence.droppedKeywords.length
        ? `调查${country(evidence.country)}市场 ${evidence.droppedKeywords.length} 个关键词排名下降的原因`
        : `调查${country(evidence.country)}市场可见度下降 ${number(evidence.visibilityDelta)} 点的原因`;
    case "competitor.investigate_overtake":
      return `${evidence.competitorName ?? "某个竞品"}更改了${fields(evidence.fields)}，并在 ${evidence.keywords.length} 个关键词上超过你`;
    case "reviews.investigate_rating_decline":
      return `过去 ${evidence.recentDays} 天的评论评分从 ${number(evidence.baselineAverage)} 降至 ${number(evidence.recentAverage)}`;
    case "reviews.reply_negative":
      return `回复 ${evidence.unanswered} 条尚未处理的低分评论`;
    case "listing.ship_update":
      return `发布更新：商店页面已有 ${formatMeasure(evidence.daysSinceUpdate)} 天未更新`;
    case "conversion.investigate_drop":
      return `调查 ${evidence.country.toUpperCase()} 市场页面浏览量稳定但获取点击减少的原因`;
    case "listing.cpp_underperforms":
      return `“${evidence.pageTitle}”的转化率低于默认产品页面`;
    case "metadata.fix_lint":
      return `修正 ${evidence.issues.length} 项商店规则问题（${evidence.field}）`;
    default: {
      const unreachable: never = evidence;
      return unreachable;
    }
  }
}
