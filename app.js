// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'prod-4g46sjwd41c4097c', // 云开发环境id
        traceUser: true // 是否在将用户访问记录到用户管理中，在控制台中可见
      })
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    }
  },
  globalData: {
    phoneNumber: null,
    hasPhoneNumber: false,
    analysisResult: null
  }
})
