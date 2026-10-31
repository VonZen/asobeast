# 把 Workbench 的优势迁入 asobeast:简约计划

给实现 Agent。本文只给范围、顺序、约束和代码入口。具体接口、字段、测试请直接读下面列出的实际代码,不要凭本文猜。

> **执行顺序:严格按 P1 → P2 → P3 → P4,一次只做一个阶段。** 每个阶段做完、测试通过、并由用户验收后,才能开始下一个阶段。不要一口气做完所有阶段。P1 要单独成一个版本。

## 总则

1. **只迁 asobeast 没有的能力**:发布元数据到 App Store Connect、多语言批量、法律页脚、广告活动数据、价值加权的前后对比。asobeast 已有的 Apple 热度、OpenAI 兼容 AI 端点、评论回复、Analytics 漏斗一律不动。
2. **用 TypeScript 按 asobeast 的风格重写,不翻译 Swift 代码。** 两个仓库许可证不同(Workbench 是 MIT + Commons Clause,asobeast 是 AGPL-3.0),Workbench 的代码只当行为参考。
3. **写 Apple 的能力默认关闭**,在设置里由用户显式开启;每次写入都要用户确认,永不提交审核。
4. 每个阶段单独可测、可合并。P1 单独成一个版本。
5. 遇到本文没写清楚的,先读代码,仍不清楚就记到 `OPEN-QUESTIONS.md`,不要自行扩大范围。

## 代码入口

| 内容 | Workbench(行为参考) | asobeast(落点) |
|---|---|---|
| ASC 元数据读写 | `Sources/ASOProviders/AppStoreConnect/ASCMetadataProvider.swift` | `apps/api/src/store-connect/`(`asc-requester.ts`、`asc-reviews-api.ts`、`asc-api.factory.ts`) |
| 发布流程与基线校验 | `Sources/ASOWorkbench/Services/MetadataService.swift`(`apply`) | `apps/api/src/metadata/`、参照 `reviews/review-reply-poster.service.ts` 的守卫写法 |
| 校验、diff、哈希 | `ASOCore/Validation/MetadataValidator.swift`、`MetadataDiff.swift`、`Models/MetadataFields.swift` | 复用 asobeast 现有 lint(`packages/shared/src/aso/`) |
| 批量与 What's New | `Features/Metadata/BatchWriteSheet.swift`、`PublishSheets.swift` | `metadata/metadata-assistant.service.ts`、`web/src/components/metadata/` |
| 法律页脚、默认更新说明 | `ASOCore/Validation/LegalFooter.swift`、`ReleaseNotesDefaults.swift` | `packages/shared/src/aso/` |
| 广告活动数据 | `ASOProviders/AppleAds/AppleAdsCampaignProvider.swift`、`Services/AdsImportService.swift`、`Features/Apps/AdsCard.swift` | `apps/api/src/scoring/apple-popularity.client.ts` 附近、`APPLE_ADS_*` 配置 |
| 价值加权对比 | `Features/Changes/ImpactView.swift`(`Row.value`) | `apps/api/src/changes/change-impact.ts` |
| 确认弹窗模式 | — | `apps/web/src/components/reviews/ReplyConfirmDialog.tsx` |
| 权限状态模式 | — | `StoreConnection.replyAccess`、`store-connection.service.ts` 的 `markReplyAccess` |

## P0:已确认的决定

P0 不再是待办,下面是已经定下来的结论,实现时直接照做。

| # | 问题 | 结论 |
|---|---|---|
| 1 | 写元数据需要的 ASC 角色 | 沿用 Workbench 的说明:**App Manager 角色才能写元数据,Developer 只能读。** 来源是 `Sources/ASOWorkbench/Features/Settings/SettingsView.swift` 第 105 行的连接引导文案。注意这和 asobeast 现有的 Admin 密钥引导不同,Admin 也能写,但引导文案要同时写明"发布元数据需要 App Manager 或 Admin"。首次写入被 Apple 拒绝时,标记发布权限为 `forbidden`,并提示缺这个角色。 |
| 2 | Apple Ads 密钥能否读广告活动报表 | **能**,直接复用现有 `APPLE_ADS_*`,不需要另配一套凭据。 |
| 3 | 开关放哪里 | **在设置里处理。** 不用环境变量,也不依赖令牌范围。设置页加一个"允许向 App Store Connect 发布元数据"的开关,默认关闭;关闭时 metadata 页的 Apply 按钮不可用,并说明去哪里开启。每次发布仍然要逐字段确认。 |
| 4 | 新表的租户隔离怎么写 | **按最合适的方式:** 读 `apps/api/prisma/` 里 `KeywordField`、`AppLocalization` 的迁移和 RLS,新表照它们的写法(带 `workspaceId`、复合主键、RLS 策略)。 |
| 5 | 前端文案怎么登记 | **按实际情况:** 看相邻组件(如 `components/metadata/`、`components/reviews/`)怎么用 `componentCopy` / `LocalizedText`,保持一致。 |

