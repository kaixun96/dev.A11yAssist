# a11y-knowledge

[English](README.md)

## 适合什么需求

通用无障碍知识，用于代码生成指导和静态审查

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
/a11y-knowledge 审查这个组件的键盘、焦点和可访问名称问题。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

只读分析源码，不修改代码、不运行扫描器或辅助技术。建议不等于合规结论。

## 参考资料

- [通用无障碍知识](knowledge/README.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
