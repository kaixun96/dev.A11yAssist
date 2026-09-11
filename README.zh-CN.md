# A11y Assist - 插件目录

[English](README.md)

挑选需要的无障碍插件，安装到 Copilot CLI，在你自己的工作流里使用。无需安装整套插件。

## 挑选插件

### 知识与静态审查

| 插件与使用说明 | 解决什么问题 | 使用前提 |
|---|---|---|
| [a11y-knowledge](plugins/a11y-knowledge/README.zh-CN.md) | 通用无障碍知识，用于代码生成指导和静态审查 | Copilot CLI，以及待审代码或问题；不需要执行环境配置 |
| [a11y-knowledge-odsp](plugins/a11y-knowledge-odsp/README.zh-CN.md) | SPDS、Fluent V8/V9、SharePoint 专属知识，已包含通用基础 | Copilot CLI 和相关项目代码；无需 AgentOW、DevBox 或执行连接 |

### 单项能力

| 插件与使用说明 | 解决什么问题 | 使用前提 |
|---|---|---|
| [a11y-intake](plugins/a11y-intake/README.zh-CN.md) | 读取获授权的工作项，整理验收条件和复现场景 | 配置工作项访问连接；内置 ADO read-item 使用主机管理的认证 |
| [a11y-resources](plugins/a11y-resources/README.zh-CN.md) | 查看资源状态；按明确授权释放已完成的评估机任务 | 获授权的资源连接；释放还需要原始、已完成且仍归本任务所有的记录 |
| [a11y-capture](plugins/a11y-capture/README.zh-CN.md) | 使用真实 Windows 辅助技术采集 BEFORE／AFTER 证据 | 已完成部署验收的 Windows 采集连接、自有评估机和固定场景；AFTER 还需实际源码 HEAD |
| [a11y-validate](plugins/a11y-validate/README.zh-CN.md) | 检查已有证据文件；按需请求独立行为评估 | 结构检查只需 Node.js 22+ 和 evidence-v1 文件；行为评估需要已验收的连接 |
| [a11y-publish](plugins/a11y-publish/README.zh-CN.md) | 向已有 Draft PR 附加证据；配置后接入更完整的发布流程 | 获授权的 PR 连接、精确 HEAD 和哈希绑定文件；内置附件操作使用 ADO 认证 |
| [agent-operations](plugins/agent-operations/README.zh-CN.md) | 清理明确归本任务所有的资源，处理限定范围的录制或 NVDA 恢复 | 获授权的 operations 连接，以及对应范围的原始归属记录 |

### 可选的完整工作流

| 插件与使用说明 | 解决什么问题 | 使用前提 |
|---|---|---|
| [a11y-workflow](plugins/a11y-workflow/README.zh-CN.md) | 可选的、以证据为依据的端到端修复工作流 | 已验收的工作项、资源、Windows 采集、源码、验证、review、发布和清理连接 |

点击上面的插件，查看各自的安装命令、使用前提、示例、能力限制和随包参考资料。

使用 SPDS、Fluent 或 SharePoint 时，选 **a11y-knowledge-odsp**，它已包含通用知识。只有需要整套流程时才选 **a11y-workflow**，无需同时安装各个小插件。

## 安装你选中的插件

先注册一次插件市场，再安装你选中的插件：

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install <插件名>@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

知识插件无需执行环境配置。执行插件需要 Node.js 22+；证据文件结构检查无需 provider。实际操作需要你配置获授权的连接。安装插件不会自动准备 Windows 评估机，也不会授予服务访问权限。

## 维护者入口

普通用户只需看插件目录和插件页面。[开发说明](docs/DEVELOPMENT.md) 解释源码、打包及兼容出口；[迁移状态](docs/MIGRATION.md) 和 [发布说明](docs/RELEASING.md) 不再混在用户安装主线上。

## 访问与许可

仓库公开不等于授予开源许可，详见 [LICENSE](LICENSE)。服务权限需要单独获取；不要提交凭据、个人 profile 或生产证据。
