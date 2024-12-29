// index.js
const app = getApp()

Page({
  data: {
    showPrivacy: false
  },

  // 显示隐私弹窗
  showPrivacyPopup() {
    this.setData({
      showPrivacy: true
    });
  },

  // 同意隐私协议
  onAgree() {
    this.setData({
      showPrivacy: false
    });
    // 获取手机号并进入主页
    this.getPhoneNumber();
  },

  // 不同意隐私协议
  onDisagree() {
    // 退出小程序
    wx.exitMiniProgram();
  },

  // 获取手机号回调
  getPhoneNumber() {
    // 开发阶段直接进入主页
    this.enterMainPage();
  },

  // 进入主页面
  enterMainPage() {
    wx.switchTab({
      url: '/pages/fill/fill'
    });
  }
})
