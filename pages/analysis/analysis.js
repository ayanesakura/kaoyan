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
    chartUnit: '分'  // 添加默认单位
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
      'departments'
    ];

    const missingFields = requiredFields.filter(field => !item[field]);
    
    if (missingFields.length > 0) {
      console.error('缺少必要字段:', missingFields);
      return false;
    }

    // 检查directions数组
    if (!Array.isArray(item.directions) || item.directions.length === 0) {
      console.error('directions字段无效');
      return false;
    }

    // 检查第一个direction的必要字段
    const direction = item.directions[0];
    const requiredDirectionFields = [
      'yjfxmc',
      'yjfxdm',
      'ksfs',
      'xwlx',
      'zsrs',
      'subjects'
    ];

    const missingDirectionFields = requiredDirectionFields.filter(field => !direction[field]);
    
    if (missingDirectionFields.length > 0) {
      console.error('direction缺少必要字段:', missingDirectionFields);
      return false;
    }

    // 检查subjects数组
    if (!Array.isArray(direction.subjects) || direction.subjects.length === 0 || 
        !Array.isArray(direction.subjects[0]) || direction.subjects[0].length === 0) {
      console.error('subjects字段无效');
      return false;
    }

    return true;
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const analysisResult = getApp().globalData.analysisResult;
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

      // 处理专业名称和代码 - 修改这里,不再合并显示
      const majorDisplay = item.major;

      // 处理研究方向信息
      const directionInfo = item.directions[0];
      const directionDisplay = `${directionInfo.yjfxmc}\n(${directionInfo.yjfxdm})`;

      // 处理考试科目（显示第一个方向的第一组考试科目）
      const subjectsDisplay = directionInfo.subjects[0]
        .map(s => `${s.value}(${s.code})`)
        .join('、');

      return {
        ...item,
        // 基本信息
        school: schoolDisplay,
        major: majorDisplay, // 只保留专业名称
        departments: item.departments,
        
        // 研究方向相关信息
        direction: directionDisplay,
        ksfs: directionInfo.ksfs,
        xwlx: directionInfo.xwlx,
        zsrs: directionInfo.zsrs,
        zybz: directionInfo.bz || '/',
        
        // 考试科目
        subjectsDisplay,
        directions: item.directions,

        // 预处理分数数据
        englishScore: this.processScoreData(item.fsx, '外语科二'),
        mathScore: this.processScoreData(item.fsx, '科三'),
        majorScore: this.processScoreData(item.fsx, '科四'),
        politicsScore: this.processScoreData(item.fsx, '政治科一'),
        totalScore: item.fsx && item.fsx[0] ? 
          item.fsx[0].data.find(s => s.subject === '总分')?.score || '/' : '/',

        // 处理报录比数据
        blbRatio: this.processBlbRatio(item.blb),

        // 就业相关信息（处理空数组情况）
        employment_status: item.jy && item.jy[0]?.status || '/',
        further_study_ratio: item.jy && item.jy[0]?.further_study_ratio || '/',
        civil_service_ratio: item.jy && item.jy[0]?.civil_service_ratio || '/',
        employment_ratio: item.jy && item.jy[0]?.employment_ratio || '/'
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
    let data = [];
    let showChart = false;
    let chartData = null;
    let chartUnit = '分';  // 默认单位为分

    switch(type) {
      case 'blb':
        title = `${schoolName} - 报录比趋势`;
        showChart = true;
        chartData = this.processBlbData(school.blb);
        chartUnit = '%';  // 报录比使用百分比单位
        break;
      case 'score':
        title = `${schoolName} - 总分数线趋势`;
        showChart = true;
        chartData = this.processChartData(school.fsx, '总分');
        break;
      case 'english':
        title = `${schoolName} - ${this.getSubjectDisplayName(school, '外语科二')}分数趋势`;
        showChart = true;
        chartData = this.processChartData(school.fsx, '外语科二');
        break;
      case 'math':
        title = `${schoolName} - ${this.getSubjectDisplayName(school, '科三')}分数趋势`;
        showChart = true;
        chartData = this.processChartData(school.fsx, '科三');
        break;
      case 'major_subject':
        title = `${schoolName} - ${this.getSubjectDisplayName(school, '科四')}分数趋势`;
        showChart = true;
        chartData = this.processChartData(school.fsx, '科四');
        break;
      case 'politics':
        title = `${schoolName} - ${this.getSubjectDisplayName(school, '政治科一')}分数趋势`;
        showChart = true;
        chartData = this.processChartData(school.fsx, '政治科一');
        break;
      case 'employment':
        title = `${schoolName} - 就业情况趋势`;
        data = school.jy || [];
        break;
      case 'further':
        title = `${schoolName} - 深造占比趋势`;
        data = school.jy ? school.jy.map(item => ({
          year: item.year,
          value: item.further_study_ratio
        })) : [];
        break;
      case 'civil':
        title = `${schoolName} - 考公占比趋势`;
        data = school.jy ? school.jy.map(item => ({
          year: item.year,
          value: item.civil_service_ratio
        })) : [];
        break;
      case 'job':
        title = `${schoolName} - 就业占比趋势`;
        data = school.jy ? school.jy.map(item => ({
          year: item.year,
          value: item.employment_ratio
        })) : [];
        break;
    }

    console.log('设置数据:', {
      showChart,
      chartData,
      title,
      chartUnit
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
      chartData,
      chartUnit  // 设置单位
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
      directions: JSON.stringify(school.directions)
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
  }
})