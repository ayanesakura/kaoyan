// 环境配置
const env = {
  dev: {
    baseUrl: 'http://192.168.0.124:80'
  }
}

// 设置当前环境 (dev/prod)
const currentEnv = 'dev'

// 云托管配置
const CLOUD_CONFIG = {
  env: 'prod-4g46sjwd41c4097c',
  service: 'kaoyan-service'
}

// API路径
const API_PATHS = {
  schoolSearch: '/api/school_search',
  schoolStructure: '/api/school_structure',
  analyze: '/api/analyze',
  majorSearch: '/api/query_school_majors_or_fxs',
  generalMajorSearch: '/api/query_majors_or_fxs',
  citySearch: '/api/query_city',
  chooseSchools: '/api/choose_schools',
  aiAnalysis: '/api/ai_ana',
  kyys: '/api/kyys'
}

// 统一的服务调用方法
function callService(path, method = 'POST', data = {}) {
  console.log('调用服务:', {
    path,
    method,
    data,
    currentEnv
  });

  if (currentEnv === 'prod') {
    console.log('使用云托管服务');
    return wx.cloud.callContainer({
      config: {
        env: CLOUD_CONFIG.env
      },
      path: path,
      method: method,
      header: {
        'X-WX-SERVICE': CLOUD_CONFIG.service,
        'content-type': 'application/json'
      },
      data: data
    })
  } else {
    console.log('使用本地开发服务');
    const url = `${env[currentEnv].baseUrl}${path}`;
    console.log('完整请求URL:', url);
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: url,
        method: method,
        header: {
          'content-type': 'application/json'
        },
        data: data,
        success: (res) => {
          console.log('请求成功:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('请求失败:', err);
          reject(err);
        }
      })
    })
  }
}

// 获取完整的API URL (用于特殊情况)
function getApiUrl(apiName) {
  const api = API_PATHS[apiName]
  if (!api) {
    console.error(`API ${apiName} not found in config`)
    return ''
  }
  
  if (currentEnv === 'prod') {
    return api
  }
  
  return `${env[currentEnv].baseUrl}${api}`
}

module.exports = {
  currentEnv,
  API_PATHS,
  CLOUD_CONFIG,
  callService,
  getApiUrl
} 