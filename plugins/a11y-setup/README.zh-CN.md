# a11y-setup

[English](README.md)

## 适合什么需求

检查和准备 Windows 无障碍环境：按需安装浏览器、NVDA、音频和 Voice Access 所需依赖

## 使用前提

Copilot 可在实际 Windows 评估机执行获授权命令；安装准备需要主机归属和变更授权。

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

复用 AgentOW 使用的共享安装脚本，无需 AgentOW 或 MCP。装插件不等于安装第三方工具；仅准备获授权的依赖子集。驱动、同意提示、提权和重启单独处理，不自动安装扫描器、ADK 或配置实时 provider。安装成功不代表运行就绪。

## 参考资料

- [环境准备与授权门禁](docs/SETUP.md)
- [环境能力就绪报告](setup/report.template.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
