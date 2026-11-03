import { apiFetch } from "./client";

export function assessKeywordRelevance(
  appId: string,
  keywordIds: string[],
): Promise<{ scores: { keywordId: string; relevance: number }[] }> {
  return apiFetch(`/apps/${appId}/keywords/relevance-ai`, {
    method: "POST",
    body: JSON.stringify({ keywordIds }),
  });
}
