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

  // 模拟搜索学校
  searchSchool: function(value) {
    if(!value) {
      this.setData({
        schoolList: [],
        showSchoolSelect: false
      });
      return;
    }

    // 模拟数据
    const mockResults = [
      `${value}大学`,
      `${value}大专`,
      `${value}职业技术学院`
    ];

    this.setData({
      schoolList: mockResults,
      showSchoolSelect: true
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