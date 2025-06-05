/* storage.js - Gerenciamento de Armazenamento Local */

C4App.utils.Storage = {
  // Prefixo para todas as chaves do app
  prefix: 'c4app_',
  
  // ===== MÉTODOS BÁSICOS =====
  
  // Salvar item no localStorage
  set(key, value, ttl = null) {
    if (!C4App.utils.isLocalStorageAvailable()) {
      console.warn('localStorage não disponível');
      return false;
    }
    
    try {
      const item = {
        value: value,
        timestamp: Date.now(),
        ttl: ttl
      };
      
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return false;
    }
  },
  
  // Obter item do localStorage
  get(key, defaultValue = null) {
    if (!C4App.utils.isLocalStorageAvailable()) {
      return defaultValue;
    }
    
    try {
      const itemStr = localStorage.getItem(this.prefix + key);
      if (!itemStr) return defaultValue;
      
      const item = JSON.parse(itemStr);
      
      // Verificar TTL
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.remove(key);
        return defaultValue;
      }
      
      return item.value;
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      return defaultValue;
    }
  },
  
  // Remover item do localStorage
  remove(key) {
    if (!C4App.utils.isLocalStorageAvailable()) {
      return false;
    }
    
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error);
      return false;
    }
  },
  
  // Verificar se chave existe
  has(key) {
    if (!C4App.utils.isLocalStorageAvailable()) {
      return false;
    }
    
    const item = this.get(key);
    return item !== null;
  },
  
  // Limpar todos os dados do app
  clear() {
    if (!C4App.utils.isLocalStorageAvailable()) {
      return false;
    }
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      return false;
    }
  },
  
  // Obter tamanho usado pelo app
  getSize() {
    if (!C4App.utils.isLocalStorageAvailable()) {
      return 0;
    }
    
    let size = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        size += localStorage.getItem(key).length;
      }
    });
    
    return size;
  },
  
  // ===== MÉTODOS ESPECÍFICOS DO APP =====
  
  // Salvar dados do usuário
  setUser(userData) {
    return this.set('user', userData, C4App.config.cache.userDataTTL);
  },
  
  // Obter dados do usuário
  getUser() {
    return this.get('user');
  },
  
  // Remover dados do usuário
  removeUser() {
    return this.remove('user');
  },
  
  // Salvar configurações do usuário
  setUserSettings(settings) {
    const currentSettings = this.getUserSettings();
    const mergedSettings = { ...currentSettings, ...settings };
    return this.set('user_settings', mergedSettings);
  },
  
  // Obter configurações do usuário
  getUserSettings() {
    return this.get('user_settings', C4App.state.userSettings);
  },
  
  // Salvar produtos
  setProducts(products) {
    return this.set('products', products, C4App.config.cache.defaultTTL);
  },
  
  // Obter produtos
  getProducts() {
    return this.get('products', []);
  },
  
  // Salvar vendas
  setSales(sales) {
    return this.set('sales', sales, C4App.config.cache.defaultTTL);
  },
  
  // Obter vendas
  getSales() {
    return this.get('sales', []);
  },
  
  // Salvar clientes
  setClients(clients) {
    return this.set('clients', clients, C4App.config.cache.defaultTTL);
  },
  
  // Obter clientes
  getClients() {
    return this.get('clients', []);
  },
  
  // Salvar metas
  setGoals(goals) {
    return this.set('goals', goals, C4App.config.cache.defaultTTL);
  },
  
  // Obter metas
  getGoals() {
    return this.get('goals', []);
  },
  
  // Salvar despesas
  setExpenses(expenses) {
    return this.set('expenses', expenses, C4App.config.cache.defaultTTL);
  },
  
  // Obter despesas
  getExpenses() {
    return this.get('expenses', []);
  },
  
  // ===== CACHE DE DADOS =====
  
  // Salvar dados em cache
  setCache(key, data, ttl = null) {
    const cacheKey = `cache_${key}`;
    const cacheTTL = ttl || C4App.config.cache.defaultTTL;
    return this.set(cacheKey, data, cacheTTL);
  },
  
  // Obter dados do cache
  getCache(key, defaultValue = null) {
    const cacheKey = `cache_${key}`;
    return this.get(cacheKey, defaultValue);
  },
  
  // Remover dados do cache
  removeCache(key) {
    const cacheKey = `cache_${key}`;
    return this.remove(cacheKey);
  },
  
  // Limpar todo o cache
  clearCache() {
    if (!C4App.utils.isLocalStorageAvailable()) {
      return false;
    }
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix + 'cache_')) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return false;
    }
  },
  
  // ===== DADOS TEMPORÁRIOS =====
  
  // Salvar dados temporários (sem TTL)
  setTemp(key, data) {
    C4App.state.tempData[key] = data;
  },
  
  // Obter dados temporários
  getTemp(key, defaultValue = null) {
    return C4App.state.tempData[key] || defaultValue;
  },
  
  // Remover dados temporários
  removeTemp(key) {
    delete C4App.state.tempData[key];
  },
  
  // Limpar todos os dados temporários
  clearTemp() {
    C4App.state.tempData = {};
  },
  
  // ===== BACKUP E RESTORE =====
  
  // Exportar todos os dados
  exportData() {
    if (!C4App.utils.isLocalStorageAvailable()) {
      return null;
    }
    
    const data = {};
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        const cleanKey = key.replace(this.prefix, '');
        data[cleanKey] = localStorage.getItem(key);
      }
    });
    
    return {
      version: C4App.config.app.version,
      timestamp: Date.now(),
      data: data
    };
  },
  
  // Importar dados
  importData(backupData) {
    if (!backupData || !backupData.data) {
      throw new Error('Dados de backup inválidos');
    }
    
    try {
      // Limpar dados existentes
      this.clear();
      
      // Importar novos dados
      Object.entries(backupData.data).forEach(([key, value]) => {
        localStorage.setItem(this.prefix + key, value);
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      throw error;
    }
  },
  
  // ===== SINCRONIZAÇÃO =====
  
  // Marcar dados como "sujos" (precisam sincronizar)
  markDirty(dataType) {
    const dirtyData = this.get('dirty_data', []);
    if (!dirtyData.includes(dataType)) {
      dirtyData.push(dataType);
      this.set('dirty_data', dirtyData);
    }
  },
  
  // Obter dados que precisam sincronizar
  getDirtyData() {
    return this.get('dirty_data', []);
  },
  
  // Marcar dados como sincronizados
  markClean(dataType) {
    const dirtyData = this.get('dirty_data', []);
    const cleanData = dirtyData.filter(type => type !== dataType);
    this.set('dirty_data', cleanData);
  },
  
  // Limpar todos os marcadores de sincronização
  clearDirtyData() {
    this.remove('dirty_data');
  },
  
  // ===== DADOS DEMO =====
  
  // Carregar dados demo
  loadDemoData() {
    const demoData = {
      products: [
        {
          id: 'prod_1',
          name: 'Blusa Rosa Feminina',
          category: 'roupas',
          cost: 20.00,
          price: 45.00,
          stock: 15,
          minStock: 5,
          description: 'Blusa feminina em algodão, cor rosa',
          image: null,
          createdAt: new Date().toISOString()
        },
        {
          id: 'prod_2',
          name: 'Brinco Dourado',
          category: 'acessorios',
          cost: 12.00,
          price: 25.00,
          stock: 8,
          minStock: 3,
          description: 'Brinco folheado a ouro',
          image: null,
          createdAt: new Date().toISOString()
        },
        {
          id: 'prod_3',
          name: 'Sandália Nude',
          category: 'calcados',
          cost: 35.00,
          price: 65.00,
          stock: 12,
          minStock: 5,
          description: 'Sandália feminina cor nude',
          image: null,
          createdAt: new Date().toISOString()
        }
      ],
      
      clients: [
        {
          id: 'client_1',
          name: 'Maria Silva',
          email: 'maria@email.com',
          phone: '(11) 99999-1111',
          address: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          cep: '01234-567',
          totalPurchases: 3,
          totalSpent: 135.00,
          lastPurchase: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: 'client_2',
          name: 'Ana Santos',
          email: 'ana@email.com',
          phone: '(11) 99999-2222',
          address: 'Av. Paulista, 456',
          city: 'São Paulo',
          state: 'SP',
          cep: '01310-100',
          totalPurchases: 5,
          totalSpent: 225.00,
          lastPurchase: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        }
      ],
      
      sales: [
        {
          id: 'sale_1',
          clientId: 'client_1',
          clientName: 'Maria Silva',
          items: [
            { productId: 'prod_1', productName: 'Blusa Rosa Feminina', quantity: 1, price: 45.00 }
          ],
          subtotal: 45.00,
          shipping: 8.00,
          discount: 0,
          total: 53.00,
          paymentMethod: 'pix',
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'sale_2',
          clientId: 'client_2',
          clientName: 'Ana Santos',
          items: [
            { productId: 'prod_2', productName: 'Brinco Dourado', quantity: 2, price: 25.00 },
            { productId: 'prod_3', productName: 'Sandália Nude', quantity: 1, price: 65.00 }
          ],
          subtotal: 115.00,
          shipping: 0, // Frete grátis
          discount: 5.75, // 5% desconto
          total: 109.25,
          paymentMethod: 'cartao',
          status: 'completed',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      
      goals: [
        {
          id: 'goal_1',
          type: 'monthly',
          title: 'Meta de Vendas - Dezembro',
          target: 5000.00,
          current: 162.25,
          period: {
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()
          },
          createdAt: new Date().toISOString()
        }
      ],
      
      expenses: [
        {
          id: 'expense_1',
          category: 'fixas',
          description: 'MEI - Dezembro',
          amount: 66.60,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ]
    };
    
    // Salvar dados demo
    this.setProducts(demoData.products);
    this.setClients(demoData.clients);
    this.setSales(demoData.sales);
    this.setGoals(demoData.goals);
    this.setExpenses(demoData.expenses);
    
    // Marcar como dados demo carregados
    this.set('demo_loaded', true);
    
    console.log('📊 Dados demo carregados com sucesso');
    return true;
  },
  
  // Verificar se dados demo estão carregados
  isDemoLoaded() {
    return this.get('demo_loaded', false);
  },
  
  // ===== ESTATÍSTICAS =====
  
  // Obter estatísticas de uso do storage
  getStats() {
    const stats = {
      totalSize: this.getSize(),
      itemCount: 0,
      cacheSize: 0,
      cacheCount: 0,
      lastAccess: this.get('last_access'),
      version: C4App.config.app.version
    };
    
    if (C4App.utils.isLocalStorageAvailable()) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          stats.itemCount++;
          if (key.includes('cache_')) {
            stats.cacheCount++;
            stats.cacheSize += localStorage.getItem(key).length;
          }
        }
      });
    }
    
    return stats;
  },
  
  // Atualizar último acesso
  updateLastAccess() {
    this.set('last_access', Date.now());
  }
};

// Atualizar último acesso ao carregar
C4App.utils.Storage.updateLastAccess();

// Event listeners para sincronização
window.addEventListener('c4:data:changed', (event) => {
  const { dataType } = event.detail;
  C4App.utils.Storage.markDirty(dataType);
});

// Limpar cache expirado periodicamente
setInterval(() => {
  if (C4App.utils.isLocalStorageAvailable()) {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(C4App.utils.Storage.prefix + 'cache_')) {
        // Tentar acessar o item para verificar TTL
        const cleanKey = key.replace(C4App.utils.Storage.prefix, '');
        C4App.utils.Storage.get(cleanKey);
      }
    });
  }
}, 60000); // A cada minuto

// Exportar para uso global
window.C4Storage = C4App.utils.Storage;

