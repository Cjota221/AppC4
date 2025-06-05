/* dashboard.js - Módulo do Dashboard */

C4App.modules.Dashboard = {
  // Estado do dashboard
  data: {
    stats: {},
    charts: {},
    recentSales: [],
    topProducts: [],
    goals: []
  },
  
  // Elementos DOM
  elements: {},
  
  // ===== INICIALIZAÇÃO =====
  
  async init() {
    this.cacheElements();
    this.setupEventListeners();
    await this.loadData();
    this.render();
    console.log('📊 Dashboard module inicializado');
  },
  
  cacheElements() {
    this.elements = {
      // Estatísticas principais
      totalSales: document.getElementById('total-sales'),
      totalOrders: document.getElementById('total-orders'),
      averageOrder: document.getElementById('average-order'),
      monthlyGoal: document.getElementById('monthly-goal'),
      
      // Gráficos
      salesChart: document.getElementById('sales-chart'),
      productsChart: document.getElementById('products-chart'),
      goalChart: document.getElementById('goal-chart'),
      
      // Listas
      recentSalesList: document.getElementById('recent-sales-list'),
      topProductsList: document.getElementById('top-products-list'),
      lowStockList: document.getElementById('low-stock-list'),
      
      // Botões de ação
      newSaleBtn: document.getElementById('new-sale-btn'),
      newProductBtn: document.getElementById('new-product-btn'),
      viewReportsBtn: document.getElementById('view-reports-btn')
    };
  },
  
  setupEventListeners() {
    // Botões de ação rápida
    if (this.elements.newSaleBtn) {
      this.elements.newSaleBtn.addEventListener('click', () => {
        this.openNewSaleModal();
      });
    }
    
    if (this.elements.newProductBtn) {
      this.elements.newProductBtn.addEventListener('click', () => {
        this.openNewProductModal();
      });
    }
    
    if (this.elements.viewReportsBtn) {
      this.elements.viewReportsBtn.addEventListener('click', () => {
        C4App.core.navigateTo('reports');
      });
    }
    
    // Eventos de dados
    window.addEventListener('c4:data:changed', (event) => {
      const { dataType } = event.detail;
      if (['sales', 'products', 'goals'].includes(dataType)) {
        this.refresh();
      }
    });
    
    // Refresh periódico
    setInterval(() => {
      this.refresh();
    }, 5 * 60 * 1000); // A cada 5 minutos
  },
  
  // ===== CARREGAMENTO DE DADOS =====
  
  async loadData() {
    try {
      // Carregar dados em paralelo
      const [sales, products, goals] = await Promise.all([
        C4App.utils.Database.getSales(),
        C4App.utils.Database.getProducts(),
        C4App.utils.Database.getGoals()
      ]);
      
      // Calcular estatísticas
      this.data.stats = this.calculateStats(sales, products, goals);
      
      // Preparar dados para gráficos
      this.data.charts = this.prepareChartData(sales, products);
      
      // Vendas recentes
      this.data.recentSales = this.getRecentSales(sales);
      
      // Produtos mais vendidos
      this.data.topProducts = this.getTopProducts(sales, products);
      
      // Metas
      this.data.goals = goals;
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      C4App.components.Toast.error('Erro ao carregar dados do dashboard');
    }
  },
  
  calculateStats(sales, products, goals) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Vendas do mês atual
    const monthlySales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.createdAt);
      return saleDate >= startOfMonth;
    });
    
    const totalSales = monthlySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalOrders = monthlySales.length;
    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Meta mensal
    const currentGoal = goals.find(goal => 
      goal.type === 'monthly' && 
      new Date(goal.period?.start || goal.createdAt) <= now &&
      new Date(goal.period?.end || goal.createdAt) >= now
    );
    
    const monthlyGoal = currentGoal ? currentGoal.target : 0;
    const goalProgress = monthlyGoal > 0 ? (totalSales / monthlyGoal) * 100 : 0;
    
    // Produtos com estoque baixo
    const lowStockProducts = products.filter(product => 
      (product.stock || 0) <= (product.minStock || 5)
    );
    
    return {
      totalSales,
      totalOrders,
      averageOrder,
      monthlyGoal,
      goalProgress,
      lowStockCount: lowStockProducts.length,
      totalProducts: products.length
    };
  },
  
  prepareChartData(sales, products) {
    // Dados para gráfico de vendas (últimos 7 dias)
    const salesChartData = this.getSalesChartData(sales);
    
    // Dados para gráfico de produtos mais vendidos
    const productsChartData = this.getProductsChartData(sales, products);
    
    return {
      sales: salesChartData,
      products: productsChartData
    };
  },
  
  getSalesChartData(sales) {
    const last7Days = [];
    const now = new Date();
    
    // Gerar últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      last7Days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        total: 0
      });
    }
    
    // Somar vendas por dia
    sales.forEach(sale => {
      const saleDate = new Date(sale.created_at || sale.createdAt).toISOString().split('T')[0];
      const dayData = last7Days.find(day => day.date === saleDate);
      if (dayData) {
        dayData.total += sale.total || 0;
      }
    });
    
    return {
      labels: last7Days.map(day => day.label),
      datasets: [{
        data: last7Days.map(day => day.total),
        color: '#ec4899'
      }]
    };
  },
  
  getProductsChartData(sales, products) {
    const productSales = {};
    
    // Contar vendas por produto
    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.productName,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.productId].quantity += item.quantity || 0;
          productSales[item.productId].revenue += (item.quantity || 0) * (item.price || 0);
        });
      }
    });
    
    // Ordenar por quantidade e pegar top 5
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    return {
      labels: topProducts.map(p => p.name),
      datasets: [{
        data: topProducts.map(p => p.quantity),
        colors: ['#ec4899', '#facc15', '#10b981', '#f59e0b', '#3b82f6']
      }]
    };
  },
  
  getRecentSales(sales) {
    return sales
      .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
      .slice(0, 5)
      .map(sale => ({
        id: sale.id,
        clientName: sale.clientName,
        total: sale.total,
        date: new Date(sale.created_at || sale.createdAt),
        status: sale.status
      }));
  },
  
  getTopProducts(sales, products) {
    const productSales = {};
    
    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              id: item.productId,
              name: item.productName,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.productId].quantity += item.quantity || 0;
          productSales[item.productId].revenue += (item.quantity || 0) * (item.price || 0);
        });
      }
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  },
  
  // ===== RENDERIZAÇÃO =====
  
  render() {
    this.renderStats();
    this.renderCharts();
    this.renderLists();
  },
  
  renderStats() {
    const { stats } = this.data;
    
    // Total de vendas
    if (this.elements.totalSales) {
      this.elements.totalSales.textContent = C4App.utils.formatCurrency(stats.totalSales);
    }
    
    // Total de pedidos
    if (this.elements.totalOrders) {
      this.elements.totalOrders.textContent = stats.totalOrders.toString();
    }
    
    // Ticket médio
    if (this.elements.averageOrder) {
      this.elements.averageOrder.textContent = C4App.utils.formatCurrency(stats.averageOrder);
    }
    
    // Meta mensal
    if (this.elements.monthlyGoal) {
      const progressText = `${stats.goalProgress.toFixed(1)}% de ${C4App.utils.formatCurrency(stats.monthlyGoal)}`;
      this.elements.monthlyGoal.textContent = progressText;
    }
  },
  
  renderCharts() {
    // Gráfico de vendas
    if (this.elements.salesChart && this.data.charts.sales) {
      if (this.data.charts.salesChartId) {
        C4App.components.Charts.update(this.data.charts.salesChartId, this.data.charts.sales);
      } else {
        this.data.charts.salesChartId = C4App.components.Charts.create(
          this.elements.salesChart,
          'line',
          this.data.charts.sales,
          { width: 350, height: 200 }
        );
      }
    }
    
    // Gráfico de produtos
    if (this.elements.productsChart && this.data.charts.products) {
      if (this.data.charts.productsChartId) {
        C4App.components.Charts.update(this.data.charts.productsChartId, this.data.charts.products);
      } else {
        this.data.charts.productsChartId = C4App.components.Charts.create(
          this.elements.productsChart,
          'doughnut',
          this.data.charts.products,
          { width: 250, height: 250, centerText: 'Top 5' }
        );
      }
    }
    
    // Gráfico de meta
    if (this.elements.goalChart && this.data.stats.monthlyGoal > 0) {
      const goalData = {
        labels: ['Atingido', 'Restante'],
        datasets: [{
          data: [
            this.data.stats.totalSales,
            Math.max(0, this.data.stats.monthlyGoal - this.data.stats.totalSales)
          ],
          colors: ['#10b981', '#e5e7eb']
        }]
      };
      
      if (this.data.charts.goalChartId) {
        C4App.components.Charts.update(this.data.charts.goalChartId, goalData);
      } else {
        this.data.charts.goalChartId = C4App.components.Charts.create(
          this.elements.goalChart,
          'doughnut',
          goalData,
          { 
            width: 200, 
            height: 200, 
            centerText: `${this.data.stats.goalProgress.toFixed(1)}%` 
          }
        );
      }
    }
  },
  
  renderLists() {
    this.renderRecentSales();
    this.renderTopProducts();
    this.renderLowStock();
  },
  
  renderRecentSales() {
    if (!this.elements.recentSalesList) return;
    
    const { recentSales } = this.data;
    
    if (recentSales.length === 0) {
      this.elements.recentSalesList.innerHTML = '<p class="empty-state">Nenhuma venda recente</p>';
      return;
    }
    
    const html = recentSales.map(sale => `
      <div class="sale-item" data-sale-id="${sale.id}">
        <div class="sale-info">
          <div class="sale-client">${C4App.utils.escapeHtml(sale.clientName)}</div>
          <div class="sale-date">${C4App.utils.formatDate(sale.date)}</div>
        </div>
        <div class="sale-amount">${C4App.utils.formatCurrency(sale.total)}</div>
        <div class="sale-status status-${sale.status}">${this.getStatusText(sale.status)}</div>
      </div>
    `).join('');
    
    this.elements.recentSalesList.innerHTML = html;
  },
  
  renderTopProducts() {
    if (!this.elements.topProductsList) return;
    
    const { topProducts } = this.data;
    
    if (topProducts.length === 0) {
      this.elements.topProductsList.innerHTML = '<p class="empty-state">Nenhum produto vendido</p>';
      return;
    }
    
    const html = topProducts.map((product, index) => `
      <div class="product-item" data-product-id="${product.id}">
        <div class="product-rank">${index + 1}º</div>
        <div class="product-info">
          <div class="product-name">${C4App.utils.escapeHtml(product.name)}</div>
          <div class="product-stats">${product.quantity} vendidos</div>
        </div>
        <div class="product-revenue">${C4App.utils.formatCurrency(product.revenue)}</div>
      </div>
    `).join('');
    
    this.elements.topProductsList.innerHTML = html;
  },
  
  renderLowStock() {
    if (!this.elements.lowStockList) return;
    
    // Buscar produtos com estoque baixo
    C4App.utils.Database.getProducts().then(products => {
      const lowStockProducts = products.filter(product => 
        (product.stock || 0) <= (product.minStock || 5)
      );
      
      if (lowStockProducts.length === 0) {
        this.elements.lowStockList.innerHTML = '<p class="empty-state">Estoque em dia!</p>';
        return;
      }
      
      const html = lowStockProducts.map(product => `
        <div class="stock-item" data-product-id="${product.id}">
          <div class="stock-info">
            <div class="stock-name">${C4App.utils.escapeHtml(product.name)}</div>
            <div class="stock-level">Estoque: ${product.stock || 0}</div>
          </div>
          <div class="stock-alert">
            <span class="alert-icon">⚠️</span>
            Baixo
          </div>
        </div>
      `).join('');
      
      this.elements.lowStockList.innerHTML = html;
    });
  },
  
  // ===== MÉTODOS AUXILIARES =====
  
  getStatusText(status) {
    const statusMap = {
      'pending': 'Pendente',
      'completed': 'Concluída',
      'cancelled': 'Cancelada'
    };
    
    return statusMap[status] || status;
  },
  
  // ===== AÇÕES =====
  
  openNewSaleModal() {
    if (C4App.modules.Sales && C4App.modules.Sales.openNewSaleModal) {
      C4App.modules.Sales.openNewSaleModal();
    } else {
      // Fallback simples
      C4App.core.navigateTo('sales');
    }
  },
  
  openNewProductModal() {
    if (C4App.modules.Products && C4App.modules.Products.openNewProductModal) {
      C4App.modules.Products.openNewProductModal();
    } else {
      // Fallback simples
      C4App.core.navigateTo('products');
    }
  },
  
  // ===== REFRESH =====
  
  async refresh() {
    try {
      await this.loadData();
      this.render();
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
    }
  }
};

// Auto-inicializar quando página do dashboard for ativada
window.addEventListener('c4:navigation:changed', (event) => {
  if (event.detail.page === 'dashboard') {
    C4App.modules.Dashboard.init();
  }
});

// Exportar para uso global
window.C4Dashboard = C4App.modules.Dashboard;

