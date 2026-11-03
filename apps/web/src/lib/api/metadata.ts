import type {
  MetadataAssistantRequest,
  MetadataAssistantResult,
  MetadataAssistantStatus,
  MetadataAuditResult,
} from "@asobeast/shared";
import { apiFetch, marketParams, withQuery } from "./client";

export interface MetadataPublishSetting {
  enabled: boolean;
  access: "unknown" | "allowed" | "forbidden";
}
export interface MetadataPublishPreview {
  baselineHash: string;
  current: Record<string, string>;
  diff: Record<string, string>;
}
export function getMetadataPublishSetting(
  appId: string,
): Promise<MetadataPublishSetting> {
  return apiFetch(`/apps/${appId}/metadata/publish-setting`);
}
export function setMetadataPublishSetting(
  appId: string,
  enabled: boolean,
): Promise<MetadataPublishSetting> {
  return apiFetch(`/apps/${appId}/metadata/publish-setting`, {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
}
export function previewMetadataPublish(
  appId: string,
  locale: string,
  fields: Record<string, string>,
): Promise<MetadataPublishPreview> {
  return apiFetch(`/apps/${appId}/metadata/publish-preview`, {
    method: "POST",
    body: JSON.stringify({ locale, fields }),
  });
}
export function applyMetadataPublish(
  appId: string,
  locale: string,
  baselineHash: string,
  confirmedFields: Record<string, string>,
): Promise<{ status: string; current: Record<string, string> }> {
  return apiFetch(`/apps/${appId}/metadata/publish-apply`, {
    method: "POST",
    body: JSON.stringify({ locale, baselineHash, confirmedFields }),
  });
}

export function getOnlineKeywordFields(
  appId: string,
): Promise<{ connected: boolean; items: Record<string, string> }> {
  return apiFetch(`/apps/${appId}/metadata/online-keywords`);
}

export function getMetadataAudit(
  appId: string,
  country?: string,
  localization?: string,
): Promise<MetadataAuditResult> {
  return apiFetch<MetadataAuditResult>(
    withQuery(
      `/apps/${appId}/metadata/audit`,
      marketParams(country, localization),
    ),
  );
}

export function getMetadataAssistantStatus(): Promise<MetadataAssistantStatus> {
  return apiFetch<MetadataAssistantStatus>("/metadata/assistant");
}

export function generateMetadataDrafts(
  appId: string,
  body: MetadataAssistantRequest,
): Promise<MetadataAssistantResult> {
  return apiFetch<MetadataAssistantResult>(
    `/apps/${appId}/metadata/assistant`,
    { method: "POST", body: JSON.stringify(body) },
  );
}
