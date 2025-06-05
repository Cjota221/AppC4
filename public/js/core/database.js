/* database.js - Integração com Supabase */

C4App.utils.Database = {
  // Cliente Supabase
  client: null,
  
  // Status de conexão
  isConnected: false,
  
  // ===== INICIALIZAÇÃO =====
  
  // Inicializar conexão com Supabase
  async init() {
    try {
      // Verificar se Supabase está disponível
      if (typeof window.supabase === 'undefined') {
        console.warn('Supabase não carregado - usando modo offline');
        return false;
      }
      
      // Criar cliente Supabase
      this.client = window.supabase.createClient(
        C4App.config.supabase.url,
        C4App.config.supabase.anonKey
      );
      
      // Testar conexão
      const { data, error } = await this.client
        .from('_health_check')
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não existe (ok para demo)
        console.warn('Supabase conectado mas sem tabelas configuradas - usando modo demo');
        this.isConnected = false;
      } else {
        this.isConnected = true;
        console.log('✅ Conectado ao Supabase');
      }
      
      // Configurar listeners de auth
      this.setupAuthListeners();
      
      return true;
    } catch (error) {
      console.warn('Erro ao conectar com Supabase:', error);
      this.isConnected = false;
      return false;
    }
  },
  
  // Configurar listeners de autenticação
  setupAuthListeners() {
    if (!this.client) return;
    
    this.client.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN') {
        C4App.state.currentUser = session.user;
        window.dispatchEvent(new CustomEvent('c4:auth:signin', {
          detail: { user: session.user }
        }));
      } else if (event === 'SIGNED_OUT') {
        C4App.state.currentUser = null;
        window.dispatchEvent(new CustomEvent('c4:auth:signout'));
      }
    });
  },
  
  // ===== MÉTODOS GENÉRICOS =====
  
  // Executar query com fallback para localStorage
  async query(table, operation, data = null, filters = null) {
    // Se não conectado, usar localStorage
    if (!this.isConnected) {
      return this.queryLocal(table, operation, data, filters);
    }
    
    try {
      let query = this.client.from(table);
      
      switch (operation) {
        case 'select':
          query = query.select('*');
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          break;
          
        case 'insert':
          query = query.insert(data);
          break;
          
        case 'update':
          query = query.update(data);
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          break;
          
        case 'delete':
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          query = query.delete();
          break;
      }
      
      const { data: result, error } = await query;
      
      if (error) {
        console.error('Erro na query Supabase:', error);
        // Fallback para localStorage
        return this.queryLocal(table, operation, data, filters);
      }
      
      return { data: result, error: null };
    } catch (error) {
      console.error('Erro ao executar query:', error);
      // Fallback para localStorage
      return this.queryLocal(table, operation, data, filters);
    }
  },
  
  // Query local (localStorage) como fallback
  queryLocal(table, operation, data = null, filters = null) {
    try {
      const storageKey = table;
      let items = C4App.utils.Storage.get(storageKey, []);
      
      switch (operation) {
        case 'select':
          let result = [...items];
          if (filters) {
            result = C4App.utils.filterBy(result, filters);
          }
          return { data: result, error: null };
          
        case 'insert':
          const newItem = {
            id: C4App.utils.generateId(table),
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          items.push(newItem);
          C4App.utils.Storage.set(storageKey, items);
          return { data: [newItem], error: null };
          
        case 'update':
          let updated = false;
          items = items.map(item => {
            const matches = filters ? 
              Object.entries(filters).every(([key, value]) => item[key] === value) :
              false;
            
            if (matches) {
              updated = true;
              return {
                ...item,
                ...data,
                updated_at: new Date().toISOString()
              };
            }
            return item;
          });
          
          if (updated) {
            C4App.utils.Storage.set(storageKey, items);
          }
          
          return { data: items.filter(item => {
            return filters ? 
              Object.entries(filters).every(([key, value]) => item[key] === value) :
              false;
          }), error: null };
          
        case 'delete':
          const originalLength = items.length;
          items = items.filter(item => {
            return filters ? 
              !Object.entries(filters).every(([key, value]) => item[key] === value) :
              true;
          });
          
          if (items.length !== originalLength) {
            C4App.utils.Storage.set(storageKey, items);
          }
          
          return { data: [], error: null };
          
        default:
          return { data: null, error: 'Operação não suportada' };
      }
    } catch (error) {
      console.error('Erro na query local:', error);
      return { data: null, error: error.message };
    }
  },
  
  // ===== PRODUTOS =====
  
  async getProducts(filters = null) {
    const { data, error } = await this.query('products', 'select', null, filters);
    if (error) {
      C4App.utils.handleError(error, 'Database.getProducts');
      return [];
    }
    return data || [];
  },
  
  async createProduct(productData) {
    const product = {
      ...productData,
      user_id: C4App.state.currentUser?.id || 'demo_user'
    };
    
    const { data, error } = await this.query('products', 'insert', product);
    if (error) {
      C4App.utils.handleError(error, 'Database.createProduct');
      return null;
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'products', action: 'create', data: data[0] }
    }));
    
    return data[0];
  },
  
  async updateProduct(id, productData) {
    const { data, error } = await this.query('products', 'update', productData, { id });
    if (error) {
      C4App.utils.handleError(error, 'Database.updateProduct');
      return null;
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'products', action: 'update', data: data[0] }
    }));
    
    return data[0];
  },
  
  async deleteProduct(id) {
    const { data, error } = await this.query('products', 'delete', null, { id });
    if (error) {
      C4App.utils.handleError(error, 'Database.deleteProduct');
      return false;
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'products', action: 'delete', id }
    }));
    
    return true;
  },
  
  // ===== VENDAS =====
  
  async getSales(filters = null) {
    const { data, error } = await this.query('sales', 'select', null, filters);
    if (error) {
      C4App.utils.handleError(error, 'Database.getSales');
      return [];
    }
    return data || [];
  },
  
  async createSale(saleData) {
    const sale = {
      ...saleData,
      user_id: C4App.state.currentUser?.id || 'demo_user'
    };
    
    const { data, error } = await this.query('sales', 'insert', sale);
    if (error) {
      C4App.utils.handleError(error, 'Database.createSale');
      return null;
    }
    
    // Atualizar estoque dos produtos
    if (sale.items && Array.isArray(sale.items)) {
      for (const item of sale.items) {
        await this.updateProductStock(item.productId, -item.quantity);
      }
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'sales', action: 'create', data: data[0] }
    }));
    
    return data[0];
  },
  
  async updateSale(id, saleData) {
    const { data, error } = await this.query('sales', 'update', saleData, { id });
    if (error) {
      C4App.utils.handleError(error, 'Database.updateSale');
      return null;
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'sales', action: 'update', data: data[0] }
    }));
    
    return data[0];
  },
  
  async deleteSale(id) {
    const { data, error } = await this.query('sales', 'delete', null, { id });
    if (error) {
      C4App.utils.handleError(error, 'Database.deleteSale');
      return false;
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'sales', action: 'delete', id }
    }));
    
    return true;
  },
  
  // ===== CLIENTES =====
  
  async getClients(filters = null) {
    const { data, error } = await this.query('clients', 'select', null, filters);
    if (error) {
      C4App.utils.handleError(error, 'Database.getClients');
      return [];
    }
    return data || [];
  },
  
  async createClient(clientData) {
    const client = {
      ...clientData,
      user_id: C4App.state.currentUser?.id || 'demo_user'
    };
    
    const { data, error } = await this.query('clients', 'insert', client);
    if (error) {
      C4App.utils.handleError(error, 'Database.createClient');
      return null;
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'clients', action: 'create', data: data[0] }
    }));
    
    return data[0];
  },
  
  async updateClient(id, clientData) {
    const { data, error } = await this.query('clients', 'update', clientData, { id });
    if (error) {
      C4App.utils.handleError(error, 'Database.updateClient');
      return null;
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'clients', action: 'update', data: data[0] }
    }));
    
    return data[0];
  },
  
  async deleteClient(id) {
    const { data, error } = await this.query('clients', 'delete', null, { id });
    if (error) {
      C4App.utils.handleError(error, 'Database.deleteClient');
      return false;
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'clients', action: 'delete', id }
    }));
    
    return true;
  },
  
  // ===== METAS =====
  
  async getGoals(filters = null) {
    const { data, error } = await this.query('goals', 'select', null, filters);
    if (error) {
      C4App.utils.handleError(error, 'Database.getGoals');
      return [];
    }
    return data || [];
  },
  
  async createGoal(goalData) {
    const goal = {
      ...goalData,
      user_id: C4App.state.currentUser?.id || 'demo_user'
    };
    
    const { data, error } = await this.query('goals', 'insert', goal);
    if (error) {
      C4App.utils.handleError(error, 'Database.createGoal');
      return null;
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'goals', action: 'create', data: data[0] }
    }));
    
    return data[0];
  },
  
  async updateGoal(id, goalData) {
    const { data, error } = await this.query('goals', 'update', goalData, { id });
    if (error) {
      C4App.utils.handleError(error, 'Database.updateGoal');
      return null;
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'goals', action: 'update', data: data[0] }
    }));
    
    return data[0];
  },
  
  // ===== DESPESAS =====
  
  async getExpenses(filters = null) {
    const { data, error } = await this.query('expenses', 'select', null, filters);
    if (error) {
      C4App.utils.handleError(error, 'Database.getExpenses');
      return [];
    }
    return data || [];
  },
  
  async createExpense(expenseData) {
    const expense = {
      ...expenseData,
      user_id: C4App.state.currentUser?.id || 'demo_user'
    };
    
    const { data, error } = await this.query('expenses', 'insert', expense);
    if (error) {
      C4App.utils.handleError(error, 'Database.createExpense');
      return null;
    }
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('c4:data:changed', {
      detail: { dataType: 'expenses', action: 'create', data: data[0] }
    }));
    
    return data[0];
  },
  
  // ===== MÉTODOS AUXILIARES =====
  
  // Atualizar estoque de produto
  async updateProductStock(productId, quantityChange) {
    const products = await this.getProducts({ id: productId });
    if (products.length === 0) return false;
    
    const product = products[0];
    const newStock = Math.max(0, (product.stock || 0) + quantityChange);
    
    return await this.updateProduct(productId, { stock: newStock });
  },
  
  // Obter estatísticas de vendas
  async getSalesStats(period = 'month') {
    const sales = await this.getSales();
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.createdAt);
      return saleDate >= startDate;
    });
    
    const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalOrders = filteredSales.length;
    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    return {
      totalSales,
      totalOrders,
      averageOrder,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };
  },
  
  // Sincronizar dados offline
  async syncOfflineData() {
    if (!this.isConnected) {
      console.log('Não conectado - pulando sincronização');
      return false;
    }
    
    const dirtyData = C4App.utils.Storage.getDirtyData();
    console.log('Sincronizando dados:', dirtyData);
    
    for (const dataType of dirtyData) {
      try {
        // Implementar lógica de sincronização específica
        // Por enquanto, apenas marcar como limpo
        C4App.utils.Storage.markClean(dataType);
      } catch (error) {
        console.error(`Erro ao sincronizar ${dataType}:`, error);
      }
    }
    
    return true;
  }
};

// Inicializar database quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  C4App.utils.Database.init();
});

// Sincronizar quando voltar online
window.addEventListener('c4:online', () => {
  C4App.utils.Database.syncOfflineData();
});

// Exportar para uso global
window.C4Database = C4App.utils.Database;

