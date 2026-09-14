import assert from 'node:assert/strict';

const repository = 'https://github.com/kaixun96/dev.A11yAssist';
const referenceTitles = {
  'docs/SETUP.md': { en: 'Environment setup and authorization gates', zh: '环境准备与授权门禁' },
  'setup/report.template.md': { en: 'Capability readiness report', zh: '环境能力就绪报告' },
  'modules/a11y-setup/skills/a11y-setup/SKILL.md': { en: 'Reused internal environment setup', zh: '内部复用的环境准备' },
  'docs/BUG-BASH.md': { en: 'Bug Bash workflow and boundaries', zh: 'Bug Bash 流程与边界' },
  'bug-bash/context.template.md': { en: 'Feature context template', zh: 'Feature context 模板' },
  'bug-bash/report.template.md': { en: 'Findings and coverage report template', zh: '问题与覆盖率报告模板' },
  'modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md': { en: 'Reused internal knowledge review', zh: '内部复用的知识审查' },
  'skills/a11y-knowledge/SKILL.md': { en: 'Read-only knowledge guidance', zh: '只读知识使用指南' },
  'references/README.md': { en: 'Shared KB pins and automatic knowledge MCP', zh: '共享知识库版本锁定与自动知识 MCP' },
  'docs/CAPABILITIES.md': { en: 'Capability interfaces and boundaries', zh: '能力接口与边界' },
  'docs/NATIVE-CAPABILITIES.md': { en: 'Native ADO operations and setup', zh: '内置 ADO 操作及配置' },
  'docs/PROVIDERS.md': { en: 'Connection setup and protocol', zh: '连接配置与协议' },
  'docs/WORKFLOW.md': { en: 'Optional workflow and evidence gates', zh: '可选工作流与证据门禁' }
};
const labels = {
  en: {
    language: '[简体中文](README.zh-CN.md)',
    intro: 'Pick the accessibility plugin you need, install it in Copilot CLI, and use it in your own workflow. You do not need the whole suite.',
    choose: 'Choose a plugin',
  groups: { discovery: 'Feature bug bash', setup: 'Environment preparation', knowledge: 'Knowledge and static review', capability: 'Individual capabilities', workflow: 'Optional complete workflow' },
    columns: '| Plugin and instructions | What it does | What you need |',
    install: 'Install your selection',
    installation: 'Register this marketplace once, then install only your chosen plugin:',
    placeholder: '<plugin-name>',
    restart: 'Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.',
    advice: 'Choose **a11y-knowledge** for accessible code guidance and read-only review, **a11y-setup** for scoped Windows environment checks and authorized preparation, or **a11y-bug-bash** for feature discovery with the same knowledge and setup skills reused internally. All ten plugins reference the current shared Common, Fluent and SharePoint KB through their own read-only knowledge MCP; no peer knowledge plugin is needed. Choose **a11y-workflow** only if you want the complete workflow.',
    readiness: 'Knowledge use requires Node.js 22+ and enabled host MCP support, but no provider or execution configuration. The KB resolves automatically from an optional configured root, validated development layout, shared user cache, then a pinned HTTPS download. KB bodies are not bundled. First uncached use without a valid local KB requires network access to the published pinned artifact; a local build does not publish it. Evidence-file structural checking needs no provider. Live operations require authorized, configured connections. Installing a plugin does not provision a Windows evaluator or grant service access.',
    details: 'Open a plugin above for its installation command, prerequisites, example, limitations and bundled reference links.',
    development: 'For maintainers',
    developmentText: 'Users can stay in the catalog and plugin pages. [Development](docs/DEVELOPMENT.md) explains source and packaging; [shared knowledge](docs/KNOWLEDGE.md) and [release guidance](docs/RELEASING.md) cover KB distribution and publishing.',
    license: 'Access and license',
    licenseText: 'Public visibility is not an open-source license grant. See [LICENSE](LICENSE). Service permissions are separate; never commit credentials, personal profiles or production evidence.',
    purpose: 'Use this for',
    requires: 'Prerequisites',
    use: 'Example',
    limits: 'Limitations',
    reference: 'Reference',
    more: 'Back to the plugin catalog',
    config: 'For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.',
    validate: 'For `a11y_validate_evidence` structural checks, skip provider configuration. Configure a connection only for independent behavior evaluation.',
    knowledge: 'This plugin registers its own read-only knowledge MCP for shared Common, Fluent and SharePoint entries. Knowledge use requires Node.js 22+ and enabled host MCP support; no peer plugin, provider or `A11Y_ASSIST_CONFIG` is required. Resolution is automatic: optional configured KB root, validated repository layout, verified shared user cache, then pinned HTTPS download. KB bodies are not bundled. First uncached use without a valid local KB needs network access and the published pinned artifact; a local build does not publish it. Cached/local use works offline. Invalid configured roots or tampered caches fail explicitly, without fallback or repair. Read full entries with citations and source status; pending sources are gaps, not authority. See [knowledge availability](references/README.md).',
    exampleNote: 'Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.'
  },
  zh: {
    language: '[English](README.md)',
    intro: '挑选需要的无障碍插件，安装到 Copilot CLI，在你自己的工作流里使用。无需安装整套插件。',
    choose: '挑选插件',
  groups: { discovery: 'Feature Bug Bash', setup: '环境准备', knowledge: '知识与静态审查', capability: '单项能力', workflow: '可选的完整工作流' },
    columns: '| 插件与使用说明 | 解决什么问题 | 使用前提 |',
    install: '安装你选中的插件',
    installation: '先注册一次插件市场，再安装你选中的插件：',
    placeholder: '<插件名>',
    restart: '安装后重启 Copilot 加载插件，再按该插件页面的示例使用。安装不会更新或重启已有 worker。',
    advice: '无障碍代码指导与只读审查选 **a11y-knowledge**；限定范围的 Windows 环境检查和获授权的准备选 **a11y-setup**；feature 发现选 **a11y-bug-bash**，其内部复用相同的知识与环境准备 skill。全部十个插件通过各自的只读知识 MCP 引用当前共享 Common、Fluent 和 SharePoint 知识库，无需另装知识插件。只有需要整套流程时才选 **a11y-workflow**。',
    readiness: '知识使用需要 Node.js 22+ 和已启用 MCP 的宿主，但无需 provider 或执行配置。知识库按可选配置根目录、已验证开发布局、共享用户缓存、固定 HTTPS 下载的顺序自动解析，不随插件打包正文。首次无缓存且无有效本地知识库时，需要联网访问已发布的固定制品；本地构建不会发布制品。证据结构检查无需 provider；实际操作需要获授权的配置连接。安装不会自动准备 Windows 评估机或授予服务访问权限。',
    details: '点击上面的插件，查看各自的安装命令、使用前提、示例、能力限制和随包参考资料。',
    development: '维护者入口',
    developmentText: '普通用户只需看插件目录和插件页面。[开发说明](docs/DEVELOPMENT.md) 解释源码与打包；[共享知识](docs/KNOWLEDGE.md) 和 [发布说明](docs/RELEASING.md) 介绍知识库分发与发布。',
    license: '访问与许可',
    licenseText: '仓库公开不等于授予开源许可，详见 [LICENSE](LICENSE)。服务权限需要单独获取；不要提交凭据、个人 profile 或生产证据。',
    purpose: '适合什么需求',
    requires: '使用前提',
    use: '使用示例',
    limits: '能力边界',
    reference: '参考资料',
    more: '返回插件目录',
    config: '执行实际操作前，只配置需要的连接，把配置放在私有文件中；启动 Copilot 前设置绝对路径 `A11Y_ASSIST_CONFIG`，然后重启。详见 [连接配置](docs/PROVIDERS.md) 和 [配置示例](config/README.md)。默认不启用任何连接。',
    validate: '仅使用 `a11y_validate_evidence` 做结构检查时，跳过 provider 配置；需要独立行为评估时才配置相应连接。',
    knowledge: '本插件注册独立的只读知识 MCP，读取共享 Common、Fluent 和 SharePoint 条目。知识使用需要 Node.js 22+ 和已启用 MCP 的宿主，无需其他插件、provider 或 `A11Y_ASSIST_CONFIG`。按可选知识库根目录、已验证仓库布局、已验证共享用户缓存、固定 HTTPS 下载的顺序自动解析。正文不随插件打包；首次无缓存且无有效本地知识库时需要联网访问已发布的固定制品，本地构建不会发布制品。有效缓存或本地知识库可离线使用；无效配置根目录或损坏缓存明确失败，不回退或自动修复。读取完整条目并引用来源及状态；pending 来源是缺口，不是权威依据。详见 [知识可用性](references/README.md)。',
    exampleNote: '将占位符替换为真实、获授权的输入。示例是提问方式，不是执行回执或环境就绪证明。'
  }
};

