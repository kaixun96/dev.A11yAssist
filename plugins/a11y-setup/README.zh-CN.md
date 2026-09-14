# a11y-setup

[English](README.md)

## 适合什么需求

检查和准备 Windows 无障碍环境：按需安装浏览器、NVDA、音频和 Voice Access 所需依赖

## 使用前提

知识需要 Node.js 22+ 和已启用 MCP 的宿主；环境检查需要在实际 Windows 评估机执行获授权命令；安装准备需要主机归属和变更授权。

本插件注册独立的只读知识 MCP，读取共享 Common、Fluent 和 SharePoint 条目。知识使用需要 Node.js 22+ 和已启用 MCP 的宿主，无需其他插件、provider 或 `A11Y_ASSIST_CONFIG`。按可选知识库根目录、已验证仓库布局、已验证共享用户缓存、固定 HTTPS 下载的顺序自动解析。正文不随插件打包；首次无缓存且无有效本地知识库时需要联网访问已发布的固定制品，本地构建不会发布制品。有效缓存或本地知识库可离线使用；无效配置根目录或损坏缓存明确失败，不回退或自动修复。读取完整条目并引用来源及状态；pending 来源是缺口，不是权威依据。详见 [知识可用性](references/README.md)。

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

使用共享的限定范围原生准备脚本及独立的只读知识 MCP，读取 Common、Fluent 和 SharePoint。无需其他插件，不包含操作 MCP、浏览器助手、provider 或知识库正文。知识访问不授予环境准备权限；首次无缓存时需要有效本地知识库或联网访问已发布的固定制品。装插件不等于安装第三方工具；仅准备明确获授权的依赖子集。驱动、同意提示、提权和重启单独处理，不自动安装扫描器、ADK 或配置实时 provider。安装成功不代表运行就绪。

## 参考资料

- [环境准备与授权门禁](docs/SETUP.md)
- [环境能力就绪报告](setup/report.template.md)
- [共享知识库版本锁定与自动知识 MCP](references/README.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
