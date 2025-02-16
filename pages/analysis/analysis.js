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
    if (!Array.isArray(fsx) || fsx.length === 0) {
      console.log('无效的分数线数据');
      return '/';
    }

    // 按年份排序,取最新的数据
    const latestScore = fsx.sort((a, b) => parseInt(b.year) - parseInt(a.year))[0];
    
    if (!latestScore || !latestScore.data || !Array.isArray(latestScore.data)) {
      return '/';
    }

    // 查找对应科目的分数
    const subjectData = latestScore.data.find(s => s.subject === subjectName);
    
    if (!subjectData || !subjectData.score) {
      return '/';
    }

    // 格式化分数
    const score = parseFloat(subjectData.score);
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

    // 处理概率值
    let probability = '/';
    if (typeof school.probability === 'string' && school.probability.includes('%')) {
      probability = school.probability; // 直接使用带百分号的字符串
    } else if (typeof school.probability === 'number') {
      probability = school.probability.toFixed(1) + '%';
    }

    // 处理专业评分总分
    let majorScore = '/';
    if (school.major_score && typeof school.major_score['总分'] === 'number') {
      majorScore = school.major_score['总分'].toFixed(1);
    }

    return {
      school_name: school.school_name,
      school: school.school_name,
      probability: probability,
      totalScore: typeof school.total_score === 'number' ? school.total_score.toFixed(1) : '/',
      
      // 评分数据
      admission_score: school.admission_score || {},
      location_score: school.location_score || {},
      major_score: school.major_score || {},
      majorTotalScore: majorScore, // 添加专业评分总分
      
      // 专业信息
      major: school.major || ''
    };
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
    console.log('app.globalData:', app.globalData);
    
    const analysisResult = app.globalData.analysisResult;
    console.log('analysisResult:', analysisResult);
    
    let userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    let targetInfo = app.globalData.targetInfo || wx.getStorageSync('targetInfo');

    this.setData({ userInfo, targetInfo });

    // 检查数据结构
    if (!analysisResult) {
      console.error('analysisResult为空');
      this.setData({ 
        loading: false,
        hasData: false 
      });
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
      return;
    }

    try {
      let probability_groups = null;
      
      // 处理 recommendations 数组
      if (analysisResult.recommendations && Array.isArray(analysisResult.recommendations)) {
        console.log('使用 recommendations 数组处理数据');
        probability_groups = {
          '保底': [],
          '稳妥': [],
          '冲刺': []
        };

        analysisResult.recommendations.forEach(school => {
          const probability = parseFloat(school.probability);
          if (!isNaN(probability)) {
            if (probability >= 60) {
              probability_groups['保底'].push(school);
            } else if (probability >= 40) {
              probability_groups['稳妥'].push(school);
            } else {
              probability_groups['冲刺'].push(school);
            }
          }
        });
      } 
      // 处理 probability_groups 结构
      else if (analysisResult.data?.probability_groups) {
        console.log('使用 probability_groups 结构处理数据');
        probability_groups = analysisResult.data.probability_groups;
      }

      if (!probability_groups) {
        console.error('无有效的院校数据');
        throw new Error('无有效的院校数据');
      }

      console.log('概率分组数据:', probability_groups);

      const processedGroups = {
        '保底': [],
        '稳妥': [],
        '冲刺': []
      };

      // 处理每个概率分组
      Object.keys(processedGroups).forEach(groupKey => {
        console.log(`开始处理${groupKey}分组`);
        const groupSchools = probability_groups[groupKey];
        console.log(`${groupKey}分组原始数据:`, groupSchools);
        
        if (Array.isArray(groupSchools)) {
          processedGroups[groupKey] = groupSchools
            .map(school => {
              console.log(`处理学校数据:`, school);
              const processed = this.processSchoolData(school);
              console.log('处理后的学校数据:', processed);
              return processed;
            })
            .filter(Boolean);
          
          console.log(`${groupKey}分组处理完成:`, processedGroups[groupKey]);
        } else {
          console.error(`${groupKey}分组不是数组:`, groupSchools);
        }
      });

      console.log('所有分组处理完成:', processedGroups);

      // 检查是否有任何有效数据
      const hasAnyData = Object.values(processedGroups).some(group => group.length > 0);
      console.log('是否有数据:', hasAnyData);

      // 检查稳妥组数据
      console.log('稳妥组数据:', processedGroups['稳妥']);

      // 更新数据
      this.setData({
        probabilityGroups: processedGroups,
        currentSchools: processedGroups['稳妥'] || [],
        loading: false,
        hasData: hasAnyData
      });

      if (!hasAnyData) {
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
    if (!school) return;
    
    const schoolName = school.school.split('\n')[0];
    let title = '';
    let chartData = null;
    let chartUnit = '分';
    let chartType = 'line'; // 默认为折线图

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
        title = `${schoolName} - ${subjectMap[type]}分数线趋势`;
        chartData = this.processChartData(school.score_data, subjectMap[type]);
        break;

      case 'admission':
        title = `${schoolName} - 录取评分维度`;
        const admissionData = school.admission_score;
        
        if (admissionData && admissionData.dimension_scores) {
          chartType = 'radar';
          chartData = {
            dimensions: admissionData.dimension_scores.map(item => item.name),
            values: [admissionData.dimension_scores.map(item => item.score)],
            descriptions: admissionData.dimension_scores.map(item => item.description)
          };
        }
        break;

      case 'major':
        title = `${schoolName} - 专业评分维度`;
        const majorData = school.major_score;
        
        if (majorData) {
          chartType = 'radar';
          // 过滤掉"总分"，只展示其他维度
          const dimensions = Object.keys(majorData).filter(key => key !== '总分');
          chartData = {
            dimensions: dimensions,
            values: [dimensions.map(key => majorData[key])],
            descriptions: dimensions.map(() => '') // 如果没有描述，使用空字符串
          };
        }
        break;

      case 'location':
        title = `${schoolName} - 地域评分维度`;
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

    this.setData({
      showTrend: true,
      trendTitle: title,
      showChart: true,
      chartData,
      chartUnit,
      chartType
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
  }
})