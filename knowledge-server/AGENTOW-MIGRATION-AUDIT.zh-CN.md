# AgentOW 无障碍知识迁移审计

[English](AGENTOW-MIGRATION-AUDIT.md) | 简体中文

技术设计：[English](TECH-DESIGN.md) | [简体中文](TECH-DESIGN.zh-CN.md)

## 1. 结论与基线

**AgentOW 无障碍知识尚未全部迁移到独立 KB 的对应条目中。** 历史归档已通过机械校验，但现有 32 个草稿条目主要提供通用知识和契约核查工作表，尚未承载源材料中的多项具体 Fluent/SharePoint 契约。主题相似不等于迁移完整，也不等于内容已获批准。

审计日期：2026-09-14。源：[kaixun96/dev.AgentOW，固定提交 7896845e51d75b0b9d632a2fd61876bc2f556ea5](https://github.com/kaixun96/dev.AgentOW/tree/7896845e51d75b0b9d632a2fd61876bc2f556ea5)。检查时该提交被记录为 main；本报告引用不可变提交，不使用会移动的 main 链接。目标内容基线：dev.A11yAssist 的 `a7ac1ce`。下文的本地 KB 链接指向现有落点；审计结论描述该基线，不代表后续修改后的状态。

| 证据集合 | 数量 | 可以证明什么 |
| --- | ---: | --- |
| 源仓库跟踪文件 | 171 | 固定 Git 树的完整文件清单 |
| 已归档快照文件 | 106 | LF 规范化的历史正文，含相关非 Markdown 参考；**不是 106 个已迁移 KB 条目** |
| 外部引用 | 8 | 第三方性能材料及生成产物保留原始引用 |
| 快照知识范围外文件 | 57 | 清单中明确记录的处置，不是语义无关的证明 |
| 宽范围匹配的第一方 Markdown 候选 | 53 个路径 | 路径**或**正文命中标记 |
| 候选中的不同正文 | 41 | CRLF → LF 后计算 SHA-256；有 12 个重复路径 |
| 独立 KB 条目 | 32，全部为草稿 | Common 20 + Fluent 4 + SharePoint 8；不能声称已批准或迁移完整 |

本审查与中英文技术设计一起提供，不修改 KB 正文、描述符、来源状态、快照、分发固定值、运行时或插件。下文记录仍需完成的迁移工作，不表示本次已经补齐这些契约。

## 2. 方法、复现与限制

1. 以固定 Git 树为准，不只查看无障碍参考目录。检查[源文件清单](../integrations/agentow/knowledge/source-inventory.json)，其中包含来源链接、完整哈希、处置方式与重复关系。
2. 使用现有[快照检查器](../tools/agentow-knowledge-snapshot.mjs)检查归档。在仓库根目录执行以下命令；需事先准备具有访问授权的源仓库检出：

   ```text
   node tools/agentow-knowledge-snapshot.mjs <source-checkout> 7896845e51d75b0b9d632a2fd61876bc2f556ea5 --check
   ```

   本次已针对固定提交重新运行检查器并通过：`check: true`、`tracked: 171`、`snapshot: 106`、`externalReference: 8`、`outsideKnowledgeScope: 57`。`--check` 检查的是归档完整性/漂移，不是 KB 语义覆盖。
3. 候选发现遍历该树中**全部被跟踪的第一方 Markdown**，排除检查器标识的第三方性能材料子树。对路径或完整正文应用 `/a11y|accessib|aria[- ]|screen.?reader|spds|fluent|wcag|nvda|narrator|voice.?access|keyboard|contrast|focus|evaluator/i`。将 CRLF 规范化为 LF 后，对 UTF-8 正文计算哈希。不能只搜索名称含 “accessibility” 的文件。附录 A 列出了全部 53 个路径及 41 个正文。
4. 将高相关参考中的实质条款与已注册目标正文和精确 ID 对照。区分通用概念与版本相关 API、生命周期前提、例外、产品范围和验证责任。操作指令继续归属于源/运行时文档，不能一律视为 KB 缺失正文。
5. 使用以下分类：**部分覆盖**＝有实质交集，但缺少细节或可追溯关系；**缺少具体契约**＝已有工作表，但没有源材料的具体契约；**操作性内容**＝执行/所有权/证据契约应位于内容层之外；**外部权威来源待接入**＝需要独立获取材料。不会仅因存在通用主题就标记“完全覆盖”。

**限制：**关键词扫描不能证明 100% 的语义完整性。未命中的正文、非 Markdown 实现/测试、链接指向的仓库、官方文档、私有材料及更早版本可能包含其他知识。53 个候选不等于 53 项独立要求。非 Markdown 的归档处置必须按用途复核，不能仅按扩展名排除。本审计不证明实现迁移、真实提供程序就绪、AT 行为、合规、再分发许可或历史 API 当前仍然有效。未操作真实 Bug、桌面、提供程序或浏览器。

## 3. 源到 KB 的发现与可执行待办

优先级是建议的内容审阅顺序，不是无障碍缺陷严重度。P1 优先补足容易导致修错责任层的具体契约；P2 补充其余具体知识及审阅覆盖。所有目标 ID 均为第 4 节列出的现有草稿。源链接提供固定版本的历史证据，**不表示批准其中的指令**。

| 工作项 / 历史来源 | 目标基线的发现 | 现有目标 ID 与下一步 |
| --- | --- | --- |
| B01 · P1 · [组件文档映射及 SPDS/Fluent 关系](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L1-L58) | **部分覆盖。** 已有版本/责任工作表，未迁移组件到文档的映射及具体委托关系声明。 | `fluent.selection.components-and-utilities`、`fluent.v9.component-contract`、`sharepoint.spds.component-contract`：确认当前组件文档与包装器版本，记录有范围限定的委托关系，不能假设每个 SPDS 包装器继承全部行为。 |
| B02 · P2 · [跨领域检查](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L59-L111)与[后续检查清单/示例][s01] | **部分覆盖。** 语义、标签、分组、视觉状态、表单和自定义控件原则有大量交集，但不能据此证明逐条迁移。 | `common.topic.component-accessibility`、`common.topic.forms-and-content`、`common.topic.visual-accessibility`、`common.implementation.component-contract`、`common.verification.design`：将保留的原则与例外映射到已审阅标准；不要把仓库专用的标题证据门禁或历史上过于宽泛的对比度表述变成通用规则。 |
| B03 · P1 · [V9 MessageBar](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L112-L156) | **缺少具体契约。** 通用“避免重复”指导没有保留 `MessageBar` intent、祖先 `AriaLiveAnnouncer` 或组合前提。 | `fluent.v9.component-contract`；关联 `sharepoint.spds.component-contract` 与 `sharepoint.case.duplicate-announcement`。审阅已安装版本的前提、组件播报责任、包装器重复播报和 `MessageBarGroup` 组合，补充正反例。 |
| B04 · P1 · [V8 MessageBar](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L157-L178) | **缺少具体契约。** V8 工作表没有具体的 `delayedRender`、内置播报及 `Announced` 区别。 | `fluent.v8.component-contract`：获取 V8 来源，不能使用已登记的 V9 文档入口替代；验证默认/覆盖行为以及额外播报机制何时会造成重复。 |
| B05 · P1 · [播报工具](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L179-L219) | **缺少具体契约。** 已有事件责任原则，但没有 `useAnnounce`、`useScreenReaderAlert`、重复消息 `indicator`、读取模式和旧版 `ScreenReader.alert` 的区别。 | `fluent.v9.component-contract`、`sharepoint.utilities.announcements-and-focus`、`sharepoint.selection.components-and-utilities`：经所有者/版本审阅后，记录每个事件仅使用一条既有机制、提供程序前提、重复消息及旧接口适用范围。 |
| B06 · P1 · [异步集合](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L220-L311) | **部分覆盖。** Common 已有实质性的状态转换矩阵；具体技术栈选择、显式刷新/无变化情况和完整本地化结果仍未充分映射。 | `common.topic.dynamic-content`、`common.verification.static`、`common.verification.dynamic`，以及两个 Fluent 契约 ID 和 `sharepoint.utilities.announcements-and-focus`：对每个适用转换追踪可见、程序化反馈及焦点结果，保留重复结果与避免重复播报的案例。源审阅严重度不能变成通用要求。 |
| B07 · P1 · [动态焦点转换](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L314-L343) | **部分覆盖。** Common 覆盖删除、工具栏、替换和异步焦点生命周期，但未覆盖全部具体生命周期及精确操作断言。 | `common.topic.keyboard-focus`、`common.case.dialog-focus`、`common.verification.testing`：添加有范围限定的消失操作控件、选择和后备目标示例；指定更新后的预期活动元素，不能把通用 Tab 顺序测试当作充分证明。 |
| B08 · P1 · [焦点责任方选择](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L344-L399) | **缺少具体契约。** 已有通用责任划分，缺少 `useRestoreFocusTarget`/`useRestoreFocusSource`、`A11yManager`、`Focus`、`FocusTransition`、`Keyboard` 和迁移 shim 边界。 | `fluent.v9.component-contract`、`fluent.v8.component-contract`、`sharepoint.utilities.announcements-and-focus`：审阅触发器/界面配对、捕获/恢复时机、已挂载后备目标、跨视图责任和未托管 DOM 路径；同一生命周期不能有两个恢复责任方。 |
| B09 · P2 · [富文本检查](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L400-L409) | **缺少专用工具内容；通用内容部分覆盖。** 表单/内容指导未保留 `checkA11yForRte`、`runH1A11yChecks` 或编辑器范围。 | `common.topic.forms-and-content` 提供通用原则；从 `sharepoint.selection.components-and-utilities` 将产品契约路由到下文提议 N01。审阅编辑器与组件编写的边界以及扫描器限制。 |
| B10 · P2 · [拖动/重排工具](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L410-L413) | **缺少具体交互协议。** 已有通用键盘/拖动替代方式，未包含 `sp-dragzone` 契约。 | `common.topic.keyboard-focus` 保留跨产品原则；`sharepoint.selection.components-and-utilities` 路由到提议 N02。审阅开始/移动/取消/完成、手柄焦点和本地化移动状态消息。**不能把产品专用的 Enter/Space/方向键行为转成通用键盘标准。** |
| B11 · P2 · [审计工具及工具边界](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L414-L424) | **部分覆盖。** 已有通用测试/证据限制，尚未映射产品扫描器/辅助方法的适用范围。 | `common.verification.static`、`common.verification.dynamic`、`common.verification.testing`、`sharepoint.selection.components-and-utilities`：审阅 `runAccessibilityScanAsync`、`verifyAccessibilityWithSPA11yAssistant` 及审计命令范围。私有辅助方法不是公开 API；历史上缺少共享视觉隐藏工具不等于当前事实。执行仍在操作文档中，不转成可执行 KB 流程。 |
| B12 · P1 · [SPDS 选型/导入/组合参考][s04] | **部分覆盖 / 缺少具体契约。** 缺少 Table/DataGrid 选型（5–23）及组合示例（104–170）；包路径（24–44）、私有样式和例外（55–103）仅有通用交集；语义（171 起）有共享覆盖。 | `sharepoint.selection.components-and-utilities`、`sharepoint.spds.component-contract`、`fluent.selection.components-and-utilities`、`common.implementation.component-contract`：审阅 `Table` 与 `DataGrid`、stable 与 `LazyComponents` 导出、受支持样式与 `.fui-*`，以及操作/导航组合边界。保留宿主范围，不能恢复为跨产品一律 SPDS 优先。 |
| B13 · P1 · [主题分类/提供程序参考][s05]与[Detheme skill][s06] | **缺少具体契约；通用验证部分覆盖。** 宿主工作表没有实际界面分类、`NeutralThemeProvider`、`NeutralV8ThemeProvider` 或 hook/提供程序处理。 | `sharepoint.verification.themes-and-host`、`sharepoint.spds.component-contract`：审阅应用框架/页面/内容/窗格/覆盖层分类、祖先覆盖、V8 shim、嵌套提供程序、令牌和回归状态。提供程序/开关发布机制仍属操作层。产品颜色不是通用无障碍要求。 |
| B14 · P2 · [本地化][s02]及[共享工具复用][s03] | **部分覆盖。** 已提及本地化/复数消息，但未映射具体区间/计数、完整句子、ReactNode 格式化、RTL 和安全富文本边界。 | `common.topic.forms-and-content`、`common.topic.dynamic-content`、`common.topic.visual-accessibility`、`sharepoint.selection.components-and-utilities`：只抽象跨产品原则；提议 N03 承载经审阅的产品格式化/资源契约。审阅 `StringHelper.formatWithLocalizedCountValue`、`formatToArray`、区域相关列表与 Fluent 自动翻转范围，不能直接引入英语复数或 RTL 假设。 |
| B15 · P2 · [ReplaceComponent 参考][s07] | **知识部分覆盖 / 执行属于操作层。** 通用宿主检查未逐项列出迁移专有的焦点、portal、提供程序、关闭和键盘风险。 | `fluent.selection.components-and-utilities`、`sharepoint.verification.themes-and-host`、`common.verification.testing`：添加绑定版本的验证清单。Flight/KillSwitch 执行、依赖更新、发布命令和证据采集仍位于源/运行时文档。 |
| B16 · P2 · [相邻审阅参考及遗漏记录](#a3-相邻或偶然命中的文档) | **部分可复用经验 / 其余为偶然命中。** 架构、性能或通用代理文档中出现标记，不表示整份文档都是无障碍知识。 | `common.analysis.root-cause`、`common.implementation.component-contract`、`common.verification.static`、`common.verification.design`、`common.verification.testing`：经审阅仅提取独立有用、已去敏的无障碍反例；通用架构/包体积和审阅流程契约保留在源中。 |

### 提议的新落点——尚未创建或注册

范围相同应优先扩展现有条目。以下仅为可选的**提议 NEW 路径**，相对于仓库根目录；它们不是现有条目，也不是可用链接：

| 提议 | 提议路径 | 提议 ID / 现有路由条目 |
| --- | --- | --- |
| N01 · RTE/内容检查器契约 | accessibility-kb/packages/sharepoint/utilities/rich-text-accessibility.md | `sharepoint.utilities.rich-text-accessibility`；从 `sharepoint.selection.components-and-utilities` 路由 |
| N02 · 产品拖动/重排契约 | accessibility-kb/packages/sharepoint/utilities/drag-and-drop.md | `sharepoint.utilities.drag-and-drop`；从 `sharepoint.selection.components-and-utilities` 路由 |
| N03 · 产品本地化契约 | accessibility-kb/packages/sharepoint/utilities/localization-and-formatting.md | `sharepoint.utilities.localization-and-formatting`；从 `sharepoint.selection.components-and-utilities` 路由 |

## 4. 现有目标精确索引

以下全部条目在审计基线均为**草稿**。这是落点索引，不是 32 项迁移完成声明。描述符：[Common](../accessibility-kb/packages/common/package.json)、[Fluent](../accessibility-kb/packages/fluent/package.json)、[SharePoint](../accessibility-kb/packages/sharepoint/package.json)。

| 现有 ID | 现有正文 |
| --- | --- |
| `common.overview` | [Common 概览](../accessibility-kb/packages/common/README.md) |
| `common.topic.foundations` | [基础知识](../accessibility-kb/packages/common/topics/foundations.md) |
| `common.topic.component-accessibility` | [组件语义](../accessibility-kb/packages/common/topics/component-accessibility.md) |
| `common.topic.keyboard-focus` | [键盘和焦点](../accessibility-kb/packages/common/topics/keyboard-focus.md) |
| `common.topic.forms-and-content` | [表单和内容](../accessibility-kb/packages/common/topics/forms-and-content.md) |
| `common.topic.dynamic-content` | [动态内容](../accessibility-kb/packages/common/topics/dynamic-content.md) |
| `common.topic.visual-accessibility` | [视觉无障碍](../accessibility-kb/packages/common/topics/visual-accessibility.md) |
| `common.requirements.authority-and-applicability` | [权威性与适用性](../accessibility-kb/packages/common/requirements/authority-and-applicability.md) |
| `common.analysis.root-cause` | [根因分析](../accessibility-kb/packages/common/analysis/root-cause.md) |
| `common.implementation.component-contract` | [组件责任](../accessibility-kb/packages/common/implementation/component-contract.md) |
| `common.verification.static` | [静态验证](../accessibility-kb/packages/common/verification/static.md) |
| `common.verification.dynamic` | [动态验证](../accessibility-kb/packages/common/verification/dynamic.md) |
| `common.verification.design` | [设计验证](../accessibility-kb/packages/common/verification/design.md) |
| `common.verification.testing` | [测试](../accessibility-kb/packages/common/verification/testing.md) |
| `common.case.dialog-focus` | [对话框焦点案例](../accessibility-kb/packages/common/cases/dialog-focus.md) |
| `common.procedure.find` | [发现流程](../accessibility-kb/packages/common/procedures/find.md) |
| `common.procedure.fix` | [修复流程](../accessibility-kb/packages/common/procedures/fix.md) |
| `common.procedure.prevent` | [预防流程](../accessibility-kb/packages/common/procedures/prevent.md) |
| `common.procedure.review-design` | [设计审阅流程](../accessibility-kb/packages/common/procedures/review-design.md) |
| `common.procedure.add-tests` | [添加测试流程](../accessibility-kb/packages/common/procedures/add-tests.md) |
| `fluent.overview` | [Fluent 概览](../accessibility-kb/packages/fluent/README.md) |
| `fluent.v8.component-contract` | [V8 契约工作表](../accessibility-kb/packages/fluent/v8/component-contract.md) |
| `fluent.v9.component-contract` | [V9 契约工作表](../accessibility-kb/packages/fluent/v9/component-contract.md) |
| `fluent.selection.components-and-utilities` | [Fluent 选型](../accessibility-kb/packages/fluent/selection/components-and-utilities.md) |
| `sharepoint.overview` | [SharePoint 概览](../accessibility-kb/packages/sharepoint/README.md) |
| `sharepoint.selection.components-and-utilities` | [SharePoint 选型](../accessibility-kb/packages/sharepoint/selection/components-and-utilities.md) |
| `sharepoint.spds.component-contract` | [SPDS 契约工作表](../accessibility-kb/packages/sharepoint/spds/component-contract.md) |
| `sharepoint.utilities.announcements-and-focus` | [播报/焦点工作表](../accessibility-kb/packages/sharepoint/utilities/announcements-and-focus.md) |
| `sharepoint.profile.support-policy` | [支持策略](../accessibility-kb/packages/sharepoint/profiles/support-policy.md) |
| `sharepoint.profile.support-matrix` | [支持矩阵](../accessibility-kb/packages/sharepoint/profiles/support-matrix.json) |
| `sharepoint.verification.themes-and-host` | [主题/宿主验证](../accessibility-kb/packages/sharepoint/verification/themes-and-host.md) |
| `sharepoint.case.duplicate-announcement` | [重复播报案例](../accessibility-kb/packages/sharepoint/cases/duplicate-announcement.md) |

概览与 Common 流程提供导航/推理方法，不能代替历史代理执行。基础知识及权威性/适用性条目用于解释来源。支持策略/矩阵仍等待官方输入，不能据此声称 AgentOW 提供过完整支持清单。通用案例也不能证明具体历史 API 案例已迁移。

## 5. 区分操作契约与权威来源缺口

- 附录 A2 中的代理指令、证据契约、Windows 宿主测试、PR 采集、设置、浏览器所有权以及运行/harness 生命周期文档，继续归属操作性源/运行时文档。KB 流程可以解释证据推理，但不能获取租约、启动 AT、采集 PR、授权修复，或暗示仅源码检查已经观察到行为。
- 原始 owner/run/affinity 与规范门禁应保留在实际操作实现中。历史标题大纲产物、审阅 schema 字段、严重度标签和发布命令不能变为跨产品 KB 要求。本审计不证明运行时迁移完整。
- 非 Markdown 契约、实现和测试可以支撑这些边界或 API 声明。106 个归档文件包含此类参考；应在审阅具体声明时检查，不能直接判定所有非 Markdown 文件都不在范围内。
- **被审计源中没有真正权威的 MAS 规则。** 获取规则正文、条款 ID、版本及授权访问是独立的资料获取缺口，不是迁移丢失。不能将 `common.requirements.authority-and-applicability` 或设计中的未来 MAS 集成描述为已连接能力。
- 官方 SPDS 文档、SharePoint 工具契约和产品支持声明仍待接入，这与历史 AgentOW 声明是两回事。Fluent 已登记的文档入口仍待审阅，也不能支撑 V8 契约。固定版本的历史声明与当前权威契约属于不同证据类型。
- 将来提升内容状态之前，需获取当前文档和已安装版本适用依据，确认所有者/审阅者与许可/再分发权限，仅概述允许使用的材料，登记准确来源元数据，并按[贡献政策](../accessibility-kb/governance/contribution.md)记录审阅证据。仅历史来源不能支持 approved 条目。不得将私有源码正文、个人信息或运行证据复制进 KB。

## 6. 关闭标准与验证记录

未来获授权的变更应逐项记录 B01–B16 的“源条款 → 目标 ID → 有范围的摘要 → 保留例外 → 已审阅版本/来源 → 所有者/审阅者 → 正反例评估”，并说明任何有意排除。新增条目需登记描述符，遵循正确分层/依赖及关系；发布变更需执行正常构建、依赖闭包/链接/schema 和回归检查。单元/schema 成功不等于语义完整，也不等于观察到 AT 成功。

本报告对照了重新运行的快照检查、固定源清单、重新计算的候选清单/哈希、相关源正文、三个包描述符及目标契约/主题正文。两种语言均包含相同的 16 项待办、3 个提议落点、32 个现有 ID 和 53 路径附录。文档回归测试检查映射与双语一致性，不证明语义等价。**结果：历史归档保全已验证；语义迁移未完成；批准及当前权威依据仍待解决。**

## 附录 A. 完整宽范围候选清单

下列每个链接均指向固定源提交。哈希为 LF 规范化 SHA-256 的前 12 位十六进制字符；完整值位于[源文件清单](../integrations/agentow/knowledge/source-inventory.json)。同一行的两个路径具有相同的完整哈希，并非仅名称相似。内容不同的 profile 副本特意分列。分类是审计处置，不是源文件自带标签。

### A1. 领域参考及混合内容/实现指南——12 路径 / 7 正文

| 候选源路径（配对路径为重复正文） | SHA-256 前缀 | 处置 |
| --- | --- | --- |
| [copilot/skills/ow-review/references/accessibility.md][s01] · [skills/ow-review/references/accessibility.md][d01] | `fc28fa277426` | B01–B11；可复用条款与操作性审阅门禁并存 |
| [copilot/skills/ow-review/references/localization-and-formatting.md][s02] · [skills/ow-review/references/localization-and-formatting.md][d02] | `985a7cdecb45` | B14；无障碍相关的本地化子集 |
| [copilot/skills/ow-review/references/shared-utility-reuse.md][s03] · [skills/ow-review/references/shared-utility-reuse.md][d03] | `d35f47cf7b50` | B14/B16；共享 API 发现，不是所有工具都属于无障碍知识 |
| [copilot/skills/ow-review/references/sharepoint-design-system-and-ux-components.md][s04] · [skills/ow-review/references/sharepoint-design-system-and-ux-components.md][d04] | `0af0f1cfd66c` | B12 |
| [copilot/skills/ow-review/references/sharepoint-theme-and-detheme.md][s05] · [skills/ow-review/references/sharepoint-theme-and-detheme.md][d05] | `d7e3c936a8ae` | B13 |
| [copilot/skills/detheme/SKILL.md][s06] | `54c2bb87d156` | B13；区分知识与发布操作指令 |
| [copilot/skills/ow-ref-replace-component/SKILL.md][s07] | `d257063eb036` | B15；区分验证知识与执行 |

### A2. 操作、路由与代理文档——31 路径 / 29 正文

这些候选保留在其实际操作来源中。可复用的证据推理可能关联 Common 验证/流程，但不等于可执行工作流已迁移。

| 候选源路径（配对路径为重复正文） | SHA-256 前缀 |
| --- | --- |
| [README.md][s08] | `31c95253a927` |
| [copilot/AGENTS.md][s09] | `59b629ae55aa` |
| [copilot/README.md][s10] | `81f13db60299` |
| [copilot/agents/a11y-evaluator.agent.md][s11] | `5f0d3f3a4820` |
| [copilot/agents/context-maintainer.agent.md][s12] | `05fd93bbc073` |
| [copilot/agents/evaluator.agent.md][s13] | `fd5effd8bcf8` |
| [copilot/agents/planner.agent.md][s14] | `7bde422eb2f7` |
| [copilot/agents/reviewer.agent.md][s15] | `88b128d5fad1` |
| [copilot/docs/a11y/README.md][s16] | `7777a5691a22` |
| [copilot/docs/a11y/evidence-contract.md][s17] | `66b2954c46b3` |
| [copilot/docs/a11y/pr-evidence-capture-guide.md][s18] | `5f174cd802c7` |
| [copilot/docs/a11y/shared-capabilities.md][s19] | `35e3240c09f4` |
| [copilot/docs/a11y/windows-host-testing.md][s20] | `e3fa18eded6d` |
| [copilot/docs/review-contract.md][s21] · [docs/review-contract.md][d21] | `23a8a9c71b86` |
| [copilot/docs/run-insights.md][s22] · [docs/run-insights.md][d22] | `c77864b2e28a` |
| [copilot/docs/sp-client-review-profile.md][s23] | `868688fc1da3` |
| [copilot/skills/agentow-a11y/SKILL.md][s24] | `7aa6a9c5764e` |
| [copilot/skills/agentow/SKILL.md][s25] | `90187da56ae4` |
| [copilot/skills/ow-a11y-host-setup/SKILL.md][s26] | `cc70863efb0f` |
| [copilot/skills/ow-batch/SKILL.md][s27] | `a6405cfbaa6e` |
| [copilot/skills/ow-context-feedback/SKILL.md][s28] | `6b60a9726e47` |
| [copilot/skills/ow-review/SKILL.md][s29] | `f872c25d6ed7` |
| [docs/USING-AGENTOW.md][s30] | `5bcde5d3dfbb` |
| [docs/USING-AGENTOW.zh-CN.md][s31] | `2e6527654a4d` |
| [docs/context-maintenance.md][s32] | `de35fce3bc06` |
| [docs/harness-contract.md][s33] | `83d21d1c6dfd` |
| [docs/personal-evaluator-browser.md][s34] | `0ef63476940b` |
| [docs/run-lifecycle.md][s35] | `89b38d2b4e78` |
| [docs/sp-client-review-profile.md][s36] | `7f628006e770` |

### A3. 相邻或偶然命中的文档

**10 路径 / 5 正文。** 这些通用审阅、架构和性能文档命中宽范围标记；仅其中与无障碍有关的经验是 B16 候选。它们不是五份独立无障碍契约，也不能自动全部排除。

| 候选源路径（配对路径为重复正文） | SHA-256 前缀 |
| --- | --- |
| [copilot/docs/review-misses.md][s37] · [docs/review-misses.md][d37] | `e4699dee6eb6` |
| [copilot/skills/ow-review/references/common-review-issues.md][s38] · [skills/ow-review/references/common-review-issues.md][d38] | `491e300af90c` |
| [copilot/skills/ow-review/references/graduation.md][s39] · [skills/ow-review/references/graduation.md][d39] | `157d9f2a72e4` |
| [copilot/skills/ow-review/references/size-regression.md][s40] · [skills/ow-review/references/size-regression.md][d40] | `f84813cd5ee0` |
| [copilot/skills/ow-review/references/ux-architecture-and-bundle-boundaries.md][s41] · [skills/ow-review/references/ux-architecture-and-bundle-boundaries.md][d41] | `243a5adfee68` |

数量核对：**12 + 31 + 10 = 53 路径；7 + 29 + 5 = 41 正文；5 + 2 + 5 = 12 个重复路径。**

[s01]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md
[d01]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/accessibility.md
[s02]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md
[d02]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/localization-and-formatting.md
[s03]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/shared-utility-reuse.md
[d03]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/shared-utility-reuse.md
[s04]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/sharepoint-design-system-and-ux-components.md
[d04]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/sharepoint-design-system-and-ux-components.md
[s05]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/sharepoint-theme-and-detheme.md
[d05]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/sharepoint-theme-and-detheme.md
[s06]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/detheme/SKILL.md
[s07]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-ref-replace-component/SKILL.md
[s08]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/README.md
[s09]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/AGENTS.md
[s10]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/README.md
[s11]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/agents/a11y-evaluator.agent.md
[s12]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/agents/context-maintainer.agent.md
[s13]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/agents/evaluator.agent.md
[s14]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/agents/planner.agent.md
[s15]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/agents/reviewer.agent.md
[s16]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/a11y/README.md
[s17]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/a11y/evidence-contract.md
[s18]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/a11y/pr-evidence-capture-guide.md
[s19]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/a11y/shared-capabilities.md
[s20]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/a11y/windows-host-testing.md
[s21]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/review-contract.md
[d21]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/review-contract.md
[s22]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/run-insights.md
[d22]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/run-insights.md
[s23]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/sp-client-review-profile.md
[s24]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/agentow-a11y/SKILL.md
[s25]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/agentow/SKILL.md
[s26]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-a11y-host-setup/SKILL.md
[s27]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-batch/SKILL.md
[s28]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-context-feedback/SKILL.md
[s29]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/SKILL.md
[s30]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/USING-AGENTOW.md
[s31]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/USING-AGENTOW.zh-CN.md
[s32]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/context-maintenance.md
[s33]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/harness-contract.md
[s34]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/personal-evaluator-browser.md
[s35]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/run-lifecycle.md
[s36]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/sp-client-review-profile.md
[s37]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/review-misses.md
[d37]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/review-misses.md
[s38]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/common-review-issues.md
[d38]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/common-review-issues.md
[s39]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/graduation.md
[d39]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/graduation.md
[s40]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/size-regression.md
[d40]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/size-regression.md
[s41]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/ux-architecture-and-bundle-boundaries.md
[d41]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/ux-architecture-and-bundle-boundaries.md