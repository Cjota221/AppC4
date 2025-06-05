/* config.js - Configurações do C4 App */

// Namespace global do aplicativo
window.C4App = {
  config: {
    // Configurações do Supabase (demo)
    supabase: {
      url: 'https://demo-c4app.supabase.co',
      anonKey: 'demo-anon-key-c4app-development'
    },
    
    // Configurações do aplicativo
    app: {
      name: 'C4 App',
      version: '1.0.0',
      environment: 'development',
      debug: true
    },
    
    // Configurações de negócio
    business: {
      // Frete grátis acima de R$ 150
      freeShippingThreshold: 150,
      
      // Taxas de frete por região
      shippingRates: {
        local: 8.00,      // São Paulo capital
        state: 12.00,     // Estado de SP
        national: 18.00   // Nacional
      },
      
      // Peso adicional por kg (acima de 1kg)
      weightFeePerKg: 2.50,
      
      // Descontos progressivos
      discountTiers: [
        { min: 200, max: 399, discount: 3 },
        { min: 400, max: 699, discount: 5 },
        { min: 700, max: Infinity, discount: 8 }
      ],
      
      // Bônus VIP (clientes com 10+ compras)
      vipBonus: 2,
      
      // Comissões
      commissions: {
        ownSales: 8,        // 8% para vendas próprias acima de R$ 500/mês
        reseller: 15,       // 15% para revendedoras
        referral: 50        // R$ 50 por indicação
      },
      
      // Impostos
      taxes: {
        mei: 66.60,         // MEI mensal
        simplesNacional: {  // Simples Nacional por faixa
          0: 4.0,           // 0-180k: 4%
          180000: 7.3,      // 180k-360k: 7.3%
          360000: 9.5       // 360k-720k: 9.5%
        }
      },
      
      // Estoque
      stock: {
        minDefault: 5,      // Estoque mínimo padrão
        maxDefault: 50      // Estoque máximo padrão
      },
      
      // Margens por categoria
      defaultMargins: {
        roupas: 22,         // 22%
        acessorios: 35,     // 35%
        calcados: 28        // 28%
      }
    },
    
    // Configurações de UI
    ui: {
      // Animações
      animations: {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      
      // Toast notifications
      toast: {
        duration: 3000,
        position: 'top-right'
      },
      
      // Paginação
      pagination: {
        itemsPerPage: 20,
        maxPages: 10
      },
      
      // Debounce para busca
      searchDebounce: 300,
      
      // Auto-save
      autoSaveDelay: 2000
    },
    
    // Configurações de cache
    cache: {
      // TTL em milissegundos
      defaultTTL: 300000,     // 5 minutos
      userDataTTL: 600000,    // 10 minutos
      reportsDataTTL: 180000  // 3 minutos
    },
    
    // Configurações de validação
    validation: {
      // Limites de campos
      limits: {
        productName: { min: 2, max: 100 },
        clientName: { min: 2, max: 100 },
        price: { min: 0.01, max: 99999.99 },
        quantity: { min: 1, max: 9999 },
        description: { max: 500 }
      },
      
      // Regex patterns
      patterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
        cep: /^\d{5}-?\d{3}$/,
        currency: /^\d+([.,]\d{2})?$/
      }
    },
    
    // Configurações de formatação
    formatting: {
      // Locale brasileiro
      locale: 'pt-BR',
      
      // Moeda
      currency: {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      
      // Números
      number: {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      },
      
      // Porcentagem
      percent: {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      },
      
      // Data
      date: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      
      // Data e hora
      datetime: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }
    }
  },
  
  // Estado global da aplicação
  state: {
    // Usuário atual
    currentUser: null,
    
    // Página atual
    currentPage: 'dashboard',
    
    // Status de conexão
    isOnline: navigator.onLine,
    
    // Status de carregamento
    isLoading: false,
    
    // Dados em cache
    cache: new Map(),
    
    // Listeners de eventos
    listeners: new Map(),
    
    // Dados temporários
    tempData: {},
    
    // Configurações do usuário
    userSettings: {
      theme: 'light',
      notifications: true,
      autoSave: true,
      currency: 'BRL',
      language: 'pt-BR'
    }
  },
  
  // Módulos da aplicação
  modules: {},
  
  // Utilitários
  utils: {},
  
  // Componentes
  components: {}
};

// Configurações específicas por ambiente
if (C4App.config.app.environment === 'development') {
  // Configurações de desenvolvimento
  C4App.config.app.debug = true;
  C4App.config.supabase.url = 'https://demo-c4app.supabase.co';
  C4App.config.supabase.anonKey = 'demo-anon-key-c4app-development';
  
  // Logs detalhados
  console.log('🚀 C4 App - Modo Desenvolvimento');
  console.log('📊 Configurações carregadas:', C4App.config);
} else if (C4App.config.app.environment === 'production') {
  // Configurações de produção
  C4App.config.app.debug = false;
  
  // Desabilitar logs
  console.log = function() {};
  console.warn = function() {};
}

// Event listeners globais
window.addEventListener('online', () => {
  C4App.state.isOnline = true;
  console.log('🌐 Conexão restaurada');
  
  // Disparar evento customizado
  window.dispatchEvent(new CustomEvent('c4:online'));
});

window.addEventListener('offline', () => {
  C4App.state.isOnline = false;
  console.log('📴 Conexão perdida - modo offline');
  
  // Disparar evento customizado
  window.dispatchEvent(new CustomEvent('c4:offline'));
});

// Detectar mudanças de visibilidade da página
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('📱 App em background');
    window.dispatchEvent(new CustomEvent('c4:background'));
  } else {
    console.log('📱 App em foreground');
    window.dispatchEvent(new CustomEvent('c4:foreground'));
  }
});

// Configurar service worker (se disponível)
if ('serviceWorker' in navigator && C4App.config.app.environment === 'production') {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('✅ Service Worker registrado:', registration);
    })
    .catch(error => {
      console.error('❌ Erro ao registrar Service Worker:', error);
    });
}

// Exportar configurações para uso global
window.C4Config = C4App.config;