只剩一件事要在实现时自己查:开关存在哪里。asobeast 现有的设置存储(`apps/api/src/config`、web 的 `settings` 组件)里有没有"工作区级"的设置表,按已有的方式加一个字段;没有就在 `StoreConnection` 上加一个布尔列,同时作为这个开关的存储。

## 阶段(P0 已完成,直接进入 P1)

## P1:发布到 ASC(单独成版本)

**目标**:用户在 metadata 页把草稿一键应用到 App Store Connect,逐字段确认,写后回读校验。

**必须保留的行为**(都来自 Workbench,见 `ASCMetadataProvider.swift` 顶部注释和 `MetadataService.apply`):

- 只有 GET 可重试;写入结果未知时先重读,不盲目重试(`AscRequester.send(request, false)` 已支持)。
- 可编辑的 `appInfo` 按状态选,不要用 `limit=1`(线上 App 有两个)。
- 写入前拿线上快照和上次拉取的内容哈希比对,不一致就拒绝并刷新基线。
- 先校验草稿,有错误不写;diff 为空不写。
- 写入后重读,以 Apple 返回的内容为准,与草稿比较,有差异标记为部分成功。
- 永不提交审核,代码里不出现 submission 相关资源。

**要做的**:

- 后端:ASC 元数据读写 API、发布服务、草稿与发布记录两张表(带 `workspaceId` 和 RLS)、`StoreConnection` 增加发布权限状态(仿 `replyAccess`:`unknown` / `allowed` / `forbidden`,首次被拒时提示缺 App Manager 或 Admin 角色),以及设置里的"允许发布"开关(默认关闭,存储方式见上面 P0 第 3 项的说明)。
- 前端:metadata 页草稿旁加 "Apply to App Store Connect",显示逐字段 diff,二次确认(仿 `ReplyConfirmDialog`);开关关闭时按钮不可用并指向设置;连接卡片加发布权限一行,连接引导文案补上"发布元数据需要 App Manager 或 Admin"。
- `ChangeEvent` 是从商店抓取检测的。通过 asobeast 发布后,下次抓取会被当成外部变更,要用发布记录去重或打标记。
- 文档:`docs/guides/metadata-workbench.mdx` 里"服务器不能应用草稿"的表述、`docs/guides/store-funnel.mdx` 的角色表、安全文档都要改成"默认关闭、逐次确认、只写这几个字段"。

**验收**:设置里的开关关闭时 Apply 不可用且给出说明;在测试 App 上写一次,回读与草稿一致;基线被改时拒绝;越权时标 `forbidden` 并提示缺角色;日志与导出里没有密钥。

## P2:多语言批量(依赖 P1)

- 一次为所有已上线语言生成标题、副标题、关键词字段;同一商店共读的语言互相避开已用词(asobeast 已有"哪些商店读哪些语言"的数据,见 `localization-markets`、`storefrontsReading`)。
- 补建缺失语言;截图复制(下载再上传,Apple 没有复制接口)作为可选项,可以放到后面。
- What's New:写一次,其余语言用现有 AI 端点本地化;为空时按语言填默认文案,因为 Apple 不接受 What's New 为空的版本。
- 法律页脚:EULA 与隐私政策链接按语言加标签,可关闭;注意总长度不超过 4000,隐私政策 URL 可从 ASC 读取。
- 批量发布走 P1 的同一条守卫流程,每个语言独立回读并报告结果。

## P3:广告活动数据

- 拉取每个关键词、每个国家的展示、点击、安装、花费;按 campaign 替换式同步,不累加。
- Keywords 页加一列和按国家汇总的卡片;没有广告账户时整块隐藏。
- 依赖 P0 第 2 项的结论:**能复用现有 `APPLE_ADS_*`**,不需要新凭据。

## P4:小项

1. 前后对比增加价值加权列:`热度 × (1 − (难度/100)²) × 契合系数`,品牌词系数 0。具体规则见 Workbench 的 `ImpactView.swift`。asobeast 现有的可见度已按热度加权,这里只增加难度和契合度。
2. 词与 App 的相关度判断:用现有 OpenAI 端点,存为可选字段。
3. 黄金词筛选:Keywords 页已有 `opportunity` 列和按等级筛选,**默认不做**,除非你觉得缺命名筛选器。

## 不做

Jev、RevenueCat、Apple Ads 网站会话、SwiftUI/AppKit 代码、MCP 快照导出。

## 风险提示

| 风险 | 处理 |
|---|---|
| 改变 asobeast"不能写商店"的产品承诺 | P1 单独发版,默认关闭,同步改文档 |
| ASC 角色不够 | 发布需要 App Manager 或 Admin;连接引导文案跟着改,被拒时提示缺什么角色 |
| 误写生产数据 | 基线哈希 + 逐字段确认 + 写后重读,先在测试 App 上验证 |
| 新表漏掉租户隔离 | 按 `KeywordField` 的写法带 `workspaceId` 与 RLS |