export function validateCatalog(catalog, names) {
  assert(Array.isArray(catalog) && catalog.length === names.length, 'Catalog must cover every plugin');
  assert.deepEqual(catalog.map(entry => entry.name).sort(), [...names].sort(), 'Catalog names must match installable plugins');
  for (const entry of catalog) {
  assert(['discovery', 'setup', 'knowledge', 'capability', 'workflow'].includes(entry.group), `Invalid catalog group: ${entry.name}`);
    assert(Array.isArray(entry.docs) && entry.docs.length, `Missing reference links: ${entry.name}`);
    for (const path of entry.docs) {
      assert(/^[a-zA-Z0-9._/-]+\.md$/.test(path) && !path.startsWith('/') && !path.split('/').includes('..'),
        `Unsafe catalog reference: ${path}`);
      assert(referenceTitles[path]?.en && referenceTitles[path]?.zh, `Missing reference title: ${path}`);
    }
    for (const language of ['en', 'zh']) {
      for (const field of ['purpose', 'requires', 'example', 'limits']) {
        assert(typeof entry[language]?.[field] === 'string' && entry[language][field].trim(),
          `Missing ${language}.${field}: ${entry.name}`);
        assert(!entry[language][field].includes('|') && !entry[language][field].includes('\n'),
          `Invalid catalog table text: ${entry.name}`);
      }
      assert(entry[language].example.startsWith(`/${entry.name} `), `Wrong example entrypoint: ${entry.name}`);
    }
  }
}

