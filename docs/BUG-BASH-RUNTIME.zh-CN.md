# Bug Bash 可执行组合

[English](BUG-BASH-RUNTIME.md) | **简体中文**

包 v0.23 / 执行契约 v0.11。源码实现、部署和现场验收分别记录；本版本不恢复任何旧任务。

显式浏览器参数 `inspection: true` 可采集有界的文档属性、计算样式、矩形以及
HTML/SVG/XML 文档根节点的 AX 和截图证据，无需编造目标 ID。仅此模式允许空断言；
结果保持 inconclusive，属于待分析的原始观察，不是可访问性 PASS。仍须使用兼容的
部署适配器和原始资源所有权；详见 [浏览器契约](BROWSER.md)。

## 配置与职责

使用 Node.js 22+。将 `config/example.bug-bash.json` 复制到获授权私有位置，
配置真实 owner、位于安装目录/仓库外的已有 `stateRoot`，并将
`A11Y_ASSIST_CONFIG` 指向该文件。

单独安装 `a11y-test-categories`，将真实绝对安装路径写入 `pluginRoots.testCategories`。
协调器调用该插件 API，不复制类别文件。任务固定插件版本、工具哈希和规程内容；
缺失或变化明确失败。仅源码或无清单的旧有限场景不要求分类依赖，但不能声称完整页面覆盖。

`discoveryProfiles` 限定能力和精确目标，`discoverySourceRoots` 限定只读源码范围；
这些是配置边界，不是现场健康证明。`providers.capture` 必须明确实现
`discovery-observe`；兼容名称 `providers.operations` 实现
`discovery-cancel`、`discovery-cleanup`、`discovery-deliver`。
取消/收尾属于 **Bug Bash**，交付属于 **a11y-report**，不需要已删除的 operations 插件或完整修复工作流。
各模块提供自有资源清理证明，原资源管理方负责释放。

旧 BEFORE/AFTER provider 不会自动支持 discovery。不得伪造 Bug、租约、
evidence-v1 请求或降级证据。仅计划/源码模式可使用 `providers: {}`，
无需现场连接即可交付哈希核实的私有本地报告；本地文件交付不代表发出了 Teams 消息。

## 从对象清单到具体场景

计划字段：`schemaVersion: 1`、唯一小写 `taskId`（3-48 字符）、
`feature`、`authorizationReference`、`mode`、`profile`、`target`、
`evaluator`、`sourceRoots`、`sourceRevision`、`budgetSeconds`、`maxRows`、
`rows`，以及采用测试类别契约格式的 `inventory`。
模式为 `both`、`page-only`、`source-only` 或 `plan-only`；未知目标/宿主/源码版本用 `null`。
预算固定为 1-14400 秒；覆盖上限为 1-5000 行。

`create` 调用独立分类插件，将每个对象/状态补齐全部十类、61 个步骤。
清单优先的计划可传 `rows: []` 和足够的 `maxRows`。
未知清单完整性不能得到完整页面覆盖结论；没有清单的旧有限场景仍可执行，
但不能代表整个 feature 已测完。仅源码模式不展开页面步骤。

用户要求提单时，在计划设置 `filingRequested:true`。验证和自有资源清理后，
执行器会在最终报告前交回调用方，直到每个实际发现都有提单结果或明确跳过理由。
使用 `a11y-file-bug` 的 draft/submit/skip 工具；仍须批准精确草稿与目的地，
该标记不自动授权上传。`a11y-report` 生成含真实 Bug 链接、失败/跳过状态的整体报告；
待定外部操作必须先核对。参见[提单](FILE-BUG.md)和[报告](REPORT.md)。
提单支持实际项目字段和同标题候选检查、批准后的大视频分块上传、原检查点恢复。
创建响应丢失时按唯一关联标记查找并回读；只读核对与明确的继续操作分开。
不确定的上传不能重发；只有证明尚未开始变更的操作才能按明确理由放弃。
提单、继续、核对和报告交付共用任务锁，防止交付过期报告。

每行包含 `id`、`journey`、`state`、`dimension`、`track`、`capability`、
`preconditions`、`actions`、`expected`、`reset`；可增加 `dependsOn` 和有限 `parameters`。
页面/源码/AT 分别使用 `browser`、`source-review` 或具名 `nvda`/`narrator`/`voice-access`。
生成行另带 `coverage: {targetId, category, step, procedureHash}`。

