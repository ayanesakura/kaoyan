const { callService, API_PATHS } = require('../../config/api.js')

Page({
  data: {
    formData: {
      school: '',
      major: '',
      grade: '',
      rank: '',
      project: '',
      firstTry: '',
      targetSchool: '',
      targetMajor: '',
      targetCity: '',
      schoolLevel: ''
    },
    schoolList: [], // 学校搜索结果列表
    showSchoolSelect: false, // 控制下拉列表显示
    isSearching: false, // 添加搜索状态
    targetSchoolList: [], // 目标学校搜索结果列表
    showTargetSchoolSelect: false, // 控制目标学校下拉列表显示
    isTargetSearching: false, // 目标学校搜索状态
    // 添加专业搜索相关状态
    majorSearchResults: [], // 专业搜索原始结果
    majorList: [], // 处理后的专业列表
    directionList: [], // 当前选中专业的方向列表
    showMajorSelect: false, // 控制专业选择下拉框显示
    isMajorSearching: false, // 专业搜索状态
    schoolLevels: ['C9', '985', '211', '一本', '二本'],
    schoolLevelIndex: null,
    grades: ['大一', '大二', '大三', '大四'],
    ranks: ['前10%', '前20%', '前50%', '我会加油的'],
    if_first_try: ['是', '否'],
    // 添加擅长科目选项
    subjects: ['英语', '数学', '政治', '专业课'],
    gradeIndex: null,
    rankIndex: null,
    if_first_try_index: null,
    subjectIndex: null, // 添加科目选择索引
    collegeList: [], // 学院列表
    selectedCollege: '', // 选中的学院
    selectedMajor: '', // 选中的专业
    citySearchResults: [],
    provinceList: [],
    cityList: [],
    showCitySelect: false,
    isCitySearching: false,
    selectedProvince: '',
  },

  // 修改防抖函数，保持this上下文
  debounce(fn, wait) {
    let timer = null;
    const that = this;  // 保存this引用
    return function() {
      if(timer) clearTimeout(timer);
      const args = arguments;
      timer = setTimeout(() => {
        fn.apply(that, args);  // 使用保存的this引用
      }, wait);
    }
  },

  // 搜索学校
  searchSchool: function(value) {
    if(!value) {
      this.setData({
        schoolList: [],
        showSchoolSelect: false
      });
      return;
    }

    this.setData({ isSearching: true });

    callService(API_PATHS.schoolSearch, 'POST', {
      query: value
    })
    .then(res => {
      if(Array.isArray(res.data)) {
        const schools = res.data.map(item => item.name);
        this.setData({
          schoolList: schools,
          showSchoolSelect: true
        });
      } else {
        throw new Error('搜索返回数据格式错误');
      }
    })
    .catch(err => {
      console.error('搜索学校失败:', err);
      wx.showToast({
        title: '搜索失败，请重试',
        icon: 'none'
      });
    })
    .finally(() => {
      this.setData({ isSearching: false });
    });
  },

  // 处理学校输入
  onSchoolInput: function(e) {
    const value = e.detail.value;
    this.setData({
      'formData.school': value
    });
    
    // 创建一个新的防抖函数实例
    if (!this._debounceSearch) {
      this._debounceSearch = this.debounce(this.searchSchool, 300);
    }
    
    // 使用缓存的防抖函数
    this._debounceSearch(value);
  },

  // 选择学校
  onSelectSchool: function(e) {
    const school = e.currentTarget.dataset.school;
    this.setData({
      'formData.school': school,
      showSchoolSelect: false,
      schoolList: []
    });

    // 获取学院专业数据
    callService(API_PATHS.schoolStructure, 'POST', {
      school_name: school
    })
    .then(res => {
      this.setData({
        collegeList: res.data.colleges || [],
        'formData.major': '' // 清空已选专业
      });
    })
    .catch(err => {
      console.error('获取学院专业失败:', err);
      wx.showToast({
        title: '获取学院专业失败',
        icon: 'none'
      });
    });
  },

  onMajorInput(e) {
    this.setData({
      'formData.major': e.detail.value  
    })
  },

  onRankInput(e) {
    this.setData({
      'formData.rank': e.detail.value
    })
  },

  onFirstTryInput(e) {
    this.setData({
      'formData.firstTry': e.detail.value
    })
  },

  onSchoolLevelChange(e) {
    const index = e.detail.value;
    this.setData({
      schoolLevelIndex: index,
      'formData.schoolLevel': this.data.schoolLevels[index]
    });
  },

  onGradeChange(e) {
    const index = e.detail.value;
    this.setData({
      gradeIndex: index,
      'formData.grade': this.data.grades[index]
    });
  },

  onRankChange(e) {
    const index = e.detail.value;
    this.setData({
      rankIndex: index,
      'formData.rank': this.data.ranks[index]
    });
  },

  onIfFirstTryChange(e) {
    const index = e.detail.value;
    this.setData({
      if_first_try_index: index,
      'formData.firstTry': this.data.if_first_try[index]
    });
  },

  onSubjectChange(e) {
    const index = e.detail.value;
    this.setData({
      subjectIndex: index,
      'formData.project': this.data.subjects[index]
    });
  },

  onTargetSchoolInput: function(e) {
    const value = e.detail.value;
    this.setData({
      'formData.targetSchool': value
    });
    
    // 创建一个新的防抖函数实例
    if (!this._debounceTargetSearch) {
      this._debounceTargetSearch = this.debounce(this.searchTargetSchool, 300);
    }
    
    // 使用缓存的防抖函数
    this._debounceTargetSearch(value);
  },

  // 处理专业输入
  onTargetMajorInput: function(e) {
    const value = e.detail.value;
    console.log('专业输入值:', value);
    
    this.setData({
      'formData.targetMajor': value
    });
    
    // 创建一个新的防抖函数实例
    if (!this._debounceMajorSearch) {
      this._debounceMajorSearch = this.debounce(this.searchMajor, 300);
    }
    
    // 使用缓存的防抖函数
    this._debounceMajorSearch(value);
  },

  onTargetCityInput(e) {
    const value = e.detail.value;
    this.setData({
      'formData.targetCity': value
    });

    // 创建一个新的防抖函数实例
    if (!this._debounceCitySearch) {
      this._debounceCitySearch = this.debounce(this.searchCity, 300);
    }
    
    // 使用缓存的防抖函数
    this._debounceCitySearch(value);
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
  },

  onSubmit() {
    console.log('点击提交按钮');
    const formData = this.data.formData;
    
    if(!formData.school || !formData.major || !formData.grade || 
       !formData.rank || !formData.project || !formData.firstTry ||
       !formData.schoolLevel) {
      wx.showToast({
        title: '请填写必填项',
        icon: 'none'
      });
      return;
    }

    // 保存表单数据到全局
    const app = getApp();
    app.globalData.savedFormData = {
      formData: { ...this.data.formData },
      // 保存索引值
      indices: {
        schoolLevelIndex: this.data.schoolLevelIndex,
        gradeIndex: this.data.gradeIndex,
        rankIndex: this.data.rankIndex,
        if_first_try_index: this.data.if_first_try_index,
        subjectIndex: this.data.subjectIndex
      }
    };

    // 准备请求数据
    const requestData = {
      user_info: {
        school: formData.school,
        major: formData.major,
        grade: formData.grade,
        is_first_time: formData.firstTry,
        good_at_subject: formData.project
      },
      target_info: {
        school: formData.targetSchool || '',
        major: formData.targetMajor || '',
        city: formData.targetCity || '',
        school_level: formData.schoolLevel
      }
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
        // 打印完整的返回数据结构
        console.log('接口返回原始数据:', JSON.stringify(res, null, 2));
        
        // 详细的数据结构分析
        console.log('数据结构分析:', {
          resType: typeof res,
          isNull: res === null,
          isUndefined: res === undefined,
          hasData: 'data' in res,
          isArray: Array.isArray(res),
          hasNestedData: res?.data?.data ? true : false,
          nestedDataType: res?.data?.data ? typeof res.data.data : 'undefined',
          isNestedDataArray: Array.isArray(res?.data?.data),
          nestedDataLength: Array.isArray(res?.data?.data) ? res.data.data.length : 'not array'
        });
        
        if (!res) {
          console.error('返回数据为空');
          throw new Error('返回数据为空');
        }

        // 检查返回数据结构
        if (typeof res !== 'object') {
          console.error('返回数据类型错误:', {
            expectedType: 'object',
            actualType: typeof res,
            value: res
          });
          throw new Error('返回数据类型错误');
        }

        // 获取学校数据数组
        let schoolsData;
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          // 标准返回格式：{ code: 200, data: { data: [...] } }
          console.log('返回数据是标准格式');
          schoolsData = res.data.data;
        } else if (res.data && Array.isArray(res.data)) {
          // 直接返回数组的情况：{ code: 200, data: [...] }
          console.log('返回数据是简单数组格式');
          schoolsData = res.data;
        } else if (Array.isArray(res)) {
          // 直接是数组的情况
          console.log('返回数据直接是数组');
          schoolsData = res;
        } else {
          console.error('无法解析的数据格式:', {
            res,
            hasData: 'data' in res,
            dataType: res.data ? typeof res.data : 'undefined',
            hasNestedData: res.data && 'data' in res.data
          });
          throw new Error('返回数据格式错误: 无法解析');
        }

        // 检查学校数据数组
        if (!Array.isArray(schoolsData)) {
          console.error('schools数据不是数组:', {
            dataType: typeof schoolsData,
            data: schoolsData,
            isArray: Array.isArray(schoolsData),
            dataStructure: JSON.stringify(schoolsData, null, 2)
          });
          throw new Error('返回数据格式错误: schools不是数组');
        }

        // 检查数组中的每个元素
        const requiredFields = ['school_name', 'major', 'departments', 'subjects'];
        console.log('开始检查必要字段:', {
          requiredFields,
          dataLength: schoolsData.length,
          firstItem: schoolsData[0]
        });

        schoolsData.forEach((item, index) => {
          console.log(`检查第${index + 1}条数据:`, {
            hasSchoolName: 'school_name' in item,
            hasMajor: 'major' in item,
            hasDepartments: 'departments' in item,
            hasSubjects: 'subjects' in item,
            item: item
          });
        });

        const invalidItems = schoolsData.filter(item => {
          const missingFields = requiredFields.filter(field => !item[field]);
          if (missingFields.length > 0) {
            console.log('发现无效数据项:', {
              item,
              missingFields
            });
          }
          return missingFields.length > 0;
        });

        if (invalidItems.length > 0) {
          console.error('部分数据缺少必要字段:', {
            invalidItemsCount: invalidItems.length,
            invalidItems: invalidItems,
            missingFieldsDetail: invalidItems.map(item => ({
              item,
              missingFields: requiredFields.filter(field => !item[field])
            }))
          });
          throw new Error('部分数据格式不正确');
        }

        // 存储分析结果
        const app = getApp();
        app.globalData.analysisResult = {
          recommendations: schoolsData
        };
        
        console.log('存储到全局数据:', {
          recommendationsCount: schoolsData.length,
          firstItem: schoolsData[0],
          globalData: app.globalData.analysisResult
        });

        wx.hideLoading();
        wx.reLaunch({
          url: '/pages/analysis/analysis'
        });
      })
      .catch(err => {
        console.error('分析失败:', {
          error: err,
          message: err.message,
          stack: err.stack,
          type: err.constructor.name
        });
        wx.hideLoading();
        wx.showToast({
          title: err.message || '分析失败，请重试',
          icon: 'none',
          duration: 3000
        });
      });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 检查是否有保存的表单数据
    const app = getApp();
    const savedData = app.globalData.savedFormData;
    
    if (savedData) {
      console.log('恢复保存的表单数据:', savedData);
      
      // 恢复表单数据
      this.setData({
        formData: { ...savedData.formData },
        // 恢复索引值
        schoolLevelIndex: savedData.indices.schoolLevelIndex,
        gradeIndex: savedData.indices.gradeIndex,
        rankIndex: savedData.indices.rankIndex,
        if_first_try_index: savedData.indices.if_first_try_index,
        subjectIndex: savedData.indices.subjectIndex
      });

      // 如果有学校数据，获取学院专业信息
      if (savedData.formData.school) {
        callService(API_PATHS.schoolStructure, 'POST', {
          school_name: savedData.formData.school
        })
        .then(res => {
          this.setData({
            collegeList: res.data.colleges || []
          });
        })
        .catch(err => {
          console.error('获取学院专业失败:', err);
        });
      }
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 如果是从分析页面返回，不清除数据
    if (this.data.formData.school) {
      return;
    }
    
    // 否则重置表单
    this.setData({
      formData: {
        school: '',
        major: '',
        grade: '',
        rank: '',
        project: '',
        firstTry: '',
        targetSchool: '',
        targetMajor: '',
        targetCity: '',
        schoolLevel: ''
      },
      schoolLevelIndex: null,
      gradeIndex: null,
      rankIndex: null,
      if_first_try_index: null,
      subjectIndex: null,
      collegeList: [],
      selectedCollege: '',
      selectedMajor: ''
    });

    // 清除全局保存的数据
    const app = getApp();
    app.globalData.savedFormData = null;
  },

  // 显示学院专业选择器
  showCollegeSelect() {
    this.setData({
      showCollegePicker: true
    });
  },

  // 选择学院
  onCollegeSelect(e) {
    const college = e.currentTarget.dataset.college;
    const majors = this.data.collegeList.find(item => item.name === college)?.majors || [];
    
    this.setData({
      selectedCollege: college,
      majorList: majors
    });
  },

  // 选择专业
  onMajorSelect(e) {
    const major = e.currentTarget.dataset.major;
    this.setData({
      selectedMajor: major,
      showCollegePicker: false,
      'formData.major': `${this.data.selectedCollege} ${major}`
    });
  },

  // 关闭选择器
  closeCollegePicker() {
    this.setData({
      showCollegePicker: false
    });
  },

  // 搜索目标学校
  searchTargetSchool: function(value) {
    if(!value) {
      this.setData({
        targetSchoolList: [],
        showTargetSchoolSelect: false
      });
      return;
    }

    this.setData({ isTargetSearching: true });

    callService(API_PATHS.schoolSearch, 'POST', {
      query: value
    })
    .then(res => {
      if(Array.isArray(res.data)) {
        const schools = res.data.map(item => item.name);
        this.setData({
          targetSchoolList: schools,
          showTargetSchoolSelect: true
        });
      } else {
        throw new Error('搜索返回数据格式错误');
      }
    })
    .catch(err => {
      console.error('搜索学校失败:', err);
      wx.showToast({
        title: '搜索失败，请重试',
        icon: 'none'
      });
    })
    .finally(() => {
      this.setData({ isTargetSearching: false });
    });
  },

  // 选择目标学校
  onSelectTargetSchool: function(e) {
    const school = e.currentTarget.dataset.school;
    this.setData({
      'formData.targetSchool': school,
      showTargetSchoolSelect: false,
      targetSchoolList: []
    });
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

    // 根据是否选择了目标学校决定使用哪个接口
    const hasTargetSchool = !!this.data.formData.targetSchool;
    const apiPath = hasTargetSchool ? API_PATHS.majorSearch : API_PATHS.generalMajorSearch;
    const requestData = hasTargetSchool ? {
      school: this.data.formData.targetSchool,
      query: value
    } : {
      query: value
    };
    
    console.log('专业搜索接口输入:', {
      api: apiPath,
      data: requestData
    });

    callService(apiPath, 'POST', requestData)
    .then(res => {
      console.log('专业搜索接口返回:', res.data);
      
      if(Array.isArray(res.data)) {
        // 检查返回数据的具体结构
        console.log('返回数据第一项:', res.data[0]);
        console.log('返回数据major字段示例:', res.data.map(item => item.major).slice(0, 3));
        
        // 收集所有有效的专业名称
        const validMajors = res.data
          .map(item => item.major)
          .filter(major => major && typeof major === 'string' && major.trim() !== '');
          
        console.log('有效的专业名称:', validMajors);
        
        // 使用Set去重
        const majorSet = new Set(validMajors);
        console.log('去重后的Set:', majorSet);
        
        // 转换为数组
        const majorList = Array.from(majorSet);
        console.log('最终的专业列表:', majorList);
        
        this.setData({
          majorSearchResults: res.data,
          majorList: majorList,
          showMajorSelect: true,
          directionList: [] // 清空方向列表
        }, () => {
          // 在状态更新后检查
          console.log('更新后的状态:', {
            showMajorSelect: this.data.showMajorSelect,
            majorListLength: this.data.majorList.length,
            majorSearchResultsLength: this.data.majorSearchResults.length,
            majorListContent: this.data.majorList
          });
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
    
    // 查找该专业的所有方向
    const directions = this.data.majorSearchResults
      .filter(item => item.major === major)
      .map(item => item.fx)
      .filter(Boolean); // 过滤掉空值
    
    this.setData({
      selectedMajor: major,
      directionList: directions,
      'formData.targetMajor': major // 直接使用专业名
    });
  },

  // 选择方向
  onSelectDirection: function(e) {
    const direction = e.currentTarget.dataset.direction;
    const majorName = this.data.selectedMajor;
    
    this.setData({
      'formData.targetMajor': `${majorName}(${direction})`, // 只显示专业名和方向
      showMajorSelect: false,
      majorList: [],
      directionList: []
    });
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
      console.log('城市搜索接口返回:', res.data);
      
      // 处理404的情况
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
        // 按省份分组处理数据
        const provinceMap = new Map();
        res.data.forEach(item => {
          if (!provinceMap.has(item.province)) {
            provinceMap.set(item.province, []);
          }
          provinceMap.get(item.province).push(item.city);
        });
        
        // 获取所有省份
        const provinceList = Array.from(provinceMap.keys());
        
        this.setData({
          citySearchResults: res.data,
          provinceList: provinceList,
          showCitySelect: true,
          cityList: [], // 清空城市列表
          selectedProvince: '' // 清空选中的省份
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
    
    // 查找该省份的所有城市
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
    
    this.setData({
      'formData.targetCity': city,
      showCitySelect: false,
      provinceList: [],
      cityList: []
    });
  },

  /**
   * 分析选校结果
   */
  async analyzeSchools() {
    try {
      wx.showLoading({
        title: '分析中...',
        mask: true
      });

      const formData = this.data.formData;
      console.log('发送分析请求，表单数据:', formData);

      const res = await wx.cloud.callFunction({
        name: 'choose_schools',
        data: formData
      });

      console.log('接口返回原始数据:', res);

      if (!res || !res.result) {
        console.error('接口返回数据为空:', res);
        throw new Error('返回数据为空');
      }

      if (res.result.code !== 200) {
        console.error('接口返回错误码:', res.result.code);
        throw new Error('接口返回错误: ' + res.result.code);
      }

      if (!res.result.data) {
        console.error('接口返回数据缺少data字段:', res.result);
        throw new Error('返回数据格式错误');
      }

      // 验证关键数据字段
      const data = res.result.data;
      console.log('解析后的数据:', data);

      if (!Array.isArray(data.fsx)) {
        console.error('分数线数据格式错误:', data.fsx);
        throw new Error('分数线数据格式错误');
      }

      // 验证必要字段
      const requiredFields = ['school_name', 'major', 'departments', 'subjects'];
      const missingFields = requiredFields.filter(field => !data[field]);
      if (missingFields.length > 0) {
        console.error('缺少必要字段:', missingFields);
        throw new Error('数据缺少必要字段: ' + missingFields.join(', '));
      }

      // 验证分数数据格式
      if (data.fsx.length > 0) {
        const firstYear = data.fsx[0];
        if (!firstYear.year || !Array.isArray(firstYear.data)) {
          console.error('分数数据格式错误:', firstYear);
          throw new Error('分数数据格式错误');
        }
      }

      // 存储分析结果
      const app = getApp();
      app.globalData.analysisResult = {
        recommendations: res.result.data
      };
      
      console.log('存储到全局数据:', app.globalData.analysisResult);

      // 跳转到分析页面
      wx.navigateTo({
        url: '/pages/analysis/analysis'
      });

    } catch (error) {
      console.error('分析失败:', error);
      wx.showToast({
        title: '分析失败: ' + error.message,
        icon: 'none',
        duration: 3000
      });
    } finally {
      wx.hideLoading();
    }
  },
}) 

// 在现有代码基础上添加请求重试函数
const MAX_RETRY = 3; // 最大重试次数

function requestWithRetry(options, retryCount = 0) {
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: resolve,
      fail: (err) => {
        console.error(`请求失败(${retryCount + 1}次):`, err);
        if (retryCount < MAX_RETRY) {
          // 延迟重试
          setTimeout(() => {
            requestWithRetry(options, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, 1000 * (retryCount + 1)); // 递增重试延迟
        } else {
          reject(err);
        }
      }
    });
  });
} 