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
    majorList: [], // 当前选中学院的专业列表
    showCollegePicker: false, // 控制选择器显示
    selectedCollege: '', // 选中的学院
    selectedMajor: '', // 选中的专业
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

  onTargetMajorInput(e) {
    this.setData({
      'formData.targetMajor': e.detail.value
    });
  },

  onTargetCityInput(e) {
    this.setData({
      'formData.targetCity': e.detail.value
    });
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

    // 准备请求数据
    const requestData = {
      current_school: formData.school,
      current_major: formData.major,
      grade: formData.grade,
      rank: formData.rank,
      good_major: formData.project,
      target_school: formData.targetSchool || '',
      target_city: formData.targetCity || '',
      target_major: formData.targetMajor || '',
      target_level: formData.schoolLevel
    };

    console.log('请求数据：', requestData);

    // 先跳转到loading页面
    wx.navigateTo({
      url: '/pages/loading/loading',
      success: () => {
        console.log('跳转到loading页面成功');
        // 在loading页面打开后再调用接口
        setTimeout(() => {
          callService(API_PATHS.analyze, 'POST', requestData)
            .then(res => {
              if(res.data.success) {
                getApp().globalData.analysisResult = res.data;
                wx.reLaunch({
                  url: '/pages/analysis/analysis'
                });
              } else {
                throw new Error(res.data.message || '分析失败');
              }
            })
            .catch(err => {
              console.error('分析失败:', err);
              wx.showToast({
                title: err.message || '分析失败，请重试',
                icon: 'none'
              });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            });
        }, 500);
      },
      fail: (err) => {
        console.error('跳转到loading页面失败:', err);
      }
    });
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