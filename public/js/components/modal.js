/* modal.js - Componente de Modal */

C4App.components.Modal = {
  // Modais ativos
  activeModals: [],
  
  // Configurações padrão
  defaults: {
    closable: true,
    backdrop: true,
    keyboard: true,
    focus: true,
    size: 'medium'
  },
  
  // ===== INICIALIZAÇÃO =====
  
  init() {
    this.setupGlobalEvents();
    console.log('🪟 Modal component inicializado');
  },
  
  setupGlobalEvents() {
    // Fechar modal com Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModals.length > 0) {
        const topModal = this.activeModals[this.activeModals.length - 1];
        if (topModal.config.keyboard) {
          this.close(topModal.id);
        }
      }
    });
  },
  
  // ===== MÉTODOS PRINCIPAIS =====
  
  // Abrir modal
  open(content, options = {}) {
    const config = { ...this.defaults, ...options };
    const modal = this.createModal(content, config);
    
    this.showModal(modal);
    return modal.id;
  },
  
  // Fechar modal
  close(modalId = null) {
    // Se não especificado, fechar o modal do topo
    if (!modalId && this.activeModals.length > 0) {
      modalId = this.activeModals[this.activeModals.length - 1].id;
    }
    
    const modalIndex = this.activeModals.findIndex(m => m.id === modalId);
    if (modalIndex === -1) return false;
    
    const modal = this.activeModals[modalIndex];
    this.hideModal(modal);
    
    return true;
  },
  
  // Fechar todos os modais
  closeAll() {
    const modalsToClose = [...this.activeModals];
    modalsToClose.forEach(modal => {
      this.close(modal.id);
    });
  },
  
  // ===== CRIAÇÃO DE MODAL =====
  
  createModal(content, config) {
    const modal = {
      id: C4App.utils.generateId('modal'),
      content,
      config,
      element: null,
      overlay: null
    };
    
    modal.element = this.createModalElement(modal);
    return modal;
  },
  
  createModalElement(modal) {
    // Criar overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', `${modal.id}-title`);
    overlay.id = modal.id;
    
    // Criar conteúdo do modal
    const modalContent = document.createElement('div');
    modalContent.className = `modal-content modal-${modal.config.size}`;
    
    // Determinar tipo de conteúdo
    if (typeof modal.content === 'string') {
      modalContent.innerHTML = modal.content;
    } else if (modal.content instanceof HTMLElement) {
      modalContent.appendChild(modal.content);
    } else if (modal.content.title || modal.content.body) {
      modalContent.innerHTML = this.createStructuredContent(modal);
    }
    
    overlay.appendChild(modalContent);
    modal.overlay = overlay;
    
    // Configurar eventos
    this.setupModalEvents(modal);
    
    return overlay;
  },
  
  createStructuredContent(modal) {
    const { title, body, footer } = modal.content;
    
    let html = '';
    
    // Header
    if (title || modal.config.closable) {
      html += '<div class="modal-header">';
      if (title) {
        html += `<h3 class="modal-title" id="${modal.id}-title">${this.escapeHtml(title)}</h3>`;
      }
      if (modal.config.closable) {
        html += '<button class="modal-close" aria-label="Fechar modal">×</button>';
      }
      html += '</div>';
    }
    
    // Body
    if (body) {
      html += `<div class="modal-body">${body}</div>`;
    }
    
    // Footer
    if (footer) {
      html += `<div class="modal-footer">${footer}</div>`;
    }
    
    return html;
  },
  
  setupModalEvents(modal) {
    // Fechar ao clicar no backdrop
    if (modal.config.backdrop) {
      modal.overlay.addEventListener('click', (e) => {
        if (e.target === modal.overlay) {
          this.close(modal.id);
        }
      });
    }
    
    // Botão de fechar
    modal.overlay.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-close')) {
        this.close(modal.id);
      }
    });
    
    // Trap focus dentro do modal
    if (modal.config.focus) {
      modal.overlay.addEventListener('keydown', (e) => {
        this.trapFocus(e, modal.overlay);
      });
    }
  },
  
  // ===== EXIBIÇÃO =====
  
  showModal(modal) {
    // Adicionar ao DOM
    document.body.appendChild(modal.element);
    
    // Adicionar à lista de modais ativos
    this.activeModals.push(modal);
    
    // Configurar z-index
    const zIndex = 1040 + (this.activeModals.length - 1) * 10;
    modal.element.style.zIndex = zIndex;
    
    // Forçar reflow para animação
    modal.element.offsetHeight;
    
    // Mostrar com animação
    modal.element.classList.add('show');
    
    // Focar no modal
    if (modal.config.focus) {
      this.focusModal(modal);
    }
    
    // Bloquear scroll do body
    this.lockBodyScroll();
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('c4:modal:opened', {
      detail: { modal }
    }));
  },
  
  hideModal(modal) {
    // Remover animação
    modal.element.classList.remove('show');
    
    // Remover da lista de ativos
    const index = this.activeModals.findIndex(m => m.id === modal.id);
    if (index > -1) {
      this.activeModals.splice(index, 1);
    }
    
    // Remover do DOM após animação
    setTimeout(() => {
      if (modal.element && modal.element.parentNode) {
        modal.element.parentNode.removeChild(modal.element);
      }
    }, 300);
    
    // Restaurar scroll se não há mais modais
    if (this.activeModals.length === 0) {
      this.unlockBodyScroll();
    }
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('c4:modal:closed', {
      detail: { modal }
    }));
  },
  
  // ===== GERENCIAMENTO DE FOCO =====
  
  focusModal(modal) {
    // Focar no primeiro elemento focável
    const focusableElements = this.getFocusableElements(modal.element);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      modal.element.focus();
    }
  },
  
  trapFocus(e, container) {
    if (e.key !== 'Tab') return;
    
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  },
  
  getFocusableElements(container) {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector))
      .filter(el => !el.disabled && el.offsetParent !== null);
  },
  
  // ===== SCROLL LOCK =====
  
  lockBodyScroll() {
    if (!document.body.classList.contains('modal-open')) {
      document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
      document.body.classList.add('modal-open');
    }
  },
  
  unlockBodyScroll() {
    document.body.classList.remove('modal-open');
    document.body.style.paddingRight = '';
  },
  
  getScrollbarWidth() {
    const scrollDiv = document.createElement('div');
    scrollDiv.style.cssText = 'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
    document.body.appendChild(scrollDiv);
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
  },
  
  // ===== UTILITÁRIOS =====
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  // ===== MODAIS PRÉ-DEFINIDOS =====
  
  // Modal de confirmação
  confirm(message, title = 'Confirmação', options = {}) {
    return new Promise((resolve) => {
      const footer = `
        <button class="btn btn-outline" data-action="cancel">Cancelar</button>
        <button class="btn btn-primary" data-action="confirm">Confirmar</button>
      `;
      
      const modalId = this.open({
        title,
        body: `<p>${this.escapeHtml(message)}</p>`,
        footer
      }, { closable: false, ...options });
      
      // Event listener para botões
      const modal = this.activeModals.find(m => m.id === modalId);
      if (modal) {
        modal.element.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          if (action === 'confirm') {
            resolve(true);
            this.close(modalId);
          } else if (action === 'cancel') {
            resolve(false);
            this.close(modalId);
          }
        });
      }
    });
  },
  
  // Modal de alerta
  alert(message, title = 'Aviso', options = {}) {
    return new Promise((resolve) => {
      const footer = '<button class="btn btn-primary" data-action="ok">OK</button>';
      
      const modalId = this.open({
        title,
        body: `<p>${this.escapeHtml(message)}</p>`,
        footer
      }, { closable: false, ...options });
      
      // Event listener para botão OK
      const modal = this.activeModals.find(m => m.id === modalId);
      if (modal) {
        modal.element.addEventListener('click', (e) => {
          if (e.target.dataset.action === 'ok') {
            resolve(true);
            this.close(modalId);
          }
        });
      }
    });
  },
  
  // Modal de prompt
  prompt(message, defaultValue = '', title = 'Digite', options = {}) {
    return new Promise((resolve) => {
      const inputId = C4App.utils.generateId('prompt-input');
      const body = `
        <p>${this.escapeHtml(message)}</p>
        <input type="text" id="${inputId}" class="form-control" value="${this.escapeHtml(defaultValue)}" style="margin-top: 1rem;">
      `;
      
      const footer = `
        <button class="btn btn-outline" data-action="cancel">Cancelar</button>
        <button class="btn btn-primary" data-action="ok">OK</button>
      `;
      
      const modalId = this.open({
        title,
        body,
        footer
      }, { closable: false, ...options });
      
      // Focar no input
      setTimeout(() => {
        const input = document.getElementById(inputId);
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
      
      // Event listener para botões
      const modal = this.activeModals.find(m => m.id === modalId);
      if (modal) {
        modal.element.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          if (action === 'ok') {
            const input = document.getElementById(inputId);
            resolve(input ? input.value : '');
            this.close(modalId);
          } else if (action === 'cancel') {
            resolve(null);
            this.close(modalId);
          }
        });
        
        // Enter para confirmar
        modal.element.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && e.target.id === inputId) {
            const input = document.getElementById(inputId);
            resolve(input ? input.value : '');
            this.close(modalId);
          }
        });
      }
    });
  },
  
  // Modal de loading
  loading(message = 'Carregando...', options = {}) {
    const body = `
      <div style="text-align: center; padding: 2rem;">
        <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;
    
    return this.open({
      body
    }, { 
      closable: false, 
      backdrop: false, 
      keyboard: false,
      size: 'small',
      ...options 
    });
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  C4App.components.Modal.init();
});

// Atalhos globais
window.modal = {
  open: (content, opts) => C4App.components.Modal.open(content, opts),
  close: (id) => C4App.components.Modal.close(id),
  confirm: (msg, title, opts) => C4App.components.Modal.confirm(msg, title, opts),
  alert: (msg, title, opts) => C4App.components.Modal.alert(msg, title, opts),
  prompt: (msg, def, title, opts) => C4App.components.Modal.prompt(msg, def, title, opts),
  loading: (msg, opts) => C4App.components.Modal.loading(msg, opts)
};

// Exportar para uso global
window.C4Modal = C4App.components.Modal;

