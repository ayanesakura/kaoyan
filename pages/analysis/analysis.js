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
    chartData: null
  },

  /**
   * 处理单个学校的分数数据
   */
  processScoreData(fsx, subject) {
    if (!fsx || !fsx[0] || !fsx[0].data) return '/';
    const subjectData = fsx[0].data.find(function(s) {
      return s.subject === subject;
    });
    return subjectData ? subjectData.score : '/';
  },

  /**
   * 处理趋势图表数据
   */
  processChartData(fsx, dataType) {
    if (!fsx || !Array.isArray(fsx)) {
      console.log('无效的分数线数据');
      return null;
    }
    
    // 按年份排序
    const sortedData = [...fsx].sort((a, b) => a.year - b.year);
    
    const years = [];
    const values = [];
    
    sortedData.forEach(item => {
      if (item.year) {
        years.push(item.year);
        let value = null;
        
        if (dataType === 'total') {
          value = parseInt(item.total) || null;
        } else if (item.data) {
          const subjectData = item.data.find(s => s.subject === dataType);
          value = subjectData ? (parseInt(subjectData.score) || null) : null;
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
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const analysisResult = getApp().globalData.analysisResult;
    if(analysisResult && analysisResult.recommendations) {
      // 处理每个学校的数据
      const processedData = analysisResult.recommendations.map(item => {
        return {
          ...item,
          // 预处理分数数据
          englishScore: this.processScoreData(item.fsx, '英语'),
          mathScore: this.processScoreData(item.fsx, '数学'),
          majorScore: this.processScoreData(item.fsx, '专业课'),
          // 处理其他数据
          totalScore: item.fsx && item.fsx[0] ? item.fsx[0].total : '/',
          blbRatio: item.blb && item.blb[0] ? item.blb[0].blb : '/',
          departments: item.departments || '/',
          probability: item.probability || '/',
          major: item.major || '/',
          employment_status: item.employment_status || '/',
          further_study_ratio: item.further_study_ratio || '/',
          civil_service_ratio: item.civil_service_ratio || '/',
          employment_ratio: item.employment_ratio || '/'
        };
      });

      this.setData({
        recommendations: processedData
      });
    }
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
   * 显示趋势数据
   */
  showTrend(e) {
    const { type, index } = e.currentTarget.dataset;
    console.log('显示趋势数据:', { type, index });
    
    const school = this.data.recommendations[index];
    let title = '';
    let data = [];
    let showChart = false;
    let chartData = null;

    switch(type) {
      case 'blb':
        title = `${school.school} - 报录比趋势`;
        data = (school.blb || []).map(item => ({
          year: item.year,
          value: item.blb
        }));
        break;
      case 'score':
        title = `${school.school} - 总分数线趋势`;
        showChart = true;
        chartData = this.processChartData(school.fsx, 'total');
        break;
      case 'english':
        title = `${school.school} - 英语分数趋势`;
        showChart = true;
        chartData = this.processChartData(school.fsx, '英语');
        break;
      case 'math':
        title = `${school.school} - 数学分数趋势`;
        showChart = true;
        chartData = this.processChartData(school.fsx, '数学');
        break;
      case 'major_subject':
        title = `${school.school} - 专业课分数趋势`;
        showChart = true;
        chartData = this.processChartData(school.fsx, '专业课');
        break;
      case 'employment':
        title = `${school.school} - 就业情况趋势`;
        data = school.employment_trend || [];
        break;
      case 'further':
        title = `${school.school} - 深造占比趋势`;
        data = school.further_study_trend || [];
        break;
      case 'civil':
        title = `${school.school} - 考公占比趋势`;
        data = school.civil_service_trend || [];
        break;
      case 'job':
        title = `${school.school} - 就业占比趋势`;
        data = school.employment_ratio_trend || [];
        break;
    }

    console.log('设置数据:', {
      showChart,
      chartData,
      title
    });

    // 如果是图表模式但没有数据，显示提示
    if (showChart && !chartData) {
      wx.showToast({
        title: '暂无趋势数据',
        icon: 'none'
      });
      return;
    }

    this.setData({
      showTrend: true,
      trendTitle: title,
      trendData: data,
      currentSchool: school,
      showChart,
      chartData
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
  }
})