读取完整规程后，通过 `configure` 输入 `{rows: [{id, parameters, preconditions,
actions, expected, reset}], reason}`，为未执行行绑定真实场景。不得删除步骤身份，
或将屏幕阅读器/Voice Access 替换为浏览器证据。同一对象/类别按编号执行；
跳过前面的未执行步骤会被拒绝。没有类型明确的浏览器场景时保留缺口。

```powershell
node "$pluginRoot\runtime\bug-bash-cli.mjs" create C:\private\plan.json
node "$pluginRoot\runtime\bug-bash-cli.mjs" configure feature-round C:\private\scenarios.json
node "$pluginRoot\runtime\bug-bash-cli.mjs" run feature-round
node "$pluginRoot\runtime\bug-bash-cli.mjs" status feature-round
```

`advance` 只推进一个安全步骤。`run` 默认最多推进 200 步，可用输入
`{maxAdvances: 1..5000}` 调整；遇到待定子操作、源码分析或恢复/输入边界时返回。
它不忙轮询、不安装 watcher、不恢复已取消覆盖；调用方通过原回调/调度器与
`reconcile` 继续。返回下一步不等于任务完成。

## 源码分析、追加与不适用

### 原生源码 subagent 与页面并行线

新建 `mode:"both"` 任务默认 `parallelSource:true`；只有明确要求串行的新任务才
设置为 `false`。旧任务继续使用原运行时与已记录计划，不迁移；其他模式不变。
这改变的是调度方式，不放宽真实 AT 或页面证据要求。

Bug Bash 包内包含 `agents/a11y-source-review.agent.md`，`model: inherit`，
工具仅有 `view`、`grep`、`glob`。主 skill 使用调用方的**原生后台 Task/subagent
工具**直接调它，不新增 source provider、MCP、独立插件或模型循环。Node CLI
负责准备、绑定、回收结果，不能自己调用模型工具。真正并行要求父任务启动后台
源码 agent 后立即继续页面线，不能先同步等待源码结果。宿主不提供工具／agent 时，
明确保留源码缺口，不伪造或静默退回串行。

每个源码行在 `parameters.sourceFiles` 中提供 1–50 个授权根目录内的绝对路径，
计划提供固定 `sourceRevision`。根据真实原生工具清单，向 `source-prepare` 传入
`{"subagentAvailable":true}` 或 `false`。缺少原生能力、版本或文件时，只记录源码
缺口，独立就绪的页面行继续。

```powershell
node "$pluginRoot\runtime\bug-bash-cli.mjs" source-prepare my-task C:\private\source-availability.json
```

返回 `sourcePending`：唯一 work ID、packet hash，以及最小上下文包，包含任务／
计划／行标识、声明源码版本、精确文件哈希、期限和只读边界。不包含父对话、
凭据、浏览器连接、评测机 token、页面结果或源码修改权限。单文件最多 2 MiB，
总文件集最多 10 MiB；声明版本不能代替文件哈希检查或不可变 checkout。

先持久化准备身份，再只把 packet 传给后台 `a11y-source-review`。拿到实际
原生任务／session ID 和完成回调后，用 `source-start` 记录：

```json
{
  "workId": "<sourcePending.id>",
  "packetHash": "<sourcePending.packetHash>",
  "workerSessionId": "<原生 Task 返回的真实任务/session 标识>",
  "callbackReference": "<真实完成回调引用>"
}
```

不得编造 ID。启动回执丢失时，`prepared` 可能已有实际子任务；按原 work ID
核对原生调用，不能重启第二个 agent。只有同一 worker／callback 的 `source-start`
才幂等。随后父任务用 `run`、`advance` 或已授权页面工具执行；同一任务同时最多
一个源码 subagent 和一个页面／AT 操作。

原生完成回调返回后，用现有 `source` 命令提交：

```json
{
  "workId": "<原始源码 work ID>",
  "packetHash": "<原始 packet hash>",
  "workerSessionId": "<已绑定的原生 worker ID>",
  "review": {
    "rowId": "<源码行>",
    "status": "observed-no-issue",
    "actual": "<仅源码观察>",
    "files": [{"path": "<packet 文件>", "sha256": "<packet 哈希>", "startLine": 1, "endLine": 10}],
    "risks": []
  }
}
```

只合并有界 schema：最多 64 KiB、50 项风险。重新核对全部 packet 文件字节；
引用只能来自原 packet；源码结果不能改写页面行，始终 `runtimeVerified:false`。
即使源码先完成，原页面 operation ID 也不变。长时间模型执行不持有任务写锁；
竞争写入沿用现有锁并明确失败，不覆盖状态。

