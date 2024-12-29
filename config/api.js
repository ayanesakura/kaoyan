const env = {
  dev: {
    baseUrl: 'http://192.168.31.146:8000'
  },
  prod: {
    baseUrl: 'https://your-production-api.com' // 生产环境地址
  }
}

// 设置当前环境 (dev/prod)
const currentEnv = 'dev'

const config = {
  baseUrl: env[currentEnv].baseUrl,
  
  // API endpoints
  apis: {
    schoolSearch: '/school/search',
    schoolStructure: '/school/school_structure',
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