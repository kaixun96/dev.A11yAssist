# a11y-publish

[English](README.md)

## 适合什么需求

向已有 Draft PR 附加证据；配置后接入更完整的发布流程

## 使用前提

获授权的 PR 连接、精确 HEAD 和哈希绑定文件；内置附件操作使用 ADO 认证。

Node.js 22+.

执行实际操作前，只配置需要的连接，把配置放在私有文件中；启动 Copilot 前设置绝对路径 `A11Y_ASSIST_CONFIG`，然后重启。详见 [连接配置](docs/PROVIDERS.md) 和 [配置示例](config/README.md)。默认不启用任何连接。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-publish@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-publish 将已批准且哈希绑定的证据附加到 <已有 Draft PR> 的 <精确 HEAD>，只更新描述。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

内置 attach-evidence 不创建 PR、不批准 review，也不验证媒体行为。完整 publish 需要另行验收的连接；不发 PR 评论、不合并，也不重放结果不明的上传。

## 参考资料

- [内置 ADO 操作及配置](docs/NATIVE-CAPABILITIES.md)
- [能力接口与边界](docs/CAPABILITIES.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
