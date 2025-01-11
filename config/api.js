const env = {
  dev: {
    baseUrl: 'http://192.168.31.144:8000'
  },
  prod: {
    baseUrl: 'https://kaoyan-service-135292-9-1330319089.sh.run.tcloudbase.com' // 生产环境地址
  }
}

// 设置当前环境 (dev/prod)
const currentEnv = 'prod'

const config = {
  baseUrl: env[currentEnv].baseUrl,
  
  // API endpoints
  apis: {
    schoolSearch: '/api/school_search',
    schoolStructure: '/api/school_structure',
    analyze: '/api/analyze'
  },

}

// 获取完整的API URL
const getApiUrl = (apiName) => {
  const api = config.apis[apiName]
  if (!api) {
    console.error(`API ${apiName} not found in config`)
    return ''
  }
  return `${config.baseUrl}${api}`
}

module.exports = {
  config,
  getApiUrl
} 