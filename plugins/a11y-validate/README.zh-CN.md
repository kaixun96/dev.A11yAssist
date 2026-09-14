# a11y-validate

[English](README.md)

## 适合什么需求

检查已有证据文件；按需请求独立行为评估

## 使用前提

结构检查只需 Node.js 22+ 和 evidence-v1 文件；行为评估需要已验收的连接。

Node.js 22+.

本插件注册独立的只读知识 MCP，读取共享 Common、Fluent 和 SharePoint 条目。知识使用需要 Node.js 22+ 和已启用 MCP 的宿主，无需其他插件、provider 或 `A11Y_ASSIST_CONFIG`。按可选知识库根目录、已验证仓库布局、已验证共享用户缓存、固定 HTTPS 下载的顺序自动解析。正文不随插件打包；首次无缓存且无有效本地知识库时需要联网访问已发布的固定制品，本地构建不会发布制品。有效缓存或本地知识库可离线使用；无效配置根目录或损坏缓存明确失败，不回退或自动修复。读取完整条目并引用来源及状态；pending 来源是缺口，不是权威依据。详见 [知识可用性](references/README.md)。

仅使用 `a11y_validate_evidence` 做结构检查时，跳过 provider 配置；需要独立行为评估时才配置相应连接。

执行实际操作前，只配置需要的连接，把配置放在私有文件中；启动 Copilot 前设置绝对路径 `A11Y_ASSIST_CONFIG`，然后重启。详见 [连接配置](docs/PROVIDERS.md) 和 [配置示例](config/README.md)。默认不启用任何连接。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-validate@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-validate 检查这些 evidence-v1 request/result 文件的结构，不启动工作流或控制浏览器。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

a11y_validate_evidence 工具无需 provider 或流程日志。结构与哈希通过不等于真实 AT 或行为通过；verify 模式还需要基线文件和仓库根路径。

## 参考资料

- [能力接口与边界](docs/CAPABILITIES.md)
- [可选工作流与证据门禁](docs/WORKFLOW.md)
- [共享知识库版本锁定与自动知识 MCP](references/README.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
