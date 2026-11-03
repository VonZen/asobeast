ALTER TABLE "StoreConnection" ADD COLUMN "metadataPublishEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoreConnection" ADD COLUMN "metadataPublishAccess" TEXT NOT NULL DEFAULT 'unknown';

CREATE TABLE "MetadataPublishDraft" (
  "appId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "fields" JSONB NOT NULL,
  "baselineHash" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MetadataPublishDraft_pkey" PRIMARY KEY ("appId","locale")
);
CREATE INDEX "MetadataPublishDraft_workspaceId_idx" ON "MetadataPublishDraft"("workspaceId");
ALTER TABLE "MetadataPublishDraft" ADD CONSTRAINT "MetadataPublishDraft_appId_workspaceId_fkey" FOREIGN KEY ("appId","workspaceId") REFERENCES "App"("id","workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MetadataPublishDraft" ADD CONSTRAINT "MetadataPublishDraft_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MetadataPublishRecord" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "fields" JSONB NOT NULL,
  "beforeHash" TEXT NOT NULL,
  "afterHash" TEXT,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MetadataPublishRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MetadataPublishRecord_workspaceId_createdAt_idx" ON "MetadataPublishRecord"("workspaceId","createdAt");
CREATE INDEX "MetadataPublishRecord_appId_locale_createdAt_idx" ON "MetadataPublishRecord"("appId","locale","createdAt");
ALTER TABLE "MetadataPublishRecord" ADD CONSTRAINT "MetadataPublishRecord_appId_workspaceId_fkey" FOREIGN KEY ("appId","workspaceId") REFERENCES "App"("id","workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MetadataPublishRecord" ADD CONSTRAINT "MetadataPublishRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

GRANT SELECT, INSERT, UPDATE, DELETE ON "MetadataPublishDraft", "MetadataPublishRecord" TO asobeast_app;
ALTER TABLE "MetadataPublishDraft" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MetadataPublishDraft" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "MetadataPublishDraft" USING (app_tenancy_bypassed() OR "workspaceId" = app_current_workspace());
ALTER TABLE "MetadataPublishRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MetadataPublishRecord" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "MetadataPublishRecord" USING (app_tenancy_bypassed() OR "workspaceId" = app_current_workspace());
