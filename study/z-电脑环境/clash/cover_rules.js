function main(content) {
  // 将规则按分组组织，每个类型单独配置
  const rulesConfig = {
    '🔗 无需代理': {
      domainSuffix: [
        'zenithspace.net',
        'queniuqe.com',
        'siliconflow.cn',
        'cursor.sh',
        'biomed168.com',
        'apache.org',
        'visactor.com',
      ],
    },
    '🇭🇰 香港自动': {},
    '🇯🇵 日本自动': {},
    '🇺🇸 美国自动': {},
    '🇸🇬 狮城自动': {},
    '🛡️ 广告拦截': {
      domainSuffix: [
        'mindoffice.cn',
        'mindoffice.net',
        'mindoffice.com',
        'im30.net',
        'im30.cn',
        'im30.com'
      ],
      domainRegex: [
        '^.*\\.mindoffice\\..*$',
        '^.*\\.im30\\..*$'
      ]
    },
  }

  // 代理组配置：定义缺失时需要创建的代理组
  const proxyGroupsConfig = {
    '🔗 无需代理': {
      type: 'select',
      proxies: ['DIRECT', 'REJECT']
    },
    '🛡️ 广告拦截': {
      type: 'select',
      proxies: ['REJECT', 'DIRECT']
    }
  }
  // https://github.com/clash-verge-rev/clash-verge-rev/issues/1762
  // 新增：为 tun 的排除进程提供分组式配置
  const tunConfig = {
    excludeProcess: [
      // 进程名列表（不带扩展名，或按你的平台要求）
      'WeChatAppEx',
      'WeChat',
      // 可继续添加：'cloudmusic.exe' 等
    ],
  }

  // 规则类型映射表
  const ruleTypes = {
    ipAsn: (value, group) => `IP-ASN,${value},${group},no-resolve`,
    domain: (value, group) => `DOMAIN,${value},${group}`,
    domainSuffix: (value, group) => `DOMAIN-SUFFIX,${value},${group}`,
    geosite: (value, group) => `GEOSITE,${value},${group}`,
    process: (value, group) => `PROCESS-NAME,${value},${group}`,
    domainRegex: (value, group) => `DOMAIN-REGEX,${value},${group}`,
  }

  // 检查并创建缺失的代理组
  const ensureProxyGroups = () => {
    // 确保 proxy-groups 存在
    if (!content['proxy-groups']) {
      content['proxy-groups'] = []
    }

    // 获取现有代理组名称
    const existingGroups = new Set(
      content['proxy-groups'].map(group => group.name)
    )

    // 检查并添加缺失的代理组
    Object.entries(proxyGroupsConfig).forEach(([groupName, groupConfig]) => {
      if (!existingGroups.has(groupName)) {
        content['proxy-groups'].push({
          name: groupName,
          type: groupConfig.type,
          proxies: groupConfig.proxies
        })
      }
    })
  }

  // 生成规则数组
  const generateRules = () => {
    return Object.entries(rulesConfig).flatMap(([group, config]) =>
      Object.entries(config).flatMap(([type, values]) =>
        values.map(value => ruleTypes[type](value, group)),
      ),
    )
  }

  // 先确保所需的代理组存在
  ensureProxyGroups()

  // 合并规则（若已有则前置新增规则）
  if (content.rules?.length) {
    content.rules = generateRules().concat(content.rules)
  }

  // 合并 tun.exclude-process：保留已有，追加新配置，并去重
  if (!content.tun) content.tun = {}
  const existing = Array.isArray(content.tun['exclude-process'])
    ? content.tun['exclude-process']
    : []
  const added = Array.isArray(tunConfig.excludeProcess)
    ? tunConfig.excludeProcess
    : []
  const merged = [...new Set([...existing, ...added])]
  if (merged.length) {
    content.tun['exclude-process'] = merged
  }

  return content
}