失败、取消或超时的 subagent 通过 `source-end` 回收，必须给出相同身份、
`outcome`、精确 `reason` 和原生宿主的 `terminationReference`。若原生工具证明
启动在创建 worker 前就被拒绝，可用 `outcome:"not-started"`、
`workerSessionId:null`；超时或回执未知不能冒充未启动。

调用方负责验证原生回执；JSON 声明本身不是 OS 沙箱，也不能证明 agent 真的运行。
声称上下文隔离前，须确认宿主只读工具策略和完成回调真实有效。取消或过期保留
两条线的原身份；通过原生宿主停止／核对源码任务后再 `source-end`，不能终止共享
进程。页面／AT 每次清理照常立即执行，但汇总清理、最终校验／报告和计划修改等待
源码回收。不会自动释放租约或迁移当前运行任务。

### 显式串行与 source-only

源码分析使用内置 `a11y-knowledge` 的只读流程，不在分析步骤内运行 shell、
测试或浏览器。分析后通过 `source` 记录 `{rowId, status, actual, files, risks}`；
`files` 包含绝对 `path`、`sha256`、`startLine`、`endLine`，
`risks` 包含 `title`、`impact`、`confirmation`。
运行时核对实际字节、行范围和授权目录；源码风险不是运行时证据。

`append` 接收 `{rows, reason}`，只追加场景。
`inventory` 接收 `{inventory, reason}`，不得删除或改写旧对象/状态，新对象补齐全部步骤。
`gap` 接收 `{rowIds, reason}`，记录未执行行的缺口。
`exclude` 接收 `{exclusions: [{rowId, basis: "feature-not-applicable", reason}]}`，
只处理未执行行。调用方必须说明对象特定的不适用理由；缺工具、时间、权限不是不适用。
任何追加都不延长原预算或改变已提交请求。

## 采集、校验与报告

`discovery-observe` 传递任务、计划哈希、profile、精确目标、原期限和就绪行；
context 绑定 `task:<taskId>`、场景哈希与 evaluator。可信连接先完成原资源管理方
支持的实际获取/派发，再操作桌面；同一桌面串行执行。

通过回执要求逐行身份、实际结果、工具版本和声明产物；具名 AT 必须是实际 AT。
必需门禁包括 `capturePreflightVerified`、`capturePostcheckVerified`、
`independentBehaviorVerified`；`capturePreflightArtifacts` /
`capturePostcheckArtifacts` 指向声明且哈希绑定的诊断。
浏览器模块记录触发前、紧邻采集前和采集后的当前环境，只关闭自己创建的浏览器。
检查失败或未知不得形成通过回执；保留异常证据及原清理归属。

`validate` 核对哈希链、原始子回执、产物字节和类别核对，单独展示可信 provider
的独立行为评估及缺口。独立 `a11y-validate` 包通过
`a11y_validate_discovery {taskId}` 提供同一只读实现，与 evidence-v1 分开。
它不把源码分析升级为页面证据，也不认证无障碍符合性。生成报告前使用同一门禁。

报告首先给出页面问题数和类别，植入样例缺陷、源码风险单独计数。
只有 provider 支持的 `issue.identity` 才合并为同一缺陷，描述冲突会拒绝；
没有确认的疑似重复不自动合并。完整报告保留每行对象/类别/步骤、预期、观测、证据、
不适用与缺口。

## 中断、取消、清理和交付

任务在私有目录保存追加式哈希链 `events`、可重建 `state.json`、
不可变报告，以及原子操作引用。原操作 ID、请求 ID、provider 和运行时保持固定。
丢失响应或未知结果使用 `reconcile`，不能换 ID 重放。

`cancel` 输入 `{reason}`，立即阻止新覆盖，但已提交操作仍需核清。
`cleanup` 仅针对原任务产生的作用，保留产物、恢复设置，并由原管理方释放。
`deliver` 要求保存报告和适用清理证明；配置的交付连接核对目标字节并返回私有位置。
未完成清理/交付不能报任务完成，取消也不能改成通过。

无人值守执行需要真实 executor、持久进度、完成回调与独立停滞 watcher；
包安装不提供这些运行中资源。新部署必须固定完整包/provider/handler 及配置来源，
并在实际主机单独验收。

原生浏览器保留获批匿名/客户端 HTTPS 和合成样例入口，policy v2 增加明确授权的
持久会话、服务端请求、本地扫描器及尺寸测量。具名 AT 原始观测仍需兼容的场景和
独立行为评估，不能改名充当 discovery PASS。详见[执行适配器](EXECUTION-ADAPTERS.md)；
缺少能力保留缺口，不伪造工具、真实播报或全面覆盖。
