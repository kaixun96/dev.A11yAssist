# a11y-test-categories

[English](README.md)

## 适合什么需求

对范围内每个对象和可达状态，逐项执行全部十类无障碍测试规程

## 使用前提

Feature 范围和对象/状态清单；本地覆盖核对需要 Node.js 22+；现场检查需要获授权的浏览器/AT 工具及资源归属。

## 安装你选中的插件

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-test-categories@a11y-assist
```

安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。

## 使用示例

```text
/a11y-test-categories 按全部十类检查 <feature> 的每个元素/状态，将逐步骤矩阵、证据及缺口保存到 <私有目录>。不抽查、不修复、不提单。
```

将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。

## 能力边界

测试规程和矩阵工具唯一所属插件。Bug Bash 通过明确配置的已安装路径调用版本化 API，不再内嵌副本。声明 Liquid HTTP MCP 用于只读标准检索，仍需用户认证；不提供浏览器/AT 后端。矩阵核对不证明证据真实或符合 WCAG，无法执行的检查保留缺口。

## 参考资料

- [全部对象的测试规程与覆盖核对（英文）](docs/TEST-CATEGORIES.md)
- [测试分类与使用说明](docs/TEST-CATEGORIES.zh-CN.md)
- [Liquid MCP 连接与 MAS/WCAG 检索](docs/LIQUID-STANDARDS.md)
- [十类测试规程索引](procedures/README.md)

[返回插件目录](https://github.com/kaixun96/dev.A11yAssist/blob/main/README.zh-CN.md)
