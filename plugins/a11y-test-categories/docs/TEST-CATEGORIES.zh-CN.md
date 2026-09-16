# 无障碍测试分类插件

[English](TEST-CATEGORIES.md) | **简体中文**

`a11y-test-categories` 是可独立安装的测试规程插件，为每个测试对象及状态规定检查内容、执行顺序和所需证据。包含十类：键盘与焦点、屏幕阅读器、结构语义、方向与输入用途、视觉颜色、时间与动画、动态内容、触摸指针、认证与表单、Voice Access 语音控制。
MAS/WCAG 正文、例外和映射通过 [Liquid MCP](LIQUID-STANDARDS.md) 按需读取。插件根目录声明 HTTP 连接及四个只读工具，认证仍由使用者完成；Bug Bash 内部模块复用根目录连接。未连接或无权限时明确记录来源缺口；获取标准不等于完成测试。不内置凭据或内部标准正文。

## 如何组合

只有本插件分发测试规程与矩阵工具。Bug Bash 需要单独安装本插件，并通过 `pluginRoots.testCategories` 明确配置真实绝对安装路径，调用 `tools/matrix.mjs` 的版本化 API（`apiVersion:1`，loadProcedures/createMatrix/checkMatrix）。任务固定插件版本、工具内容及规程哈希；缺少或变化就明确失败，不使用隐藏副本。独立入口 `/a11y-test-categories` 保留，不新增浏览器、AT 后端、MCP server 或 Agent。

调用方先列出对象及状态；本插件为每一项展开全部十类的每个编号步骤。浏览器工具执行页面操作，真实 AT/capture 工具提供实际辅助技术证据。调用方判断问题并交付报告。本插件防止漏掉矩阵行却宣称完整覆盖，不自动判断 WCAG。

## 用法和输入

```powershell
copilot plugin install a11y-test-categories@a11y-assist
```

如未注册 marketplace，先添加 `kaixun96/dev.A11yAssist`；安装后重启 Copilot。

```text
/a11y-test-categories 检查 <feature> 的每个对象和可达状态，
页面为 <获授权 URL 和安全样例>，使用 <已有获授权工具>。
逐项执行全部十类的所有步骤，保存到 <私有目录>。
预算 <时长>；未完成项保留为缺口，不修复、不提单。
```

输入包括范围、对象/状态清单、用户路径、预期行为、环境、安全数据、已有工具、资源归属、预算和私有输出位置。清单覆盖每个区域、控件、有意义的内容元素，以及承接全局检查的页面级对象。约定样例中每个范围内元素都要覆盖，抽查代表控件不等于完整覆盖。发现新对象或状态就扩展清单及矩阵；无法确认清单完整时，结果只能是部分覆盖。

每个对象/状态都展开十类中的每个编号步骤，适用项按顺序实际执行。不适用必须给出针对该对象的具体理由；缺少 AT、时间或权限属于缺口，不是不适用。同一证据只有实际覆盖每个对象/状态/步骤时才能复用；无需为增加计数机械重复全局操作。必须阅读完整规程，包括编号步骤之后的证据和清理要求。十类不是完整标准，仍需补充 feature 特有的检查。

## 输出什么

返回私有对象清单、逐步骤矩阵、证据引用、问题与缺口，以及总数、已执行数、待完成数和分类统计。问题数按缺陷去重，不是受影响步骤的行数。简要报告先说一共发现多少问题、分别属于什么类别；详细覆盖和证据保留在报告中，不做装饰性仪表盘。

`observed-no-issue`、`finding` 必须有真实证据；`not-applicable` 必须有理由。`planned`、`blocked`、`not-run`、`inconclusive` 全部保留，存在这些适用行就不能宣称页面检查完成。仅计划模式不执行，源码模式不执行页面规程。矩阵完整不代表符合 WCAG、真实 AT 行为正确或清理完成。

## 本地矩阵契约

内置核对工具要求 Node.js 22+，只读写指定的本地 JSON 文件，不打开页面或启动 AT。输出应位于安装目录和公开仓库之外。对象清单示例：

```json
{
  "schemaVersion": 1,
  "scope": "约定安全样例中的条目选择器",
  "inventoryComplete": false,
  "inventoryEvidence": "清单尚未完成；空状态未访问",
  "targets": [
    {
      "id": "picker-open-cancel",
      "target": "选择器的取消按钮",
      "scenario": "打开选择器并取消",
      "state": "弹窗打开且有结果"
    }
  ]
}
```

在独立插件或内置模块根目录执行：

```powershell
node .\tools\matrix.mjs create <private-inventory.json> <new-private-matrix.json>
node .\tools\matrix.mjs check <private-inventory.json> <private-matrix.json>
```

`create` 不覆盖现有矩阵。填写每行的 `status`、`evidence`（非空产物 ID/引用）和 `reason`，不改变身份或步骤说明。保留原始清单和规程版本；变更时显式核对，不静默替换。

`check` 返回统计及 `accountingComplete`：完整记账退出码为 0，有效但未完成为 2，输入无效为 1。拒绝缺行、重复行、外来行、改写步骤、版本不符、无效状态、没有证据引用的结论，以及没有理由的未执行行。调用方还必须核实清单完整性、不适用理由、证据存在及真实性、实际行为和资源清理。它是本地覆盖核对工具，不是实时执行后端或防篡改证据验证器。

## 参考

- [规程索引及固定版本来源](../procedures/README.md)（打包时自动转为安装包内路径）。
