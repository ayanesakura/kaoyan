const { callService, API_PATHS } = require('../../config/api.js')

Page({
  data: {
    formData: {
      targetMajor: [],
      targetCity: [],
      workCity: [],
      schoolLevels: []
    },
    // 专业搜索相关
    majorSearchResults: [],
    majorList: [],
    directionList: [],
    showMajorSelect: false,
    isMajorSearching: false,
    selectedMajor: '',
    // 城市搜索相关
    targetCityInput: '',
    citySearchResults: [],
    provinceList: [],
    cityList: [],
    showCitySelect: false,
    isCitySearching: false,
    selectedProvince: '',
    // 工作城市相关
    workCityInput: '',
    workCitySearchResults: [],
    workCityProvinceList: [],
    workCityCityList: [],
    showWorkCitySelect: false,
    isWorkCitySearching: false,
    selectedWorkCityProvince: '',
    // 学校层级相关
    schoolLevelOptions: ['C9', '985', '211', '一本', '二本'],
    selectedSchoolLevels: []
  },

  onLoad(options) {
    // 获取上一页传递的数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptPersonalInfo', (data) => {
      // 保存个人信息数据
      this.personalInfo = data;
      
      // 检查是否有保存的目标院校数据
      const app = getApp();
      const savedTargetData = app.globalData.savedTargetData;
      if (savedTargetData) {
        this.setData({
          formData: savedTargetData,
          selectedSchoolLevels: savedTargetData.schoolLevels || []
        });
      }
    });
  },

  // 返回上一页
  onBack() {
    // 保存当前填写的数据到全局变量
    const app = getApp();
    app.globalData.savedTargetData = {
      targetMajor: this.data.formData.targetMajor,
      targetCity: this.data.formData.targetCity,
      workCity: this.data.formData.workCity,
      schoolLevels: this.data.formData.schoolLevels
    };

    // 返回上一页
    wx.navigateBack();
  },

  // 防抖函数
  debounce(fn, wait) {
    let timer = null;
    const that = this;
    return function() {
      if(timer) clearTimeout(timer);
      const args = arguments;
      timer = setTimeout(() => {
        fn.apply(that, args);
      }, wait);
    }
  },

  // 修改专业输入处理
  onTargetMajorInput: function(e) {
    const value = e.detail.value;
    this.setData({
      targetMajorInput: value
    });
    
    if (!this._debounceMajorSearch) {
      this._debounceMajorSearch = this.debounce(this.searchMajor, 300);
    }
    
    this._debounceMajorSearch(value);
  },

  // 搜索专业
  searchMajor: function(value) {
    if(!value) {
      this.setData({
        majorSearchResults: [],
        majorList: [],
        directionList: [],
        showMajorSelect: false
      });
      return;
    }

    this.setData({ isMajorSearching: true });

    callService(API_PATHS.generalMajorSearch, 'POST', {
      query: value
    })
    .then(res => {
      if(Array.isArray(res.data)) {
        const validMajors = res.data
          .map(item => item.major)
          .filter(major => major && typeof major === 'string' && major.trim() !== '');
          
        const majorSet = new Set(validMajors);
        const majorList = Array.from(majorSet);
        
        this.setData({
          majorSearchResults: res.data,
          majorList: majorList,
          showMajorSelect: true,
          directionList: []
        });
      } else {
        throw new Error('搜索返回数据格式错误');
      }
    })
    .catch(err => {
      console.error('搜索专业失败:', err);
      wx.showToast({
        title: '搜索失败，请重试',
        icon: 'none'
      });
    })
    .finally(() => {
      this.setData({ isMajorSearching: false });
    });
  },

  // 关闭专业选择器
  closeMajorSelect: function() {
    this.setData({
      showMajorSelect: false,
      majorList: [],
      directionList: []
    });
  },

  // 选择专业
  onSelectMajor: function(e) {
    const major = e.currentTarget.dataset.major;
    
    const directions = this.data.majorSearchResults
      .filter(item => item.major === major)
      .map(item => item.fx)
      .filter(Boolean);
    
    this.setData({
      selectedMajor: major,
      directionList: directions
    });
  },

  // 选择专业方向
  onSelectDirection: function(e) {
    const direction = e.currentTarget.dataset.direction;
    const majorName = this.data.selectedMajor;
    const newMajor = `${majorName}(${direction})`;
    
    if (!this.data.formData.targetMajor.includes(newMajor)) {
      this.setData({
        'formData.targetMajor': [...this.data.formData.targetMajor, newMajor],
        targetMajorInput: '',
        showMajorSelect: false,
        majorList: [],
        directionList: []
      });
    }
  },

  // 删除已选专业
  onDeleteMajor: function(e) {
    const index = e.currentTarget.dataset.index;
    const targetMajor = [...this.data.formData.targetMajor];
    targetMajor.splice(index, 1);
    this.setData({
      'formData.targetMajor': targetMajor
    });
  },

  // 修改城市输入处理
  onTargetCityInput(e) {
    const value = e.detail.value;
    this.setData({
      targetCityInput: value
    });

    if (!this._debounceCitySearch) {
      this._debounceCitySearch = this.debounce(this.searchCity, 300);
    }
    
    this._debounceCitySearch(value);
  },

  // 搜索城市
  searchCity: function(value) {
    if(!value) {
      this.setData({
        citySearchResults: [],
        provinceList: [],
        cityList: [],
        showCitySelect: false
      });
      return;
    }

    this.setData({ isCitySearching: true });

    callService(API_PATHS.citySearch, 'POST', {
      query: value
    })
    .then(res => {
      if (res.data.code === 404) {
        this.setData({
          citySearchResults: [],
          provinceList: [],
          cityList: [],
          showCitySelect: true
        });
        return;
      }
      
      if(Array.isArray(res.data)) {
        const provinceMap = new Map();
        res.data.forEach(item => {
          if (!provinceMap.has(item.province)) {
            provinceMap.set(item.province, []);
          }
          provinceMap.get(item.province).push(item.city);
        });
        
        const provinceList = Array.from(provinceMap.keys());
        
        this.setData({
          citySearchResults: res.data,
          provinceList: provinceList,
          showCitySelect: true,
          cityList: [],
          selectedProvince: ''
        });
      } else {
        throw new Error('搜索返回数据格式错误');
      }
    })
    .catch(err => {
      console.error('搜索城市失败:', err);
      this.setData({
        citySearchResults: [],
        provinceList: [],
        cityList: [],
        showCitySelect: true
      });
    })
    .finally(() => {
      this.setData({ isCitySearching: false });
    });
  },

  // 选择省份
  onSelectProvince: function(e) {
    const province = e.currentTarget.dataset.province;
    
    const cities = this.data.citySearchResults
      .filter(item => item.province === province)
      .map(item => item.city);
    
    this.setData({
      selectedProvince: province,
      cityList: cities
    });
  },

  // 关闭城市选择器
  closeCitySelect: function() {
    this.setData({
      showCitySelect: false,
      provinceList: [],
      cityList: []
    });
  },

  // 选择城市
  onSelectCity: function(e) {
    const city = e.currentTarget.dataset.city;
    
    if (!this.data.formData.targetCity.includes(city)) {
      this.setData({
        'formData.targetCity': [...this.data.formData.targetCity, city],
        targetCityInput: '',
        showCitySelect: false,
        provinceList: [],
        cityList: []
      });
    }
  },

  // 删除已选城市
  onDeleteCity: function(e) {
    const index = e.currentTarget.dataset.index;
    const targetCity = [...this.data.formData.targetCity];
    targetCity.splice(index, 1);
    this.setData({
      'formData.targetCity': targetCity
    });
  },

  // 工作城市相关函数
  onWorkCityInput(e) {
    const value = e.detail.value;
    this.setData({
      workCityInput: value
    });

    if (!this._debounceWorkCitySearch) {
      this._debounceWorkCitySearch = this.debounce(this.searchWorkCity, 300);
    }
    
    this._debounceWorkCitySearch(value);
  },

  searchWorkCity: function(value) {
    if(!value) {
      this.setData({
        workCitySearchResults: [],
        workCityProvinceList: [],
        workCityCityList: [],
        showWorkCitySelect: false
      });
      return;
    }

    this.setData({ isWorkCitySearching: true });

    callService(API_PATHS.citySearch, 'POST', {
      query: value
    })
    .then(res => {
      if (res.data.code === 404) {
        this.setData({
          workCitySearchResults: [],
          workCityProvinceList: [],
          workCityCityList: [],
          showWorkCitySelect: true
        });
        return;
      }
      
      if(Array.isArray(res.data)) {
        const provinceMap = new Map();
        res.data.forEach(item => {
          if (!provinceMap.has(item.province)) {
            provinceMap.set(item.province, []);
          }
          provinceMap.get(item.province).push(item.city);
        });
        
        const provinceList = Array.from(provinceMap.keys());
        
        this.setData({
          workCitySearchResults: res.data,
          workCityProvinceList: provinceList,
          showWorkCitySelect: true,
          workCityCityList: [],
          selectedWorkCityProvince: ''
        });
      } else {
        throw new Error('搜索返回数据格式错误');
      }
    })
    .catch(err => {
      console.error('搜索工作城市失败:', err);
      this.setData({
        workCitySearchResults: [],
        workCityProvinceList: [],
        workCityCityList: [],
        showWorkCitySelect: true
      });
    })
    .finally(() => {
      this.setData({ isWorkCitySearching: false });
    });
  },

  onSelectWorkCityProvince: function(e) {
    const province = e.currentTarget.dataset.province;
    
    const cities = this.data.workCitySearchResults
      .filter(item => item.province === province)
      .map(item => item.city);
    
    this.setData({
      selectedWorkCityProvince: province,
      workCityCityList: cities
    });
  },

  closeWorkCitySelect: function() {
    this.setData({
      showWorkCitySelect: false,
      workCityProvinceList: [],
      workCityCityList: []
    });
  },

  onSelectWorkCity: function(e) {
    const city = e.currentTarget.dataset.city;
    
    if (!this.data.formData.workCity.includes(city)) {
      this.setData({
        'formData.workCity': [...this.data.formData.workCity, city],
        workCityInput: '',
        showWorkCitySelect: false,
        workCityProvinceList: [],
        workCityCityList: []
      });
    }
  },

  onDeleteWorkCity: function(e) {
    const index = e.currentTarget.dataset.index;
    const workCity = [...this.data.formData.workCity];
    workCity.splice(index, 1);
    this.setData({
      'formData.workCity': workCity
    });
  },

  // 学校层级相关函数
  onSchoolLevelChange(e) {
    const value = e.detail.value;
    const level = this.data.schoolLevelOptions[value];
    
    const index = this.data.selectedSchoolLevels.indexOf(level);
    let newSelectedLevels = [...this.data.selectedSchoolLevels];
    
    if (index === -1) {
      newSelectedLevels.push(level);
    } else {
      newSelectedLevels.splice(index, 1);
    }
    
    this.setData({
      selectedSchoolLevels: newSelectedLevels,
      'formData.schoolLevels': newSelectedLevels
    });
  },

  onDeleteSchoolLevel(e) {
    const index = e.currentTarget.dataset.index;
    const newSelectedLevels = [...this.data.selectedSchoolLevels];
    newSelectedLevels.splice(index, 1);
    
    this.setData({
      selectedSchoolLevels: newSelectedLevels,
      'formData.schoolLevels': newSelectedLevels
    });
  },

  // 提交表单
  onSubmit() {
    if(this.data.formData.targetMajor.length === 0) {
      wx.showToast({
        title: '请填写期望专业',
        icon: 'none'
      });
      return;
    }

    // 合并个人信息和目标信息
    const formData = {
      ...this.personalInfo,
      ...this.data.formData
    };

    // 保存表单数据到全局
    const app = getApp();
    app.globalData.savedFormData = {
      formData: formData,
      indices: this.personalInfo.indices
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
      school_level: formData.schoolLevels.join(',') || ''
    };

    // 保存到globalData
    app.globalData.userInfo = userInfo;
    app.globalData.targetInfo = targetInfo;

    // 保存到本地存储
    try {
      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('targetInfo', targetInfo);
      console.log('用户信息和目标信息已保存到本地存储');
    } catch (e) {
      console.error('保存到本地存储失败:', e);
    }

    // 准备请求数据
    const requestData = {
      user_info: userInfo,
      target_info: targetInfo
    };

    // 处理空字符串
    const processedData = this.processRequestData(requestData);
    console.log('处理后的请求数据：', processedData);

    // 显示加载提示
    wx.showLoading({
      title: '分析中...',
      mask: true
    });

    // 调用接口
    callService(API_PATHS.chooseSchools, 'POST', processedData)
      .then(res => {
        if (!res || !res.result) {
          throw new Error('返回数据为空');
        }

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
        const app = getApp();
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
  },

  /**
   * 处理请求数据，将空字符串转换为null
   */
  processRequestData(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result = {};
    for (const key in obj) {
      if (obj[key] === '') {
        result[key] = null;
      } else if (typeof obj[key] === 'object') {
        result[key] = this.processRequestData(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }
}) 