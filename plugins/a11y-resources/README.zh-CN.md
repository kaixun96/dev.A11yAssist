# a11y-resources

[English](README.md)

## 适合什么需求

查看资源状态；按明确授权释放已完成的评估机任务

## 使用前提

获授权的资源连接；释放还需要原始、已完成且仍归本任务所有的记录。

Node.js 22+.

执行实际操作前，只配置需要的连接，把配置放在私有文件中；启动 Copilot 前设置绝对路径 `A11Y_ASSIST_CONFIG`，然后重启。详见 [连接配置](docs/PROVIDERS.md) 和 [配置示例](config/README.md)。默认不启用任何连接。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-resources@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-resources 通过已配置的连接查看资源归属和就绪状态，不申请或释放任何资源。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

不是通用资源分配器或恢复驱动。状态过期不代表归属失效；release-evaluator 是另行明确授权的操作，不会随状态查询执行。

## 参考资料

- [能力接口与边界](docs/CAPABILITIES.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
