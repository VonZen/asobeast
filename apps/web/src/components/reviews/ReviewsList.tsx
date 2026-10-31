"use client";

import { Suspense, startTransition, useDeferredValue, useState } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { storefrontLanguage } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber } from "@/lib/format";
import { appDetailOptions, reviewsOptions } from "@/lib/queries";
import {
  reviewQueryParser,
  reviewReplyParser,
  reviewReplyStateParser,
  reviewScoreParser,
  reviewSinceParser,
  reviewSortParser,
  reviewVersionParser,
} from "@/lib/search-params";
import { ReplyComposer } from "./ReplyComposer";
import { ReviewCard } from "./ReviewCard";
import { ReviewCountsStrip } from "./ReviewCountsStrip";
import { ReviewThemesStrip } from "./ReviewThemesStrip";
import { ReviewsToolbar } from "./ReviewsToolbar";
import {
  narrowsReviews,
  REVIEWS_SHOW_ALL_LIMIT,
  reviewFilters,
  type ReviewView,
} from "./review-filters";
import { matchesReviewQuery, quotedPhrase } from "./review-search";
import { reviewActionLabel, reviewTwins } from "./review-subject";
import { ReviewCountsSkeleton, ReviewsListSkeleton } from "./skeletons";

function ShowAll({
  shown,
  total,
  searching,
  expanded,
  onShowAll,
}: {
  shown: number;
  total: number;
  searching: boolean;
  expanded: boolean;
  onShowAll: () => void;
}) {
  const language = useInterfaceLanguage();
  if (total <= shown) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <p className="text-caption text-muted-foreground">
        {language === "zh-CN"
          ? searching
            ? `搜索范围为已加载的 ${formatNumber(shown)} 条评论，共 ${formatNumber(total)} 条`
            : `显示 ${formatNumber(shown)} 条，共 ${formatNumber(total)} 条`
          : searching
            ? `Search covers the ${formatNumber(shown)} loaded of ${formatNumber(total)} reviews`
            : `Showing ${formatNumber(shown)} of ${formatNumber(total)}`}
      </p>
      {expanded ? (
        <p className="text-caption text-muted-foreground">
          {language === "zh-CN"
            ? `此页面最多显示 ${REVIEWS_SHOW_ALL_LIMIT} 条评论；请缩小筛选范围以查看其他评论。`
            : `The page shows at most ${REVIEWS_SHOW_ALL_LIMIT} reviews; narrow the filters to reach the others.`}
        </p>
      ) : (
        <Button variant="outline" size="sm" onClick={onShowAll}>
          {language === "zh-CN" ? "显示全部" : "Show all"}
        </Button>
      )}
    </div>
  );
}