export function renderCatalog(catalog, language) {
  const l = labels[language];
  const filename = language === 'zh' ? 'README.zh-CN.md' : 'README.md';
  const sections = Object.entries(l.groups).map(([group, title]) =>
    `### ${title}\n\n${l.columns}\n|---|---|---|\n` +
    catalog.filter(entry => entry.group === group).map(entry =>
      `| [${entry.name}](plugins/${entry.name}/${filename}) | ${entry[language].purpose} | ${entry[language].requires} |`).join('\n')
  ).join('\n\n');
  return `# A11y Assist - ${language === 'zh' ? '插件目录' : 'Plugin catalog'}\n\n${l.language}\n\n${l.intro}\n\n## ${l.choose}\n\n${sections}\n\n${l.details}\n\n${l.advice}\n\n## ${l.install}\n\n${l.installation}\n\n\`\`\`powershell\ncopilot plugin marketplace add kaixun96/dev.A11yAssist\ncopilot plugin install ${l.placeholder}@a11y-assist\n\`\`\`\n\n${l.restart}\n\n${l.readiness}\n\n## ${l.development}\n\n${l.developmentText}\n\n## ${l.license}\n\n${l.licenseText}\n`;
}

export function renderPlugin(entry, language, execution) {
  const l = labels[language];
  const content = entry[language];
  const setup = `\n\n${l.knowledge}` + (execution ? `\n\n${entry.name === 'a11y-validate' ? l.validate + '\n\n' : ''}${l.config}` : '');
  const references = entry.docs.map(path => `- [${referenceTitles[path][language]}](${path})`).join('\n');
  const catalogUrl = language === 'zh' ? `${repository}/blob/main/README.zh-CN.md` : repository;
  return `# ${entry.name}\n\n${l.language}\n\n## ${l.purpose}\n\n${content.purpose}\n\n## ${l.requires}\n\n${content.requires}${language === 'zh' ? '。' : '.'}${execution ? '\n\nNode.js 22+.' : ''}${setup}\n\n## ${l.install}\n\n\`\`\`powershell\ncopilot plugin marketplace add kaixun96/dev.A11yAssist\ncopilot plugin install ${entry.name}@a11y-assist\n\`\`\`\n\n${l.restart}\n\n## ${l.use}\n\n\`\`\`text\n${content.example}\n\`\`\`\n\n${l.exampleNote}\n\n## ${l.limits}\n\n${content.limits}\n\n## ${l.reference}\n\n${references}\n\n[${l.more}](${catalogUrl})\n`;
}
