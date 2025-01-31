Page({
  data: {
    userInfo: {},
    currentView: 'day',
    currentDateIndex: 3, // 默认选中当天
    dates: [],
    overallScore: 66,
    loveScore: 77,
    wealthScore: 58,
    careerScore: 59,
    studyScore: 72,
    luckyColor: '#87CEEB',
    luckyColorName: '蓝色',
    luckyNumbers: '8, 9',
    luckyFood: '饼干',
    fortuneDescription: '今天适合谈情说爱，妙语连珠收获好感。也可以发掘新鲜趣味，享受被信息资讯包围的感觉。日常约会项目都可以安排起来。',
    suggestions: '适度玩梗、谈情说爱',
    avoidance: '循规蹈矩、自我批判',
    currentTime: '',
    moonPhase: '月空亡结束',
  },

  onLoad() {
    this.initDates()
    this.getUserInfo()
    this.updateCurrentTime()
    // 每分钟更新一次时间
    setInterval(() => {
      this.updateCurrentTime()
    }, 60000)
  },

  // 更新当前时间
  updateCurrentTime() {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    this.setData({
      currentTime: `${hours}:${minutes}`
    })
  },

  // 初始化日期数据
  initDates() {
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const dates = []
    
    for (let i = -3; i <= 3; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      dates.push({
        weekday: weekdays[date.getDay() === 0 ? 6 : date.getDay() - 1],
        date: date.getDate(),
        fullDate: date.toISOString().split('T')[0]
      })
    }

    this.setData({ dates })
  },

  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ userInfo })
  },

  // 切换视图
  switchView(e) {
    const view = e.currentTarget.dataset.view
    this.setData({ 
      currentView: view 
    }, () => {
      // 切换视图后可以做一些额外的操作
      this.updateFortuneData()
    })
  },

  // 选择日期
  selectDate(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      currentDateIndex: index
    }, () => {
      this.updateFortuneData()
    })
  },

  // 更新运势数据
  updateFortuneData() {
    const selectedDate = this.data.dates[this.data.currentDateIndex]
    // TODO: 根据选中的日期获取对应的运势数据
    // 这里可以调用后端API获取数据
    console.log('更新运势数据:', selectedDate.fullDate)
  },

  // 查看更多
  showMore() {
    wx.navigateTo({
      url: '/pages/weather/weather'
    })
  }
}) 