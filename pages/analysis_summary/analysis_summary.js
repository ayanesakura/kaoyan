Page({
  data: {
    schools: [],
    loading: true,
    hasData: false
  },

  onLoad() {
    const app = getApp();
    const result = app.globalData.analysisResult;

    if (!result || !result.data) {
      this.setData({ 
        loading: false,
        hasData: false 
      });
      return;
    }

    try {
      // 合并所有分组的学校数据
      const allSchools = [
        ...(result.data.冲刺 || []),
        ...(result.data.稳妥 || []),
        ...(result.data.保底 || [])
      ];

      // 处理学校数据
      const schools = allSchools.map(school => ({
        name: school.school_name,
        department: school.major_name,
        majorCode: school.major_code,
        city: school.city,
        levels: school.levels || [],
        score: Math.round(parseFloat(school.total_score)) || 0,
        probability: parseInt(school.admission_probability) || 0
      }));

      // 按综合得分排序
      schools.sort((a, b) => b.score - a.score);

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
    wx.navigateTo({
      url: '/pages/analysis/analysis'
    });
  }
}); 