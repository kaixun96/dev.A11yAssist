# A11y Assist

**v0.5 原生执行能力：**`read-item` 可以实际读取 ADO 工作项和完整分页讨论；
`attach-evidence` 可以向已有 Draft PR 上传哈希绑定的文件、下载核对字节，
并更新及回读 PR 描述、HEAD 和 Draft 状态。它们使用内置 ADO 连接，
不需要另写 provider 程序，但不代表已解释讨论、完成验收或验证媒体行为。
Windows 主机准备、附件发布和描述预算实现也已移入公共源码；
AgentOW 的专用浏览器场景保留在独立集成目录。
具体配置和未迁移边界见 [原生能力](docs/NATIVE-CAPABILITIES.md)。

[![English](docs/assets/language-en.svg)](README.md) [![简体中文](docs/assets/language-zh-cn.svg)](README.zh-CN.md)

面向 Copilot CLI 的无障碍知识与模块化工作流插件。可以在代码生成和审查时使用
无障碍指导，也可以配置单项能力，搭建以证据为依据的 Bug 修复流程。

**只想规避生成代码中的常见无障碍问题？从 `a11y-knowledge` 开始。**
不需要 AgentOW、DevBox 或工作流配置。

## 快速开始：无障碍指导与静态代码审查

在 Copilot CLI 中安装：

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-knowledge@a11y-assist
```

重启 Copilot 加载插件，然后直接提问：

```text
/a11y-knowledge 审查这个组件中潜在的无障碍问题。
```

也可以让代码助手在生成时使用：

```text
使用 /a11y-knowledge 指导这个组件的实现，并对生成的代码做静态无障碍审查。
```

插件提供规则和只读审查指导，生成或修改代码仍由代码助手负责。它帮助识别原生语义、
可访问名称、ARIA、键盘处理、焦点和播报等方面的问题。框架相关规则只应在适用的项目中使用。

**默认只读。** 不需要在每次提问时重复“不要运行浏览器或辅助技术”。
知识插件不会启动修复工作流、打开浏览器、操作辅助技术（AT）或运行检测工具。
其审查基于模型对源码的分析，不是自动扫描器，也不保证满足无障碍标准；
无法从源码确定的行为仍属于未验证。

### 包含哪些知识？

| 主题 | 内容 |
|---|---|
| 基础与标准 | 基于源码的判断、适用标准、具体问题与不确定性 |
| 组件语义 | 原生元素、名称/角色/状态、结构、关系和组件契约 |
| 键盘与焦点 | 键盘操作、对话框、导航、焦点保留与恢复 |
| 表单与内容 | 标签、校验、分组、图片替代文本、表格和媒体语义 |
| 动态内容 | 加载/结果/错误、状态消息、播报归属和焦点稳定性 |
| 视觉无障碍 | 源码中可识别的对比度、焦点样式、重排、文本、目标大小和动效风险 |

按相关场景读取主题，不必每次全部加载。不预设框架、操作系统、代码仓库或编码工作流。
示例使用标准 Web 标记；只有明确实际平台契约时，才建议相应的平台实现。
详见[知识索引](knowledge/README.md)。

通用知识包不包含项目专属规则或操作流程。

### SPDS、Fluent V8/V9 和 SharePoint 专属知识

独立安装只读项目知识包：

```powershell
copilot plugin install a11y-knowledge-odsp@a11y-assist
```

重启 Copilot 后使用 `/a11y-knowledge-odsp`。它包含通用基础和完整项目参考：
SPDS/Fluent 组件与 MessageBar 契约、V8/V9 焦点及播报、组件选型与组合、
SharePoint 工具和页面/canvas 焦点、主题、导入路径、review 规则及原始 A11y 上下文。
**不需要 AgentOW、provider、DevBox 或执行工作流。**

查看[专属知识入口](integrations/agentow/knowledge/README.md)、
[完整来源导航](integrations/agentow/knowledge/complete-source-guide.md)和
[逐文件覆盖与排除清单](integrations/agentow/knowledge/source-inventory.json)。
这次保留固定源版本的完整文档正文，不再只选六份。归档中的操作指令和源码仅供阅读，
知识 skill 不会执行它们。没有删除 AgentOW 原文、切换运行中的消费者或镜像外部产品文档。

## 在自己的工作流中按需调用

安装后，通过 `/<插件名>` 调用。

小插件接收各自需要的输入并返回结果，不要求完整工作流、AgentOW 会话或无关的前置阶段。

| 插件 | 用途 | 使用前提 |
|---|---|---|
| `a11y-knowledge` | 代码生成指导、静态审查和无障碍问题咨询 | 无需 provider 即可使用 |
| `a11y-knowledge-odsp` | SPDS、Fluent V8/V9、SharePoint 专属静态指导及完整来源参考 | 只读，无需 AgentOW、provider 或工作流 |
| `a11y-intake` | 工作项读取、验收条件和复现场景 | 接通有权限的工作项读取工具 |
| `a11y-resources` | 查看共享资源的归属和就绪状态 | 状态接口，不是通用资源申请工具 |
| `a11y-capture` | 真实 Windows AT 的 BEFORE/AFTER 取证 | 接通获授权的 Windows 采集工具，并持有评估机使用权 |
| `a11y-validate` | 检查已有证据；按需进行独立行为评估 | evidence-v1 结构检查可直接使用；行为评估需接通评估工具 |
| `a11y-publish` | 面向 reviewer 的 Draft PR 和证据发布 | 接通有权限的 PR 与媒体发布工具 |
| `agent-operations` | 按明确范围清理自有资源、恢复录制进程和默认音频端点、处理原始 NVDA 实例、核对已有操作 | 接通有权限操作指定自有资源的工具 |
| `a11y-workflow` | 可选的完整证据驱动流程 | 接通所需执行工具，并选择源码实现与 review 工具 |

例如，`a11y_validate_evidence` 可直接检查已有的请求/结果文件，不需要创建 Bug run
或配置外部服务。它检查证据契约，不代表实际媒体中的行为已经通过验证。

**v0.10 NVDA 独立入口：** `recover-nvda` 复用原控制器，只处理原任务记录的主进程；
已有停止结果时只读取，不重复关闭。不会重写启动流程，也不代表全部清理完成。
没有原始身份记录、仍在运行或中断后缺少完成凭据的任务会明确拒绝，而不是接管。
详见[能力边界](docs/CAPABILITIES.md#scoped-nvda-recovery-v010)。

**v0.7 本地证据文件核验：** 显式提供 `artifactRoot`，verify 时再提供
`baselineArtifactRoot`，即可核对所有根目录内相对路径证据的实际哈希。
文件缺失、变化或越界都会拒绝；不会下载远程 URI，也不代表独立行为验收。
小插件和完整包复用[同一核验实现](docs/CAPABILITIES.md#optional-local-artifact-bytes-v07)。

外部操作通过 `<prefix>_invoke` 接收 `operationId`、action、context 和 input。
操作记录用于防止重复执行，不会强加完整工作流。包括结果未通过时，下一步也由调用方决定。
详见[能力输入与示例](docs/CAPABILITIES.md)。

**v0.6 调用方自主等待：** CLI 或独立调用方可以显式配置限时轮询，替代完成回调。
由调用方调度同一操作的结果核对，不需要 Twin 连接。默认仍要求回调；
回调失败不会自动降级，超时也不授权重复执行。
详见[等待契约](docs/PROVIDERS.md#explicit-caller-owned-polling-v06)。

各执行插件自带同版本的通用知识副本，以及独立存放的现有执行集成说明，
直接读取这些文件，不需要调用或单独安装
`a11y-knowledge`。完整工作流也自带各阶段工具，无需把所有小插件都安装一遍。

## 可选的完整工作流

**只有需要我们提供的完整编排时，才使用 `a11y-workflow`。**
它调用同一套能力实现，叠加阶段顺序、BEFORE/AFTER、review、失败处理和清理策略。
AgentOW 或其他调用方可以保留自己的工作流，只调用需要的小插件。

外部工具连接仍需配置；安装插件不会自动获得工作项、机器或 PR 权限。
当前通过可信可执行程序接通现有工具，不会自动连接其他 MCP server 中的工具。
缺少连接时，该操作不会启动；
`doctor` 只报告配置情况，不代表评估环境已经可用。

支持的执行环境为 **Twinbot + 多台 Windows DevBox**，或
**Copilot CLI + 单台/多台 Windows DevBox**。知识、证据结构检查及独立的非采集操作
不需要这些主机配置。
执行插件需要 Node.js 22+。

安装完整入口：

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-workflow@a11y-assist
```

