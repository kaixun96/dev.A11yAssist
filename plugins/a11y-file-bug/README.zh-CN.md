# a11y-file-bug

[English](README.md)

## 适合什么需求

验证后按明确授权创建 Bug，包含详细复现、原因及不确定性、校验后的证据附件

## 使用前提

已验证的原始发现任务/问题、审阅后的附件、项目字段及获授权提单连接。

Node.js 22+.

执行实际操作前，只配置需要的连接，把配置放在私有文件中；启动 Copilot 前设置绝对路径 `A11Y_ASSIST_CONFIG`，然后重启。详见 [连接配置](docs/PROVIDERS.md) 和 [配置示例](config/README.md)。默认不启用任何连接。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-file-bug@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-file-bug 为 <已验证任务/问题> 起草 Bug，包含环境、复现、预期/实际、原因及已审阅视频的时间点；批准前不提交。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

提供 ADO WIT 提单、附件上传与回读，使用固定操作 ID 核对未知结果；不自动提单。仅接受实际页面发现，不接受种子缺陷或代码风险。简单上传总计最多 128 MiB，更大证据需要获授权分块适配器。不操作 PR。

## 参考资料

- [Bug 描述、创建与证据附件](docs/FILE-BUG.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
