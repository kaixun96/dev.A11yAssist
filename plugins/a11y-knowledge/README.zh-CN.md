# a11y-knowledge

[English](README.md)

## 适合什么需求

使用共享 Common、SPDS、Fluent V8/V9 和 SharePoint 知识进行无障碍代码指导、根因分析、静态及设计审查和测试规划

## 使用前提

Node.js 22+、已启用 MCP 的宿主，以及待审代码或问题；自动解析知识库，无需执行配置或其他插件。

本插件注册独立的只读知识 MCP，读取共享 Common、Fluent 和 SharePoint 条目。知识使用需要 Node.js 22+ 和已启用 MCP 的宿主，无需其他插件、provider 或 `A11Y_ASSIST_CONFIG`。按可选知识库根目录、已验证仓库布局、已验证共享用户缓存、固定 HTTPS 下载的顺序自动解析。正文不随插件打包；首次无缓存且无有效本地知识库时需要联网访问已发布的固定制品，本地构建不会发布制品。有效缓存或本地知识库可离线使用；无效配置根目录或损坏缓存明确失败，不回退或自动修复。读取完整条目并引用来源及状态；pending 来源是缺口，不是权威依据。详见 [知识可用性](references/README.md)。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-knowledge@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-knowledge 使用固定版本的共享组件知识，审查这个 Fluent V9 对话框的键盘、焦点恢复和播报，引用完整条目及来源状态。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

仅提供只读知识 MCP，不包含操作运行时、扫描器或真实 AT。引用锁定共享 Common、Fluent 和 SharePoint 包，正文不随插件打包。按实际技术栈和版本读取；首次无缓存时需要有效本地知识库或联网访问已发布的固定制品，本地构建不会发布制品。读取完整条目，搜索摘要不是规则，pending 来源是缺口。知识不授予执行权限。

## 参考资料

- [共享知识库版本锁定与自动知识 MCP](references/README.md)
- [只读知识使用指南](skills/a11y-knowledge/SKILL.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
