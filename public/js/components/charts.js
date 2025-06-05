/* charts.js - Componente de Gráficos Simples */

C4App.components.Charts = {
  // Gráficos ativos
  charts: new Map(),
  
  // Configurações padrão
  defaults: {
    width: 400,
    height: 300,
    padding: 40,
    colors: {
      primary: '#ec4899',
      secondary: '#facc15',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#ffffff',
      text: '#374151',
      grid: '#e5e7eb'
    },
    animation: {
      enabled: true,
      duration: 800,
      easing: 'easeOutCubic'
    }
  },
  
  // ===== INICIALIZAÇÃO =====
  
  init() {
    console.log('📊 Charts component inicializado');
  },
  
  // ===== MÉTODOS PRINCIPAIS =====
  
  // Criar gráfico
  create(container, type, data, options = {}) {
    const canvas = this.createCanvas(container, options);
    const config = { ...this.defaults, ...options };
    
    const chart = {
      id: C4App.utils.generateId('chart'),
      canvas,
      ctx: canvas.getContext('2d'),
      type,
      data,
      config,
      container: typeof container === 'string' ? document.getElementById(container) : container
    };
    
    this.charts.set(chart.id, chart);
    this.render(chart);
    
    return chart.id;
  },
  
  // Atualizar gráfico
  update(chartId, newData) {
    const chart = this.charts.get(chartId);
    if (!chart) return false;
    
    chart.data = newData;
    this.render(chart);
    return true;
  },
  
  // Destruir gráfico
  destroy(chartId) {
    const chart = this.charts.get(chartId);
    if (!chart) return false;
    
    if (chart.canvas && chart.canvas.parentNode) {
      chart.canvas.parentNode.removeChild(chart.canvas);
    }
    
    this.charts.delete(chartId);
    return true;
  },
  
  // ===== CRIAÇÃO DE CANVAS =====
  
  createCanvas(container, options) {
    const containerEl = typeof container === 'string' ? document.getElementById(container) : container;
    
    if (!containerEl) {
      throw new Error('Container não encontrado');
    }
    
    // Limpar container
    containerEl.innerHTML = '';
    
    // Criar canvas
    const canvas = document.createElement('canvas');
    canvas.width = options.width || this.defaults.width;
    canvas.height = options.height || this.defaults.height;
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    
    containerEl.appendChild(canvas);
    
    return canvas;
  },
  
  // ===== RENDERIZAÇÃO =====
  
  render(chart) {
    const { ctx, type, data, config } = chart;
    
    // Limpar canvas
    ctx.clearRect(0, 0, chart.canvas.width, chart.canvas.height);
    
    // Renderizar baseado no tipo
    switch (type) {
      case 'line':
        this.renderLineChart(chart);
        break;
      case 'bar':
        this.renderBarChart(chart);
        break;
      case 'pie':
        this.renderPieChart(chart);
        break;
      case 'doughnut':
        this.renderDoughnutChart(chart);
        break;
      default:
        console.error('Tipo de gráfico não suportado:', type);
    }
  },
  
  // ===== GRÁFICO DE LINHA =====
  
  renderLineChart(chart) {
    const { ctx, data, config } = chart;
    const { width, height, padding } = config;
    
    const chartArea = {
      x: padding,
      y: padding,
      width: width - (padding * 2),
      height: height - (padding * 2)
    };
    
    // Calcular escalas
    const xScale = this.calculateXScale(data.labels, chartArea);
    const yScale = this.calculateYScale(data.datasets, chartArea);
    
    // Desenhar grid
    this.drawGrid(ctx, chartArea, xScale, yScale, config);
    
    // Desenhar datasets
    data.datasets.forEach((dataset, index) => {
      this.drawLineDataset(ctx, dataset, xScale, yScale, config, index);
    });
    
    // Desenhar labels
    this.drawLabels(ctx, data.labels, xScale, yScale, config);
  },
  
  drawLineDataset(ctx, dataset, xScale, yScale, config, index) {
    const color = dataset.color || config.colors.primary;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = dataset.lineWidth || 2;
    ctx.beginPath();
    
    dataset.data.forEach((value, i) => {
      const x = xScale.getPixel(i);
      const y = yScale.getPixel(value);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Desenhar pontos
    if (dataset.showPoints !== false) {
      ctx.fillStyle = color;
      dataset.data.forEach((value, i) => {
        const x = xScale.getPixel(i);
        const y = yScale.getPixel(value);
        
        ctx.beginPath();
        ctx.arc(x, y, dataset.pointRadius || 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  },
  
  // ===== GRÁFICO DE BARRAS =====
  
  renderBarChart(chart) {
    const { ctx, data, config } = chart;
    const { width, height, padding } = config;
    
    const chartArea = {
      x: padding,
      y: padding,
      width: width - (padding * 2),
      height: height - (padding * 2)
    };
    
    // Calcular escalas
    const xScale = this.calculateXScale(data.labels, chartArea);
    const yScale = this.calculateYScale(data.datasets, chartArea);
    
    // Desenhar grid
    this.drawGrid(ctx, chartArea, xScale, yScale, config);
    
    // Calcular largura das barras
    const barWidth = (chartArea.width / data.labels.length) * 0.6;
    const barSpacing = (chartArea.width / data.labels.length) * 0.4;
    
    // Desenhar datasets
    data.datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.color || config.colors.primary;
      ctx.fillStyle = color;
      
      dataset.data.forEach((value, i) => {
        const x = xScale.getPixel(i) - (barWidth / 2);
        const y = yScale.getPixel(value);
        const barHeight = chartArea.y + chartArea.height - y;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    });
    
    // Desenhar labels
    this.drawLabels(ctx, data.labels, xScale, yScale, config);
  },
  
  // ===== GRÁFICO DE PIZZA =====
  
  renderPieChart(chart) {
    const { ctx, data, config } = chart;
    const { width, height } = config;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    // Calcular total
    const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
    
    let currentAngle = -Math.PI / 2; // Começar no topo
    
    data.datasets[0].data.forEach((value, index) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      const color = data.datasets[0].colors?.[index] || this.getColorByIndex(index, config);
      
      // Desenhar fatia
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Desenhar borda
      ctx.strokeStyle = config.colors.background;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Desenhar label
      if (data.labels && data.labels[index]) {
        const labelAngle = currentAngle + (sliceAngle / 2);
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = config.colors.text;
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const percentage = ((value / total) * 100).toFixed(1);
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }
      
      currentAngle += sliceAngle;
    });
    
    // Desenhar legenda
    this.drawLegend(ctx, data, config, 'pie');
  },
  
  // ===== GRÁFICO DOUGHNUT =====
  
  renderDoughnutChart(chart) {
    const { ctx, data, config } = chart;
    const { width, height } = config;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 20;
    const innerRadius = outerRadius * 0.5;
    
    // Calcular total
    const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
    
    let currentAngle = -Math.PI / 2;
    
    data.datasets[0].data.forEach((value, index) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      const color = data.datasets[0].colors?.[index] || this.getColorByIndex(index, config);
      
      // Desenhar fatia
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fill();
      
      // Desenhar borda
      ctx.strokeStyle = config.colors.background;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      currentAngle += sliceAngle;
    });
    
    // Desenhar valor central
    if (config.centerText) {
      ctx.fillStyle = config.colors.text;
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.centerText, centerX, centerY);
    }
    
    // Desenhar legenda
    this.drawLegend(ctx, data, config, 'doughnut');
  },
  
  // ===== UTILITÁRIOS =====
  
  calculateXScale(labels, chartArea) {
    const step = chartArea.width / (labels.length - 1 || 1);
    
    return {
      getPixel: (index) => chartArea.x + (index * step)
    };
  },
  
  calculateYScale(datasets, chartArea) {
    let min = Infinity;
    let max = -Infinity;
    
    datasets.forEach(dataset => {
      dataset.data.forEach(value => {
        min = Math.min(min, value);
        max = Math.max(max, value);
      });
    });
    
    // Adicionar padding
    const range = max - min;
    min -= range * 0.1;
    max += range * 0.1;
    
    return {
      min,
      max,
      getPixel: (value) => {
        const ratio = (value - min) / (max - min);
        return chartArea.y + chartArea.height - (ratio * chartArea.height);
      }
    };
  },
  
  drawGrid(ctx, chartArea, xScale, yScale, config) {
    ctx.strokeStyle = config.colors.grid;
    ctx.lineWidth = 1;
    
    // Linhas horizontais
    for (let i = 0; i <= 5; i++) {
      const y = chartArea.y + (chartArea.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(chartArea.x, y);
      ctx.lineTo(chartArea.x + chartArea.width, y);
      ctx.stroke();
    }
    
    // Linhas verticais
    for (let i = 0; i <= 5; i++) {
      const x = chartArea.x + (chartArea.width / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, chartArea.y);
      ctx.lineTo(x, chartArea.y + chartArea.height);
      ctx.stroke();
    }
  },
  
  drawLabels(ctx, labels, xScale, yScale, config) {
    ctx.fillStyle = config.colors.text;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    labels.forEach((label, index) => {
      const x = xScale.getPixel(index);
      const y = yScale.getPixel(yScale.min) + 10;
      ctx.fillText(label, x, y);
    });
  },
  
  drawLegend(ctx, data, config, type) {
    if (!data.labels) return;
    
    const legendX = config.width - 150;
    const legendY = 20;
    const itemHeight = 20;
    
    data.labels.forEach((label, index) => {
      const y = legendY + (index * itemHeight);
      const color = data.datasets[0].colors?.[index] || this.getColorByIndex(index, config);
      
      // Desenhar cor
      ctx.fillStyle = color;
      ctx.fillRect(legendX, y, 15, 15);
      
      // Desenhar texto
      ctx.fillStyle = config.colors.text;
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, legendX + 20, y + 7);
    });
  },
  
  getColorByIndex(index, config) {
    const colors = [
      config.colors.primary,
      config.colors.secondary,
      config.colors.success,
      config.colors.warning,
      config.colors.error,
      config.colors.info
    ];
    
    return colors[index % colors.length];
  },
  
  // ===== MÉTODOS DE CONVENIÊNCIA =====
  
  // Gráfico de vendas mensais
  createSalesChart(container, salesData, options = {}) {
    const data = {
      labels: salesData.map(item => item.month),
      datasets: [{
        data: salesData.map(item => item.total),
        color: options.color || this.defaults.colors.primary,
        lineWidth: 3
      }]
    };
    
    return this.create(container, 'line', data, {
      ...options,
      title: 'Vendas Mensais'
    });
  },
  
  // Gráfico de produtos mais vendidos
  createTopProductsChart(container, productsData, options = {}) {
    const data = {
      labels: productsData.map(item => item.name),
      datasets: [{
        data: productsData.map(item => item.quantity),
        colors: productsData.map((_, index) => this.getColorByIndex(index, this.defaults))
      }]
    };
    
    return this.create(container, 'doughnut', data, {
      ...options,
      centerText: 'Top Produtos'
    });
  },
  
  // Gráfico de progresso de meta
  createGoalProgressChart(container, current, target, options = {}) {
    const percentage = (current / target) * 100;
    
    const data = {
      labels: ['Atingido', 'Restante'],
      datasets: [{
        data: [current, Math.max(0, target - current)],
        colors: [this.defaults.colors.success, this.defaults.colors.grid]
      }]
    };
    
    return this.create(container, 'doughnut', data, {
      ...options,
      centerText: `${percentage.toFixed(1)}%`
    });
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  C4App.components.Charts.init();
});

// Atalhos globais
window.charts = {
  create: (container, type, data, opts) => C4App.components.Charts.create(container, type, data, opts),
  update: (id, data) => C4App.components.Charts.update(id, data),
  destroy: (id) => C4App.components.Charts.destroy(id),
  sales: (container, data, opts) => C4App.components.Charts.createSalesChart(container, data, opts),
  products: (container, data, opts) => C4App.components.Charts.createTopProductsChart(container, data, opts),
  goal: (container, current, target, opts) => C4App.components.Charts.createGoalProgressChart(container, current, target, opts)
};

// Exportar para uso global
window.C4Charts = C4App.components.Charts;

