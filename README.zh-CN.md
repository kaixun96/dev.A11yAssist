# A11y Assist

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
| 基础与标准 | 用户影响、WCAG 分类和证据选择 |
| 组件无障碍 | 语义、名称/角色/状态、播报、焦点、键盘、对比度和重排；包含 odsp-web / SPDS / Fluent 专项规则 |
| 证据契约 | AgentOW 的版本化 BEFORE/AFTER 产物、场景身份和精确提交绑定 |
| Windows 主机测试 | NVDA、Narrator、Voice Access、录制前置条件和清理流程 |
| PR 证据 | 匹配截图、标注、真实录屏、标题层级上下文、Voice Access 编号和媒体发布 |
| 持久评估浏览器 | 专用 Chromium profile、认证和匹配截图 |

按相关场景读取主题，不必每次全部加载。操作类参考文档属于知识，不代表获得了执行命令的授权。
详见[知识索引](knowledge/README.md)。

## 选择插件

安装后，通过 `/<插件名>` 调用。

| 插件 | 用途 | 当前可用性 |
|---|---|---|
| `a11y-knowledge` | 代码生成指导、静态审查和无障碍问题咨询 | 无需 provider 即可使用 |
| `a11y-intake` | Bug 接收、验收条件和标准复现场景 | 需要经过验证的 provider |
| `a11y-resources` | 查看共享资源的归属和就绪状态 | 状态接口，不是通用资源申请工具 |
| `a11y-capture` | 真实 Windows AT 的 BEFORE/AFTER 取证 | 需要经过验证的 provider |
| `a11y-validate` | 证据完整性与独立行为评估 | 需要经过验证的 provider |
| `a11y-publish` | 面向 reviewer 的 Draft PR 和证据发布 | 需要经过验证的 provider |
| `agent-operations` | 持久化进度、核对已有请求和清理自有资源 | 需要经过验证的 provider |
| `a11y-workflow` | 编排完整的证据驱动工作流 | 需要经过验证的 providers，包括 AgentOW 集成 |

各执行插件自带同版本的知识副本，直接读取这些文件，不需要调用或单独安装
`a11y-knowledge`。完整工作流也自带各阶段工具，无需把所有小插件都安装一遍。

## 执行工作流

**执行插件目前是可安装的基础框架，不是开箱即用的生产部署。**
本仓库提供共享运行时和门禁；实际访问工作项、管理资源、采集证据和发布 PR 的
providers（执行适配器）需要自行配置并验证。缺少 provider 时停止执行；
`doctor` 只报告配置情况，不代表评估环境已经可用。

支持的执行环境为 **Twinbot + 多台 Windows DevBox**，或
**Copilot CLI + 单台/多台 Windows DevBox**。只读知识使用不受这些主机要求限制。
执行插件需要 Node.js 22+。

安装完整入口：

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-workflow@a11y-assist
copilot plugin marketplace add kaixun96/dev.AgentOW
copilot plugin install agentow-copilot@agentOW
```

使用 [config/](config/) 中的模板创建私有 provider 配置，并在重启 Copilot 前设置其绝对路径：

```powershell
$env:A11Y_ASSIST_CONFIG = 'C:\YourPrivateDirectory\a11y-config.json'
```

执行前阅读[工作流契约](docs/WORKFLOW.md)和 [provider 配置](docs/PROVIDERS.md)。
真实 BEFORE/AFTER 证据及相关门禁不可省略，静态代码审查不能替代它们。

只安装某一项执行能力时，使用
`copilot plugin install <plugin-name>@a11y-assist`。
[tools/install.ps1](tools/install.ps1) 可以打印安装命令；
`-Execute` 执行命令，`-Plugin all` 安装全部八个插件。

## 与 AgentOW 的关系

AgentOW 是独立插件。**它现有的 `/agentow-a11y` 流程不会自动调用这些插件。**

知识迁移目前采用**先复制、后统一切换**的方式：共享主题已放入本仓库，
AgentOW 原有文件、引用和运行时保持不变。等完整集成就绪后，再统一接入并清理冗余。
安装本仓库不会切换 AgentOW 的依赖，也不会更新正在运行的 worker。

未来完整工作流的集成仍由 AgentOW 负责源码，Windows 证据 provider 负责真实 AT。
不能在 AgentOW 源码步骤中递归调用 `a11y-workflow`，也不能借用 AgentOW 的
未验证 Draft PR 回退路径绕过 A11y Assist 的严格门禁。

详见[知识迁移](docs/KNOWLEDGE.md)和[执行部署计划](docs/MIGRATION.md)。

## 更新与开发

使用主机支持的插件管理器更新，并在安全时机按需重启。
向仓库推送代码不会热更新当前会话；正在执行的工作流应固定其使用的插件版本。

源文件位于 `skills/`、`knowledge/`、`runtime/`、`contracts/` 和 `adapters/`。
`plugins/`、marketplace 和 release 清单均为生成产物，不要手工修改。
独立安装包中的副本是分发产物，不是另一套实现。

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
