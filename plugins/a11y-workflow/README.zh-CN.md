# a11y-workflow

[English](README.md)

## 适合什么需求

可选的、以证据为依据的端到端修复工作流

## 使用前提

已验收的工作项、资源、Windows 采集、源码、验证、review、发布和清理连接。

Node.js 22+.

本插件注册独立的只读知识 MCP，读取共享 Common、Fluent 和 SharePoint 条目。知识使用需要 Node.js 22+ 和已启用 MCP 的宿主，无需其他插件、provider 或 `A11Y_ASSIST_CONFIG`。按可选知识库根目录、已验证仓库布局、已验证共享用户缓存、固定 HTTPS 下载的顺序自动解析。正文不随插件打包；首次无缓存且无有效本地知识库时需要联网访问已发布的固定制品，本地构建不会发布制品。有效缓存或本地知识库可离线使用；无效配置根目录或损坏缓存明确失败，不回退或自动修复。读取完整条目并引用来源及状态；pending 来源是缺口，不是权威依据。详见 [知识可用性](references/README.md)。

执行实际操作前，只配置需要的连接，把配置放在私有文件中；启动 Copilot 前设置绝对路径 `A11Y_ASSIST_CONFIG`，然后重启。详见 [连接配置](docs/PROVIDERS.md) 和 [配置示例](config/README.md)。默认不启用任何连接。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-workflow@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-workflow 检查 <指定 Bug> 所需的配置，在开始执行前报告缺少的连接。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

已包含共用能力，不要求安装其他小插件。支持 Twinbot 配合多个 Windows DevBox，或 Copilot CLI 配合一个或多个 Windows DevBox；单机是大小为一的资源池，遵守相同门禁。直接配置源码和 review 连接。安装不等于环境已就绪。没有已复现的 BEFORE 就不改源码或建 PR，也不允许未验证发布。

## 参考资料

- [可选工作流与证据门禁](docs/WORKFLOW.md)
- [连接配置与协议](docs/PROVIDERS.md)
- [能力接口与边界](docs/CAPABILITIES.md)
- [共享知识库版本锁定与自动知识 MCP](references/README.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
