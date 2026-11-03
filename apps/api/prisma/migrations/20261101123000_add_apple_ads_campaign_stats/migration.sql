CREATE TABLE "AppleAdsKeywordStat" (
  "workspaceId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "keywordId" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "impressions" INTEGER NOT NULL,
  "taps" INTEGER NOT NULL,
  "installs" INTEGER NOT NULL,
  "spend" DECIMAL(18,4) NOT NULL,
  "rangeStart" DATE NOT NULL,
  "rangeEnd" DATE NOT NULL,
  "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppleAdsKeywordStat_pkey" PRIMARY KEY ("appId", "campaignId", "keywordId", "country")
);
CREATE INDEX "AppleAdsKeywordStat_workspaceId_country_idx" ON "AppleAdsKeywordStat"("workspaceId", "country");
ALTER TABLE "AppleAdsKeywordStat" ADD CONSTRAINT "AppleAdsKeywordStat_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppleAdsKeywordStat" ADD CONSTRAINT "AppleAdsKeywordStat_appId_workspaceId_fkey" FOREIGN KEY ("appId","workspaceId") REFERENCES "App"("id","workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
GRANT SELECT, INSERT, UPDATE, DELETE ON "AppleAdsKeywordStat" TO asobeast_app;
ALTER TABLE "AppleAdsKeywordStat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppleAdsKeywordStat" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "AppleAdsKeywordStat"
  USING (app_tenancy_bypassed() OR "workspaceId" = app_current_workspace());
