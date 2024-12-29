// index.js
const app = getApp()

Page({
  data: {
    hasPhoneNumber: false
  },

  onLoad() {
    // 检查是否已有手机号
    if (app.globalData.phoneNumber) {
      this.setData({
        hasPhoneNumber: true
      })
    }
  },

  // 获取手机号回调
  getPhoneNumber(e) {
    // 开发阶段直接进入主页
    this.enterMainPage()
    
    /* 
    // 实际上线时的代码
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const { encryptedData, iv } = e.detail
      // 处理手机号获取逻辑...
    }
    */
  },

  // 进入主页面
  enterMainPage() {
    wx.switchTab({
      url: '/pages/fill/fill'
    })
  }
})
