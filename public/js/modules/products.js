/* products.js - Módulo de Produtos */

C4App.modules.Products = {
  // Estado do módulo
  data: {
    products: [],
    filteredProducts: [],
    categories: [],
    currentFilter: 'all',
    searchTerm: '',
    sortBy: 'name',
    sortOrder: 'asc'
  },
  
  // Elementos DOM
  elements: {},
  
  // ===== INICIALIZAÇÃO =====
  
  async init() {
    this.cacheElements();
    this.setupEventListeners();
    await this.loadData();
    this.render();
    console.log('📦 Products module inicializado');
  },
  
  cacheElements() {
    this.elements = {
      // Controles
      searchInput: document.getElementById('products-search'),
      categoryFilter: document.getElementById('category-filter'),
      sortSelect: document.getElementById('products-sort'),
      addProductBtn: document.getElementById('add-product-btn'),
      
      // Lista de produtos
      productsList: document.getElementById('products-list'),
      productsCount: document.getElementById('products-count'),
      
      // Modais
      productModal: document.getElementById('product-modal'),
      productForm: document.getElementById('product-form'),
      
      // Estatísticas
      totalProducts: document.getElementById('total-products'),
      lowStockCount: document.getElementById('low-stock-count'),
      totalValue: document.getElementById('total-inventory-value')
    };
  },
  
  setupEventListeners() {
    // Busca
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => {
        this.data.searchTerm = e.target.value;
        this.applyFilters();
      });
    }
    
    // Filtro por categoria
    if (this.elements.categoryFilter) {
      this.elements.categoryFilter.addEventListener('change', (e) => {
        this.data.currentFilter = e.target.value;
        this.applyFilters();
      });
    }
    
    // Ordenação
    if (this.elements.sortSelect) {
      this.elements.sortSelect.addEventListener('change', (e) => {
        const [sortBy, sortOrder] = e.target.value.split('-');
        this.data.sortBy = sortBy;
        this.data.sortOrder = sortOrder;
        this.applyFilters();
      });
    }
    
    // Botão adicionar produto
    if (this.elements.addProductBtn) {
      this.elements.addProductBtn.addEventListener('click', () => {
        this.openNewProductModal();
      });
    }
    
    // Formulário de produto
    if (this.elements.productForm) {
      this.elements.productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleProductSubmit(e.target);
      });
    }
    
    // Eventos de dados
    window.addEventListener('c4:data:changed', (event) => {
      const { dataType } = event.detail;
      if (dataType === 'products') {
        this.refresh();
      }
    });
  },
  
  // ===== CARREGAMENTO DE DADOS =====
  
  async loadData() {
    try {
      this.data.products = await C4App.utils.Database.getProducts();
      this.data.categories = this.extractCategories(this.data.products);
      this.applyFilters();
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      C4App.components.Toast.error('Erro ao carregar produtos');
    }
  },
  
  extractCategories(products) {
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return categories.sort();
  },
  
  // ===== FILTROS E ORDENAÇÃO =====
  
  applyFilters() {
    let filtered = [...this.data.products];
    
    // Filtro por categoria
    if (this.data.currentFilter !== 'all') {
      filtered = filtered.filter(product => product.category === this.data.currentFilter);
    }
    
    // Filtro por busca
    if (this.data.searchTerm) {
      const term = this.data.searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term))
      );
    }
    
    // Ordenação
    filtered.sort((a, b) => {
      let aValue = a[this.data.sortBy];
      let bValue = b[this.data.sortBy];
      
      // Tratar valores numéricos
      if (this.data.sortBy === 'price' || this.data.sortBy === 'cost' || this.data.sortBy === 'stock') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      // Tratar strings
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      if (aValue < bValue) comparison = -1;
      
      return this.data.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    this.data.filteredProducts = filtered;
    this.renderProducts();
    this.updateStats();
  },
  
  // ===== RENDERIZAÇÃO =====
  
  render() {
    this.renderCategoryFilter();
    this.renderProducts();
    this.updateStats();
  },
  
  renderCategoryFilter() {
    if (!this.elements.categoryFilter) return;
    
    const options = [
      '<option value="all">Todas as categorias</option>',
      ...this.data.categories.map(category => 
        `<option value="${category}">${C4App.utils.titleCase(category)}</option>`
      )
    ];
    
    this.elements.categoryFilter.innerHTML = options.join('');
    this.elements.categoryFilter.value = this.data.currentFilter;
  },
  
  renderProducts() {
    if (!this.elements.productsList) return;
    
    const { filteredProducts } = this.data;
    
    // Atualizar contador
    if (this.elements.productsCount) {
      this.elements.productsCount.textContent = `${filteredProducts.length} produto(s)`;
    }
    
    if (filteredProducts.length === 0) {
      this.elements.productsList.innerHTML = this.getEmptyState();
      return;
    }
    
    const html = filteredProducts.map(product => this.renderProductCard(product)).join('');
    this.elements.productsList.innerHTML = html;
    
    // Configurar eventos dos cards
    this.setupProductCardEvents();
  },
  
  renderProductCard(product) {
    const margin = product.price && product.cost ? 
      ((product.price - product.cost) / product.price * 100).toFixed(1) : 0;
    
    const stockStatus = this.getStockStatus(product);
    
    return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-image">
          ${product.image ? 
            `<img src="${product.image}" alt="${C4App.utils.escapeHtml(product.name)}" loading="lazy">` :
            '<div class="product-placeholder">📦</div>'
          }
        </div>
        
        <div class="product-info">
          <h3 class="product-name">${C4App.utils.escapeHtml(product.name)}</h3>
          
          <div class="product-category">
            ${product.category ? C4App.utils.titleCase(product.category) : 'Sem categoria'}
          </div>
          
          <div class="product-prices">
            <div class="product-cost">
              Custo: ${C4App.utils.formatCurrency(product.cost || 0)}
            </div>
            <div class="product-price">
              Venda: ${C4App.utils.formatCurrency(product.price || 0)}
            </div>
            <div class="product-margin">
              Margem: ${margin}%
            </div>
          </div>
          
          <div class="product-stock ${stockStatus.class}">
            <span class="stock-icon">${stockStatus.icon}</span>
            Estoque: ${product.stock || 0}
            ${product.minStock ? `(mín: ${product.minStock})` : ''}
          </div>
        </div>
        
        <div class="product-actions">
          <button class="btn btn-sm btn-outline edit-product-btn" data-product-id="${product.id}">
            ✏️ Editar
          </button>
          <button class="btn btn-sm btn-outline duplicate-product-btn" data-product-id="${product.id}">
            📋 Duplicar
          </button>
          <button class="btn btn-sm btn-danger delete-product-btn" data-product-id="${product.id}">
            🗑️ Excluir
          </button>
        </div>
      </div>
    `;
  },
  
  getStockStatus(product) {
    const stock = product.stock || 0;
    const minStock = product.minStock || 5;
    
    if (stock === 0) {
      return { class: 'stock-empty', icon: '❌' };
    } else if (stock <= minStock) {
      return { class: 'stock-low', icon: '⚠️' };
    } else {
      return { class: 'stock-ok', icon: '✅' };
    }
  },
  
  getEmptyState() {
    const hasSearch = this.data.searchTerm || this.data.currentFilter !== 'all';
    
    if (hasSearch) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Nenhum produto encontrado</h3>
          <p>Tente ajustar os filtros de busca</p>
          <button class="btn btn-outline" onclick="C4App.modules.Products.clearFilters()">
            Limpar filtros
          </button>
        </div>
      `;
    }
    
    return `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>Nenhum produto cadastrado</h3>
        <p>Comece adicionando seu primeiro produto</p>
        <button class="btn btn-primary" onclick="C4App.modules.Products.openNewProductModal()">
          ➕ Adicionar produto
        </button>
      </div>
    `;
  },
  
  setupProductCardEvents() {
    // Editar produto
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.productId;
        this.openEditProductModal(productId);
      });
    });
    
    // Duplicar produto
    document.querySelectorAll('.duplicate-product-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.productId;
        this.duplicateProduct(productId);
      });
    });
    
    // Excluir produto
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.productId;
        this.deleteProduct(productId);
      });
    });
  },
  
  updateStats() {
    const { products } = this.data;
    
    // Total de produtos
    if (this.elements.totalProducts) {
      this.elements.totalProducts.textContent = products.length.toString();
    }
    
    // Produtos com estoque baixo
    const lowStockProducts = products.filter(p => 
      (p.stock || 0) <= (p.minStock || 5)
    );
    
    if (this.elements.lowStockCount) {
      this.elements.lowStockCount.textContent = lowStockProducts.length.toString();
    }
    
    // Valor total do estoque
    const totalValue = products.reduce((sum, product) => {
      return sum + ((product.cost || 0) * (product.stock || 0));
    }, 0);
    
    if (this.elements.totalValue) {
      this.elements.totalValue.textContent = C4App.utils.formatCurrency(totalValue);
    }
  },
  
  // ===== MODAIS =====
  
  openNewProductModal() {
    this.openProductModal();
  },
  
  openEditProductModal(productId) {
    const product = this.data.products.find(p => p.id === productId);
    if (product) {
      this.openProductModal(product);
    }
  },
  
  openProductModal(product = null) {
    const isEdit = product !== null;
    const title = isEdit ? 'Editar Produto' : 'Novo Produto';
    
    const formHtml = `
      <form id="product-form" data-validate>
        <input type="hidden" name="id" value="${product?.id || ''}">
        
        <div class="form-group">
          <label for="product-name">Nome do produto *</label>
          <input 
            type="text" 
            id="product-name" 
            name="name" 
            class="form-control" 
            value="${product?.name || ''}"
            required
            data-rules="required|minLength:2"
          >
        </div>
        
        <div class="form-group">
          <label for="product-category">Categoria</label>
          <select id="product-category" name="category" class="form-control">
            <option value="">Selecione uma categoria</option>
            ${this.data.categories.map(cat => 
              `<option value="${cat}" ${product?.category === cat ? 'selected' : ''}>
                ${C4App.utils.titleCase(cat)}
              </option>`
            ).join('')}
            <option value="__new__">+ Nova categoria</option>
          </select>
        </div>
        
        <div class="form-group" id="new-category-group" style="display: none;">
          <label for="new-category">Nova categoria</label>
          <input type="text" id="new-category" class="form-control">
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="product-cost">Custo *</label>
            <input 
              type="text" 
              id="product-cost" 
              name="cost" 
              class="form-control" 
              value="${product?.cost || ''}"
              required
              data-mask="currency"
              data-rules="required|currency"
            >
          </div>
          
          <div class="form-group">
            <label for="product-price">Preço de venda *</label>
            <input 
              type="text" 
              id="product-price" 
              name="price" 
              class="form-control" 
              value="${product?.price || ''}"
              required
              data-mask="currency"
              data-rules="required|currency"
            >
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="product-stock">Estoque atual</label>
            <input 
              type="number" 
              id="product-stock" 
              name="stock" 
              class="form-control" 
              value="${product?.stock || 0}"
              min="0"
            >
          </div>
          
          <div class="form-group">
            <label for="product-min-stock">Estoque mínimo</label>
            <input 
              type="number" 
              id="product-min-stock" 
              name="minStock" 
              class="form-control" 
              value="${product?.minStock || 5}"
              min="0"
            >
          </div>
        </div>
        
        <div class="form-group">
          <label for="product-description">Descrição</label>
          <textarea 
            id="product-description" 
            name="description" 
            class="form-control" 
            rows="3"
            placeholder="Descrição opcional do produto"
          >${product?.description || ''}</textarea>
        </div>
        
        <div class="margin-preview" id="margin-preview">
          <strong>Margem de lucro: <span id="margin-value">0%</span></strong>
        </div>
      </form>
    `;
    
    const footer = `
      <button type="button" class="btn btn-outline" data-action="cancel">Cancelar</button>
      <button type="submit" form="product-form" class="btn btn-primary">
        ${isEdit ? 'Atualizar' : 'Cadastrar'} produto
      </button>
    `;
    
    const modalId = C4App.components.Modal.open({
      title,
      body: formHtml,
      footer
    }, { size: 'large' });
    
    // Configurar eventos do modal
    setTimeout(() => {
      this.setupProductModalEvents(modalId);
    }, 100);
  },
  
  setupProductModalEvents(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Categoria nova
    const categorySelect = modal.querySelector('#product-category');
    const newCategoryGroup = modal.querySelector('#new-category-group');
    
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        if (e.target.value === '__new__') {
          newCategoryGroup.style.display = 'block';
        } else {
          newCategoryGroup.style.display = 'none';
        }
      });
    }
    
    // Cálculo de margem em tempo real
    const costInput = modal.querySelector('#product-cost');
    const priceInput = modal.querySelector('#product-price');
    const marginValue = modal.querySelector('#margin-value');
    
    const updateMargin = () => {
      const cost = C4App.utils.parseCurrency(costInput.value);
      const price = C4App.utils.parseCurrency(priceInput.value);
      
      if (cost > 0 && price > 0) {
        const margin = ((price - cost) / price * 100).toFixed(1);
        marginValue.textContent = `${margin}%`;
        marginValue.className = margin > 0 ? 'positive' : 'negative';
      } else {
        marginValue.textContent = '0%';
        marginValue.className = '';
      }
    };
    
    if (costInput && priceInput) {
      costInput.addEventListener('input', updateMargin);
      priceInput.addEventListener('input', updateMargin);
      updateMargin(); // Calcular inicial
    }
    
    // Submit do formulário
    const form = modal.querySelector('#product-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleProductSubmit(form, modalId);
      });
    }
    
    // Botão cancelar
    modal.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'cancel') {
        C4App.components.Modal.close(modalId);
      }
    });
  },
  
  // ===== AÇÕES =====
  
  async handleProductSubmit(form, modalId) {
    try {
      // Validar formulário
      if (!C4App.components.FormValidator.validateForm(form.id)) {
        return;
      }
      
      const formData = new FormData(form);
      const productData = {};
      
      // Processar dados do formulário
      for (const [key, value] of formData.entries()) {
        if (key === 'cost' || key === 'price') {
          productData[key] = C4App.utils.parseCurrency(value);
        } else if (key === 'stock' || key === 'minStock') {
          productData[key] = parseInt(value) || 0;
        } else {
          productData[key] = value.trim();
        }
      }
      
      // Tratar categoria nova
      const categorySelect = form.querySelector('#product-category');
      const newCategoryInput = form.querySelector('#new-category');
      
      if (categorySelect.value === '__new__' && newCategoryInput.value.trim()) {
        productData.category = newCategoryInput.value.trim().toLowerCase();
      }
      
      // Salvar produto
      const isEdit = productData.id;
      let result;
      
      if (isEdit) {
        result = await C4App.utils.Database.updateProduct(productData.id, productData);
      } else {
        delete productData.id;
        result = await C4App.utils.Database.createProduct(productData);
      }
      
      if (result) {
        C4App.components.Toast.success(
          isEdit ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!'
        );
        
        C4App.components.Modal.close(modalId);
        await this.refresh();
      } else {
        C4App.components.Toast.error('Erro ao salvar produto');
      }
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      C4App.components.Toast.error('Erro ao salvar produto');
    }
  },
  
  async duplicateProduct(productId) {
    try {
      const product = this.data.products.find(p => p.id === productId);
      if (!product) return;
      
      const duplicatedProduct = {
        ...product,
        name: `${product.name} (Cópia)`,
        stock: 0
      };
      
      delete duplicatedProduct.id;
      delete duplicatedProduct.created_at;
      delete duplicatedProduct.updated_at;
      
      const result = await C4App.utils.Database.createProduct(duplicatedProduct);
      
      if (result) {
        C4App.components.Toast.success('Produto duplicado com sucesso!');
        await this.refresh();
      }
      
    } catch (error) {
      console.error('Erro ao duplicar produto:', error);
      C4App.components.Toast.error('Erro ao duplicar produto');
    }
  },
  
  async deleteProduct(productId) {
    try {
      const product = this.data.products.find(p => p.id === productId);
      if (!product) return;
      
      const confirmed = await C4App.components.Modal.confirm(
        `Tem certeza que deseja excluir o produto "${product.name}"?`,
        'Confirmar exclusão'
      );
      
      if (!confirmed) return;
      
      const result = await C4App.utils.Database.deleteProduct(productId);
      
      if (result) {
        C4App.components.Toast.success('Produto excluído com sucesso!');
        await this.refresh();
      }
      
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      C4App.components.Toast.error('Erro ao excluir produto');
    }
  },
  
  clearFilters() {
    this.data.searchTerm = '';
    this.data.currentFilter = 'all';
    this.data.sortBy = 'name';
    this.data.sortOrder = 'asc';
    
    if (this.elements.searchInput) this.elements.searchInput.value = '';
    if (this.elements.categoryFilter) this.elements.categoryFilter.value = 'all';
    if (this.elements.sortSelect) this.elements.sortSelect.value = 'name-asc';
    
    this.applyFilters();
  },
  
  // ===== REFRESH =====
  
  async refresh() {
    try {
      await this.loadData();
      this.render();
    } catch (error) {
      console.error('Erro ao atualizar produtos:', error);
    }
  }
};

// Auto-inicializar quando página de produtos for ativada
window.addEventListener('c4:navigation:changed', (event) => {
  if (event.detail.page === 'products') {
    C4App.modules.Products.init();
  }
});

// Exportar para uso global
window.C4Products = C4App.modules.Products;

