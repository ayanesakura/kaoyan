const { callService, API_PATHS } = require('../../config/api.js')

Page({
  data: {
    weights: {
      location: 20,    // 地理位置权重
      employment: 20,  // 就业权重
      government: 20,  // 进体制权重
      education: 20,   // 升学权重
      reputation: 20   // 学校专业知名度权重
    },
    totalWeight: 100,
    isValid: true,
    errorMsg: ''
  },

  onLoad(options) {
    // 获取之前页面传递的数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptTargetInfo', (data) => {
      this.targetInfo = data;
    });

    // 检查是否有保存的权重数据
    const app = getApp();
    const savedWeights = app.globalData.savedWeights;
    if (savedWeights) {
      this.setData({
        weights: savedWeights
      });
      this.calculateTotal();
    }
  },

  // 处理滑块变化
  onSliderChange(e) {
    const { field } = e.currentTarget.dataset;
    const value = parseInt(e.detail.value);
    
    this.setData({
      [`weights.${field}`]: value
    });
    
    this.calculateTotal();
  },

  // 处理输入框变化
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    let value = parseInt(e.detail.value || 0);
    
    // 确保输入值在0-100之间
    value = Math.min(100, Math.max(0, value));
    
    this.setData({
      [`weights.${field}`]: value
    });
    
    this.calculateTotal();
  },

  // 计算总和并验证
  calculateTotal() {
    const weights = this.data.weights;
    const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
    
    this.setData({
      totalWeight: total,
      isValid: total === 100,
      errorMsg: total > 100 ? '权重总和超过100%' : total < 100 ? '权重总和小于100%' : ''
    });
  },

  // 返回上一页
  onBack() {
    // 保存当前权重数据
    const app = getApp();
    app.globalData.savedWeights = this.data.weights;
    
    wx.navigateBack();
  },

  // 开始分析
  onSubmit() {
    if (!this.data.isValid) {
      wx.showToast({
        title: '请确保权重总和为100%',
        icon: 'none'
      });
      return;
    }

    // 合并所有数据
    const formData = {
      ...this.targetInfo,
      weights: this.data.weights
    };

    // 准备用户信息
    const userInfo = {
      school: formData.school,
      major: formData.major,
      grade: formData.grade,
      is_first_time: formData.firstTry,
      good_at_subject: formData.project,
      cet: formData.cet,
      hometown: formData.hometown
    };

    // 准备目标信息
    const targetInfo = {
      major: formData.targetMajor.join(',') || '',
      city: formData.targetCity.join(',') || '',
      work_city: formData.workCity.join(',') || '',
      school_level: formData.schoolLevels.join(',') || '',
      weights: this.data.weights
    };

    // 保存到globalData
    const app = getApp();
    app.globalData.userInfo = userInfo;
    app.globalData.targetInfo = targetInfo;

    // 保存到本地存储
    try {
      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('targetInfo', targetInfo);
    } catch (e) {
      console.error('保存到本地存储失败:', e);
    }

    // 准备请求数据
    const requestData = {
      user_info: userInfo,
      target_info: targetInfo
    };

    // 显示加载提示
    wx.showLoading({
      title: '分析中...',
      mask: true
    });

    // 调用接口
    callService(API_PATHS.chooseSchools, 'POST', requestData)
      .then(res => {
        let schoolsData;
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          schoolsData = res.data.data;
        } else if (res.data && Array.isArray(res.data)) {
          schoolsData = res.data;
        } else if (Array.isArray(res)) {
          schoolsData = res;
        } else {
          throw new Error('返回数据格式错误');
        }

        // 存储分析结果
        app.globalData.analysisResult = {
          recommendations: schoolsData
        };

        wx.hideLoading();
        wx.reLaunch({
          url: '/pages/analysis/analysis'
        });
      })
      .catch(err => {
        console.error('分析失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: err.message || '分析失败，请重试',
          icon: 'none',
          duration: 3000
        });
      });
  }
}) 