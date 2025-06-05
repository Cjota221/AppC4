/* utils.js - Funções Utilitárias do C4 App */

C4App.utils = {
  // ===== FORMATAÇÃO =====
  
  // Formatar moeda brasileira
  formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
    
    return new Intl.NumberFormat(C4App.config.formatting.locale, 
      C4App.config.formatting.currency
    ).format(Number(value));
  },
  
  // Formatar número
  formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return '0';
    
    return new Intl.NumberFormat(C4App.config.formatting.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(Number(value));
  },
  
  // Formatar porcentagem
  formatPercent(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    
    return new Intl.NumberFormat(C4App.config.formatting.locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(Number(value) / 100);
  },
  
  // Formatar data
  formatDate(date, includeTime = false) {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    const options = includeTime ? 
      C4App.config.formatting.datetime : 
      C4App.config.formatting.date;
    
    return new Intl.DateTimeFormat(C4App.config.formatting.locale, options)
      .format(dateObj);
  },
  
  // Formatar data relativa (ex: "há 2 dias")
  formatRelativeDate(date) {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now - dateObj;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
    
    return `há ${Math.floor(diffDays / 365)} anos`;
  },
  
  // ===== VALIDAÇÃO =====
  
  // Validar email
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return C4App.config.validation.patterns.email.test(email.trim());
  },
  
  // Validar telefone brasileiro
  isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    return C4App.config.validation.patterns.phone.test(phone.trim());
  },
  
  // Validar CEP
  isValidCEP(cep) {
    if (!cep || typeof cep !== 'string') return false;
    return C4App.config.validation.patterns.cep.test(cep.trim());
  },
  
  // Validar valor monetário
  isValidCurrency(value) {
    if (!value || typeof value !== 'string') return false;
    return C4App.config.validation.patterns.currency.test(value.trim());
  },
  
  // Validar campo obrigatório
  isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    return Boolean(value);
  },
  
  // Validar comprimento de string
  isValidLength(value, min = 0, max = Infinity) {
    if (!value || typeof value !== 'string') return false;
    const length = value.trim().length;
    return length >= min && length <= max;
  },
  
  // Validar range numérico
  isValidRange(value, min = -Infinity, max = Infinity) {
    const num = Number(value);
    if (isNaN(num)) return false;
    return num >= min && num <= max;
  },
  
  // ===== CONVERSÃO =====
  
  // Converter string para número
  parseNumber(value) {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'string') return 0;
    
    // Remover formatação brasileira
    const cleaned = value.replace(/[^\d,-]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  },
  
  // Converter para slug (URL amigável)
  toSlug(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-'); // Remove hífens duplicados
  },
  
  // Capitalizar primeira letra
  capitalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },
  
  // Capitalizar cada palavra
  titleCase(text) {
    if (!text || typeof text !== 'string') return '';
    return text.split(' ')
      .map(word => this.capitalize(word))
      .join(' ');
  },
  
  // ===== UTILITÁRIOS DE ARRAY =====
  
  // Agrupar array por propriedade
  groupBy(array, key) {
    if (!Array.isArray(array)) return {};
    
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },
  
  // Ordenar array por propriedade
  sortBy(array, key, direction = 'asc') {
    if (!Array.isArray(array)) return [];
    
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },
  
  // Filtrar array por múltiplos critérios
  filterBy(array, filters) {
    if (!Array.isArray(array) || !filters) return array;
    
    return array.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') return true;
        
        const itemValue = item[key];
        if (typeof value === 'string') {
          return String(itemValue).toLowerCase().includes(value.toLowerCase());
        }
        
        return itemValue === value;
      });
    });
  },
  
  // Remover duplicatas
  unique(array, key = null) {
    if (!Array.isArray(array)) return [];
    
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    
    return [...new Set(array)];
  },
  
  // ===== UTILITÁRIOS DE OBJETO =====
  
  // Deep clone de objeto
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = this.deepClone(obj[key]);
    });
    
    return cloned;
  },
  
  // Merge profundo de objetos
  deepMerge(target, source) {
    const result = this.deepClone(target);
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  },
  
  // Obter valor aninhado seguro
  get(obj, path, defaultValue = null) {
    if (!obj || typeof path !== 'string') return defaultValue;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined || !(key in result)) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result;
  },
  
  // Definir valor aninhado
  set(obj, path, value) {
    if (!obj || typeof path !== 'string') return obj;
    
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return obj;
  },
  
  // ===== UTILITÁRIOS DE PERFORMANCE =====
  
  // Debounce
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Throttle
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // ===== UTILITÁRIOS DE ID =====
  
  // Gerar ID único
  generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
  },
  
  // Gerar UUID v4 simples
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  
  // ===== UTILITÁRIOS DE URL =====
  
  // Construir query string
  buildQueryString(params) {
    if (!params || typeof params !== 'object') return '';
    
    const query = Object.entries(params)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    return query ? `?${query}` : '';
  },
  
  // Parsear query string
  parseQueryString(queryString) {
    if (!queryString || typeof queryString !== 'string') return {};
    
    const params = {};
    const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;
    
    query.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    });
    
    return params;
  },
  
  // ===== UTILITÁRIOS DE STORAGE =====
  
  // Verificar se localStorage está disponível
  isLocalStorageAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  // ===== UTILITÁRIOS DE DEVICE =====
  
  // Detectar se é mobile
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  // Detectar se é iOS
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },
  
  // Detectar se é Android
  isAndroid() {
    return /Android/.test(navigator.userAgent);
  },
  
  // Detectar se suporta touch
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  // ===== UTILITÁRIOS DE ERRO =====
  
  // Handler de erro global
  handleError(error, context = 'Unknown') {
    console.error(`[${context}] Erro:`, error);
    
    // Log para analytics (se configurado)
    if (C4App.config.app.debug) {
      console.trace();
    }
    
    // Mostrar toast de erro para o usuário
    if (C4App.components && C4App.components.toast) {
      C4App.components.toast.error('Ops! Algo deu errado. Tente novamente.');
    }
    
    // Disparar evento de erro
    window.dispatchEvent(new CustomEvent('c4:error', {
      detail: { error, context }
    }));
  },
  
  // ===== UTILITÁRIOS DE LOADING =====
  
  // Mostrar loading global
  showLoading(message = 'Carregando...') {
    C4App.state.isLoading = true;
    
    // Atualizar UI se necessário
    const loadingElements = document.querySelectorAll('.loading-text');
    loadingElements.forEach(el => {
      el.textContent = message;
    });
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('c4:loading:start', {
      detail: { message }
    }));
  },
  
  // Esconder loading global
  hideLoading() {
    C4App.state.isLoading = false;
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('c4:loading:end'));
  }
};

// Aliases para funções mais usadas
C4App.utils.$ = (selector) => document.querySelector(selector);
C4App.utils.$$ = (selector) => document.querySelectorAll(selector);
C4App.utils.log = (...args) => {
  if (C4App.config.app.debug) {
    console.log('[C4App]', ...args);
  }
};

// Exportar utilitários para uso global
window.C4Utils = C4App.utils;

