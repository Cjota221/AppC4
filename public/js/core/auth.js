/* auth.js - Sistema de Autenticação */

C4App.utils.Auth = {
  // ===== ESTADO =====
  currentUser: null,
  isAuthenticated: false,
  
  // ===== INICIALIZAÇÃO =====
  
  async init() {
    // Verificar se há usuário salvo no localStorage
    const savedUser = C4App.utils.Storage.getUser();
    if (savedUser) {
      this.currentUser = savedUser;
      this.isAuthenticated = true;
      C4App.state.currentUser = savedUser;
      
      console.log('👤 Usuário restaurado do localStorage:', savedUser.email);
      
      // Disparar evento de login
      window.dispatchEvent(new CustomEvent('c4:auth:restored', {
        detail: { user: savedUser }
      }));
      
      return true;
    }
    
    // Verificar sessão do Supabase (se conectado)
    if (C4App.utils.Database.client) {
      try {
        const { data: { session } } = await C4App.utils.Database.client.auth.getSession();
        if (session?.user) {
          await this.handleAuthSuccess(session.user, session);
          return true;
        }
      } catch (error) {
        console.warn('Erro ao verificar sessão Supabase:', error);
      }
    }
    
    return false;
  },
  
  // ===== AUTENTICAÇÃO =====
  
  // Login com email e senha
  async login(email, password) {
    try {
      // Validar dados
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }
      
      if (!C4App.utils.isValidEmail(email)) {
        throw new Error('Email inválido');
      }
      
      // Tentar login no Supabase
      if (C4App.utils.Database.client) {
        const { data, error } = await C4App.utils.Database.client.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });
        
        if (error) {
          // Se erro no Supabase, usar login demo
          console.warn('Erro no Supabase, usando login demo:', error.message);
          return await this.loginDemo(email);
        }
        
        if (data.user) {
          await this.handleAuthSuccess(data.user, data.session);
          return { success: true, user: data.user };
        }
      }
      
      // Fallback para login demo
      return await this.loginDemo(email);
      
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Login demo (para desenvolvimento)
  async loginDemo(email) {
    try {
      const demoUser = {
        id: 'demo_user_' + Date.now(),
        email: email.trim(),
        name: this.extractNameFromEmail(email),
        avatar: null,
        created_at: new Date().toISOString(),
        is_demo: true
      };
      
      await this.handleAuthSuccess(demoUser);
      
      return { success: true, user: demoUser };
    } catch (error) {
      console.error('Erro no login demo:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Registro de novo usuário
  async register(email, password, userData = {}) {
    try {
      // Validar dados
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }
      
      if (!C4App.utils.isValidEmail(email)) {
        throw new Error('Email inválido');
      }
      
      if (password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }
      
      // Tentar registro no Supabase
      if (C4App.utils.Database.client) {
        const { data, error } = await C4App.utils.Database.client.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              name: userData.name || this.extractNameFromEmail(email),
              ...userData
            }
          }
        });
        
        if (error) {
          console.warn('Erro no registro Supabase:', error.message);
          // Fallback para registro demo
          return await this.registerDemo(email, userData);
        }
        
        if (data.user) {
          // Se precisar confirmar email
          if (!data.session) {
            return { 
              success: true, 
              needsConfirmation: true, 
              message: 'Verifique seu email para confirmar a conta' 
            };
          }
          
          await this.handleAuthSuccess(data.user, data.session);
          return { success: true, user: data.user };
        }
      }
      
      // Fallback para registro demo
      return await this.registerDemo(email, userData);
      
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Registro demo
  async registerDemo(email, userData = {}) {
    try {
      const demoUser = {
        id: 'demo_user_' + Date.now(),
        email: email.trim(),
        name: userData.name || this.extractNameFromEmail(email),
        avatar: userData.avatar || null,
        created_at: new Date().toISOString(),
        is_demo: true,
        ...userData
      };
      
      await this.handleAuthSuccess(demoUser);
      
      return { success: true, user: demoUser };
    } catch (error) {
      console.error('Erro no registro demo:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Logout
  async logout() {
    try {
      // Logout do Supabase
      if (C4App.utils.Database.client && !this.currentUser?.is_demo) {
        await C4App.utils.Database.client.auth.signOut();
      }
      
      // Limpar dados locais
      this.currentUser = null;
      this.isAuthenticated = false;
      C4App.state.currentUser = null;
      
      // Remover dados do localStorage
      C4App.utils.Storage.removeUser();
      
      // Disparar evento de logout
      window.dispatchEvent(new CustomEvent('c4:auth:logout'));
      
      console.log('👋 Usuário deslogado');
      return { success: true };
      
    } catch (error) {
      console.error('Erro no logout:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ===== RECUPERAÇÃO DE SENHA =====
  
  async resetPassword(email) {
    try {
      if (!C4App.utils.isValidEmail(email)) {
        throw new Error('Email inválido');
      }
      
      // Tentar reset no Supabase
      if (C4App.utils.Database.client) {
        const { error } = await C4App.utils.Database.client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password'
        });
        
        if (error) {
          throw error;
        }
        
        return { 
          success: true, 
          message: 'Email de recuperação enviado. Verifique sua caixa de entrada.' 
        };
      }
      
      // Para modo demo
      return { 
        success: true, 
        message: 'Em modo demo. Use qualquer email para fazer login.' 
      };
      
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ===== PERFIL DO USUÁRIO =====
  
  async updateProfile(userData) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Usuário não autenticado');
      }
      
      // Atualizar no Supabase
      if (C4App.utils.Database.client && !this.currentUser.is_demo) {
        const { data, error } = await C4App.utils.Database.client.auth.updateUser({
          data: userData
        });
        
        if (error) {
          throw error;
        }
        
        if (data.user) {
          this.currentUser = { ...this.currentUser, ...data.user.user_metadata, ...userData };
        }
      } else {
        // Atualizar dados demo
        this.currentUser = { ...this.currentUser, ...userData };
      }
      
      // Salvar no localStorage
      C4App.utils.Storage.setUser(this.currentUser);
      C4App.state.currentUser = this.currentUser;
      
      // Disparar evento de atualização
      window.dispatchEvent(new CustomEvent('c4:auth:profile-updated', {
        detail: { user: this.currentUser }
      }));
      
      return { success: true, user: this.currentUser };
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Alterar senha
  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Usuário não autenticado');
      }
      
      if (newPassword.length < 6) {
        throw new Error('Nova senha deve ter pelo menos 6 caracteres');
      }
      
      // Alterar no Supabase
      if (C4App.utils.Database.client && !this.currentUser.is_demo) {
        const { error } = await C4App.utils.Database.client.auth.updateUser({
          password: newPassword
        });
        
        if (error) {
          throw error;
        }
      }
      
      return { success: true, message: 'Senha alterada com sucesso' };
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ===== MÉTODOS AUXILIARES =====
  
  // Manipular sucesso da autenticação
  async handleAuthSuccess(user, session = null) {
    this.currentUser = user;
    this.isAuthenticated = true;
    C4App.state.currentUser = user;
    
    // Salvar no localStorage
    C4App.utils.Storage.setUser(user);
    
    // Carregar dados demo se for primeira vez
    if (user.is_demo && !C4App.utils.Storage.isDemoLoaded()) {
      C4App.utils.Storage.loadDemoData();
    }
    
    // Disparar evento de login
    window.dispatchEvent(new CustomEvent('c4:auth:login', {
      detail: { user, session }
    }));
    
    console.log('✅ Login realizado:', user.email);
  },
  
  // Extrair nome do email
  extractNameFromEmail(email) {
    if (!email) return 'Usuário';
    
    const name = email.split('@')[0];
    return C4App.utils.titleCase(name.replace(/[._-]/g, ' '));
  },
  
  // Verificar se usuário está autenticado
  isLoggedIn() {
    return this.isAuthenticated && this.currentUser !== null;
  },
  
  // Obter usuário atual
  getCurrentUser() {
    return this.currentUser;
  },
  
  // Verificar permissão
  hasPermission(permission) {
    if (!this.isAuthenticated) return false;
    
    // Para demo, todas as permissões são liberadas
    if (this.currentUser?.is_demo) return true;
    
    // Implementar lógica de permissões se necessário
    return true;
  },
  
  // Middleware de autenticação
  requireAuth(callback) {
    if (!this.isLoggedIn()) {
      // Redirecionar para login
      this.showLoginScreen();
      return false;
    }
    
    if (typeof callback === 'function') {
      callback(this.currentUser);
    }
    
    return true;
  },
  
  // Mostrar tela de login
  showLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loginScreen && mainApp) {
      loginScreen.style.display = 'block';
      mainApp.style.display = 'none';
    }
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('c4:auth:show-login'));
  },
  
  // Mostrar app principal
  showMainApp() {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const loadingScreen = document.getElementById('loading-screen');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('c4:auth:show-app'));
  },
  
  // ===== VALIDAÇÃO DE TOKEN =====
  
  async validateToken() {
    if (!this.isAuthenticated) return false;
    
    // Para usuários demo, sempre válido
    if (this.currentUser?.is_demo) return true;
    
    // Verificar token do Supabase
    if (C4App.utils.Database.client) {
      try {
        const { data: { user } } = await C4App.utils.Database.client.auth.getUser();
        return user !== null;
      } catch (error) {
        console.warn('Token inválido:', error);
        await this.logout();
        return false;
      }
    }
    
    return true;
  }
};

// Event listeners
window.addEventListener('c4:auth:login', (event) => {
  C4App.utils.Auth.showMainApp();
});

window.addEventListener('c4:auth:logout', (event) => {
  C4App.utils.Auth.showLoginScreen();
});

window.addEventListener('c4:auth:restored', (event) => {
  C4App.utils.Auth.showMainApp();
});

// Inicializar autenticação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  C4App.utils.Auth.init();
});

// Validar token periodicamente (a cada 5 minutos)
setInterval(() => {
  if (C4App.utils.Auth.isLoggedIn()) {
    C4App.utils.Auth.validateToken();
  }
}, 5 * 60 * 1000);

// Exportar para uso global
window.C4Auth = C4App.utils.Auth;

