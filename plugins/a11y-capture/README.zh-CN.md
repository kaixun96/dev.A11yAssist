# a11y-capture

[English](README.md)

## 适合什么需求

采集真实 Windows AT 证据，恢复自有录制、音频或 NVDA 资源

## 使用前提

已验收且支持每次采集前环境检查和采集后异常检查的 Windows 连接、自有评估机和固定场景；AFTER 还需实际源码 HEAD。

Node.js 22+.

执行实际操作前，只配置需要的连接，把配置放在私有文件中；启动 Copilot 前设置绝对路径 `A11Y_ASSIST_CONFIG`，然后重启。详见 [连接配置](docs/PROVIDERS.md) 和 [配置示例](config/README.md)。默认不启用任何连接。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-capture@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-capture 通过获授权的采集连接，在 <自有评估机> 为 <已固定场景> 采集 BEFORE。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

内置 observe-at 在原归属下采集 NVDA Speech Viewer、Narrator ETW/音频及 Voice Access 数字指令/UIA/音频。原始观测不等于 BEFORE/AFTER/discovery PASS；行为、媒体和标签归属需独立评估。不自动安装工具、停止借用进程或释放租约。

## 参考资料

- [能力接口与边界](docs/CAPABILITIES.md)
- [连接配置与协议](docs/PROVIDERS.md)
- [内置执行适配器与支持范围](docs/EXECUTION-ADAPTERS.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
