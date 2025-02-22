import * as echarts from '../ec-canvas/echarts';

Component({
  properties: {
    chartData: {
      type: Object,
      value: null,
      observer: function(newVal) {
        console.log('chartData更新:', newVal);
        if (newVal) {
          this.initChartWhenReady();
        }
      }
    },
    title: {
      type: String,
      value: ''
    },
    unit: {
      type: String,
      value: ''
    },
    chartType: {
      type: String,
      value: 'line',
      observer: function(newVal) {
        console.log('chartType更新:', newVal);
      }
    }
  },

  data: {
    ec: {
      lazyLoad: true
    },
    isComponentReady: false
  },

  lifetimes: {
    created: function() {
      console.log('组件created');
    },
    
    attached: function() {
      console.log('组件attached');
      setTimeout(() => {
        this.setData({ isComponentReady: true }, () => {
          this.initChartWhenReady();
        });
      }, 100);
    },

    ready: function() {
      console.log('组件ready');
    },

    detached: function() {
      console.log('组件detached');
    }
  },

  methods: {
    initChartWhenReady: function() {
      console.log('准备初始化图表:', {
        isReady: this.data.isComponentReady,
        hasData: !!this.data.chartData,
        chartType: this.data.chartType
      });

      if (!this.data.isComponentReady || !this.data.chartData) {
        console.log('组件或数据未准备好，跳过初始化');
        return;
      }

      try {
        this.ecComponent = this.selectComponent('#mychart');
        console.log('获取到图表组件:', this.ecComponent);
        
        if (!this.ecComponent) {
          throw new Error('找不到图表组件实例');
        }

        this.initChart();
      } catch (error) {
        console.error('初始化图表失败:', error);
      }
    },

    initChart: function() {
      console.log('开始初始化图表');
      
      try {
        this.ecComponent.init((canvas, width, height, dpr) => {
          console.log('图表canvas初始化:', { width, height, dpr });
          
          // 确保有有效的宽高
          if (!width || !height) {
            console.error('无效的canvas尺寸:', { width, height });
            return;
          }

          const chart = echarts.init(canvas, null, {
            width: width,
            height: height,
            devicePixelRatio: dpr
          });
          
          const option = this.getChartOption();
          console.log('图表配置:', option);
          
          chart.setOption(option);
          
          return chart;
        });
      } catch (error) {
        console.error('初始化图表实例失败:', error);
      }
    },

    getChartOption: function() {
      console.log('获取图表配置，类型:', this.data.chartType);
      if (this.data.chartType === 'radar') {
        return this.getRadarOption();
      }
      return this.getLineOption();
    },

    getLineOption: function() {
      const { years, values } = this.data.chartData;
      
      return {
        grid: {
          top: '10%',
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: years,
          axisLabel: {
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: `{value}${this.data.unit}`,
            fontSize: 10
          }
        },
        series: [{
          data: values,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            color: '#666',
            formatter: function(params) {
              return params.value !== null ? params.value : '-';
            },
            distance: 5,  // 标签与点的距离
            padding: [2, 4],  // 标签内边距
            backgroundColor: 'rgba(255, 255, 255, 0.8)'  // 半透明背景
          },
          itemStyle: {
            color: '#87CEEB'
          },
          lineStyle: {
            color: '#87CEEB',
            width: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
              offset: 0,
              color: 'rgba(135, 206, 235, 0.3)'
            }, {
              offset: 1,
              color: 'rgba(135, 206, 235, 0.1)'
            }])
          }
        }],
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const value = params[0].value;
            return `${params[0].name}年: ${value !== null ? value + this.data.unit : '暂无数据'}`;
          }
        }
      };
    },

    getRadarOption: function() {
      const { dimensions, values, descriptions } = this.data.chartData;
      
      return {
        backgroundColor: '#fff',
        grid: {
          containLabel: true  // 确保包含标签
        },
        radar: {
          indicator: dimensions.map(dim => ({
            name: dim,
            max: 100
          })),
          center: ['50%', '50%'],  // 略微下移中心点
          radius: '55%',  // 缩小雷达图主体
          splitNumber: 4,
          shape: 'circle',
          name: {
            formatter: (text) => {
              // 优化换行逻辑
              const maxLength = 4;  // 增加单行最大字符数
              const textArr = text.split('');
              const rows = [];
              let row = '';
              
              textArr.forEach(char => {
                if (row.length < maxLength) {
                  row += char;
                } else {
                  rows.push(row);
                  row = char;
                }
              });
              if (row) rows.push(row);
              
              return rows.join('\n');
            },
            textStyle: {
              color: '#666',
              fontSize: 11,
              lineHeight: 14,  // 增加行高
              padding: [5, 8],  // 增加内边距
              backgroundColor: 'rgba(255, 255, 255, 0.8)'  // 添加半透明背景
            }
          },
          axisLine: {
            lineStyle: {
              color: '#ddd',
              width: 1
            }
          },
          splitLine: {
            lineStyle: {
              color: '#ddd',
              width: 1
            }
          },
          splitArea: {
            show: true,
            areaStyle: {
              color: ['rgba(255,255,255,0.3)', 'rgba(135,206,235,0.05)']
            }
          }
        },
        series: [{
          type: 'radar',
          data: [{
            value: values[0],
            name: '',
            symbol: 'circle',
            symbolSize: 6,
            label: {
              show: true,
              formatter: '{c}',
              color: '#333',
              fontSize: 11,
              distance: 1
            },
            itemStyle: {
              color: '#87CEEB'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                offset: 0,
                color: 'rgba(135, 206, 235, 0.6)'
              }, {
                offset: 1,
                color: 'rgba(135, 206, 235, 0.2)'
              }])
            },
            lineStyle: {
              color: '#87CEEB',
              width: 2
            }
          }]
        }]
      };
    }
  }
}) 