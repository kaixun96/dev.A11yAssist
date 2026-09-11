# a11y-bug-bash

[English](README.md)

## 适合什么需求

面向 feature 的无障碍 Bug Bash：根据 context 和验证步骤制定覆盖清单，检查页面、审查源码，分开报告已复现 bug 与代码风险

## 使用前提

Feature context 和验证步骤；代码审查需要只读源码；实际页面和 AT 检查需要已有、获授权的 Windows 工具连接及资源归属。

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

首版检查框架，不自带浏览器、扫描器或录制器。内部原样复用 a11y-knowledge skills 和完整 ODSP 参考资料，无需另装插件，也不重复注册知识命令。缺少工具或源码时明确报告部分覆盖，不宣称 PASS。不自动改代码、构建、提 bug 或建 PR。

## 参考资料

- [Bug Bash 流程与边界](docs/BUG-BASH.md)
- [Feature context 模板](bug-bash/context.template.md)
- [问题与覆盖率报告模板](bug-bash/report.template.md)
- [内部复用的知识审查](modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md)
- [随包项目知识](modules/a11y-knowledge/integrations/agentow/knowledge/README.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
