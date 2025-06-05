/* app.js - Aplicação Principal do C4 App */

C4App.core = {
  // Estado da aplicação
  isInitialized: false,
  currentPage: 'dashboard',
  
  // ===== INICIALIZAÇÃO =====
  
  async init() {
    try {
      console.log('🚀 Iniciando C4 App...');
      
      // Mostrar loading
      this.showLoading('Inicializando aplicação...');
      
      // Aguardar um pouco para mostrar o loading
      await this.delay(1000);
      
      // Inicializar módulos core
      await this.initializeCore();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Configurar navegação
      this.setupNavigation();
      
      // Configurar formulários
      this.setupForms();
      
      // Verificar autenticação
      const isAuthenticated = await C4App.utils.Auth.init();
      
      if (isAuthenticated) {
        // Usuário logado - mostrar app
        this.showMainApp();
        await this.loadInitialData();
      } else {
        // Usuário não logado - mostrar login
        this.showLoginScreen();
      }
      
      // Marcar como inicializado
      this.isInitialized = true;
      
      // Esconder loading
      this.hideLoading();
      
      console.log('✅ C4 App inicializado com sucesso');
      
      // Disparar evento de inicialização
      window.dispatchEvent(new CustomEvent('c4:app:initialized'));
      
    } catch (error) {
      console.error('❌ Erro ao inicializar C4 App:', error);
      this.showError('Erro ao carregar aplicação. Recarregue a página.');
    }
  },
  
  // Inicializar módulos core
  async initializeCore() {
    // Inicializar database
    await C4App.utils.Database.init();
    
    // Carregar configurações do usuário
    const userSettings = C4App.utils.Storage.getUserSettings();
    C4App.state.userSettings = { ...C4App.state.userSettings, ...userSettings };
    
    // Aplicar tema
    this.applyTheme(C4App.state.userSettings.theme);
    
    console.log('⚙️ Módulos core inicializados');
  },
  
  // ===== NAVEGAÇÃO =====
  
  setupNavigation() {
    // Navegação bottom
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) {
          this.navigateTo(page);
        }
      });
    });
    
    // FAB (Floating Action Button)
    const fab = document.getElementById('fab-new-sale');
    if (fab) {
      fab.addEventListener('click', () => {
        this.openNewSaleModal();
      });
    }
    
    // Botões de ação rápida
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    quickActionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleQuickAction(action);
      });
    });
    
    console.log('🧭 Navegação configurada');
  },
  
  // Navegar para página
  navigateTo(page) {
    if (!this.isInitialized) return;
    
    // Verificar autenticação
    if (!C4App.utils.Auth.isLoggedIn()) {
      C4App.utils.Auth.showLoginScreen();
      return;
    }
    
    // Esconder todas as páginas
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
      p.style.display = 'none';
      p.classList.remove('active');
    });
    
    // Mostrar página selecionada
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
      targetPage.style.display = 'block';
      targetPage.classList.add('active');
      
      // Atualizar navegação
      this.updateNavigation(page);
      
      // Atualizar estado
      this.currentPage = page;
      C4App.state.currentPage = page;
      
      // Carregar dados da página
      this.loadPageData(page);
      
      // Disparar evento de navegação
      window.dispatchEvent(new CustomEvent('c4:navigation:changed', {
        detail: { page }
      }));
      
      console.log(`📄 Navegou para: ${page}`);
    }
  },
  
  // Atualizar indicadores de navegação
  updateNavigation(activePage) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === activePage) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    });
  },
  
  // ===== FORMULÁRIOS =====
  
  setupForms() {
    // Formulário de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin(e.target);
      });
    }
    
    // Link de registro
    const registerLink = document.getElementById('register-link');
    if (registerLink) {
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showRegisterModal();
      });
    }
    
    // Link de dados demo
    const demoLink = document.getElementById('demo-link');
    if (demoLink) {
      demoLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loginWithDemo();
      });
    }
    
    console.log('📝 Formulários configurados');
  },
  
  // ===== AUTENTICAÇÃO =====
  
  async handleLogin(form) {
    try {
      const formData = new FormData(form);
      const email = formData.get('email');
      const password = formData.get('password');
      
      // Mostrar loading
      this.showLoading('Fazendo login...');
      
      // Tentar login
      const result = await C4App.utils.Auth.login(email, password);
      
      if (result.success) {
        // Login bem-sucedido
        this.showMainApp();
        await this.loadInitialData();
        
        if (C4App.components && C4App.components.toast) {
          C4App.components.toast.success(`Bem-vinda, ${result.user.name || result.user.email}!`);
        }
      } else {
        // Erro no login
        this.showError(result.error || 'Erro ao fazer login');
      }
      
    } catch (error) {
      console.error('Erro no login:', error);
      this.showError('Erro inesperado ao fazer login');
    } finally {
      this.hideLoading();
    }
  },
  
  async loginWithDemo() {
    try {
      this.showLoading('Carregando dados demo...');
      
      const result = await C4App.utils.Auth.loginDemo('demo@c4app.com');
      
      if (result.success) {
        this.showMainApp();
        await this.loadInitialData();
        
        if (C4App.components && C4App.components.toast) {
          C4App.components.toast.info('Usando dados demo. Explore o app!');
        }
      } else {
        this.showError('Erro ao carregar dados demo');
      }
      
    } catch (error) {
      console.error('Erro no login demo:', error);
      this.showError('Erro ao carregar dados demo');
    } finally {
      this.hideLoading();
    }
  },
  
  // ===== CARREGAMENTO DE DADOS =====
  
  async loadInitialData() {
    try {
      console.log('📊 Carregando dados iniciais...');
      
      // Carregar dados em paralelo
      const [products, sales, clients, goals] = await Promise.all([
        C4App.utils.Database.getProducts(),
        C4App.utils.Database.getSales(),
        C4App.utils.Database.getClients(),
        C4App.utils.Database.getGoals()
      ]);
      
      // Atualizar cache local
      C4App.utils.Storage.setProducts(products);
      C4App.utils.Storage.setSales(sales);
      C4App.utils.Storage.setClients(clients);
      C4App.utils.Storage.setGoals(goals);
      
      // Atualizar dashboard
      if (this.currentPage === 'dashboard') {
        this.loadPageData('dashboard');
      }
      
      console.log('✅ Dados iniciais carregados');
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  },
  
  async loadPageData(page) {
    try {
      switch (page) {
        case 'dashboard':
          if (C4App.modules.Dashboard) {
            await C4App.modules.Dashboard.refresh();
          }
          break;
          
        case 'products':
          if (C4App.modules.Products) {
            await C4App.modules.Products.refresh();
          }
          break;
          
        case 'sales':
          if (C4App.modules.Sales) {
            await C4App.modules.Sales.refresh();
          }
          break;
          
        case 'reports':
          if (C4App.modules.Reports) {
            await C4App.modules.Reports.refresh();
          }
          break;
          
        case 'profile':
          if (C4App.modules.Profile) {
            await C4App.modules.Profile.refresh();
          }
          break;
      }
    } catch (error) {
      console.error(`Erro ao carregar dados da página ${page}:`, error);
    }
  },
  
  // ===== AÇÕES RÁPIDAS =====
  
  handleQuickAction(action) {
    switch (action) {
      case 'new-sale':
        this.openNewSaleModal();
        break;
        
      case 'new-product':
        this.openNewProductModal();
        break;
        
      default:
        console.warn('Ação rápida não reconhecida:', action);
    }
  },
  
  openNewSaleModal() {
    if (C4App.modules.Sales && C4App.modules.Sales.openNewSaleModal) {
      C4App.modules.Sales.openNewSaleModal();
    } else {
      console.warn('Módulo de vendas não carregado');
    }
  },
  
  openNewProductModal() {
    if (C4App.modules.Products && C4App.modules.Products.openNewProductModal) {
      C4App.modules.Products.openNewProductModal();
    } else {
      console.warn('Módulo de produtos não carregado');
    }
  },
  
  // ===== INTERFACE =====
  
  showLoading(message = 'Carregando...') {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingText = document.querySelector('.loading-text');
    
    if (loadingScreen) {
      loadingScreen.style.display = 'flex';
    }
    
    if (loadingText) {
      loadingText.textContent = message;
    }
    
    C4App.state.isLoading = true;
  },
  
  hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    
    C4App.state.isLoading = false;
  },
  
  showLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loginScreen) loginScreen.style.display = 'block';
    if (mainApp) mainApp.style.display = 'none';
    
    this.hideLoading();
  },
  
  showMainApp() {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    
    this.hideLoading();
    
    // Navegar para dashboard se não há página ativa
    if (!this.currentPage || this.currentPage === 'login') {
      this.navigateTo('dashboard');
    }
  },
  
  showError(message) {
    if (C4App.components && C4App.components.toast) {
      C4App.components.toast.error(message);
    } else {
      alert(message);
    }
  },
  
  // ===== EVENT LISTENERS =====
  
  setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await this.handleLogout();
      });
    }
    
    // Menu do usuário
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
      userMenu.addEventListener('click', () => {
        this.navigateTo('profile');
      });
    }
    
    // Carregar dados demo
    const loadDemoBtn = document.getElementById('load-demo-btn');
    if (loadDemoBtn) {
      loadDemoBtn.addEventListener('click', () => {
        this.loadDemoData();
      });
    }
    
    // Eventos customizados
    window.addEventListener('c4:data:changed', (event) => {
      this.handleDataChange(event.detail);
    });
    
    window.addEventListener('c4:auth:login', () => {
      this.updateUserGreeting();
    });
    
    window.addEventListener('c4:auth:logout', () => {
      this.clearUserData();
    });
    
    // Eventos de conectividade
    window.addEventListener('c4:online', () => {
      if (C4App.components && C4App.components.toast) {
        C4App.components.toast.success('Conexão restaurada');
      }
    });
    
    window.addEventListener('c4:offline', () => {
      if (C4App.components && C4App.components.toast) {
        C4App.components.toast.warning('Sem conexão - modo offline');
      }
    });
    
    console.log('👂 Event listeners configurados');
  },
  
  async handleLogout() {
    try {
      this.showLoading('Saindo...');
      
      const result = await C4App.utils.Auth.logout();
      
      if (result.success) {
        this.showLoginScreen();
        this.clearUserData();
        
        if (C4App.components && C4App.components.toast) {
          C4App.components.toast.info('Logout realizado com sucesso');
        }
      }
      
    } catch (error) {
      console.error('Erro no logout:', error);
      this.showError('Erro ao fazer logout');
    } finally {
      this.hideLoading();
    }
  },
  
  // ===== UTILITÁRIOS =====
  
  updateUserGreeting() {
    const userNameEl = document.getElementById('user-name');
    const profileNameEl = document.getElementById('profile-name');
    const profileEmailEl = document.getElementById('profile-email');
    
    const user = C4App.utils.Auth.getCurrentUser();
    
    if (user) {
      const greeting = this.getGreeting();
      const name = user.name || C4App.utils.Auth.extractNameFromEmail(user.email);
      
      if (userNameEl) {
        userNameEl.textContent = `${greeting}, ${name}`;
      }
      
      if (profileNameEl) {
        profileNameEl.textContent = name;
      }
      
      if (profileEmailEl) {
        profileEmailEl.textContent = user.email;
      }
    }
  },
  
  getGreeting() {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  },
  
  clearUserData() {
    // Limpar dados temporários
    C4App.utils.Storage.clearTemp();
    
    // Resetar estado
    this.currentPage = 'dashboard';
    C4App.state.currentPage = 'dashboard';
  },
  
  handleDataChange(detail) {
    const { dataType, action } = detail;
    
    // Atualizar página atual se relevante
    if (this.currentPage === dataType || this.currentPage === 'dashboard') {
      this.loadPageData(this.currentPage);
    }
    
    console.log(`📊 Dados alterados: ${dataType} - ${action}`);
  },
  
  loadDemoData() {
    try {
      C4App.utils.Storage.loadDemoData();
      this.loadInitialData();
      
      if (C4App.components && C4App.components.toast) {
        C4App.components.toast.success('Dados demo carregados!');
      }
    } catch (error) {
      console.error('Erro ao carregar dados demo:', error);
      this.showError('Erro ao carregar dados demo');
    }
  },
  
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    console.log(`🎨 Tema aplicado: ${theme}`);
  },
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  C4App.core.init();
});

// Exportar para uso global
window.C4Core = C4App.core;

