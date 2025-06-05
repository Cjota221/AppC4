/* toast.js - Componente de Notificações Toast */

C4App.components.Toast = {
  // Container de toasts
  container: null,
  
  // Queue de toasts
  queue: [],
  
  // Configurações padrão
  defaults: {
    duration: 3000,
    position: 'top-right',
    maxToasts: 5,
    showProgress: true
  },
  
  // ===== INICIALIZAÇÃO =====
  
  init() {
    this.createContainer();
    console.log('🍞 Toast component inicializado');
  },
  
  createContainer() {
    // Verificar se container já existe
    this.container = document.getElementById('toast-container');
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'assertive');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    }
  },
  
  // ===== MÉTODOS PRINCIPAIS =====
  
  // Mostrar toast genérico
  show(message, type = 'info', options = {}) {
    const config = { ...this.defaults, ...options };
    
    const toast = this.createToast(message, type, config);
    this.addToQueue(toast, config);
    
    return toast.id;
  },
  
  // Toasts específicos por tipo
  success(message, options = {}) {
    return this.show(message, 'success', options);
  },
  
  error(message, options = {}) {
    return this.show(message, 'error', { duration: 5000, ...options });
  },
  
  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  },
  
  info(message, options = {}) {
    return this.show(message, 'info', options);
  },
  
  // ===== CRIAÇÃO DE TOAST =====
  
  createToast(message, type, config) {
    const toast = {
      id: C4App.utils.generateId('toast'),
      message,
      type,
      config,
      element: null,
      timer: null,
      progressTimer: null
    };
    
    // Criar elemento DOM
    toast.element = this.createToastElement(toast);
    
    return toast;
  },
  
  createToastElement(toast) {
    const element = document.createElement('div');
    element.className = `toast toast-${toast.type}`;
    element.setAttribute('role', 'alert');
    element.setAttribute('aria-live', 'assertive');
    element.id = toast.id;
    
    // Conteúdo do toast
    element.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${this.getIcon(toast.type)}</div>
        <div class="toast-message">${this.escapeHtml(toast.message)}</div>
        <button class="toast-close" aria-label="Fechar notificação">×</button>
      </div>
      ${toast.config.showProgress ? '<div class="toast-progress"><div class="toast-progress-bar"></div></div>' : ''}
    `;
    
    // Event listeners
    this.setupToastEvents(element, toast);
    
    return element;
  },
  
  setupToastEvents(element, toast) {
    // Botão de fechar
    const closeBtn = element.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.remove(toast.id);
      });
    }
    
    // Pausar timer no hover
    element.addEventListener('mouseenter', () => {
      this.pauseTimer(toast);
    });
    
    element.addEventListener('mouseleave', () => {
      this.resumeTimer(toast);
    });
    
    // Fechar com Escape
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.remove(toast.id);
      }
    });
  },
  
  // ===== GERENCIAMENTO DE QUEUE =====
  
  addToQueue(toast, config) {
    // Limitar número de toasts
    if (this.queue.length >= config.maxToasts) {
      const oldestToast = this.queue.shift();
      this.removeElement(oldestToast);
    }
    
    // Adicionar à queue
    this.queue.push(toast);
    
    // Mostrar toast
    this.showToast(toast);
  },
  
  showToast(toast) {
    // Adicionar ao container
    this.container.appendChild(toast.element);
    
    // Forçar reflow para animação
    toast.element.offsetHeight;
    
    // Mostrar com animação
    toast.element.classList.add('show');
    
    // Configurar timer de auto-close
    if (toast.config.duration > 0) {
      this.startTimer(toast);
    }
    
    // Configurar barra de progresso
    if (toast.config.showProgress && toast.config.duration > 0) {
      this.startProgressBar(toast);
    }
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('c4:toast:shown', {
      detail: { toast }
    }));
  },
  
  // ===== TIMERS =====
  
  startTimer(toast) {
    toast.timer = setTimeout(() => {
      this.remove(toast.id);
    }, toast.config.duration);
  },
  
  pauseTimer(toast) {
    if (toast.timer) {
      clearTimeout(toast.timer);
      toast.timer = null;
    }
    
    if (toast.progressTimer) {
      clearInterval(toast.progressTimer);
      toast.progressTimer = null;
    }
  },
  
  resumeTimer(toast) {
    if (toast.config.duration > 0) {
      // Calcular tempo restante baseado na barra de progresso
      const progressBar = toast.element.querySelector('.toast-progress-bar');
      if (progressBar) {
        const currentWidth = parseFloat(progressBar.style.width) || 0;
        const remainingTime = toast.config.duration * (1 - currentWidth / 100);
        
        if (remainingTime > 0) {
          toast.timer = setTimeout(() => {
            this.remove(toast.id);
          }, remainingTime);
          
          this.resumeProgressBar(toast, remainingTime);
        }
      } else {
        this.startTimer(toast);
      }
    }
  },
  
  // ===== BARRA DE PROGRESSO =====
  
  startProgressBar(toast) {
    const progressBar = toast.element.querySelector('.toast-progress-bar');
    if (!progressBar) return;
    
    let progress = 0;
    const increment = 100 / (toast.config.duration / 50); // Atualizar a cada 50ms
    
    toast.progressTimer = setInterval(() => {
      progress += increment;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
      
      if (progress >= 100) {
        clearInterval(toast.progressTimer);
        toast.progressTimer = null;
      }
    }, 50);
  },
  
  resumeProgressBar(toast, remainingTime) {
    const progressBar = toast.element.querySelector('.toast-progress-bar');
    if (!progressBar) return;
    
    const currentWidth = parseFloat(progressBar.style.width) || 0;
    let progress = currentWidth;
    const increment = (100 - currentWidth) / (remainingTime / 50);
    
    toast.progressTimer = setInterval(() => {
      progress += increment;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
      
      if (progress >= 100) {
        clearInterval(toast.progressTimer);
        toast.progressTimer = null;
      }
    }, 50);
  },
  
  // ===== REMOÇÃO =====
  
  remove(toastId) {
    const toastIndex = this.queue.findIndex(t => t.id === toastId);
    if (toastIndex === -1) return;
    
    const toast = this.queue[toastIndex];
    
    // Limpar timers
    this.pauseTimer(toast);
    
    // Remover da queue
    this.queue.splice(toastIndex, 1);
    
    // Remover elemento
    this.removeElement(toast);
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('c4:toast:removed', {
      detail: { toast }
    }));
  },
  
  removeElement(toast) {
    if (!toast.element || !toast.element.parentNode) return;
    
    // Animação de saída
    toast.element.classList.remove('show');
    
    // Remover após animação
    setTimeout(() => {
      if (toast.element && toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
    }, 300);
  },
  
  // Remover todos os toasts
  clear() {
    const toastsToRemove = [...this.queue];
    toastsToRemove.forEach(toast => {
      this.remove(toast.id);
    });
  },
  
  // ===== UTILITÁRIOS =====
  
  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    return icons[type] || icons.info;
  },
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  // ===== CONFIGURAÇÃO =====
  
  setDefaults(newDefaults) {
    this.defaults = { ...this.defaults, ...newDefaults };
  },
  
  // ===== MÉTODOS AVANÇADOS =====
  
  // Toast com ação
  showWithAction(message, type, actionText, actionCallback, options = {}) {
    const toastId = this.show(message, type, { duration: 0, ...options });
    
    // Adicionar botão de ação
    setTimeout(() => {
      const toast = this.queue.find(t => t.id === toastId);
      if (toast && toast.element) {
        const actionBtn = document.createElement('button');
        actionBtn.className = 'toast-action';
        actionBtn.textContent = actionText;
        actionBtn.addEventListener('click', () => {
          actionCallback();
          this.remove(toastId);
        });
        
        const content = toast.element.querySelector('.toast-content');
        content.insertBefore(actionBtn, content.querySelector('.toast-close'));
      }
    }, 100);
    
    return toastId;
  },
  
  // Toast de loading
  showLoading(message, options = {}) {
    const loadingIcon = '<div class="loading-spinner"></div>';
    const toastId = this.show(message, 'info', { 
      duration: 0, 
      showProgress: false,
      ...options 
    });
    
    // Substituir ícone por spinner
    setTimeout(() => {
      const toast = this.queue.find(t => t.id === toastId);
      if (toast && toast.element) {
        const icon = toast.element.querySelector('.toast-icon');
        if (icon) {
          icon.innerHTML = loadingIcon;
        }
      }
    }, 100);
    
    return toastId;
  },
  
  // Atualizar toast existente
  update(toastId, newMessage, newType = null) {
    const toast = this.queue.find(t => t.id === toastId);
    if (!toast) return false;
    
    // Atualizar mensagem
    const messageEl = toast.element.querySelector('.toast-message');
    if (messageEl) {
      messageEl.textContent = newMessage;
    }
    
    // Atualizar tipo se fornecido
    if (newType && newType !== toast.type) {
      toast.element.className = toast.element.className.replace(`toast-${toast.type}`, `toast-${newType}`);
      
      const iconEl = toast.element.querySelector('.toast-icon');
      if (iconEl) {
        iconEl.textContent = this.getIcon(newType);
      }
      
      toast.type = newType;
    }
    
    return true;
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  C4App.components.Toast.init();
});

// Atalhos globais
window.toast = {
  success: (msg, opts) => C4App.components.Toast.success(msg, opts),
  error: (msg, opts) => C4App.components.Toast.error(msg, opts),
  warning: (msg, opts) => C4App.components.Toast.warning(msg, opts),
  info: (msg, opts) => C4App.components.Toast.info(msg, opts),
  show: (msg, type, opts) => C4App.components.Toast.show(msg, type, opts)
};

// Exportar para uso global
window.C4Toast = C4App.components.Toast;

