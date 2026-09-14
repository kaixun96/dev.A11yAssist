# a11y-bug-bash

[English](README.md)

## 适合什么需求

面向 feature 的无障碍 Bug Bash：根据 context 和验证步骤制定覆盖清单，检查页面、审查源码，分开报告已复现 bug 与代码风险

## 使用前提

Feature context 和验证步骤；知识需要 Node.js 22+ 和已启用 MCP 的宿主；代码审查需要只读源码；页面和 AT 检查需要已有、获授权的 Windows 工具连接及资源归属。

本插件注册独立的只读知识 MCP，读取共享 Common、Fluent 和 SharePoint 条目。知识使用需要 Node.js 22+ 和已启用 MCP 的宿主，无需其他插件、provider 或 `A11Y_ASSIST_CONFIG`。按可选知识库根目录、已验证仓库布局、已验证共享用户缓存、固定 HTTPS 下载的顺序自动解析。正文不随插件打包；首次无缓存且无有效本地知识库时需要联网访问已发布的固定制品，本地构建不会发布制品。有效缓存或本地知识库可离线使用；无效配置根目录或损坏缓存明确失败，不回退或自动修复。读取完整条目并引用来源及状态；pending 来源是缺口，不是权威依据。详见 [知识可用性](references/README.md)。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-bug-bash@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-bug-bash 检查 <feature>：<context 和预期行为>。按 <验证步骤> 操作 <获授权测试 URL 和安全数据>，源码在 <路径/版本>。使用已有浏览器连接，预算 30 分钟，报告保存到 <私有输出目录>。分开报告页面 bug 和代码风险，不修改代码或提单。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

发现框架仅提供只读知识 MCP，不包含浏览器、扫描器、AT 或 provider 运行时。内部复用单一知识与环境准备 skill，使用本插件知识工具及顶层知识库引用；环境准备资源使用明确的内部目录，不是第二个插件根目录。无需其他插件、不重复注册公共 skill，不打包知识库正文。环境准备默认检查和规划；按需安装依赖需要单独的主机变更授权及实际归属。首次无缓存的知识使用需要有效本地知识库或联网访问已发布的固定制品。缺少工具或源码时明确报告部分覆盖，不宣称 PASS。不自动改代码、构建、提 bug 或建 PR。

## 参考资料

- [Bug Bash 流程与边界](docs/BUG-BASH.md)
- [Feature context 模板](bug-bash/context.template.md)
- [问题与覆盖率报告模板](bug-bash/report.template.md)
- [环境准备与授权门禁](docs/SETUP.md)
- [内部复用的环境准备](modules/a11y-setup/skills/a11y-setup/SKILL.md)
- [内部复用的知识审查](modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md)
- [共享知识库版本锁定与自动知识 MCP](references/README.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