为自己的编码环境选择 `source` 和 `review` 连接。AgentOW 是可选项，不再默认安装。
需要现有 AgentOW/odsp-web 集成时，单独安装 `agentow-copilot@agentOW`，
并明确设置 `workflowProfile: "agentow-odsp"` 及其 `agentow` 连接。

使用 [config/](config/) 中的模板创建私有工具连接配置，并在重启 Copilot 前设置其绝对路径：

```powershell
$env:A11Y_ASSIST_CONFIG = 'C:\YourPrivateDirectory\a11y-config.json'
```

执行前阅读[工作流契约](docs/WORKFLOW.md)和 [provider 配置](docs/PROVIDERS.md)。
真实 BEFORE/AFTER 证据及相关门禁不可省略，静态代码审查不能替代它们。

只安装某一项执行能力时，使用
`copilot plugin install <plugin-name>@a11y-assist`。
[tools/install.ps1](tools/install.ps1) 可以打印安装命令；
`-Execute` 执行命令，`-Plugin all` 安装全部八个插件。
只有明确需要同时安装 AgentOW 时才添加 `-WithAgentOW`。

## 与 AgentOW 的关系

AgentOW 是独立调用方，不是这些插件的必需父级。它可以在保留自身工作流的同时，
调用已加载的能力 MCP 工具；现有 `/agentow-a11y` 编排不会被静默替换。

