# AgentOW 无障碍知识迁移审计

[English](AGENTOW-MIGRATION-AUDIT.md) | 简体中文

技术设计：[English](TECH-DESIGN.md) | [简体中文](TECH-DESIGN.zh-CN.md)

## 1. 结论与基线

**经审计的可复用无障碍规则已完成迁移，落在 authored Common、Fluent、SharePoint 包中。** 下文 B01–B16 将源条款映射到已实现的指导、具体 API/责任契约、例外及验证案例。N01–N03 已登记为条目，不再是提案。

覆盖更新：2026-09-15；源清单审计：2026-09-14。源：[kaixun96/dev.AgentOW，固定提交 7896845e51d75b0b9d632a2fd61876bc2f556ea5](https://github.com/kaixun96/dev.AgentOW/tree/7896845e51d75b0b9d632a2fd61876bc2f556ea5)。目标为当前 authored 包，三个包均为 `0.1.1`，精确依赖已协调。本地链接指向已实现正文；消费方实际读取的快照由生成引用另行标识。

| 证据集合 | 数量 | 可以证明什么 |
| --- | ---: | --- |
| 源仓库跟踪文件 | 171 | 固定 Git 树的完整文件清单 |
| 已归档快照文件 | 106 | LF 规范化的历史正文，含相关非 Markdown 参考；**不是 106 个已迁移 KB 条目** |
| 外部引用 | 8 | 第三方性能材料及生成产物保留原始引用 |
| 快照知识范围外文件 | 57 | 清单中明确记录的处置，不是语义无关的证明 |
| 宽范围匹配的第一方 Markdown 候选 | 53 个路径 | 路径**或**正文命中标记 |
| 候选中的不同正文 | 41 | CRLF → LF 后计算 SHA-256；有 12 个重复路径 |
| 独立 KB 条目 | 35，全部为草稿 | Common 20 + Fluent 4 + SharePoint 11；精确目标索引见第 4 节 |

**来源与批准：** 描述符将迁移条款绑定到固定的 `historical-reference` / `historical` 来源。全部条目仍为 draft，owner 尚未分配；迁移不等于官方批准、当前安装版本有效性、再分发许可或已观察到的合规结果。相关审核遵循[贡献政策](../accessibility-kb/governance/contribution.md)。完成范围是经审计的可复用规则，不是仓库每个字、可执行程序或其链接的外部来源。

## 2. 方法、复现与限制

1. 以固定 Git 树为准，不只查看无障碍参考目录。检查[源文件清单](../integrations/agentow/knowledge/source-inventory.json)，其中包含来源链接、完整哈希、处置方式与重复关系。
2. 使用现有[快照检查器](../tools/agentow-knowledge-snapshot.mjs)检查归档。在仓库根目录执行以下命令；需事先准备具有访问授权的源仓库检出：

   ```text
   node tools/agentow-knowledge-snapshot.mjs <source-checkout> 7896845e51d75b0b9d632a2fd61876bc2f556ea5 --check
   ```

   2026-09-15 已重新检查并通过：`check: true`、`tracked: 171`、`snapshot: 106`、`externalReference: 8`、`outsideKnowledgeScope: 57`。`--check` 检查归档完整性/漂移；下方条款映射记录 KB 覆盖。
3. 候选发现遍历该树中**全部被跟踪的第一方 Markdown**，排除检查器标识的第三方性能材料子树。对路径或完整正文应用 `/a11y|accessib|aria[- ]|screen.?reader|spds|fluent|wcag|nvda|narrator|voice.?access|keyboard|contrast|focus|evaluator/i`。将 CRLF 规范化为 LF 后，对 UTF-8 正文计算哈希。不能只搜索名称含 “accessibility” 的文件。附录 A 列出了全部 53 个路径及 41 个正文。
4. 将高相关参考中的实质条款与已注册目标正文和精确 ID 对照。区分通用概念与版本相关 API、生命周期前提、例外、产品范围和验证责任。操作指令继续归属于源/运行时文档，不能一律视为 KB 缺失正文。
5. 记录已实现规则、所属目标 ID 及保留的例外。跨产品结果放 Common，框架 API 放 Fluent，宿主契约放 SharePoint。操作指令留在 KB 内容之外；官方来源获取与历史迁移分开处理。

53 个候选是发现集合，不是 53 项独立要求。附录 A 保留精确的路径/哈希核对，包括重复项及操作性/相邻材料的处置。非 Markdown 材料若支撑具体声明，应按用途评估；范围不扩展到未检查的修订或链接仓库。

## 3. 源到 KB 的已实现覆盖

B01–B16 保留原审计标识，便于贡献者追溯最初发现。所有目标 ID 均可从第 4 节找到正文。“已实现”指可用知识内容，不表示执行过所描述的 UI 行为。

| 审计项 / 历史来源 | 已实现条款及保留例外 | 所属目标 ID |
| --- | --- | --- |
| B01 · [组件文档映射及 SPDS/Fluent 关系](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L1-L58) | 组件到文档映射覆盖标签、具名控件、MessageBar、焦点、通知与截断。SPDS 委托已确认的 V9 责任方，明确的行为覆盖除外；检查包装器 props 与组合。 | `fluent.selection.components-and-utilities`、`fluent.v9.component-contract`、`sharepoint.spds.component-contract` |
| B02 · [跨领域检查](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L59-L111)与[审阅触发条件/清单/示例][s01] | 新增/改动的渲染 UI 及无障碍相关样式触发审阅；不适用须有基于 diff 的无影响说明，依赖运行时的准则在证据缺失时保持未验证。历史范围为适用的 WCAG 2.1 A/AA 及完整键盘/读屏操作。渲染语义、标签/分组、标题/表格、表单/图像/自定义控件及视觉/重排/目标检查保留对比度/二维内容例外。标题级别变更需前后完整 live 页面/对话框大纲、目标/父级/兄弟标题及理由；上下文缺失则暂缓决定。不设通用单 H1 或禁用态对比度规则。 | `common.topic.component-accessibility`、`common.topic.forms-and-content`、`common.topic.visual-accessibility`、`common.implementation.component-contract`、`common.verification.design` |
| B03 · [V9 MessageBar](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L112-L156) | intent 配合唯一应用祖先 `AriaLiveAnnouncer`；不叠加 role/live region/手动播报。politeness 覆盖须经 owner 确认；`MessageBar` 保持为 `MessageBarGroup` 的直接子项。根节点/重试示例区分前提缺失与重复播报。 | `fluent.v9.component-contract`、`sharepoint.spds.component-contract`、`sharepoint.case.duplicate-announcement` |
| B04 · [V8 MessageBar](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L157-L178) | 默认 `delayedRender` 向内部 live region 插入内容；error/blocked/severeWarning 使用 alert 行为。同一消息不另加 `Announced`。检查 `delayedRender={false}`、role、shim、portal 覆盖，不直接推定静默或引入 V9 前提。 | `fluent.v8.component-contract`、`sharepoint.case.duplicate-announcement` |
| B05 · [播报工具](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L179-L219) | provider 支撑的 `useAnnounce` 或既有 `useScreenReaderAlert`/`ScreenReaderAlert.read`，每事件一条机制。常规结果用 `ReadAfterOtherContent`，紧急错误用 `ReadImmediately`；组件 `indicator` 支持重复文本。旧版 `ScreenReader.alert(id, message)` 为 assertive；typing helper 不代替通用状态。 | `fluent.v9.component-contract`、`sharepoint.utilities.announcements-and-focus`、`sharepoint.selection.components-and-utilities` |
| B06 · [异步集合](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L220-L312) | 可见/程序化/焦点矩阵覆盖加载、计数、空态、错误/重试、追加/结束、排序/筛选/搜索/分组/分页/替换、刷新有变化/无变化、选择和后台完成。完整本地化结果及重复事件；spinner/busy 标记或先前错误条不覆盖完成。V8/V9/宿主机制分别绑定。历史 Important 覆盖可感知结果缺失；Minor 仅限转换已可感知时的措辞/冗余改进。行内容变化不能豁免程序化反馈缺失；所供证据须区分可见、实际播报及焦点结果。 | `common.topic.dynamic-content`、`common.verification.static`、`common.verification.dynamic`、`fluent.v8.component-contract`、`fluent.v9.component-contract`、`sharepoint.utilities.announcements-and-focus` |
| B07 · [动态焦点转换](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L314-L343)及[严重度校准][s01] | 删除/替换、消失工具栏/toast/内联/Keep both/Retry 操作的稳定身份与提交后后备目标；最后取消选择保留仍存在的行焦点。后台完成不抢焦点。关闭、突然卸载、动画案例断言精确操作后的 `document.activeElement`，不只检查 DOM 存在；焦点轨迹本身不能证明可见性。历史 Important 覆盖键盘触发的焦点丢失或无关落点；Minor 要求已到达逻辑合理、可见、启用的目标，且剩余问题不阻塞操作。“By design” 需交互契约和针对性测试证据。 | `common.topic.keyboard-focus`、`common.case.dialog-focus`、`common.verification.dynamic`、`common.verification.testing`、`sharepoint.utilities.announcements-and-focus` |
| B08 · [焦点责任方选择](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L344-L399) | 组件/Tabster 优先；仅对未满足的恢复职责使用 V9 `useRestoreFocusTarget`/`useRestoreFocusSource`。跨视图用 `A11yManager.saveActiveElementAs`/`restoreFocus`；未托管 DOM 用 `Focus`、`FocusTransition`、`Keyboard`、`A11yAttribute`。迁移层专属 `useRestoreFocusOnDismiss`、`ModalShim`、`FocusTrapZoneShim`；唯一责任方与已挂载后备目标，不编造重载。 | `fluent.v9.component-contract`、`fluent.v8.component-contract`、`sharepoint.utilities.announcements-and-focus` |
| B09 · [富文本检查](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L400-L409) | N01 记录 `@msinternal/sp-a11y-checker-util`、`checkA11yForRte`、`runH1A11yChecks`：标题/H1、空链接、表头、图像替代及文本/图像/覆盖层对比度。编辑器/内容范围与组件编写分开；不编造源未提供的签名。 | `sharepoint.utilities.rich-text-accessibility`、`sharepoint.selection.components-and-utilities`、`common.topic.forms-and-content` |
| B10 · [拖动/重排工具](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L410-L413) | N02 保留 `sp-dragzone` / `IDragZoneA11yStrings`：Enter/Space 开始、方向键移动、Escape 取消、取消/完成后手柄焦点；本地化 `moveStarted`、`moveComplete`、`moveCancelled`、`moveNotAllowed`。源未指定完成键/API；产品协议不是通用键盘政策。 | `sharepoint.utilities.drag-and-drop`、`sharepoint.selection.components-and-utilities`、`common.topic.keyboard-focus` |
| B11 · [审计工具及工具边界](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L414-L424)与[评估器证据规则][s11]（`agentow-evaluator`） | `runAccessibilityScanAsync`：axe、`includeSelectors`、详情/截图/计数及禁用规则理由；`verifyAccessibilityWithSPA11yAssistant(page)` 仍限 authoring page。保留私有 helper 边界及仅属历史的 `VisuallyHidden` 缺失；零违规不等于交互覆盖。Voice Access 比较匹配规范 URL、viewport、缩放、滚动、selector/几何、隐藏 debug bar 且无对话框；几何变更/对话框任务另设匹配场景。将编号坐标映射到 DOM/UIA 边界，排除浏览器/OS chrome，不仅因编号就判可操作控件违规，未映射编号保持 inconclusive。读屏录制要求时长/尺寸/图像方差/音频 RMS/peak、可见焦点帧、持久音频端点的真实语音及合成 Windows 桌面；仅有 MP4、静音/幻灯片/浏览器局部录制或质量元数据不足。每个适用步骤链接不可变证据；要求匹配基线/场景/修订及原失败实际消失，不能用静态扫描代替（B16）。 | `sharepoint.verification.themes-and-host`、`sharepoint.selection.components-and-utilities`、`common.verification.static`、`common.verification.dynamic`、`common.verification.testing` |
| B12 · [SPDS 选型/导入/组合参考][s04] | DataGrid/Table 能力选型、受控排序/选择；sp-client stable-bundle 与 odsp-common stable、`LazyComponents` 依赖路径。ODSP-Web 中 SPDS stable/LazyComponents 满足需求时，不得直接导入 `@fluentui/react-components`：绕过在历史政策中为 Important；例外需两个入口均有具体能力缺口，且后备方案满足语义/无障碍/主题要求，不能仅凭样式偏好。优先受支持 slots/tokens/typography，私有 `.fui-*` 仅限有记录的窄例外。兄弟 info action 与 `BreadcrumbItem > Menu > MenuTrigger > Button` 保留操作/导航语义。 | `sharepoint.selection.components-and-utilities`、`sharepoint.spds.component-contract`、`fluent.selection.components-and-utilities`、`common.implementation.component-contract` |
| B13 · [主题分类/provider 参考][s05]与[Detheme skill][s06] | chrome/自有页面/客户内容/内联窗格/覆盖层分类；`NeutralThemeProvider`、`enabledCustomStyleHooks`、祖先复用与有意嵌套。V8 shim 需同时启用迁移且存在匹配 shim，否则用 `NeutralV8ThemeProvider`。保留嵌套 `getTheme()`/`createV9Theme(getTheme())` 风险及 V9 token 分层/import；适用处保留客户主题。共同记录分类、provider 祖先链、token/样式决策及相关渲染状态截图；可见主题变更缺少截图须明确标为证据缺口，不能凭源码/token 判通过。 | `sharepoint.verification.themes-and-host`、`sharepoint.spds.component-contract` |
| B14 · [本地化][s02]及[共享工具复用][s03] | N03：资源包括辅助文本/回退、完整可重排句子与翻译上下文。数值计数用 `StringHelper.formatWithLocalizedCountValue` 配合句子区间（示例 `0\|\|1\|\|2-`）；实体名占位符不要求区间。`formatToArray`、`Intl.ListFormat`、安全富文本、选择标签的 `linkify: false`；Fluent 自动翻转例外仅限其样式管线。Common 保留语言中立原则与工具适配推理。 | `sharepoint.utilities.localization-and-formatting`、`sharepoint.selection.components-and-utilities`、`common.topic.forms-and-content`、`common.topic.dynamic-content`、`common.topic.visual-accessibility`、`fluent.selection.components-and-utilities` |
| B15 · [ReplaceComponent 参考][s07] | 绑定版本的 Panel/Drawer 清单：`onRender*`、header/body/footer、几何/滚动、portal/provider、保留 V8 控件、键盘、关闭/动画与焦点后备。比较相同 route/fixture/viewport/state 及所有可达分支；以源 props/shim 行为判断等价，不只看名称或截图。 | `fluent.selection.components-and-utilities`、`sharepoint.verification.themes-and-host`、`common.verification.testing` |
| B16 · [相邻审阅参考及遗漏记录](#a3-相邻或偶然命中的文档)与[评估器匹配证据][s11] | 去敏案例覆盖副本分歧、首次渲染错误空态、自述清单、过期异步、取消/数据域错误、生命周期清理和有范围的 parity。语义/状态责任、lazy 边界、reconciliation/prop 是否存在及必要初始化/runtime identity 转为无障碍回归检查。B11 证据规则要求实际观察到请求验证的失败，以相同已批准场景/基线对照实际测试修订/构建，并为每个适用步骤链接不可变证据；缺失、阻塞、跳过、不确定或矛盾的观察不能靠 diff 或扫描升级为通过。通用包体积预算、报告 schema 和工作流执行留在内容外。 | `common.analysis.root-cause`、`common.implementation.component-contract`、`common.verification.static`、`common.verification.dynamic`、`common.verification.design`、`common.verification.testing` |

### 已新增落点——N01–N03

三个正文均已在 SharePoint `0.1.1` 登记来源绑定和关系，并从概览及选型条目链接。

| 新增项 | 已实现正文 | 已注册 ID |
| --- | --- | --- |
| N01 · RTE/内容检查器契约 | [富文本无障碍](../accessibility-kb/packages/sharepoint/utilities/rich-text-accessibility.md) | `sharepoint.utilities.rich-text-accessibility` |
| N02 · 产品拖动/重排契约 | [拖动与重排](../accessibility-kb/packages/sharepoint/utilities/drag-and-drop.md) | `sharepoint.utilities.drag-and-drop` |
| N03 · 产品本地化契约 | [本地化与格式化](../accessibility-kb/packages/sharepoint/utilities/localization-and-formatting.md) | `sharepoint.utilities.localization-and-formatting` |

## 4. 现有目标精确索引

以下精确列出 35 个已注册 ID，除迁移规则正文外还包括概览、流程及支持档案。三个包均为 `0.1.1`。描述符：[Common](../accessibility-kb/packages/common/package.json)、[Fluent](../accessibility-kb/packages/fluent/package.json)、[SharePoint](../accessibility-kb/packages/sharepoint/package.json)。

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
| `fluent.v8.component-contract` | [V8 播报/焦点契约](../accessibility-kb/packages/fluent/v8/component-contract.md) |
| `fluent.v9.component-contract` | [V9 组件/播报/焦点契约](../accessibility-kb/packages/fluent/v9/component-contract.md) |
| `fluent.selection.components-and-utilities` | [Fluent 选型](../accessibility-kb/packages/fluent/selection/components-and-utilities.md) |
| `sharepoint.overview` | [SharePoint 概览](../accessibility-kb/packages/sharepoint/README.md) |
| `sharepoint.selection.components-and-utilities` | [SharePoint 选型](../accessibility-kb/packages/sharepoint/selection/components-and-utilities.md) |
| `sharepoint.spds.component-contract` | [SPDS 委托/组合契约](../accessibility-kb/packages/sharepoint/spds/component-contract.md) |
| `sharepoint.utilities.announcements-and-focus` | [播报/焦点契约](../accessibility-kb/packages/sharepoint/utilities/announcements-and-focus.md) |
| `sharepoint.utilities.rich-text-accessibility` | [富文本无障碍](../accessibility-kb/packages/sharepoint/utilities/rich-text-accessibility.md) |
| `sharepoint.utilities.drag-and-drop` | [拖动与重排](../accessibility-kb/packages/sharepoint/utilities/drag-and-drop.md) |
| `sharepoint.utilities.localization-and-formatting` | [本地化与格式化](../accessibility-kb/packages/sharepoint/utilities/localization-and-formatting.md) |
| `sharepoint.profile.support-policy` | [支持策略](../accessibility-kb/packages/sharepoint/profiles/support-policy.md) |
| `sharepoint.profile.support-matrix` | [支持矩阵](../accessibility-kb/packages/sharepoint/profiles/support-matrix.json) |
| `sharepoint.verification.themes-and-host` | [主题/宿主验证](../accessibility-kb/packages/sharepoint/verification/themes-and-host.md) |
| `sharepoint.case.duplicate-announcement` | [重复播报案例](../accessibility-kb/packages/sharepoint/cases/duplicate-announcement.md) |

用概览选择契约，用 Common 流程组织推理。基础知识及权威性/适用性解释来源；支持档案将支持、适用性、验证及例外分开。两个案例提供具体的假设性正反场景，不是事故记录。

## 5. 操作边界与独立来源获取

- **现有插件保持不变。** 设置、provider、浏览器/AT 操作、租约、证据采集、PR 发布及 run/harness 生命周期仍由其操作实现负责。保留 owner/run/affinity 与规范门禁。KB 流程提供推理，不是可执行替代品。
- **有意保留的内容边界：** 标题大纲决策、证据质量规则及历史有范围的 Important/Minor 评定规则已保留于 B02/B06/B07/B11/B12/B13/B15/B16；该评定规则不是 MAS 分类，也不替代当前产品政策。仓库专属产物/报告 schema 及执行流程（包括 Flight/KillSwitch 和发布命令）仍在 KB 内容之外。
- **MAS 是独立的获取与实现工作。** 经审计源中没有官方 MAS 规则正文、ID 或获授权的规则 API。统一 KB/MAS 适配器仍是[技术设计第 11 节](TECH-DESIGN.zh-CN.md#11-待实现一个-kb-入口包含-mas-规则能力)中的设计，留待后续实现，不是已迁移 API。
- **当前来源资格审核：** 官方 SPDS/SharePoint 工具及产品支持连接仍待接入；Fluent V9 文档目标待审阅，不能作为 V8 来源。支持矩阵仍为 `awaiting-official-source`、`products: []`。通过贡献流程取得版本相关来源与审核，不编造声明。

## 6. 维护与验证记录

2026-09-15 验证：**KB 97 项、现有插件 79 项测试通过**，两套生成检查通过。
内容构建包含 35 个条目，保留四份不可变产物（两份原快照及两份新 0.1.1 快照）。
MCP 回归通过公开的本地工具检索、读取迁入规则；未修改现有插件、运行时实现或 MAS 适配器。

后续贡献同时更新所属正文和描述符：“源条款 → 目标 ID → 有范围的规则/例外 → 正反例”。范围不变则复用现有 ID；新增可独立引用内容时补导航和关系。Common 保持产品独立，Fluent 保持版本区分，SharePoint 保持宿主范围。协调精确版本并按[设计中的发布流程](TECH-DESIGN.zh-CN.md#9-版本生成与发布)发布。

本次更新将当前 authored 正文、包 README 与描述符对照既有固定来源审计。两种语言均保留 B01–B16、已注册 N01–N03、精确的 35 个目标 ID 及未改动的 53 路径 / 41 正文附录。

在仓库根目录验证：重跑第 2 节快照命令，检查固定来源归档完整性/漂移；用 `npm --prefix knowledge-server run build`、`npm --prefix knowledge-server test` 和 `npm --prefix knowledge-server run check` 检查 KB 生成/发布、schema/内容/文档回归及生成一致性。用 `npm run build`、`npm test` 和 `npm run check` 检查插件市场生成、回归及生成一致性。按已完成的运行记录结果；这些检查不证明 live AT 行为或官方来源批准。

**结果：经审计的可复用规则已在 authored 内容中完成迁移；独立来源资格审核、发布验证和未来 MAS 适配器是分别跟进的工作。**

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

这些候选同时包含操作指令和可复用评估规则。评估器的覆盖层归因、录制质量及匹配基线/逐步骤证据规则，已在 B11 通过 `agentow-evaluator` 迁移到 `common.verification.dynamic`，B16 补充回归解释。代理执行、路由、验证器及产物/报告 schema 仍留在实际操作来源中。

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