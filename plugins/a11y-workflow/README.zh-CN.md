# a11y-workflow

[English](README.md)

## 适合什么需求

可选的、以证据为依据的端到端修复工作流

## 使用前提

已验收的工作项、资源、Windows 采集、源码、验证、review、发布和清理连接。

Node.js 22+.

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

已包含共用能力，不要求安装其他小插件；AgentOW 可选。安装不等于环境已就绪。没有已复现的 BEFORE 就不改源码或建 PR，也不允许未验证发布。

## 参考资料

- [可选工作流与证据门禁](docs/WORKFLOW.md)
- [连接配置与协议](docs/PROVIDERS.md)
- [能力接口与边界](docs/CAPABILITIES.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
