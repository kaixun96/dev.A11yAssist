# agent-operations

[English](README.md)

## 适合什么需求

清理明确归本任务所有的资源，处理限定范围的录制或 NVDA 恢复

## 使用前提

获授权的 operations 连接，以及对应范围的原始归属记录。

Node.js 22+.

执行实际操作前，只配置需要的连接，把配置放在私有文件中；启动 Copilot 前设置绝对路径 `A11Y_ASSIST_CONFIG`，然后重启。详见 [连接配置](docs/PROVIDERS.md) 和 [配置示例](config/README.md)。默认不启用任何连接。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install agent-operations@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/agent-operations 读取 <已有 operation ID> 的状态，不重试执行、不停止任何进程。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

不是通用进程终止工具。recover-media 和 recover-nvda 使用原始身份记录，只证明限定范围，不代表全部清理完成；不接管忙碌、非自有或记录不完整的任务。

## 参考资料

- [能力接口与边界](docs/CAPABILITIES.md)
- [连接配置与协议](docs/PROVIDERS.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
