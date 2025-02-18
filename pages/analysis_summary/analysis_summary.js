Page({
  data: {
    schools: [],
    loading: true,
    hasData: false
  },

  onLoad() {
    const app = getApp();
    const result = app.globalData.analysisResult;
    console.log('原始数据:', result); // 添加日志查看原始数据

    if (!result || !result.data) {
      this.setData({ 
        loading: false,
        hasData: false 
      });
      return;
    }

    try {
      // 处理所有学校数据
      let allSchools = [];
      
      // 添加分类标识
      if (result.data.冲刺) {
        allSchools.push(...result.data.冲刺.map(school => ({...school, category: 'chong'})));
      }
      if (result.data.稳妥) {
        allSchools.push(...result.data.稳妥.map(school => ({...school, category: 'wen'})));
      }
      if (result.data.保底) {
        allSchools.push(...result.data.保底.map(school => ({...school, category: 'bao'})));
      }

      // 处理学校数据时添加显示文本
      const categoryText = {
        'chong': '冲',
        'wen': '稳',
        'bao': '保'
      };

      // 处理学校数据
      const schools = allSchools.map(school => {
        console.log('单个学校原始数据:', school); // 添加调试日志
        return {
          name: school.school_name,
          department: school.major_name,
          majorCode: school.major_code,
          city: school.city,
          levels: school.levels || [], // 直接使用原始数据中的levels数组
          score: Math.round(parseFloat(school.total_score)) || 0,
          probability: parseInt(school.admission_probability) || 0,
          category: school.category,
          categoryText: categoryText[school.category]
        };
      });

      // 按综合得分排序
      schools.sort((a, b) => b.score - a.score);

      console.log('处理后的学校数据:', schools); // 添加日志查看处理后的数据

      this.setData({
        schools,
        loading: false,
        hasData: schools.length > 0
      });

    } catch (error) {
      console.error('处理数据时出错:', error);
      this.setData({ 
        loading: false,
        hasData: false 
      });
    }
  },

  // 查看专业详情
  onMajorTap(e) {
    const { majorCode } = e.currentTarget.dataset;
    // TODO: 跳转到专业详情页面
  },

  // 查看完整分析
  viewFullAnalysis() {
    wx.reLaunch({
      url: '/pages/analysis/analysis',
      success: () => {
        console.log('跳转到分析页面成功');
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
}); 