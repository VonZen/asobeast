import type { ActionEvidence } from "@asobeast/shared";
import { formatMeasure } from "@/lib/format";

const number = (value: number | null) =>
  value === null ? "—" : formatMeasure(value);
const percent = (value: number | null) =>
  value === null ? "—" : `${(value * 100).toFixed(1)}%`;

export function chineseEvidenceSummary(evidence: ActionEvidence): string {
  switch (evidence.rule) {
    case "keyword.add_uncovered":
      return `机会分数为 ${number(evidence.opportunity)}，搜索量为 ${number(evidence.volume)}，没有已索引字段包含此关键词。`;
    case "keyword.defend":
      return `${number(evidence.entrants.length)} 个新 App 进入前 10，其中 ${number(evidence.entrantsAtOrAbove)} 个排名与你持平或高于你。`;
    case "keyword.prune":
      return `在 ${number(evidence.checkedDays)} 次检查中有 ${number(evidence.rankedDays)} 次获得排名，每天消耗 ${number(evidence.dailyRequestsSaved)} 次请求。`;
    case "rank.investigate_drop":
      return `你在 ${evidence.changedAt} 更改了 ${evidence.fields.join("、")}，随后 ${number(evidence.droppedKeywords.length)} 个跟踪关键词的排名下降。`;
    case "serp.hold_volatile":
      return `这些搜索结果的波动为 ${number(evidence.volatility)}/100，今天的变化并不可靠。`;
    case "audit.fix_factor":
      return `在 ${evidence.auditDate} 的诊断中，${evidence.factorLabel} 得分 ${number(evidence.score)}/10，权重为 ${number(evidence.weight)}。`;
    case "reviews.investigate_theme":
      return `“${evidence.theme}”出现在${evidence.version ?? "最新版本"}的 ${number(evidence.mentions)} 条负面评论中，之前为 ${number(evidence.previousMentions)} 条。`;
    case "market.improve_country":
      return `${evidence.country.toUpperCase()} 市场的可见度比 ${evidence.homeCountry.toUpperCase()} 低 ${number(evidence.gap)} 点，建议调查该市场。`;
    case "keyword.push_to_top10":
      return `当前排名第 ${evidence.latestPosition}，搜索量为 ${number(evidence.volume)}；在 ${number(evidence.windowDays)} 天中有 ${number(evidence.daysInBand)} 天排在 11 至 20 名，但只有权重较弱的字段包含该关键词。`;
    case "rank.investigate_unexplained_drop":
      return `${evidence.country.toUpperCase()} 市场可见度从 ${number(evidence.visibilityBefore)} 降至 ${number(evidence.visibilityAfter)}，${evidence.droppedKeywords.length} 个关键词排名下降，且没有发现可解释这一变化的自身修改。`;
    case "competitor.investigate_overtake":
      return `${evidence.competitorName ?? "某个竞品"}于 ${evidence.changedAt} 修改了商店页面，并在此后一直在 ${evidence.keywords.length} 个关键词上领先。`;
    case "reviews.investigate_rating_decline":
      return `最近 ${evidence.recentDays} 天的评论平均评分为 ${number(evidence.recentAverage)}，之前为 ${number(evidence.baselineAverage)}；没有单一的投诉主题可以解释这一变化。`;
    case "reviews.reply_negative":
      return `最近 ${evidence.windowDays} 天检查的 ${number(evidence.checked)} 条低分评论中，有 ${number(evidence.unanswered)} 条尚未回复。`;
    case "listing.ship_update":
      return `商店显示上次更新是在 ${number(evidence.daysSinceUpdate)} 天前${evidence.competitorMedianDays === null ? "" : `，竞品更新间隔中位数为 ${number(evidence.competitorMedianDays)} 天`}。`;
    case "conversion.investigate_drop":
      return `最近 ${evidence.windowDays} 个完整日内，日均获取点击数从 ${number(evidence.getsBefore)} 降至 ${number(evidence.getsAfter)}，而产品页面浏览量从 ${number(evidence.pageViewsBefore)} 到 ${number(evidence.pageViewsAfter)}，基本保持稳定。`;
    case "listing.cpp_underperforms":
      return `在最近 ${evidence.windowDays} 个完整日内，“${evidence.pageTitle}”将 ${percent(evidence.pageConversion)} 的产品页面浏览转化为获取点击，默认产品页面为 ${percent(evidence.defaultConversion)}。`;
    case "metadata.fix_lint":
      return `${evidence.field} 有 ${evidence.issues.length} 项商店规则问题，当前长度为 ${number(evidence.chars)} / ${number(evidence.limit)} 个字符。`;
    default: {
      const unreachable: never = evidence;
      return unreachable;
    }
  }
}
