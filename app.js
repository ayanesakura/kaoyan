// app.js
// 获取云开发配置
const { CLOUD_CONFIG } = require('./config/api.js')

App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: CLOUD_CONFIG.env,
        traceUser: true  // 是否记录用户访问记录
      });
      console.log('云开发环境初始化成功');
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  globalData: {
    phoneNumber: null,
    hasPhoneNumber: false,
    analysisResult: null
  }
})
