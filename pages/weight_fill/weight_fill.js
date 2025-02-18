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
    errorMsg: '',
    targetInfo: null  // 添加targetInfo字段
  },

  onLoad(options) {
    // 获取之前页面传递的数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptTargetInfo', (data) => {
      // 保存到data中
      this.setData({
        targetInfo: data
      });
    });

    // 先尝试从本地存储获取数据
    try {
      const savedWeightData = wx.getStorageSync('weightData');
      if (savedWeightData) {
        this.setData({
          weights: savedWeightData.weights,
          targetInfo: savedWeightData.targetInfo || this.data.targetInfo
        });
        this.calculateTotal();
        return;
      }
    } catch (e) {
      console.error('从本地存储读取数据失败:', e);
    }

    // 如果本地存储没有数据,检查globalData
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
    this.saveData(); // 添加保存数据的调用
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
    this.saveData(); // 添加保存数据的调用
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

  // 新增保存数据的方法
  saveData() {
    const app = getApp();
    const weightData = {
      weights: this.data.weights,
      targetInfo: this.data.targetInfo
    };

    // 保存到globalData
    app.globalData.savedWeights = this.data.weights;
    
    // 保存到本地存储
    try {
      wx.setStorageSync('weightData', weightData);
    } catch (e) {
      console.error('保存到本地存储失败:', e);
    }
  },

  // 返回上一页
  onBack() {
    this.saveData(); // 添加保存数据的调用
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

    // 检查targetInfo是否存在
    if (!this.data.targetInfo) {
      wx.showToast({
        title: '缺少必要的信息',
        icon: 'none'
      });
      return;
    }

    // 合并所有数据
    const formData = {
      ...this.data.targetInfo,
      weights: this.data.weights
    };

    // 准备用户信息
    const userInfo = {
      signature: formData.signature || '未设置',
      gender: formData.gender || '未设置',
      school: formData.school,
      major: formData.major ? formData.major.split(' ').pop() : '', // 只取空格后的专业名称
      grade: formData.grade,
      rank: formData.rank || '未设置',
      is_first_time: formData.firstTry,
      cet: formData.cet,
      hometown: formData.hometown ? (() => {
        const parts = formData.hometown.split('-');
        return {
          province: parts[0] || '未设置',
          city: parts[1] || parts[0] || '未设置' // 如果没有city部分,使用province作为city
        };
      })() : {
        province: '未设置',
        city: '未设置'
      }
    };

    // 准备目标信息
    const targetInfo = {
      school_cities: (formData.targetCity || []).map(city => {
        if (!city) return { province: '未设置', city: '未设置' };
        const parts = city.split('-');
        return {
          province: parts[0] || '未设置',
          city: parts[1] || parts[0] || '未设置' // 如果没有city部分,使用province作为city
        };
      }),
      majors: (formData.targetMajor || []).map(item => {
        const majorStr = item.major || item;
        const match = majorStr.match(/^(.+?)\((.*)\)$/);
        if (match) {
          return match[1]; // 返回括号前的专业名称
        }
        return majorStr; // 如果没有括号,返回完整字符串
      }),
      directions: (formData.targetMajor || []).map(item => {
        const majorStr = item.major || item;
        const match = majorStr.match(/^(.+?)\((.*)\)$/);
        if (match) {
          return match[2]; // 返回括号中的方向
        }
        return null; // 如果没有括号,返回null
      }).filter(Boolean), // 过滤掉null值
      levels: formData.schoolLevels || [],
      work_cities: (formData.workCity || []).map(city => {
        if (!city) return { province: '未设置', city: '未设置' };
        const parts = city.split('-');
        return {
          province: parts[0] || '未设置',
          city: parts[1] || parts[0] || '未设置' // 如果没有city部分,使用province作为city
        };
      }),
      weights: [
        {
          name: "城市",
          val: this.data.weights.location / 100
        },
        {
          name: "就业",
          val: this.data.weights.employment / 100
        },
        {
          name: "体制",
          val: this.data.weights.government / 100
        },
        {
          name: "升学",
          val: this.data.weights.education / 100
        },
        {
          name: "声誉",
          val: this.data.weights.reputation / 100
        }
      ]
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
    callService(API_PATHS.chooseSchoolsV2, 'POST', requestData)
      .then(res => {
        // res.data 已经是解析好的对象
        const responseData = res.data;
        
        if (responseData.code === 0 && responseData.data) {
          // 存储解析后的数据
          app.globalData.analysisResult = responseData;
          
          wx.hideLoading();
          wx.reLaunch({
            url: '/pages/analysis/analysis'
          });
        } else {
          throw new Error(responseData.message || '请求失败');
        }
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