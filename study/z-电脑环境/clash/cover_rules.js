function main(content) {
    // 将规则按分组组织，每个类型单独配置
    const rulesConfig = {
      '🔗 无需代理': {
        // ipAsn: ['132203'],
        // process: ['cloudmusic.exe']
        domainSuffix: [
          'zenithspace.net', // 这将直连 *.zenithspace.net
          'queniuqe.com',
          'siliconflow.cn',
          'cursor.sh',
          'biomed168.com',
          // 'windsurf.com'
        ],
      },
      '🇭🇰 香港自动': {},
      '🇯🇵 日本自动': {
        // geosite: [
        //   'binance'
        // ],
      },
      '🇺🇸 美国自动': {
        // domain: [
        //   'ces.google.com',
        // ],
        // domainSuffix: [
        //   'koofr.eu',
        //   'koofr.net',
        // ],
      },
      '🇸🇬 狮城自动': {},
      '🛡️ 广告拦截': {
        // geosite: [
        //   'category-ads-all'
        // ],
        domainSuffix: [
          'mindoffice.cn',
          'mindoffice.net',
          'mindoffice.com',
          'im30.net',
          'im30.cn',
          'im30.com'
        ],
      },
    }
  
    // 规则类型映射表
    const ruleTypes = {
      ipAsn: (value, group) => `IP-ASN,${value},${group},no-resolve`,
      domain: (value, group) => `DOMAIN,${value},${group}`,
      domainSuffix: (value, group) => `DOMAIN-SUFFIX,${value},${group}`,
      geosite: (value, group) => `GEOSITE,${value},${group}`,
      process: (value, group) => `PROCESS-NAME,${value},${group}`,
      // 可以继续添加其他类型的规则
    }
  
    // 生成规则数组的函数
    const generateRules = () => {
      return Object.entries(rulesConfig).flatMap(([group, config]) =>
        Object.entries(config).flatMap(([type, values]) =>
          values.map(value => ruleTypes[type](value, group)),
        ),
      )
    }
  
    if (content.rules?.length) {
      content.rules = generateRules().concat(content.rules)
    }
  
    return content
  }
  