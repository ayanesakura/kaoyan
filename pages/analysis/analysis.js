// pages/analysis/analysis.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    probabilityGroups: {
      '保底': [],
      '稳妥': [],
      '冲刺': []
    },
    currentTab: '稳妥',
    currentSchools: [],
    showTrend: false,
    trendTitle: '',
    trendData: [],
    showChart: false,
    chartData: null,
    chartUnit: '分',
    userInfo: {},
    targetInfo: {},
    loading: true,
    hasData: false
  },

  /**
   * 处理单个学校的分数数据
   */
  processScoreData(fsx, subjectName) {
    console.log('处理分数线数据:', {
      subjectName: subjectName,
      fsx: fsx
    });

    if (!Array.isArray(fsx) || fsx.length === 0) {
      console.log('无效的分数线数据');
      return '/';
    }

    // 按年份排序,取最新的数据
    const latestScore = fsx.sort((a, b) => parseInt(b.year) - parseInt(a.year))[0];
    console.log('最新分数线数据:', latestScore);
    
    if (!latestScore || !latestScore.data || !Array.isArray(latestScore.data)) {
      console.log('无效的最新分数线数据结构');
      return '/';
    }

    // 查找对应科目的分数
    const subjectData = latestScore.data.find(s => s.subject === subjectName);
    console.log('科目分数数据:', {
      subjectName: subjectName,
      subjectData: subjectData
    });
    
    if (!subjectData || !subjectData.score) {
      console.log('未找到科目分数数据');
      return '/';
    }

    // 格式化分数
    const score = parseFloat(subjectData.score);
    console.log('格式化后的分数:', score);
    return isNaN(score) ? '/' : score.toFixed(1);
  },

  /**
   * 处理趋势图表数据
   */
  processChartData(fsx, subjectName) {
    if (!fsx || !Array.isArray(fsx)) {
      return null;
    }
    
    // 按年份去重并排序
    const uniqueData = {};
    fsx.forEach(item => {
      if (!uniqueData[item.year] || item.year > uniqueData[item.year].year) {
        uniqueData[item.year] = item;
      }
    });
    
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
    
    return years.length > 0 && !values.every(v => v === null) ? { years, values } : null;
  },

  /**
   * 处理评分数据
   */
  processScoreDetails(scoreData, type) {
    if (!scoreData) return null;

    switch(type) {
      case 'admission':
        if (!scoreData.dimension_scores) return null;
        return {
          years: scoreData.dimension_scores.map(item => item.name),
          values: scoreData.dimension_scores.map(item => item.score),
          descriptions: scoreData.dimension_scores.map(item => item.description)
        };
      
      case 'location':
        if (!scoreData.scores) return null;
        return {
          years: Object.keys(scoreData.scores),
          values: Object.values(scoreData.scores)
        };
      
      case 'major':
        if (!scoreData.dimension_scores) return null;
        return {
          years: scoreData.dimension_scores.map(item => item.name),
          values: scoreData.dimension_scores.map(item => item.score),
          descriptions: scoreData.dimension_scores.map(item => item.description)
        };
      
      default:
        return null;
    }
  },

  /**
   * 处理单个学校数据
   */
  processSchoolData(school) {
    if (!school || !school.school_name) {
      console.error('无效的学校数据:', school);
      return null;
    }

    // 处理分数线数据
    const fsx_data = (school.fsx_score || []).filter(item => {
      return item && item.year && item.总分 && !isNaN(item.总分);
    }).sort((a, b) => b.year - a.year);

    // 获取最新的分数数据
    const latestScore = fsx_data.length > 0 ? {
      total: fsx_data[0].总分,
      subject1: fsx_data[0].科目1 || '/',
      subject2: fsx_data[0].科目2 || '/',
      subject3: fsx_data[0].科目3 || '/',
      subject4: fsx_data[0].科目4 || '/'
    } : {
      total: '/',
      subject1: '/',
      subject2: '/',
      subject3: '/',
      subject4: '/'
    };

    // 处理概率值
    let probability = school.admission_probability || '/';
    if (typeof probability === 'number') {
      probability = probability.toFixed(1) + '%';
    }

    // 处理评分 - 添加更多调试信息
    console.log('完整的学校数据:', school);
    const score = school.total_score;
    console.log('原始分数:', score, typeof score);
    
    let formattedScore = '/';
    if (score !== undefined && score !== null && !isNaN(score)) {
      formattedScore = Math.round(parseFloat(score)).toString();
    }
    console.log('格式化后的分数:', formattedScore);

    // 先创建基础对象，然后添加处理后的值
    const processedSchool = {
      // 基础信息
      school_name: school.school_name,
      major_name: school.major_name || '',
      major_code: school.major_code || '',
      city: school.city || '',
      levels: school.levels || [],
      
      // 处理后的值
      probability,
      total_score: formattedScore,
      
      // 评分数据
      admission_score: school.admission_score || {},
      location_score: school.location_score || {},
      major_score: school.major_score || {},
      sx_score: school.sx_score || {},
      
      // 分数线数据
      latestScore,
      fsx_score: fsx_data
    };

    return processedSchool;
  },

  formatNumber(num) {
    if (!num || isNaN(num)) return '/';
    return parseFloat(num).toFixed(1);
  },

  /**
   * Tab切换处理
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    const schools = this.data.probabilityGroups[tab] || [];
    
    this.setData({
      currentTab: tab,
      currentSchools: schools
    });

    if (schools.length === 0) {
      wx.showToast({
        title: `暂无${tab}院校`,
        icon: 'none'
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({ loading: true });

    const app = getApp();
    const result = app.globalData.analysisResult;
    console.log('原始数据:', result.data);

    try {
      // 处理概率分组数据
      const groups = {
        '保底': result.data.保底 || [],
        '稳妥': result.data.稳妥 || [],
        '冲刺': result.data.冲刺 || []
      };

      // 添加调试日志
      console.log('分组前的数据:', groups);

      // 处理每个分组的学校数据
      Object.keys(groups).forEach(groupKey => {
        groups[groupKey] = groups[groupKey].map(school => {
          // 添加调试日志
          console.log('处理前的学校数据:', school);
          const processed = this.processSchoolData(school);
          console.log('处理后的学校数据:', processed);
          return processed;
        });
      });

      // 更新数据
      const hasData = Object.values(groups).some(group => group.length > 0);
      this.setData({
        probabilityGroups: groups,
        currentSchools: groups['稳妥'] || [],
        loading: false,
        hasData: hasData
      });

      if (!hasData) {
        wx.showToast({
          title: '暂无匹配的院校',
          icon: 'none'
        });
      }

    } catch (error) {
      console.error('处理数据时出错:', error);
      this.setData({ 
        loading: false,
        hasData: false 
      });
      wx.showToast({
        title: '数据处理失败',
        icon: 'none'
      });
    }
  },

  // 处理最新分数线数据
  processLatestScore(fsx) {
    if (!Array.isArray(fsx) || fsx.length === 0) {
      return {
        total: '/',
        subject1: '/',
        subject2: '/',
        subject3: '/',
        subject4: '/'
      };
    }

    // 过滤掉无效数据并按年份排序
    const validScores = fsx
      .filter(score => 
        score.year && 
        score.总分 != null && 
        score.科目1 != null && 
        score.科目2 != null && 
        score.科目3 != null && 
        score.科目4 != null
      )
      .sort((a, b) => b.year - a.year);

    if (validScores.length === 0) {
      return {
        total: '/',
        subject1: '/',
        subject2: '/',
        subject3: '/',
        subject4: '/'
      };
    }

    const latest = validScores[0];
    return {
      total: latest.总分 || '/',
      subject1: latest.科目1 || '/',
      subject2: latest.科目2 || '/',
      subject3: latest.科目3 || '/',
      subject4: latest.科目4 || '/'
    };
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
    const school = this.data.currentSchools[index];
    
    if (type === 'score') {
      // 处理总分趋势
      const fsx_data = this.processFsxData(school.fsx_score, '总分');
      
      if (!fsx_data) {
        wx.showToast({
          title: '暂无趋势数据',
          icon: 'none'
        });
        return;
      }

      // 禁止页面滚动
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
      
      this.setData({
        showTrend: true,
        trendTitle: `${school.school_name} - 分数线趋势`,
        chartData: fsx_data,
        chartType: 'line',
        chartUnit: '分'
      });
    } else if (type === 'subject1') {
      // 处理政治分数趋势
      const fsx_data = this.processFsxData(school.fsx_score, '科目1');
      
      if (!fsx_data) {
        wx.showToast({
          title: '暂无趋势数据',
          icon: 'none'
        });
        return;
      }

      // 禁止页面滚动
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
      
      this.setData({
        showTrend: true,
        trendTitle: `${school.school_name} - 科目一分数趋势`,
        chartData: fsx_data,
        chartType: 'line',
        chartUnit: '分'
      });
    } else if (type === 'subject2') {
      // 处理英语分数趋势
      const fsx_data = this.processFsxData(school.fsx_score, '科目2');
      
      if (!fsx_data) {
        wx.showToast({
          title: '暂无趋势数据',
          icon: 'none'
        });
        return;
      }

      // 禁止页面滚动
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
      
      this.setData({
        showTrend: true,
        trendTitle: `${school.school_name} - 科目二分数趋势`,
        chartData: fsx_data,
        chartType: 'line',
        chartUnit: '分'
      });
    } else if (type === 'subject3') {
      // 处理数学分数趋势
      const fsx_data = this.processFsxData(school.fsx_score, '科目3');
      
      if (!fsx_data) {
        wx.showToast({
          title: '暂无趋势数据',
          icon: 'none'
        });
        return;
      }

      // 禁止页面滚动
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
      
      this.setData({
        showTrend: true,
        trendTitle: `${school.school_name} - 科目三分数趋势`,
        chartData: fsx_data,
        chartType: 'line',
        chartUnit: '分'
      });
    } else if (type === 'subject4') {
      // 处理专业课分数趋势
      const fsx_data = this.processFsxData(school.fsx_score, '科目4');
      
      if (!fsx_data) {
        wx.showToast({
          title: '暂无趋势数据',
          icon: 'none'
        });
        return;
      }

      // 禁止页面滚动
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
      
      this.setData({
        showTrend: true,
        trendTitle: `${school.school_name} - 科目四分数趋势`,
        chartData: fsx_data,
        chartType: 'line',
        chartUnit: '分'
      });
    } else if (type === 'admission') {
      // 处理录取评分雷达图数据
      const admissionScore = school.admission_score;
      const dimensions = [
        '专业匹配度',
        '专业排名',
        '备考时间',
        '学校跨度',
        '录取规模',
        '竞争强度',
        '英语基础'
      ];
      
      const values = dimensions.map(dim => admissionScore[dim] || 0);
      
      // 准备雷达图数据
      const chartData = {
        dimensions,
        values: [values],  // 雷达图需要二维数组
        descriptions: []   // 可以添加每个维度的描述
      };

      // 禁止页面滚动
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
      
      this.setData({
        showTrend: true,
        trendTitle: `${school.school_name} - 录取评分分析`,
        chartData,
        chartType: 'radar'  // 设置为雷达图
      });
    } else if (type === 'location') {
      // 处理地域评分雷达图数据
      const locationScore = school.location_score;
      const dimensions = [
        '医疗资源',
        '家乡匹配度',
        '工作城市匹配度',
        '教育资源'
      ];
      
      const values = dimensions.map(dim => locationScore[dim] || 0);
      
      // 准备雷达图数据
      const chartData = {
        dimensions,
        values: [values],
        descriptions: []
      };

      // 禁止页面滚动
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
      
      this.setData({
        showTrend: true,
        trendTitle: `${school.school_name} - 地域评分分析`,
        chartData,
        chartType: 'radar'
      });
    } else if (type === 'major') {
      // 处理专业评分雷达图数据
      const majorScore = school.major_score;
      const dimensions = [
        '专业排名',
        '专业综合满意度',
        '学校知名度',
        '学校综合满意度'
      ];
      
      const values = dimensions.map(dim => majorScore[dim] || 0);
      
      // 准备雷达图数据
      const chartData = {
        dimensions,
        values: [values],
        descriptions: []
      };

      // 禁止页面滚动
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
      
      this.setData({
        showTrend: true,
        trendTitle: `${school.school_name} - 专业评分分析`,
        chartData,
        chartType: 'radar'
      });
    } else {
      let title = '';
      let chartData = null;
      let chartUnit = '';
      let chartType = 'line';

      switch(type) {
        case 'score':
        case 'english':
        case 'math':
        case 'major_subject':
        case 'politics':
          const subjectMap = {
            'score': '总分',
            'english': '英语',
            'math': '数学',
            'major_subject': '专业课',
            'politics': '政治'
          };
          title = `${school.school_name} - ${subjectMap[type]}分数线趋势`;
          chartData = this.processChartData(school.fsx_score, subjectMap[type]);
          break;

        case 'location':
          title = `${school.school_name} - 地域评分维度`;
          const locationData = school.location_score;
          
          if (locationData && locationData.scores) {
            chartType = 'radar';
            // 获取所有维度名称，过滤掉总分
            const dimensions = Object.keys(locationData.scores).filter(key => key !== '总分');
            const values = dimensions.map(key => locationData.scores[key]);
            
            chartData = {
              dimensions: dimensions,
              values: [values],
              descriptions: dimensions.map(() => '')
            };
            
            console.log('地域评分雷达图数据:', {
              dimensions,
              values,
              scores: locationData.scores
            });
          }
          break;
      }

      if (!chartData) {
        wx.showToast({
          title: '暂无趋势数据',
          icon: 'none'
        });
        return;
      }

      // 禁止页面滚动
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
      
      this.setData({
        showTrend: true,
        trendTitle: title,
        showChart: true,
        chartData,
        chartUnit,
        chartType
      });
    }
  },

  /**
   * 关闭趋势面板
   */
  closeTrend() {
    this.setData({
      showTrend: false,
      trendTitle: '',
      trendData: [],
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
    const school = this.data.currentSchools[index];
    
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

  /**
   * 开始AI分析
   */
  startAIAnalysis() {
    if (!this.data.userInfo || !this.data.targetInfo) {
      wx.showToast({
        title: '请先完善个人信息',
        icon: 'none',
        duration: 2000
      });
      
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
  },

  // 处理分数线数据
  processFsxData(fsx_score, field) {
    if (!Array.isArray(fsx_score) || fsx_score.length === 0) {
      console.log('无效的分数线数据:', fsx_score);
      return null;
    }

    // 按年份去重并排序
    const uniqueData = {};
    fsx_score.forEach(item => {
      // 确保数据有效
      if (item && item.year && item[field] !== undefined) {
        if (!uniqueData[item.year] || item.year > uniqueData[item.year].year) {
          uniqueData[item.year] = item;
        }
      }
    });
    
    const sortedData = Object.values(uniqueData).sort((a, b) => a.year - b.year);
    
    // 检查处理后的数据是否有效
    if (sortedData.length === 0) {
      console.log('处理后无有效数据');
      return null;
    }

    const years = sortedData.map(item => item.year);
    const values = sortedData.map(item => {
      const value = parseFloat(item[field]);
      return isNaN(value) ? null : value;
    });

    // 检查是否所有值都是null
    if (values.every(v => v === null)) {
      console.log('所有分数值都无效');
      return null;
    }

    console.log('处理后的趋势数据:', { years, values });
    return { years, values };
  }
})