# a11y-knowledge-odsp

[English](README.md)

## 适合什么需求

SPDS、Fluent V8/V9、SharePoint 专属知识，已包含通用基础

## 使用前提

Copilot CLI 和相关项目代码；无需 AgentOW、DevBox 或执行连接。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-knowledge-odsp@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-knowledge-odsp 审查这个 Fluent V9 对话框的焦点恢复和播报。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

只读。已包含项目原文和通用主题，无需另外安装通用知识插件。归档里的命令只是参考资料，不是执行授权。

## 参考资料

- [项目知识索引](integrations/agentow/knowledge/README.md)
- [SPDS 和 Fluent V8/V9](integrations/agentow/knowledge/fluent-spds.md)
- [SharePoint 专属指导](integrations/agentow/knowledge/sharepoint.md)
- [完整原文导航](integrations/agentow/knowledge/complete-source-guide.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
