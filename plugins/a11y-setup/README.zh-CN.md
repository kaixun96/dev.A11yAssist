# a11y-setup

[English](README.md)

## 适合什么需求

先落实 DevBox 资源与归属，再检查和准备所需 Windows 无障碍工具

## 使用前提

Copilot 可在实际 Windows 评估机执行获授权命令；安装准备需要主机归属和变更授权。

Node.js 22+.

执行实际操作前，只配置需要的连接，把配置放在私有文件中；启动 Copilot 前设置绝对路径 `A11Y_ASSIST_CONFIG`，然后重启。详见 [连接配置](docs/PROVIDERS.md) 和 [配置示例](config/README.md)。默认不启用任何连接。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-setup@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-setup check <Windows 评估机> 的浏览器和 NVDA 环境，将已安装版本、缺少依赖和具体准备步骤保存到 <私有输出目录>。暂不安装或打开应用。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

包含资源查询/释放及可选的原 recovery lease 下 Dev Center 启动/回读适配器，不再单装 resources。云端开机不代表 Console/AT 就绪；保留原分配器和进行中连接，不强制释放或自动安装扫描器。

## 参考资料

- [环境准备与授权门禁](docs/SETUP.md)
- [内置执行适配器与支持范围](docs/EXECUTION-ADAPTERS.md)
- [环境能力就绪报告](setup/report.template.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
