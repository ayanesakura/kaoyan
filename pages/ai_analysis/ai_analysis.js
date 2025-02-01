const { callService } = require('../../config/api.js')

Page({
  data: {
    content: '',
    parsedContent: []
  },

  // 解析Markdown文本
  parseMarkdown(text) {
    if (!text) return [];

    // 将文本按行分割，保留空行
    const lines = text.split('\n');
    const nodes = [];
    let currentList = null;
    let isInParagraph = false;
    let paragraphText = '';
    let emptyLineCount = 0;

    const finishParagraph = () => {
      if (paragraphText) {
        // 如果有连续的空行，添加额外的间距
        const marginClass = emptyLineCount > 1 ? 'p-extra-margin' : 'p';
        nodes.push({
          name: 'div',
          attrs: {
            class: marginClass
          },
          children: this.processInlineStyles(paragraphText.trim())
        });
        paragraphText = '';
        isInParagraph = false;
        emptyLineCount = 0;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1] || '';
      
      // 处理空行
      if (!line.trim()) {
        if (currentList) {
          nodes.push(currentList);
          currentList = null;
        }
        finishParagraph();
        emptyLineCount++;
        continue;
      }

      // 处理标题
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        if (currentList) {
          nodes.push(currentList);
          currentList = null;
        }
        finishParagraph();
        
        const level = headingMatch[1].length;
        nodes.push({
          name: 'div',
          attrs: {
            class: `h${level}`
          },
          children: this.processInlineStyles(headingMatch[2].trim())
        });
        continue;
      }

      // 处理有序列表
      const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (olMatch) {
        finishParagraph();
        
        if (!currentList || currentList.name !== 'ol') {
          if (currentList) {
            nodes.push(currentList);
          }
          currentList = {
            name: 'ol',
            attrs: {
              class: 'ol'
            },
            children: []
          };
        }
        
        // 获取实际的序号
        const number = parseInt(olMatch[1]);
        currentList.children.push({
          name: 'li',
          attrs: {
            class: 'li',
            value: number.toString() // 设置实际的序号
          },
          children: this.processInlineStyles(olMatch[2].trim())
        });
        continue;
      }

      // 处理无序列表
      const ulMatch = line.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        finishParagraph();
        
        if (!currentList || currentList.name !== 'ul') {
          if (currentList) {
            nodes.push(currentList);
          }
          currentList = {
            name: 'ul',
            attrs: {
              class: 'ul'
            },
            children: []
          };
        }
        
        currentList.children.push({
          name: 'li',
          attrs: {
            class: 'li'
          },
          children: this.processInlineStyles(ulMatch[1].trim())
        });
        continue;
      }

      // 处理引用
      const quoteMatch = line.match(/^>\s+(.+)$/);
      if (quoteMatch) {
        if (currentList) {
          nodes.push(currentList);
          currentList = null;
        }
        finishParagraph();
        
        nodes.push({
          name: 'div',
          attrs: {
            class: 'blockquote'
          },
          children: this.processInlineStyles(quoteMatch[1].trim())
        });
        continue;
      }

      // 处理普通段落
      if (!isInParagraph) {
        if (currentList) {
          nodes.push(currentList);
          currentList = null;
        }
        isInParagraph = true;
      }
      
      // 添加行内容到当前段落
      paragraphText += (paragraphText ? '\n' : '') + line;
      
      // 如果下一行是空行或者是其他格式，结束当前段落
      if (!nextLine.trim() || 
          nextLine.match(/^(#{1,6}|\d+\.|-|\*|>)\s+/) ||
          i === lines.length - 1) {
        finishParagraph();
      }
    }

    // 添加最后的列表（如果有）
    if (currentList) {
      nodes.push(currentList);
    }
    
    // 添加最后的段落（如果有）
    finishParagraph();

    return nodes;
  },

  // 处理行内样式（加粗、斜体等）
  processInlineStyles(text) {
    const segments = [];
    let currentIndex = 0;
    
    // 处理加粗文本
    const boldRegex = /\*\*(.*?)\*\*/g;
    let boldMatch;
    
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      // 添加加粗文本前的普通文本
      if (boldMatch.index > currentIndex) {
        segments.push({
          type: 'text',
          text: text.slice(currentIndex, boldMatch.index)
        });
      }
      
      // 添加加粗文本
      segments.push({
        name: 'strong',
        attrs: {
          class: 'bold'
        },
        children: [{
          type: 'text',
          text: boldMatch[1]
        }]
      });
      
      currentIndex = boldMatch.index + boldMatch[0].length;
    }
    
    // 添加剩余的文本
    if (currentIndex < text.length) {
      segments.push({
        type: 'text',
        text: text.slice(currentIndex)
      });
    }
    
    // 处理斜体文本
    const processedSegments = [];
    for (const segment of segments) {
      if (segment.type === 'text') {
        const italicRegex = /\*(.*?)\*/g;
        let italicMatch;
        let lastIndex = 0;
        let textContent = segment.text;
        const textSegments = [];
        
        while ((italicMatch = italicRegex.exec(textContent)) !== null) {
          if (italicMatch.index > lastIndex) {
            textSegments.push({
              type: 'text',
              text: textContent.slice(lastIndex, italicMatch.index)
            });
          }
          
          textSegments.push({
            name: 'em',
            attrs: {
              class: 'italic'
            },
            children: [{
              type: 'text',
              text: italicMatch[1]
            }]
          });
          
          lastIndex = italicMatch.index + italicMatch[0].length;
        }
        
        if (lastIndex < textContent.length) {
          textSegments.push({
            type: 'text',
            text: textContent.slice(lastIndex)
          });
        }
        
        processedSegments.push(...textSegments);
      } else {
        processedSegments.push(segment);
      }
    }
    
    return processedSegments;
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
            const content = res.data.data.content;
            this.setData({
              content: content,
              parsedContent: this.parseMarkdown(content)
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