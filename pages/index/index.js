// index.js
const app = getApp()

Page({
  data: {
    showPrivacy: false,
    userInfo: null,
    hasUserInfo: false
  },

  // 显示隐私弹窗
  showPrivacyPopup() {
    console.log('点击了登录按钮，显示隐私弹窗');
    this.setData({
      showPrivacy: true
    });
  },

  // 同意隐私协议
  onAgree() {
    console.log('用户同意隐私协议，准备获取用户信息');
    this.setData({
      showPrivacy: false
    });
    // 获取用户信息
    this.getUserProfile();
  },

  // 不同意隐私协议
  onDisagree() {
    console.log('用户不同意隐私协议，退出小程序');
    // 退出小程序
    wx.exitMiniProgram();
  },

  // 获取用户信息
  getUserProfile() {
    console.log('开始获取用户信息...');
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功，详细信息：', {
          nickName: res.userInfo.nickName,
          gender: res.userInfo.gender === 1 ? '男' : '女',
          language: res.userInfo.language,
          city: res.userInfo.city,
          province: res.userInfo.province,
          country: res.userInfo.country,
          avatarUrl: res.userInfo.avatarUrl
        });

        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        
        // 保存到全局数据
        app.globalData.userInfo = res.userInfo;
        app.globalData.hasUserInfo = true;
        console.log('已更新全局数据:', app.globalData);
        
        // 保存到本地存储
        wx.setStorageSync('userInfo', res.userInfo);
        console.log('已保存到本地存储');
        
        // 获取手机号
        this.getPhoneNumber();
      },
      fail: (err) => {
        console.error('获取用户信息失败，错误信息：', err);
        wx.showToast({
          title: '需要授权才能使用',
          icon: 'none'
        });
      }
    });
  },

  // 获取手机号回调
  getPhoneNumber() {
    console.log('准备进入主页，当前用户信息：', {
      globalData: app.globalData.userInfo,
      pageData: this.data.userInfo,
      hasUserInfo: this.data.hasUserInfo
    });
    // 开发阶段直接进入主页
    this.enterMainPage();
  },

  // 进入主页面
  enterMainPage() {
    console.log('跳转到主页');
    wx.switchTab({
      url: '/pages/fill/fill'
    });
  },

  onLoad() {
    console.log('页面加载，清除用户信息');
    // 清除本地存储的用户信息
    wx.removeStorageSync('userInfo');
    app.globalData.userInfo = null;
    app.globalData.hasUserInfo = false;
    
    this.setData({
      userInfo: null,
      hasUserInfo: false
    });
    
    console.log('当前状态：', {
      pageData: this.data,
      globalData: app.globalData,
      storage: wx.getStorageSync('userInfo')
    });
  }
})
