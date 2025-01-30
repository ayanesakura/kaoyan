import * as echarts from '../ec-canvas/echarts';

Component({
  properties: {
    chartData: {
      type: Object,
      value: {},
      observer: function(newVal) {
        console.log('图表数据更新:', newVal);
        if (newVal && newVal.years && newVal.values) {
          this.setData({
            pendingData: newVal
          });
        }
      }
    },
    title: {
      type: String,
      value: ''
    }
  },

  data: {
    ec: {
      lazyLoad: true
    },
    pendingData: null,
    isReady: false
  },

  lifetimes: {
    attached: function() {
      console.log('图表组件已挂载');
      this.ecComponent = this.selectComponent('#mychart');
      if (!this.ecComponent) {
        console.error('找不到图表组件实例');
        return;
      }
      this.setData({ isReady: true }, () => {
        if (this.data.pendingData) {
          this.init();
        }
      });
    }
  },

  methods: {
    init: function() {
      console.log('开始初始化图表');
      if (!this.ecComponent || !this.data.isReady) {
        console.log('组件未准备好，等待组件准备完成');
        return;
      }

      this.ecComponent.init((canvas, width, height, dpr) => {
        console.log('图表画布初始化:', { width, height, dpr });
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });
        const option = this.getOption();
        console.log('图表配置:', option);
        chart.setOption(option);
        this.chart = chart;
        return chart;
      });
    },

    getOption: function() {
      const { years, values } = this.data.pendingData || this.properties.chartData;
      return {
        title: {
          text: this.properties.title,
          left: 'center',
          textStyle: {
            fontSize: 14,
            color: '#333'
          },
          top: 10
        },
        grid: {
          containLabel: true,
          left: 30,
          right: 20,
          bottom: 20,
          top: 50
        },
        xAxis: {
          type: 'category',
          data: years,
          axisLabel: {
            fontSize: 11,
            interval: 0,
            rotate: 0
          },
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 11,
            formatter: '{value}分'
          },
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        series: [{
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#87CEEB'
          },
          lineStyle: {
            color: '#87CEEB',
            width: 3
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: 'rgba(135, 206, 235, 0.3)'
              }, {
                offset: 1,
                color: 'rgba(135, 206, 235, 0)'
              }]
            }
          },
          emphasis: {
            itemStyle: {
              color: '#87CEEB',
              borderWidth: 3,
              borderColor: '#fff',
              shadowColor: 'rgba(0, 0, 0, 0.2)',
              shadowBlur: 10
            }
          }
        }],
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const data = params[0];
            return `${data.name}年: ${data.value}分`;
          },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#eee',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          },
          padding: [8, 12]
        }
      };
    }
  }
}) 