evidence-v1 校验器统一维护在本仓库的 `runtime/evidence-v1.mjs`。
AgentOW 可以在原工具路径使用按提交固定、自动生成的副本，保留离线使用能力，
而不是另维护一份实现。详见[调用方集成](integrations/agentow/README.md)。

知识迁移目前采用**先复制、后统一切换**的方式：共享主题已放入本仓库，
其余 AgentOW 原始引用和现有运行环境保留，后续迁移及冗余清理在相应兼容门禁通过后进行。
通用静态审查知识与 `integrations/agentow/` 中保留的操作和项目专项内容分开；
只有执行插件打包该目录，`a11y-knowledge` 不打包也不读取它。
安装本仓库不会更新正在运行的 worker。

未来完整工作流的集成仍由 AgentOW 负责源码，Windows 证据 provider 负责真实 AT。
不能在 AgentOW 源码步骤中递归调用 `a11y-workflow`，也不能借用 AgentOW 的
未验证 Draft PR 回退路径绕过 A11y Assist 的严格门禁。

详见[知识迁移](docs/KNOWLEDGE.md)和[执行部署计划](docs/MIGRATION.md)。

## 更新与开发

使用主机支持的插件管理器更新，并在安全时机按需重启。
向仓库推送代码不会热更新当前会话；正在执行的工作流应固定其使用的插件版本。

源文件位于 `skills/`、`knowledge/`、`integrations/`、`runtime/`、`contracts/` 和 `adapters/`。
`plugins/`、marketplace 和 release 清单均为生成产物，不要手工修改。
独立安装包中的副本是分发产物，不是另一套实现。
构建会移除生成包中已退役的文件，避免旧操作指令在更新后仍残留于独立知识包。

使用 Node.js 22+：

```powershell
npm run build
npm test
npm run check
```

详见[发布流程](docs/RELEASING.md)。

## 访问与许可

仓库公开不等于授予开源许可，详见 [LICENSE](LICENSE)。操作相关服务的权限需要单独获取。
请勿提交凭据、浏览器 profile、私有环境配置或生产证据。
