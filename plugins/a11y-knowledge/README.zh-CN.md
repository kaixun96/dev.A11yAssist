# a11y-knowledge

[English](README.md)

## 适合什么需求

面向通用和 ODSP 项目的无障碍知识与静态审查，使用可移植的基础主题及提供的当前组件文档

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

一次安装包含可离线使用的通用主题，无需另装插件。项目专属规则需依据提供的当前文档及实际技术栈和版本；缺失规则属于上下文缺口。只读，不运行扫描器或真实辅助技术；静态审查不等于运行验证。

## 参考资料

- [通用无障碍知识](knowledge/README.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
