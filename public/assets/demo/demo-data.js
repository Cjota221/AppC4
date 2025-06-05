// demo-data.js - Dados Demo para Teste

C4App.demo = {
  // ===== DADOS DE EXEMPLO =====
  
  products: [
    {
      id: 'prod_001',
      name: 'Blusa Rosa Feminina',
      category: 'roupas',
      cost: 20.00,
      price: 45.00,
      stock: 15,
      minStock: 5,
      description: 'Blusa feminina em tecido leve, cor rosa, tamanhos P, M e G',
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'prod_002',
      name: 'Brinco Dourado Elegante',
      category: 'acessorios',
      cost: 12.00,
      price: 25.00,
      stock: 8,
      minStock: 3,
      description: 'Brinco dourado com design elegante, hipoalergênico',
      created_at: '2024-01-16T14:30:00Z'
    },
    {
      id: 'prod_003',
      name: 'Sandália Nude Confortável',
      category: 'calcados',
      cost: 35.00,
      price: 65.00,
      stock: 12,
      minStock: 4,
      description: 'Sandália nude com salto baixo, muito confortável para o dia a dia',
      created_at: '2024-01-17T09:15:00Z'
    },
    {
      id: 'prod_004',
      name: 'Vestido Floral Verão',
      category: 'roupas',
      cost: 28.00,
      price: 55.00,
      stock: 6,
      minStock: 5,
      description: 'Vestido com estampa floral, perfeito para o verão',
      created_at: '2024-01-18T16:45:00Z'
    },
    {
      id: 'prod_005',
      name: 'Bolsa Pequena Preta',
      category: 'acessorios',
      cost: 22.00,
      price: 42.00,
      stock: 3,
      minStock: 5,
      description: 'Bolsa pequena preta, ideal para ocasiões especiais',
      created_at: '2024-01-19T11:20:00Z'
    }
  ],
  
  clients: [
    {
      id: 'client_001',
      name: 'Maria Silva',
      email: 'maria.silva@email.com',
      phone: '(11) 99999-1111',
      address: {
        street: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      created_at: '2024-01-10T08:00:00Z'
    },
    {
      id: 'client_002',
      name: 'Ana Santos',
      email: 'ana.santos@email.com',
      phone: '(11) 99999-2222',
      address: {
        street: 'Av. Principal, 456',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-890'
      },
      created_at: '2024-01-12T10:30:00Z'
    },
    {
      id: 'client_003',
      name: 'Carla Oliveira',
      email: 'carla.oliveira@email.com',
      phone: '(11) 99999-3333',
      address: {
        street: 'Rua do Comércio, 789',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-012'
      },
      created_at: '2024-01-14T15:45:00Z'
    }
  ],
  
  sales: [
    {
      id: 'sale_001',
      clientId: 'client_001',
      clientName: 'Maria Silva',
      items: [
        {
          productId: 'prod_001',
          productName: 'Blusa Rosa Feminina',
          quantity: 2,
          price: 45.00
        },
        {
          productId: 'prod_002',
          productName: 'Brinco Dourado Elegante',
          quantity: 1,
          price: 25.00
        }
      ],
      subtotal: 115.00,
      shipping: 12.00,
      discount: 0.00,
      total: 127.00,
      paymentMethod: 'pix',
      status: 'completed',
      created_at: '2024-01-20T14:30:00Z'
    },
    {
      id: 'sale_002',
      clientId: 'client_002',
      clientName: 'Ana Santos',
      items: [
        {
          productId: 'prod_003',
          productName: 'Sandália Nude Confortável',
          quantity: 1,
          price: 65.00
        }
      ],
      subtotal: 65.00,
      shipping: 0.00,
      discount: 5.00,
      total: 60.00,
      paymentMethod: 'cartao',
      status: 'completed',
      created_at: '2024-01-21T10:15:00Z'
    },
    {
      id: 'sale_003',
      clientId: 'client_003',
      clientName: 'Carla Oliveira',
      items: [
        {
          productId: 'prod_004',
          productName: 'Vestido Floral Verão',
          quantity: 1,
          price: 55.00
        },
        {
          productId: 'prod_005',
          productName: 'Bolsa Pequena Preta',
          quantity: 1,
          price: 42.00
        }
      ],
      subtotal: 97.00,
      shipping: 8.00,
      discount: 0.00,
      total: 105.00,
      paymentMethod: 'dinheiro',
      status: 'pending',
      created_at: '2024-01-22T16:20:00Z'
    },
    {
      id: 'sale_004',
      clientId: 'client_001',
      clientName: 'Maria Silva',
      items: [
        {
          productId: 'prod_001',
          productName: 'Blusa Rosa Feminina',
          quantity: 1,
          price: 45.00
        }
      ],
      subtotal: 45.00,
      shipping: 0.00,
      discount: 0.00,
      total: 45.00,
      paymentMethod: 'pix',
      status: 'completed',
      created_at: '2024-01-23T09:45:00Z'
    }
  ],
  
  goals: [
    {
      id: 'goal_001',
      type: 'monthly',
      title: 'Meta de Janeiro 2024',
      target: 5000.00,
      current: 337.00,
      period: {
        start: '2024-01-01',
        end: '2024-01-31'
      },
      created_at: '2024-01-01T00:00:00Z'
    }
  ],
  
  expenses: [
    {
      id: 'expense_001',
      category: 'fixas',
      description: 'Aluguel do ateliê',
      amount: 800.00,
      date: '2024-01-05',
      created_at: '2024-01-05T10:00:00Z'
    },
    {
      id: 'expense_002',
      category: 'variaveis',
      description: 'Tecidos e materiais',
      amount: 350.00,
      date: '2024-01-15',
      created_at: '2024-01-15T14:30:00Z'
    },
    {
      id: 'expense_003',
      category: 'marketing',
      description: 'Impulsionamento Instagram',
      amount: 100.00,
      date: '2024-01-20',
      created_at: '2024-01-20T11:15:00Z'
    }
  ],
  
  user: {
    id: 'user_001',
    name: 'Jessica',
    email: 'jessica@c4app.com',
    businessName: 'Jessica Moda Feminina',
    businessType: 'MEI',
    created_at: '2024-01-01T00:00:00Z'
  },
  
  // ===== MÉTODOS DE INSTALAÇÃO =====
  
  async install() {
    try {
      console.log('📦 Instalando dados demo...');
      
      // Verificar se já existem dados
      const existingProducts = await C4App.utils.Database.getProducts();
      if (existingProducts.length > 0) {
        console.log('ℹ️ Dados já existem, pulando instalação demo');
        return false;
      }
      
      // Instalar dados em ordem
      await this.installProducts();
      await this.installClients();
      await this.installSales();
      await this.installGoals();
      await this.installExpenses();
      await this.installUser();
      
      console.log('✅ Dados demo instalados com sucesso!');
      
      // Notificar mudança de dados
      window.dispatchEvent(new CustomEvent('c4:data:changed', {
        detail: { dataType: 'all' }
      }));
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao instalar dados demo:', error);
      return false;
    }
  },
  
  async installProducts() {
    for (const product of this.products) {
      await C4App.utils.Database.createProduct(product);
    }
    console.log('✅ Produtos demo instalados');
  },
  
  async installClients() {
    for (const client of this.clients) {
      await C4App.utils.Database.createClient(client);
    }
    console.log('✅ Clientes demo instalados');
  },
  
  async installSales() {
    for (const sale of this.sales) {
      await C4App.utils.Database.createSale(sale);
    }
    console.log('✅ Vendas demo instaladas');
  },
  
  async installGoals() {
    for (const goal of this.goals) {
      await C4App.utils.Database.createGoal(goal);
    }
    console.log('✅ Metas demo instaladas');
  },
  
  async installExpenses() {
    for (const expense of this.expenses) {
      await C4App.utils.Database.createExpense(expense);
    }
    console.log('✅ Despesas demo instaladas');
  },
  
  async installUser() {
    await C4App.utils.Storage.set('user', this.user);
    console.log('✅ Usuário demo instalado');
  },
  
  // ===== MÉTODOS DE LIMPEZA =====
  
  async clear() {
    try {
      console.log('🧹 Limpando dados demo...');
      
      // Limpar localStorage
      const keys = ['products', 'clients', 'sales', 'goals', 'expenses', 'user'];
      for (const key of keys) {
        await C4App.utils.Storage.remove(key);
      }
      
      console.log('✅ Dados demo removidos');
      
      // Notificar mudança de dados
      window.dispatchEvent(new CustomEvent('c4:data:changed', {
        detail: { dataType: 'all' }
      }));
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao limpar dados demo:', error);
      return false;
    }
  },
  
  // ===== MÉTODOS DE VERIFICAÇÃO =====
  
  async isInstalled() {
    try {
      const products = await C4App.utils.Database.getProducts();
      return products.length > 0;
    } catch (error) {
      return false;
    }
  },
  
  // ===== MÉTODOS DE CONVENIÊNCIA =====
  
  async installIfEmpty() {
    const isEmpty = !(await this.isInstalled());
    if (isEmpty) {
      return await this.install();
    }
    return false;
  },
  
  async reinstall() {
    await this.clear();
    return await this.install();
  }
};

// Auto-instalar dados demo se não existirem
document.addEventListener('DOMContentLoaded', async () => {
  // Aguardar inicialização do app
  setTimeout(async () => {
    try {
      await C4App.demo.installIfEmpty();
    } catch (error) {
      console.error('Erro ao auto-instalar dados demo:', error);
    }
  }, 1000);
});

// Exportar para uso global
window.C4Demo = C4App.demo;

