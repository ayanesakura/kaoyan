const { getApiUrl } = require('../../config/api.js')

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
  },

  // 防抖函数
  debounce(fn, wait) {
    let timer = null;
    return function() {
      if(timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, arguments);
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

    // 调用接口搜索学校
    wx.request({
      url: getApiUrl('schoolSearch'),
      data: { query: value },
      success: (res) => {
        // 处理返回的数据
        const schools = (res.data || []).map(item => item.name);
        
        this.setData({
          schoolList: schools,
          showSchoolSelect: true
        });
      },
      fail: (err) => {
        console.error('搜索学校失败:', err);
        wx.showToast({
          title: '搜索失败，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ isSearching: false });
      }
    });
  },

  // 处理学校输入
  onSchoolInput: function(e) {
    const value = e.detail.value;
    this.setData({
      'formData.school': value
    });
    
    // 使用防抖处理搜索
    this.debounce(this.searchSchool, 300)(value);
  },

  // 选择学校
  onSelectSchool: function(e) {
    const school = e.currentTarget.dataset.school;
    this.setData({
      'formData.school': school,
      showSchoolSelect: false,
      schoolList: []
    });
  },

  onMajorInput(e) {
    this.setData({
      'formData.major': e.detail.value  
    })
  },

  onGradeInput(e) {
    this.setData({
      'formData.grade': e.detail.value
    })
  },

  onRankInput(e) {
    this.setData({
      'formData.rank': e.detail.value
    })
  },

  onProjectInput(e) {
    this.setData({
      'formData.project': e.detail.value
    })
  },

  onFirstTryInput(e) {
    this.setData({
      'formData.firstTry': e.detail.value
    })
  },

  onSubmit() {
    const formData = this.data.formData
    
    // 表单验证
    if(!formData.school || !formData.major || !formData.grade || 
       !formData.rank || !formData.project || !formData.firstTry) {
      wx.showToast({
        title: '请填写必填项',
        icon: 'none'
      })
      return
    }

    // TODO: 提交表单数据
    wx.showToast({
      title: '提交成功',
      icon: 'success'
    })
  }
}) 