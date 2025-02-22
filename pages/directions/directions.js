Page({
  data: {
    school: '',
    school_code: '',
    major: '',
    major_code: '',
    departments: '',
    directions: [],
    currentTab: 0, // 当前选中的tab索引
    swiperHeight: 0 // swiper高度
  },

  onLoad(options) {
    try {
      const {
        school,
        school_code,
        major,
        major_code,
        departments,
        directions
      } = options;
      
      // 先解码，再解析JSON
      const directionsData = JSON.parse(decodeURIComponent(directions));
      
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

      // 计算swiper高度
      this.calculateSwiperHeight();
    } catch (err) {
      console.error('解析数据失败:', err);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  // 计算swiper高度
  calculateSwiperHeight() {
    const query = wx.createSelectorQuery();
    query.select('.header').boundingClientRect();
    query.select('.tabs-scroll').boundingClientRect();
    query.exec(res => {
      if (!res[0] || !res[1]) return;
      
      const windowHeight = wx.getSystemInfoSync().windowHeight;
      const headerHeight = res[0].height;
      const tabsHeight = res[1].height;
      const swiperHeight = windowHeight - headerHeight - tabsHeight;
      
      console.log('高度计算:', {
        windowHeight,
        headerHeight,
        tabsHeight,
        swiperHeight
      });

      this.setData({
        swiperHeight
      });
    });
  },

  // 点击tab切换
  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    console.log('切换到tab:', index);
    
    if (this.data.currentTab === index) return;
    
    this.setData({
      currentTab: index
    });
  },

  // swiper切换事件
  swiperChange(e) {
    const index = e.detail.current;
    console.log('swiper切换到:', index);
    
    this.setData({
      currentTab: index
    });

    // 确保对应的tab滚动到可视区域
    this.scrollTabIntoView(index);
  },

  // 将选中的tab滚动到可视区域
  scrollTabIntoView(index) {
    const query = wx.createSelectorQuery();
    query.selectAll('.tab-item').boundingClientRect();
    query.select('.tabs-scroll').boundingClientRect();
    query.exec(res => {
      if (!res[0] || !res[1]) return;
      
      const tabItems = res[0];
      const scrollView = res[1];
      
      if (tabItems[index]) {
        const tab = tabItems[index];
        const scrollLeft = tab.left - (scrollView.width - tab.width) / 2;
        
        wx.nextTick(() => {
          this.setData({
            scrollLeft
          });
        });
      }
    });
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack({
      delta: 1
    })
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