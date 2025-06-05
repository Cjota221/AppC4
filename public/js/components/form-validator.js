/* form-validator.js - Componente de Validação de Formulários */

C4App.components.FormValidator = {
  // Formulários registrados
  forms: new Map(),
  
  // Regras de validação padrão
  rules: {
    required: {
      validate: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
      message: 'Este campo é obrigatório'
    },
    
    email: {
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Digite um email válido'
    },
    
    phone: {
      validate: (value) => /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value),
      message: 'Digite um telefone válido (ex: (11) 99999-9999)'
    },
    
    cpf: {
      validate: (value) => C4App.utils.isValidCPF(value),
      message: 'Digite um CPF válido'
    },
    
    cnpj: {
      validate: (value) => C4App.utils.isValidCNPJ(value),
      message: 'Digite um CNPJ válido'
    },
    
    cep: {
      validate: (value) => /^\d{5}-?\d{3}$/.test(value),
      message: 'Digite um CEP válido (ex: 12345-678)'
    },
    
    number: {
      validate: (value) => !isNaN(parseFloat(value)) && isFinite(value),
      message: 'Digite um número válido'
    },
    
    currency: {
      validate: (value) => /^\d+([.,]\d{2})?$/.test(value.replace(/[R$\s]/g, '')),
      message: 'Digite um valor monetário válido'
    },
    
    minLength: {
      validate: (value, param) => value.length >= parseInt(param),
      message: (param) => `Mínimo de ${param} caracteres`
    },
    
    maxLength: {
      validate: (value, param) => value.length <= parseInt(param),
      message: (param) => `Máximo de ${param} caracteres`
    },
    
    min: {
      validate: (value, param) => parseFloat(value) >= parseFloat(param),
      message: (param) => `Valor mínimo: ${param}`
    },
    
    max: {
      validate: (value, param) => parseFloat(value) <= parseFloat(param),
      message: (param) => `Valor máximo: ${param}`
    },
    
    pattern: {
      validate: (value, param) => new RegExp(param).test(value),
      message: 'Formato inválido'
    },
    
    match: {
      validate: (value, param, form) => {
        const matchField = form.querySelector(`[name="${param}"]`);
        return matchField ? value === matchField.value : false;
      },
      message: (param) => `Deve ser igual ao campo ${param}`
    }
  },
  
  // ===== INICIALIZAÇÃO =====
  
  init() {
    this.setupGlobalEvents();
    this.autoRegisterForms();
    console.log('✅ FormValidator component inicializado');
  },
  
  setupGlobalEvents() {
    // Auto-registrar formulários quando adicionados ao DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const forms = node.querySelectorAll ? node.querySelectorAll('form[data-validate]') : [];
            forms.forEach(form => this.register(form));
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  },
  
  autoRegisterForms() {
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => this.register(form));
  },
  
  // ===== REGISTRO DE FORMULÁRIOS =====
  
  register(form, options = {}) {
    if (!(form instanceof HTMLFormElement)) {
      console.error('FormValidator: elemento não é um formulário');
      return false;
    }
    
    const formId = form.id || C4App.utils.generateId('form');
    if (!form.id) form.id = formId;
    
    const config = {
      validateOnInput: true,
      validateOnBlur: true,
      showErrors: true,
      scrollToError: true,
      ...options
    };
    
    const formData = {
      element: form,
      config,
      fields: new Map(),
      isValid: false
    };
    
    // Registrar campos
    this.registerFields(formData);
    
    // Configurar eventos
    this.setupFormEvents(formData);
    
    // Salvar formulário
    this.forms.set(formId, formData);
    
    console.log(`📝 Formulário registrado: ${formId}`);
    return formId;
  },
  
  registerFields(formData) {
    const fields = formData.element.querySelectorAll('[data-rules], [required]');
    
    fields.forEach(field => {
      const fieldName = field.name || field.id;
      if (!fieldName) return;
      
      const rules = this.parseRules(field);
      const fieldData = {
        element: field,
        name: fieldName,
        rules,
        isValid: false,
        errors: []
      };
      
      formData.fields.set(fieldName, fieldData);
      this.setupFieldEvents(fieldData, formData);
    });
  },
  
  parseRules(field) {
    const rules = [];
    
    // Regra required
    if (field.hasAttribute('required')) {
      rules.push({ name: 'required' });
    }
    
    // Regras do atributo data-rules
    const rulesAttr = field.getAttribute('data-rules');
    if (rulesAttr) {
      const ruleStrings = rulesAttr.split('|');
      ruleStrings.forEach(ruleString => {
        const [name, param] = ruleString.split(':');
        rules.push({ name: name.trim(), param: param?.trim() });
      });
    }
    
    // Regras baseadas no tipo do input
    switch (field.type) {
      case 'email':
        if (!rules.some(r => r.name === 'email')) {
          rules.push({ name: 'email' });
        }
        break;
      case 'number':
        if (!rules.some(r => r.name === 'number')) {
          rules.push({ name: 'number' });
        }
        break;
    }
    
    return rules;
  },
  
  // ===== EVENTOS =====
  
  setupFormEvents(formData) {
    const form = formData.element;
    
    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(formData, e);
    });
    
    // Reset
    form.addEventListener('reset', () => {
      this.clearErrors(form.id);
    });
  },
  
  setupFieldEvents(fieldData, formData) {
    const field = fieldData.element;
    
    // Input
    if (formData.config.validateOnInput) {
      field.addEventListener('input', () => {
        this.validateField(fieldData, formData);
      });
    }
    
    // Blur
    if (formData.config.validateOnBlur) {
      field.addEventListener('blur', () => {
        this.validateField(fieldData, formData);
      });
    }
    
    // Máscaras automáticas
    this.setupMasks(field);
  },
  
  setupMasks(field) {
    const type = field.getAttribute('data-mask') || field.type;
    
    switch (type) {
      case 'phone':
        field.addEventListener('input', (e) => {
          e.target.value = C4App.utils.maskPhone(e.target.value);
        });
        break;
        
      case 'cpf':
        field.addEventListener('input', (e) => {
          e.target.value = C4App.utils.maskCPF(e.target.value);
        });
        break;
        
      case 'cnpj':
        field.addEventListener('input', (e) => {
          e.target.value = C4App.utils.maskCNPJ(e.target.value);
        });
        break;
        
      case 'cep':
        field.addEventListener('input', (e) => {
          e.target.value = C4App.utils.maskCEP(e.target.value);
        });
        break;
        
      case 'currency':
        field.addEventListener('input', (e) => {
          e.target.value = C4App.utils.maskCurrency(e.target.value);
        });
        break;
    }
  },
  
  // ===== VALIDAÇÃO =====
  
  validateField(fieldData, formData) {
    const field = fieldData.element;
    const value = field.value;
    const errors = [];
    
    // Executar regras de validação
    for (const rule of fieldData.rules) {
      const ruleConfig = this.rules[rule.name];
      if (!ruleConfig) continue;
      
      // Pular validação se campo vazio e não é obrigatório
      if (!value && rule.name !== 'required') continue;
      
      const isValid = ruleConfig.validate(value, rule.param, formData.element);
      
      if (!isValid) {
        const message = typeof ruleConfig.message === 'function' 
          ? ruleConfig.message(rule.param)
          : ruleConfig.message;
        errors.push(message);
      }
    }
    
    // Atualizar estado do campo
    fieldData.errors = errors;
    fieldData.isValid = errors.length === 0;
    
    // Mostrar/esconder erros
    if (formData.config.showErrors) {
      this.showFieldErrors(field, errors);
    }
    
    // Atualizar classes CSS
    this.updateFieldClasses(field, fieldData.isValid);
    
    // Atualizar estado do formulário
    this.updateFormState(formData);
    
    return fieldData.isValid;
  },
  
  validateForm(formId) {
    const formData = this.forms.get(formId);
    if (!formData) return false;
    
    let isValid = true;
    
    // Validar todos os campos
    for (const fieldData of formData.fields.values()) {
      const fieldValid = this.validateField(fieldData, formData);
      if (!fieldValid) isValid = false;
    }
    
    formData.isValid = isValid;
    return isValid;
  },
  
  // ===== EXIBIÇÃO DE ERROS =====
  
  showFieldErrors(field, errors) {
    this.clearFieldErrors(field);
    
    if (errors.length === 0) return;
    
    // Criar container de erro
    const errorContainer = document.createElement('div');
    errorContainer.className = 'field-errors';
    errorContainer.setAttribute('role', 'alert');
    
    errors.forEach(error => {
      const errorElement = document.createElement('div');
      errorElement.className = 'field-error';
      errorElement.textContent = error;
      errorContainer.appendChild(errorElement);
    });
    
    // Inserir após o campo
    const parent = field.parentNode;
    const nextSibling = field.nextSibling;
    
    if (nextSibling) {
      parent.insertBefore(errorContainer, nextSibling);
    } else {
      parent.appendChild(errorContainer);
    }
  },
  
  clearFieldErrors(field) {
    const parent = field.parentNode;
    const existingErrors = parent.querySelectorAll('.field-errors');
    existingErrors.forEach(error => error.remove());
  },
  
  updateFieldClasses(field, isValid) {
    field.classList.remove('valid', 'invalid');
    
    if (field.value) {
      field.classList.add(isValid ? 'valid' : 'invalid');
    }
  },
  
  // ===== ESTADO DO FORMULÁRIO =====
  
  updateFormState(formData) {
    const allValid = Array.from(formData.fields.values()).every(field => field.isValid);
    formData.isValid = allValid;
    
    // Atualizar botão de submit
    const submitBtn = formData.element.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = !allValid;
    }
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('c4:form:validation-changed', {
      detail: { 
        formId: formData.element.id, 
        isValid: allValid,
        errors: this.getFormErrors(formData.element.id)
      }
    }));
  },
  
  // ===== SUBMIT =====
  
  handleSubmit(formData, event) {
    const isValid = this.validateForm(formData.element.id);
    
    if (!isValid) {
      // Scroll para primeiro erro
      if (formData.config.scrollToError) {
        this.scrollToFirstError(formData);
      }
      
      // Disparar evento de erro
      window.dispatchEvent(new CustomEvent('c4:form:validation-failed', {
        detail: { 
          formId: formData.element.id,
          errors: this.getFormErrors(formData.element.id)
        }
      }));
      
      return false;
    }
    
    // Disparar evento de sucesso
    window.dispatchEvent(new CustomEvent('c4:form:validation-success', {
      detail: { 
        formId: formData.element.id,
        data: this.getFormData(formData.element.id)
      }
    }));
    
    return true;
  },
  
  scrollToFirstError(formData) {
    for (const fieldData of formData.fields.values()) {
      if (!fieldData.isValid) {
        fieldData.element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        fieldData.element.focus();
        break;
      }
    }
  },
  
  // ===== MÉTODOS PÚBLICOS =====
  
  isValid(formId) {
    const formData = this.forms.get(formId);
    return formData ? formData.isValid : false;
  },
  
  getFormData(formId) {
    const formData = this.forms.get(formId);
    if (!formData) return null;
    
    const data = {};
    const formDataObj = new FormData(formData.element);
    
    for (const [key, value] of formDataObj.entries()) {
      data[key] = value;
    }
    
    return data;
  },
  
  getFormErrors(formId) {
    const formData = this.forms.get(formId);
    if (!formData) return {};
    
    const errors = {};
    for (const [fieldName, fieldData] of formData.fields.entries()) {
      if (fieldData.errors.length > 0) {
        errors[fieldName] = fieldData.errors;
      }
    }
    
    return errors;
  },
  
  clearErrors(formId) {
    const formData = this.forms.get(formId);
    if (!formData) return;
    
    for (const fieldData of formData.fields.values()) {
      fieldData.errors = [];
      fieldData.isValid = false;
      this.clearFieldErrors(fieldData.element);
      this.updateFieldClasses(fieldData.element, true);
    }
    
    this.updateFormState(formData);
  },
  
  setFieldError(formId, fieldName, error) {
    const formData = this.forms.get(formId);
    if (!formData) return;
    
    const fieldData = formData.fields.get(fieldName);
    if (!fieldData) return;
    
    fieldData.errors = [error];
    fieldData.isValid = false;
    
    if (formData.config.showErrors) {
      this.showFieldErrors(fieldData.element, [error]);
    }
    
    this.updateFieldClasses(fieldData.element, false);
    this.updateFormState(formData);
  },
  
  // ===== REGRAS CUSTOMIZADAS =====
  
  addRule(name, validateFn, message) {
    this.rules[name] = {
      validate: validateFn,
      message: message
    };
  },
  
  removeRule(name) {
    delete this.rules[name];
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  C4App.components.FormValidator.init();
});

// Atalhos globais
window.validator = {
  register: (form, opts) => C4App.components.FormValidator.register(form, opts),
  validate: (formId) => C4App.components.FormValidator.validateForm(formId),
  isValid: (formId) => C4App.components.FormValidator.isValid(formId),
  getData: (formId) => C4App.components.FormValidator.getFormData(formId),
  getErrors: (formId) => C4App.components.FormValidator.getFormErrors(formId),
  clearErrors: (formId) => C4App.components.FormValidator.clearErrors(formId)
};

// Exportar para uso global
window.C4FormValidator = C4App.components.FormValidator;

