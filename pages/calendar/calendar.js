const { callService, API_PATHS } = require('../../config/api.js')

Page({
  data: {
    hasRequiredInfo: false,
    showInfoModal: false,
    isLoading: false,
    loadingText: '正在获取你的考研运势...',
    loadingTexts: [
      '正在翻阅考研秘籍...',
      '正在为你掐指一算...',
      '正在查询学霸指数...',
      '正在获取幸运食物...',
      '正在计算抢座概率...',
      '正在连接考研星座...',
      '正在分析复习指数...',
      '正在测量学习气场...',
      '正在探测记忆曲线...',
      '正在解析刷题情况...',
      '正在预测单词效率...',
      '正在定位学习座位...',
      '正在召唤学习灵感...',
      '正在计算咖啡因量...',
      '正在请求考神保佑...'
    ],
    loadingTextTimer: null,
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
    metricsChartData: null, // 图表数据
    barColors: ['#87CEEB', '#FFB6C1', '#98FB98', '#DDA0DD', '#F0E68C'], // 柱状图颜色
    luckyColor: {}, // 今日幸运色
    luckyNumber: {}, // 今日幸运数字
    luckyDirection: {}, // 今日幸运方向
    luckyFood: {}, // 今日幸运食物
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
    this.initApp();
  },

  // 初始化应用
  async initApp() {
    try {
      console.log('开始检查用户信息');
      const hasInfo = this.checkUserInfo();
      if (hasInfo) {
        this.getFortune();
      }
      this.initDates();
    } catch (err) {
      console.error('初始化失败:', err);
    }
  },

  onShow() {
    const hasInfo = this.checkUserInfo();
    if (hasInfo) {
      this.getFortune();
    }
  },

  // 检查用户信息
  checkUserInfo() {
    const userInfo = {signature: '测试用户', birthday: '2000-01-01', mbti: 'INTJ', gender: '男性'}
    // const userInfo = wx.getStorageSync('userInfo') || {};
    console.log('检查用户信息:', userInfo);
    
    const hasRequiredInfo = !!(userInfo.signature && userInfo.birthday && userInfo.mbti && userInfo.gender);
    console.log('是否有必需信息:', hasRequiredInfo);
    
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
    const cacheKey = `fortune1_${today}`;
    console.log('今日缓存key:', cacheKey);
    const cachedData = wx.getStorageSync(cacheKey);
    console.log('缓存数据:', cachedData);
  
    if (cachedData) {
      console.log('使用缓存数据');
      this.setFortuneData(cachedData);
      // return;
    }

    const userInfo = this.data.userForm;
    console.log('获取到的用户信息:', userInfo);
    
    if (!userInfo || !userInfo.signature) {
      console.log('未找到用户信息');
      return;
    }

    try {
      console.log('准备调用运势接口');
      // 开始显示加载动画
      this.setData({ isLoading: true });
      this.startLoadingTextAnimation();
      
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
      // 停止加载动画
      this.stopLoadingTextAnimation();
      this.setData({ isLoading: false });
    }
  },

  // 开始加载文字动画
  startLoadingTextAnimation() {
    // 清除可能存在的计时器
    this.stopLoadingTextAnimation();
    
    // 创建已使用的文案集合，避免短时间内重复
    const usedTexts = new Set();
    
    // 随机显示加载文字
    const updateLoadingText = () => {
      const texts = this.data.loadingTexts;
      let randomIndex;
      let maxAttempts = 10; // 防止死循环
      
      // 尝试获取未使用过的文案
      do {
        randomIndex = Math.floor(Math.random() * texts.length);
        maxAttempts--;
      } while (usedTexts.has(randomIndex) && maxAttempts > 0 && usedTexts.size < texts.length - 1);
      
      // 更新文字并记录已使用
      this.setData({ loadingText: texts[randomIndex] });
      usedTexts.add(randomIndex);
      
      // 如果所有文案都用过了，清空记录
      if (usedTexts.size >= texts.length * 0.7) {
        usedTexts.clear();
      }
    };
    
    // 初始更新一次
    updateLoadingText();
    
    // 设置定时器，每2秒更新一次文字
    this.data.loadingTextTimer = setInterval(updateLoadingText, 2500);
  },
  
  // 停止加载文字动画
  stopLoadingTextAnimation() {
    if (this.data.loadingTextTimer) {
      clearInterval(this.data.loadingTextTimer);
      this.data.loadingTextTimer = null;
    }
  },

  onUnload() {
    // 组件卸载时清除计时器
    this.stopLoadingTextAnimation();
  },

  // 设置运势数据
  setFortuneData(data) {
    console.log('原始数据:', data);
    console.log('运势指数:', {
      复习效率: data.复习效率指数,
      刷题顺利: data.刷题顺利度,
      抢座运势: data.抢座运势,
      意外惊喜: data.意外惊喜指数
    });
    
    // 确保数值转换正确
    const getScore = (value) => {
      const score = parseFloat(value);
      return isNaN(score) ? 0 : score;
    };
    
    // 转换运势指标数据为图表格式
    const metrics = [
      { name: '复习', score: getScore(data.复习效率指数) },
      { name: '刷题', score: getScore(data.刷题顺利度) },
      { name: '抢座', score: getScore(data.抢座运势) },
      { name: '惊喜', score: getScore(data.意外惊喜指数) }
    ];
    
    console.log('转换后的指标数据:', metrics);
    
    this.setData({
      fortuneMetrics: metrics,
      luckyColor: { 
        value: data.今日幸运色, 
        description: '',
        colorCode: data.颜色编码
      },
      luckyNumber: { value: data.今日幸运数字, description: '' },
      luckyDirection: { value: data.今日幸运方向, description: '' },
      luckyFood: { value: data.今日幸运食物, description: '' },
      todayDo: data.今日宜,
      todayDont: data.今日忌,
      summary: data.总结
    });
    
    console.log('设置后的fortuneMetrics:', this.data.fortuneMetrics);
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