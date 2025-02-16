// pages/analysis/analysis.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    recommendations: [],
    showTrend: false,
    trendTitle: '',
    trendData: [],
    currentSchool: null,
    showChart: false,
    chartData: null,
    chartUnit: '分',  // 添加默认单位
    userInfo: {},
    targetInfo: {}
  },

  /**
   * 处理单个学校的分数数据
   */
  processScoreData(fsx, subjectName) {
    if (!fsx || !fsx[0] || !fsx[0].data) return '/';
    const subjectData = fsx[0].data.find(function(s) {
      return s.subject === subjectName;
    });
    return subjectData ? subjectData.score : '/';
  },

  /**
   * 处理趋势图表数据
   */
  processChartData(fsx, subjectName) {
    if (!fsx || !Array.isArray(fsx)) {
      console.log('无效的分数线数据');
      return null;
    }
    
    // 按年份去重，保留最新的数据
    const uniqueData = {};
    fsx.forEach(item => {
      if (!uniqueData[item.year] || item.year > uniqueData[item.year].year) {
        uniqueData[item.year] = item;
      }
    });
    
    // 转换为数组并按年份排序
    const sortedData = Object.values(uniqueData).sort((a, b) => a.year - b.year);
    
    const years = [];
    const values = [];
    
    sortedData.forEach(item => {
      if (item.year) {
        years.push(item.year);
        let value = null;
        
        if (item.data) {
          const subjectData = item.data.find(s => s.subject === subjectName);
          value = subjectData ? (parseFloat(subjectData.score) || null) : null;
        }
        
        values.push(value);
      }
    });

    console.log('处理后的图表数据:', { years, values });
    
    // 确保有有效数据
    if (years.length === 0 || values.every(v => v === null)) {
      console.log('没有有效的趋势数据');
      return null;
    }
    
    return { years, values };
  },

  /**
   * 处理单个学校的报录比数据
   */
  processBlbRatio(blb) {
    if (!blb || !Array.isArray(blb) || blb.length === 0) return '/';
    
    // 找到最新年份的数据
    const latestData = blb.reduce((latest, current) => {
      return (!latest || current.year > latest.year) ? current : latest;
    }, null);
    
    // 如果没有最新数据或者没有报录比值，返回'/'
    if (!latestData || !latestData.blb) return '/';
    
    // 获取当前年份
    const currentYear = new Date().getFullYear();
    // 设置数据有效期阈值（比如最近3年的数据）
    const validThreshold = currentYear - 3;
    
    // 如果数据太旧，返回'/'
    if (latestData.year < validThreshold) {
      console.log('报录比数据过期:', latestData.year, '阈值:', validThreshold);
      return '/';
    }
    
    return latestData.blb;
  },

  /**
   * 处理报录比趋势数据
   */
  processBlbData(blb) {
    if (!blb || !Array.isArray(blb)) {
      console.log('无效的报录比数据');
      return null;
    }
    
    // 按年份去重，保留最新的数据
    const uniqueData = {};
    blb.forEach(item => {
      if (!uniqueData[item.year] || item.year > uniqueData[item.year].year) {
        uniqueData[item.year] = item;
      }
    });
    
    // 转换为数组并按年份排序
    const sortedData = Object.values(uniqueData).sort((a, b) => a.year - b.year);
    
    const years = [];
    const values = [];
    
    sortedData.forEach(item => {
      if (item.year) {
        years.push(item.year);
        // 将百分比字符串转换为数值
        const value = item.blb ? parseFloat(item.blb.replace('%', '')) : null;
        values.push(value);
      }
    });

    console.log('处理后的报录比数据:', { years, values });
    
    // 确保有有效数据
    if (years.length === 0 || values.every(v => v === null)) {
      console.log('没有有效的报录比数据');
      return null;
    }
    
    return { years, values };
  },

  /**
   * 验证数据是否有效
   */
  validateData(item) {
    // 检查必要字段
    const requiredFields = [
      'school_name',
      'school_code',
      'major',
      'major_code',
      'probability'
    ];

    const missingFields = requiredFields.filter(field => !item[field]);
    
    if (missingFields.length > 0) {
      console.error('缺少必要字段:', missingFields);
      return false;
    }

    return true;
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const app = getApp();
    const analysisResult = app.globalData.analysisResult;
    let userInfo = app.globalData.userInfo;
    let targetInfo = app.globalData.targetInfo;

    console.log('从globalData获取的用户信息:', userInfo);
    console.log('从globalData获取的目标信息:', targetInfo);

    // 如果globalData中没有数据，尝试从本地存储获取
    if (!userInfo) {
      try {
        userInfo = wx.getStorageSync('userInfo');
        console.log('从本地存储获取的用户信息:', userInfo);
      } catch (e) {
        console.error('从本地存储获取用户信息失败:', e);
      }
    }

    if (!targetInfo) {
      try {
        targetInfo = wx.getStorageSync('targetInfo');
        console.log('从本地存储获取的目标信息:', targetInfo);
      } catch (e) {
        console.error('从本地存储获取目标信息失败:', e);
      }
    }

    // 保存用户信息和目标信息
    this.setData({
      userInfo,
      targetInfo
    });

    if (!analysisResult || !analysisResult.recommendations) {
      console.error('接口返回数据格式错误:', analysisResult);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
      return;
    }

    const schoolsData = analysisResult.recommendations;
    if (!Array.isArray(schoolsData)) {
      console.error('recommendations不是数组:', schoolsData);
      wx.showToast({
        title: '数据格式错误',
        icon: 'none'
      });
      return;
    }

    // 处理每个学校的数据
    const processedData = schoolsData.map(item => {
      // 验证数据有效性
      if (!this.validateData(item)) {
        console.error('数据验证失败:', item);
        return null;
      }

      // 处理学校名称和代码
      const schoolDisplay = `${item.school_name}\n(${item.school_code})`;

      // 处理专业名称和代码
      const majorDisplay = item.major;

      // 获取最新年份的就业数据
      const latestEmploymentData = item.employment_data && item.employment_data.length > 0 
        ? item.employment_data[item.employment_data.length - 1] 
        : null;

      // 获取最新年份的分数线数据
      const latestScoreData = item.score_data && item.score_data.length > 0
        ? item.score_data[item.score_data.length - 1]
        : null;

      return {
        ...item,
        // 基本信息
        school: schoolDisplay,
        major: majorDisplay,
        probability: (item.probability || 0).toFixed(2) + '%',
        
        // 分数线数据
        englishScore: latestScoreData ? latestScoreData.english || '/' : '/',
        mathScore: latestScoreData ? latestScoreData.math || '/' : '/',
        majorScore: latestScoreData ? latestScoreData.major || '/' : '/',
        politicsScore: latestScoreData ? latestScoreData.politics || '/' : '/',
        totalScore: latestScoreData ? latestScoreData.total || '/' : '/',

        // 就业相关信息
        employment_status: latestEmploymentData ? latestEmploymentData.status || '/' : '/',
        further_study_ratio: latestEmploymentData ? latestEmploymentData.further_study_ratio || '/' : '/',
        civil_service_ratio: latestEmploymentData ? latestEmploymentData.civil_service_ratio || '/' : '/',
        employment_ratio: latestEmploymentData ? latestEmploymentData.employment_ratio || '/' : '/',

        // 保存原始数据用于趋势图
        score_data: item.score_data || [],
        employment_data: item.employment_data || []
      };
    }).filter(item => item !== null); // 过滤掉无效的数据

    if (processedData.length === 0) {
      wx.showToast({
        title: '没有有效的数据',
        icon: 'none'
      });
      return;
    }

    this.setData({
      recommendations: processedData
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 获取科目显示名称
   */
  getSubjectDisplayName(school, subjectName) {
    // 从第一个方向的第一组考试科目中获取科目信息
    if (!school.directions || !school.directions[0] || !school.directions[0].subjects || !school.directions[0].subjects[0]) {
      return subjectName;
    }

    const subject = school.directions[0].subjects[0].find(s => s.name === subjectName);
    if (!subject) return subjectName;

    // 如果value包含换行符，使用name
    if (subject.value && subject.value.includes('\n')) {
      return subject.name;
    }

    return `${subject.value}(${subject.code})`;
  },

  /**
   * 显示趋势数据
   */
  showTrend(e) {
    const { type, index } = e.currentTarget.dataset;
    console.log('显示趋势数据:', { type, index });
    
    const school = this.data.recommendations[index];
    const schoolName = school.school.split('\n')[0];  // 只使用学校名称，不包含代码
    let title = '';
    let showChart = true;
    let chartData = null;
    let chartUnit = '分';  // 默认单位为分

    const processScoreData = (data, field) => {
      if (!data || !Array.isArray(data) || data.length === 0) return null;
      
      const years = data.map(item => item.year);
      const values = data.map(item => item[field] ? parseFloat(item[field]) : null);
      
      return { years, values };
    };

    const processEmploymentData = (data, field) => {
      if (!data || !Array.isArray(data) || data.length === 0) return null;
      
      const years = data.map(item => item.year);
      const values = data.map(item => {
        if (!item[field]) return null;
        // 移除百分号并转换为数字
        return parseFloat(item[field].replace('%', ''));
      });
      
      return { years, values };
    };

    switch(type) {
      case 'score':
        title = `${schoolName} - 总分数线趋势`;
        chartData = processScoreData(school.score_data, 'total');
        break;
      case 'english':
        title = `${schoolName} - 英语分数趋势`;
        chartData = processScoreData(school.score_data, 'english');
        break;
      case 'math':
        title = `${schoolName} - 数学分数趋势`;
        chartData = processScoreData(school.score_data, 'math');
        break;
      case 'major_subject':
        title = `${schoolName} - 专业课分数趋势`;
        chartData = processScoreData(school.score_data, 'major');
        break;
      case 'politics':
        title = `${schoolName} - 政治分数趋势`;
        chartData = processScoreData(school.score_data, 'politics');
        break;
      case 'employment':
        title = `${schoolName} - 就业情况趋势`;
        chartData = processEmploymentData(school.employment_data, 'status');
        chartUnit = '%';
        break;
      case 'further':
        title = `${schoolName} - 深造占比趋势`;
        chartData = processEmploymentData(school.employment_data, 'further_study_ratio');
        chartUnit = '%';
        break;
      case 'civil':
        title = `${schoolName} - 考公占比趋势`;
        chartData = processEmploymentData(school.employment_data, 'civil_service_ratio');
        chartUnit = '%';
        break;
      case 'job':
        title = `${schoolName} - 就业占比趋势`;
        chartData = processEmploymentData(school.employment_data, 'employment_ratio');
        chartUnit = '%';
        break;
    }

    console.log('设置数据:', {
      showChart,
      chartData,
      title,
      chartUnit
    });

    // 如果是图表模式但没有数据，显示提示
    if (!chartData || chartData.years.length === 0) {
      wx.showToast({
        title: '暂无趋势数据',
        icon: 'none'
      });
      return;
    }

    this.setData({
      showTrend: true,
      trendTitle: title,
      showChart,
      chartData,
      chartUnit
    });
  },

  /**
   * 关闭趋势面板
   */
  closeTrend() {
    this.setData({
      showTrend: false,
      trendTitle: '',
      trendData: [],
      currentSchool: null,
      showChart: false,
      chartData: null
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '考研院校分析结果',
      path: '/pages/fill/fill'
    };
  },

  /**
   * 显示专业方向详情
   */
  showDirections(e) {
    const index = e.currentTarget.dataset.index;
    const school = this.data.recommendations[index];
    
    console.log('点击专业，准备跳转:', {
      index,
      school
    });
    
    // 准备要传递的数据
    const params = {
      school: school.school_name,
      school_code: school.school_code,
      major: school.major,
      major_code: school.major_code,
      departments: school.departments,
      directions: encodeURIComponent(JSON.stringify(school.directions))
    };
    
    // 构建查询字符串
    const query = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    console.log('跳转参数:', query);
    
    // 跳转到方向详情页
    wx.navigateTo({
      url: `/pages/directions/directions?${query}`,
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 开始AI分析
  startAIAnalysis() {
    console.log('开始AI分析，用户信息:', this.data.userInfo);
    console.log('目标信息:', this.data.targetInfo);

    if (!this.data.userInfo || !this.data.targetInfo) {
      console.error('缺少必要信息:', {
        userInfo: this.data.userInfo,
        targetInfo: this.data.targetInfo
      });
      
      wx.showToast({
        title: '请先完善个人信息',
        icon: 'none',
        duration: 2000
      });
      
      // 延迟后跳转到填写页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/fill/fill'
        });
      }, 2000);
      
      return;
    }

    const analysisData = {
      user_info: {
        school: this.data.userInfo.school,
        major: this.data.userInfo.major,
        grade: this.data.userInfo.grade,
        is_first_time: this.data.userInfo.is_first_time,
        good_at_subject: this.data.userInfo.good_at_subject
      },
      target_info: {
        school_level: this.data.targetInfo.school_level
      }
    };

    console.log('准备发送的分析数据:', analysisData);

    // 验证数据完整性
    const requiredUserFields = ['school', 'major', 'grade', 'is_first_time', 'good_at_subject'];
    const missingUserFields = requiredUserFields.filter(field => !analysisData.user_info[field]);
    
    if (missingUserFields.length > 0) {
      console.error('用户信息不完整，缺少字段:', missingUserFields);
      wx.showToast({
        title: '请完善个人信息',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (!analysisData.target_info.school_level) {
      console.error('目标信息不完整，缺少school_level字段');
      wx.showToast({
        title: '请设置目标院校层次',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/ai_analysis/ai_analysis',
      success: (res) => {
        res.eventChannel.emit('acceptAnalysisData', analysisData);
      },
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  }
})