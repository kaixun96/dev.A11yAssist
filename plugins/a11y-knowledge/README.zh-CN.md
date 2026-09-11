# a11y-knowledge

[English](README.md)

## 适合什么需求

无障碍知识与静态审查，内置通用基础及 ODSP 子模块（SPDS、Fluent V8/V9、SharePoint）

## 使用前提

Copilot CLI，以及待审代码或问题；不需要执行环境配置。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-knowledge@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-knowledge 使用内置组件知识，审查这个 Fluent V9 对话框的键盘、焦点恢复和播报。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

一次安装包含通用主题和完整 ODSP 参考资料，无需另装插件。按实际技术栈和版本读取；其他项目只使用通用知识，不套用 ODSP 约定。只读，不运行扫描器或真实辅助技术；归档命令只是参考资料，不是执行授权。

## 参考资料

- [通用无障碍知识](knowledge/README.md)
- [内置 ODSP 子模块](skills/a11y-knowledge-odsp/SKILL.md)
- [项目知识索引](integrations/agentow/knowledge/README.md)
- [SPDS 和 Fluent V8/V9](integrations/agentow/knowledge/fluent-spds.md)
- [SharePoint 专属指导](integrations/agentow/knowledge/sharepoint.md)
- [完整原文导航](integrations/agentow/knowledge/complete-source-guide.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
