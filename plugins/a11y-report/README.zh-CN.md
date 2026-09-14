# a11y-report

[English](README.md)

## 适合什么需求

在验证及获授权提单之后生成整体无障碍报告

## 使用前提

原始私有发现日志、证据文件及兼容的测试分类插件版本。

Node.js 22+.

执行实际操作前，只配置需要的连接，把配置放在私有文件中；启动 Copilot 前设置绝对路径 `A11Y_ASSIST_CONFIG`，然后重启。详见 [连接配置](docs/PROVIDERS.md) 和 [配置示例](config/README.md)。默认不启用任何连接。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-report@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-report 为 <任务> 生成最终报告：不同问题数量/类别、真实 Bug 链接、证据、全部未覆盖步骤和清理状态。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

复用唯一报告生成实现，不执行测试、修改源码或创建 Bug。待定操作必须先核对；本地报告交付不等于发送消息，缺口与未提单发现始终保留。

## 参考资料

- [整体报告与核实交付](docs/REPORT.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
