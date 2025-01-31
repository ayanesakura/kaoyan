const { callService } = require('../../config/api.js')

Page({
  data: {
    content: ''
  },

  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel();
    
    // 显示加载提示
    wx.showLoading({
      title: 'AI分析中...',
      mask: true
    });

    // 监听分析页面传来的数据
    eventChannel.on('acceptAnalysisData', (data) => {
      callService('/api/ai_ana', 'POST', data)
        .then(res => {
          if (res.data.code === 200) {
            this.setData({
              content: res.data.data.content
            });
          } else {
            wx.showToast({
              title: '分析失败',
              icon: 'error'
            });
          }
        })
        .catch(() => {
          wx.showToast({
            title: '网络错误',
            icon: 'error'
          });
        })
        .finally(() => {
          wx.hideLoading();
        });
    });
  }
}) 