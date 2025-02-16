import * as echarts from '../ec-canvas/echarts';

Component({
  properties: {
    chartData: {
      type: Object,
      value: null,
      observer: function(newVal) {
        if (newVal) {
          this.initChart();
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
      value: 'line'
    }
  },

  data: {
    ec: {
      lazyLoad: true
    }
  },

  lifetimes: {
    attached: function() {
      this.ecComponent = this.selectComponent('#mychart-dom');
      this.initChart();
    }
  },

  methods: {
    initChart: function() {
      if (!this.ecComponent || !this.data.chartData) return;
      
      this.ecComponent.init((canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });
        
        const option = this.getChartOption();
        chart.setOption(option);
        
        return chart;
      });
    },

    getChartOption: function() {
      if (this.data.chartType === 'radar') {
        return this.getRadarOption();
      }
      return this.getLineOption();
    },

    getLineOption: function() {
      const { years, values } = this.data.chartData;
      
      return {
        title: {
          text: this.data.title,
          left: 'center',
          textStyle: {
            fontSize: 14,
            color: '#333'
          }
        },
        grid: {
          top: '15%',
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
        title: {
          text: this.data.title,
          left: 'center',
          textStyle: {
            fontSize: 14,
            color: '#333'
          }
        },
        radar: {
          indicator: dimensions.map(dim => ({
            name: dim,
            max: 100
          })),
          radius: '60%',
          splitNumber: 4,
          axisName: {
            color: '#666',
            fontSize: 10
          },
          splitLine: {
            lineStyle: {
              color: ['#ddd']
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
            name: this.data.title,
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
        }],
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            const values = params.value;
            const indicators = params.indicator;
            let result = `${params.name}<br/>`;
            values.forEach((val, index) => {
              const description = descriptions?.[index] ? `<br/>${descriptions[index]}` : '';
              result += `${indicators[index].name}: ${val}分${description}<br/>`;
            });
            return result;
          }
        }
      };
    }
  }
}) 