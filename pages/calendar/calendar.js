const { callService, API_PATHS } = require('../../config/api.js')

Page({
  data: {
    hasRequiredInfo: false,
    showInfoModal: false,
    userForm: {
      signature: '',
      birthday: '',
      mbti: '',
      gender: ''
    },
    mbtiOptions: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 
                  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'],
    genderOptions: ['男性', '女性'],
    mbtiIndex: -1,
    genderIndex: -1,
    // 运势数据
    fortuneMetrics: [], // 考研运势指标
    luckyColor: {}, // 今日幸运色
    luckyNumber: {}, // 今日幸运数字
    luckyDirection: {}, // 今日幸运方向
    todayDo: [], // 今日宜
    todayDont: [], // 今日忌
    summary: '', // 总结
    // 日历相关数据
    currentView: 'day',
    dates: [],
    currentDateIndex: 0,
    currentTime: '',
    moonPhase: ''
  },

  onLoad() {
    console.log('页面加载');
    // 开发阶段，清除运势缓存
    this.clearFortuneCache();
    this.checkUserInfo();
    this.initDates();
  },

  onShow() {
    if (this.data.hasRequiredInfo) {
      this.getFortune();
    }
  },

  // 检查用户信息
  checkUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const hasRequiredInfo = !!(userInfo.signature && userInfo.birthday && userInfo.mbti && userInfo.gender);
    
    this.setData({
      hasRequiredInfo,
      userForm: {
        signature: userInfo.signature || '',
        birthday: userInfo.birthday || '',
        mbti: userInfo.mbti || '',
        gender: userInfo.gender || ''
      },
      mbtiIndex: userInfo.mbti ? this.data.mbtiOptions.indexOf(userInfo.mbti) : -1,
      genderIndex: userInfo.gender ? this.data.genderOptions.indexOf(userInfo.gender) : -1
    });

    return hasRequiredInfo;
  },

  // 初始化日期数据
  initDates() {
    const today = new Date();
    const dates = [];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.getDate(),
        weekday: `周${weekdays[date.getDay()]}`
      });
    }

    this.setData({ dates });
  },

  // 获取运势数据
  async getFortune() {
    console.log('进入getFortune方法');
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `fortune_${today}`;
    console.log('今日缓存key:', cacheKey);
    
    const cachedData = wx.getStorageSync(cacheKey);
    console.log('缓存数据:', cachedData);

    if (cachedData) {
      console.log('使用缓存数据');
      this.setFortuneData(cachedData);
      return;
    }

    const userInfo = wx.getStorageSync('userInfo');
    console.log('获取到的用户信息:', userInfo);
    
    if (!userInfo) {
      console.log('未找到用户信息');
      return;
    }

    try {
      console.log('准备调用运势接口');
      wx.showLoading({ title: '获取运势中' });
      
      const requestData = {
        birthday: userInfo.birthday,
        mbti: userInfo.mbti.toLowerCase(),
        signature: userInfo.signature,
        gender: userInfo.gender
      };
      console.log('请求参数:', requestData);
      console.log('接口地址:', API_PATHS.kyys);
      
      const res = await callService(API_PATHS.kyys, 'POST', requestData);
      console.log('接口返回数据:', res);

      if (res.data) {
        console.log('接口调用成功，缓存数据');
        wx.setStorageSync(cacheKey, res.data);
        this.setFortuneData(res.data);
      } else {
        console.log('接口返回数据为空');
      }
    } catch (err) {
      console.error('获取运势失败:', err);
      console.error('错误详情:', {
        message: err.message,
        stack: err.stack,
        errCode: err.errCode
      });
      wx.showToast({
        title: '获取运势失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 设置运势数据
  setFortuneData(data) {
    console.log('设置运势数据:', data);
    this.setData({
      fortuneMetrics: data.考研运势,
      luckyColor: data.今日幸运色,
      luckyNumber: data.今日幸运数字,
      luckyDirection: data.今日幸运方向,
      todayDo: data.今日宜,
      todayDont: data.今日忌,
      summary: data.总结
    });
    console.log('运势数据设置完成');
  },

  // 显示信息填写弹窗
  onFillInfo() {
    this.setData({ showInfoModal: true });
  },

  // 关闭信息填写弹窗
  closeInfoModal() {
    this.setData({ showInfoModal: false });
  },

  // 头像点击
  onAvatarClick() {
    this.setData({ showInfoModal: true });
  },

  // 输入昵称
  onSignatureInput(e) {
    this.setData({
      'userForm.signature': e.detail.value
    });
  },

  // 选择生日
  onBirthdayChange(e) {
    this.setData({
      'userForm.birthday': e.detail.value
    });
  },

  // 选择性别
  onGenderChange(e) {
    const index = e.detail.value;
    this.setData({
      genderIndex: index,
      'userForm.gender': this.data.genderOptions[index]
    });
  },

  // 选择MBTI
  onMbtiChange(e) {
    const index = e.detail.value;
    this.setData({
      mbtiIndex: index,
      'userForm.mbti': this.data.mbtiOptions[index]
    });
  },

  // 提交用户信息
  submitUserInfo() {
    const { signature, birthday, mbti, gender } = this.data.userForm;
    console.log('提交用户信息:', this.data.userForm);
    
    if (!signature || !birthday || !mbti || !gender) {
      console.log('信息不完整:', { signature, birthday, mbti, gender });
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    console.log('保存用户信息到本地存储');
    wx.setStorageSync('userInfo', this.data.userForm);
    this.setData({
      hasRequiredInfo: true,
      showInfoModal: false
    });

    console.log('开始获取运势数据');
    this.getFortune();
  },

  // 切换视图
  switchView(e) {
    const view = e.currentTarget.dataset.view;
    this.setData({ currentView: view });
  },

  // 选择日期
  selectDate(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentDateIndex: index });
  },

  // 分享
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 显示更多
  showMore() {
    wx.showToast({
      title: '更多功能开发中',
      icon: 'none'
    });
  },

  // 清除运势缓存
  clearFortuneCache() {
    console.log('清除运势缓存');
    try {
      const keys = wx.getStorageInfoSync().keys;
      const fortuneKeys = keys.filter(key => key.startsWith('fortune_'));
      console.log('找到运势缓存keys:', fortuneKeys);
      
      fortuneKeys.forEach(key => {
        console.log('删除缓存:', key);
        wx.removeStorageSync(key);
      });
      
      console.log('运势缓存清除完成');
    } catch (err) {
      console.error('清除缓存失败:', err);
    }
  }
}); 