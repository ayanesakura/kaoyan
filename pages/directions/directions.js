Page({
  data: {
    school: '',
    school_code: '',
    major: '',
    major_code: '',
    departments: '',
    directions: []
  },

  onLoad(options) {
    console.log('方向页面收到参数:', options);
    
    try {
      // 解析基本信息并进行URL解码
      const {
        school,
        school_code,
        major,
        major_code,
        departments,
        directions
      } = options;
      
      // 先对directions进行URL解码,再解析JSON
      const decodedDirections = decodeURIComponent(directions);
      const directionsData = JSON.parse(decodedDirections);
      
      console.log('解析后的方向数据:', directionsData);
      
      // 更新页面数据,其他字段也需要URL解码
      this.setData({
        school: decodeURIComponent(school),
        school_code: decodeURIComponent(school_code),
        major: decodeURIComponent(major),
        major_code: decodeURIComponent(major_code),
        departments: decodeURIComponent(departments),
        directions: directionsData
      });

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: '研究方向详情'
      });
    } catch (err) {
      console.error('解析数据失败:', err);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: `${this.data.school} - ${this.data.major}专业方向详情`,
      path: '/pages/fill/fill'
    };
  }
}) 