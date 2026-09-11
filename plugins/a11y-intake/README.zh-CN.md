# a11y-intake

[English](README.md)

## 适合什么需求

读取获授权的工作项，整理验收条件和复现场景

## 使用前提

配置工作项访问连接；内置 ADO read-item 使用主机管理的认证。

Node.js 22+.

执行实际操作前，只配置需要的连接，把配置放在私有文件中；启动 Copilot 前设置绝对路径 `A11Y_ASSIST_CONFIG`，然后重启。详见 [连接配置](docs/PROVIDERS.md) 和 [配置示例](config/README.md)。默认不启用任何连接。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-intake@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-intake 读取获授权的工作项 <工作项链接>，整理预期行为和缺少的复现信息。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

ADO read-item 读取字段、讨论和附件元数据，不代表附件内容已审阅或验收条件已完成。不会申请评估机、创建分支或 PR；先遵守部署环境的归属门禁。

## 参考资料

- [内置 ADO 操作及配置](docs/NATIVE-CAPABILITIES.md)
- [能力接口与边界](docs/CAPABILITIES.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