function ReviewCards({
  id,
  view,
  query,
  reply,
  onReply,
  onClearFilters,
  onResetSearch,
}: {
  id: string;
  view: ReviewView;
  query: string;
  reply: string | null;
  onReply: (reviewId: string | null) => void;
  onClearFilters: () => void;
  onResetSearch: () => void;
}) {
  const language = useInterfaceLanguage();
  const { data: app } = useSuspenseQuery(appDetailOptions(id));
  const viewKey = JSON.stringify(view);
  const [expandedView, setExpandedView] = useState<string | null>(null);
  const [closed, setClosed] = useState<string | null>(null);
  const searching = useDeferredValue(query.trim() !== "");
  const expanded = expandedView === viewKey || searching;
  const { data } = useSuspenseQuery(
    reviewsOptions(
      id,
      reviewFilters(view, expanded ? REVIEWS_SHOW_ALL_LIMIT : undefined),
    ),
  );

  const narrowed = narrowsReviews(view);
  const filtered = narrowed || view.replyState !== null;
  const queueCleared = view.replyState === "needs_reply" && !narrowed;

  if (data.total === 0) {
    return filtered ? (
      <EmptyState
        title={
          queueCleared
            ? language === "zh-CN"
              ? "没有需要回复的评论"
              : "Nothing needs a reply"
            : language === "zh-CN"
              ? "没有符合筛选条件的评论"
              : "No reviews match these filters"
        }
        body={
          queueCleared
            ? language === "zh-CN"
              ? "所有已保存的评论都有回复或草稿。"
              : "Every stored review has a reply or a saved draft."
            : language === "zh-CN"
              ? "没有评论符合所选评分、版本、时间和回复状态。"
              : "Nothing stored matches the selected rating, version, period and reply state."
        }
        action={
          <Button variant="outline" onClick={onClearFilters}>
            {language === "zh-CN"
              ? queueCleared
                ? "显示所有评论"
                : "清除筛选"
              : queueCleared
                ? "Show all reviews"
                : "Clear filters"}
          </Button>
        }
      />
    ) : (
      <EmptyState
        title={
          language === "zh-CN" ? "尚无已保存的评论" : "No reviews stored yet"
        }
        body={
          language === "zh-CN"
            ? "下次每日同步后将显示评论。"
            : "Reviews appear after the next daily sync."
        }
      />
    );
  }

  const shown = data.reviews.filter((review) =>
    matchesReviewQuery(review, query),
  );
  const twins = reviewTwins(shown);

  return (
    <div className="flex flex-col">
      {shown.length === 0 ? (
        <EmptyState
          title={
            language === "zh-CN"
              ? "没有符合搜索条件的评论"
              : "No reviews match this search"
          }
          body={
            quotedPhrase(query) === null
              ? language === "zh-CN"
                ? "搜索已加载评论的标题、正文、作者和回复。"
                : "Search looks through the titles, texts, authors and replies of the reviews loaded here."
              : language === "zh-CN"
                ? "带引号的搜索会匹配已加载评论标题和正文中的完整词语。"
                : "A search in quotes matches whole words in the titles and texts of the reviews loaded here."
          }
          action={
            <Button variant="outline" onClick={onResetSearch}>
              {language === "zh-CN" ? "重置搜索" : "Reset search"}
            </Button>
          }
        />
      ) : (
        <div className="divide-y">
          {shown.map((review) => {
            const twin = twins.get(review.id);
            return (
              <ReviewCard
                key={review.id}
                appId={id}
                store={app.store}
                fallbackLanguage={storefrontLanguage(app.country)}
                review={review}
                twin={twin}
                actions={
                  reply === review.id ? null : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      autoFocus={closed === review.id}
                      aria-label={reviewActionLabel(
                        review.reply?.text ? "Edit reply to" : "Reply to",
                        review,
                        twin,
                      )}
                      onClick={() => {
                        setClosed(null);
                        onReply(review.id);
                      }}
                    >
                      {language === "zh-CN"
                        ? review.reply?.text
                          ? "编辑回复"
                          : "回复"
                        : review.reply?.text
                          ? "Edit reply"
                          : "Reply"}
                    </Button>
                  )
                }
              >
                {reply === review.id ? (
                  <ReplyComposer
                    appId={id}
                    review={review}
                    store={app.store}
                    storeAppId={app.storeAppId}
                    onClose={() => {
                      setClosed(review.id);
                      onReply(null);
                    }}
                  />
                ) : null}
              </ReviewCard>
            );
          })}
        </div>
      )}
      <ShowAll
        shown={data.reviews.length}
        total={data.total}
        searching={query.trim() !== ""}
        expanded={expanded}
        onShowAll={() => startTransition(() => setExpandedView(viewKey))}
      />
    </div>
  );
}

export function ReviewsList({ id }: { id: string }) {
  const language = useInterfaceLanguage();
  const [score, setScore] = useQueryState("score", reviewScoreParser);
  const [version, setVersion] = useQueryState("version", reviewVersionParser);
  const [since, setSince] = useQueryState("since", reviewSinceParser);
  const [replyState, setReplyState] = useQueryState(
    "replyState",
    reviewReplyStateParser,
  );
  const [sort, setSort] = useQueryState("sort", reviewSortParser);
  const [query, setQuery] = useQueryState("q", reviewQueryParser);
  const [reply, setReply] = useQueryState("reply", reviewReplyParser);
  const view: ReviewView = { score, version, since, replyState, sort };

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          {language === "zh-CN" ? "评论" : "Reviews"}
        </CardDescription>
        <CardTitle>
          {language === "zh-CN" ? "用户评论" : "User reviews"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Suspense fallback={<ReviewCountsSkeleton />}>
          <ReviewCountsStrip
            id={id}
            view={view}
            onSelect={(next) => {
              void setReplyState(next);
              if (next === "needs_reply") void setSort("lowest");
            }}
          />
        </Suspense>
        <ReviewsToolbar
          id={id}
          view={view}
          query={query}
          onScore={(next) => void setScore(next)}
          onVersion={(next) => void setVersion(next || null)}
          onSince={(next) => void setSince(next)}
          onReplyState={(next) => void setReplyState(next)}
          onSort={(next) => void setSort(next === "newest" ? null : next)}
          onQuery={(next, options) => void setQuery(next || null, options)}
        />
        <ReviewThemesStrip
          id={id}
          view={view}
          query={query}
          onSelect={(next) => void setQuery(next || null)}
        />
        <Suspense fallback={<ReviewsListSkeleton />}>
          <ReviewCards
            id={id}
            view={view}
            query={query}
            reply={reply}
            onReply={(next) => void setReply(next)}
            onClearFilters={() => {
              void setScore(null);
              void setVersion(null);
              void setSince(null);
              void setReplyState(null);
              void setSort(null);
              void setQuery(null);
              void setReply(null);
            }}
            onResetSearch={() => {
              void setQuery(null);
              void setReply(null);
            }}
          />
        </Suspense>
      </CardContent>
    </Card>
  );
}
