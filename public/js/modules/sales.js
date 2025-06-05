/* sales.js - Módulo de Vendas */

C4App.modules.Sales = {
  // Estado do módulo
  data: {
    sales: [],
    filteredSales: [],
    products: [],
    clients: [],
    currentFilter: 'all',
    dateRange: 'month',
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc'
  },
  
  // Elementos DOM
  elements: {},
  
  // ===== INICIALIZAÇÃO =====
  
  async init() {
    this.cacheElements();
    this.setupEventListeners();
    await this.loadData();
    this.render();
    console.log('💰 Sales module inicializado');
  },
  
  cacheElements() {
    this.elements = {
      // Controles
      searchInput: document.getElementById('sales-search'),
      statusFilter: document.getElementById('status-filter'),
      dateRangeFilter: document.getElementById('date-range-filter'),
      sortSelect: document.getElementById('sales-sort'),
      addSaleBtn: document.getElementById('add-sale-btn'),
      
      // Lista de vendas
      salesList: document.getElementById('sales-list'),
      salesCount: document.getElementById('sales-count'),
      
      // Estatísticas
      totalSales: document.getElementById('sales-total'),
      totalOrders: document.getElementById('orders-total'),
      averageTicket: document.getElementById('average-ticket')
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
    
    // Filtros
    if (this.elements.statusFilter) {
      this.elements.statusFilter.addEventListener('change', (e) => {
        this.data.currentFilter = e.target.value;
        this.applyFilters();
      });
    }
    
    if (this.elements.dateRangeFilter) {
      this.elements.dateRangeFilter.addEventListener('change', (e) => {
        this.data.dateRange = e.target.value;
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
    
    // Botão nova venda
    if (this.elements.addSaleBtn) {
      this.elements.addSaleBtn.addEventListener('click', () => {
        this.openNewSaleModal();
      });
    }
    
    // Eventos de dados
    window.addEventListener('c4:data:changed', (event) => {
      const { dataType } = event.detail;
      if (['sales', 'products', 'clients'].includes(dataType)) {
        this.refresh();
      }
    });
  },
  
  // ===== CARREGAMENTO DE DADOS =====
  
  async loadData() {
    try {
      const [sales, products, clients] = await Promise.all([
        C4App.utils.Database.getSales(),
        C4App.utils.Database.getProducts(),
        C4App.utils.Database.getClients()
      ]);
      
      this.data.sales = sales;
      this.data.products = products;
      this.data.clients = clients;
      
      this.applyFilters();
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      C4App.components.Toast.error('Erro ao carregar vendas');
    }
  },
  
  // ===== FILTROS =====
  
  applyFilters() {
    let filtered = [...this.data.sales];
    
    // Filtro por status
    if (this.data.currentFilter !== 'all') {
      filtered = filtered.filter(sale => sale.status === this.data.currentFilter);
    }
    
    // Filtro por período
    if (this.data.dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (this.data.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (startDate) {
        filtered = filtered.filter(sale => {
          const saleDate = new Date(sale.created_at || sale.createdAt);
          return saleDate >= startDate;
        });
      }
    }
    
    // Filtro por busca
    if (this.data.searchTerm) {
      const term = this.data.searchTerm.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.clientName?.toLowerCase().includes(term) ||
        sale.id?.toLowerCase().includes(term)
      );
    }
    
    // Ordenação
    filtered.sort((a, b) => {
      let aValue = a[this.data.sortBy];
      let bValue = b[this.data.sortBy];
      
      if (this.data.sortBy === 'date') {
        aValue = new Date(a.created_at || a.createdAt);
        bValue = new Date(b.created_at || b.createdAt);
      } else if (this.data.sortBy === 'total') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      if (aValue < bValue) comparison = -1;
      
      return this.data.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    this.data.filteredSales = filtered;
    this.renderSales();
    this.updateStats();
  },
  
  // ===== RENDERIZAÇÃO =====
  
  render() {
    this.renderSales();
    this.updateStats();
  },
  
  renderSales() {
    if (!this.elements.salesList) return;
    
    const { filteredSales } = this.data;
    
    // Atualizar contador
    if (this.elements.salesCount) {
      this.elements.salesCount.textContent = `${filteredSales.length} venda(s)`;
    }
    
    if (filteredSales.length === 0) {
      this.elements.salesList.innerHTML = this.getEmptyState();
      return;
    }
    
    const html = filteredSales.map(sale => this.renderSaleCard(sale)).join('');
    this.elements.salesList.innerHTML = html;
    
    // Configurar eventos dos cards
    this.setupSaleCardEvents();
  },
  
  renderSaleCard(sale) {
    const date = new Date(sale.created_at || sale.createdAt);
    const statusClass = this.getStatusClass(sale.status);
    const statusText = this.getStatusText(sale.status);
    
    return `
      <div class="sale-card" data-sale-id="${sale.id}">
        <div class="sale-header">
          <div class="sale-id">#${sale.id.slice(-8)}</div>
          <div class="sale-status ${statusClass}">${statusText}</div>
        </div>
        
        <div class="sale-info">
          <div class="sale-client">
            <strong>${C4App.utils.escapeHtml(sale.clientName)}</strong>
          </div>
          <div class="sale-date">
            ${C4App.utils.formatDate(date)} às ${C4App.utils.formatTime(date)}
          </div>
        </div>
        
        <div class="sale-items">
          ${this.renderSaleItems(sale.items)}
        </div>
        
        <div class="sale-totals">
          <div class="sale-subtotal">
            Subtotal: ${C4App.utils.formatCurrency(sale.subtotal || 0)}
          </div>
          ${sale.shipping > 0 ? `
            <div class="sale-shipping">
              Frete: ${C4App.utils.formatCurrency(sale.shipping)}
            </div>
          ` : ''}
          ${sale.discount > 0 ? `
            <div class="sale-discount">
              Desconto: -${C4App.utils.formatCurrency(sale.discount)}
            </div>
          ` : ''}
          <div class="sale-total">
            <strong>Total: ${C4App.utils.formatCurrency(sale.total || 0)}</strong>
          </div>
        </div>
        
        <div class="sale-payment">
          <span class="payment-method">${this.getPaymentMethodText(sale.paymentMethod)}</span>
        </div>
        
        <div class="sale-actions">
          <button class="btn btn-sm btn-outline view-sale-btn" data-sale-id="${sale.id}">
            👁️ Ver
          </button>
          ${sale.status === 'pending' ? `
            <button class="btn btn-sm btn-success complete-sale-btn" data-sale-id="${sale.id}">
              ✅ Concluir
            </button>
          ` : ''}
          <button class="btn btn-sm btn-outline edit-sale-btn" data-sale-id="${sale.id}">
            ✏️ Editar
          </button>
          <button class="btn btn-sm btn-danger cancel-sale-btn" data-sale-id="${sale.id}">
            ❌ Cancelar
          </button>
        </div>
      </div>
    `;
  },
  
  renderSaleItems(items) {
    if (!items || !Array.isArray(items)) return '<div class="no-items">Sem itens</div>';
    
    return items.map(item => `
      <div class="sale-item">
        <span class="item-name">${C4App.utils.escapeHtml(item.productName)}</span>
        <span class="item-quantity">x${item.quantity}</span>
        <span class="item-price">${C4App.utils.formatCurrency(item.price)}</span>
      </div>
    `).join('');
  },
  
  getStatusClass(status) {
    const classes = {
      'pending': 'status-pending',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classes[status] || 'status-unknown';
  },
  
  getStatusText(status) {
    const texts = {
      'pending': 'Pendente',
      'completed': 'Concluída',
      'cancelled': 'Cancelada'
    };
    return texts[status] || status;
  },
  
  getPaymentMethodText(method) {
    const methods = {
      'pix': 'PIX',
      'cartao': 'Cartão',
      'dinheiro': 'Dinheiro',
      'transferencia': 'Transferência'
    };
    return methods[method] || method;
  },
  
  getEmptyState() {
    const hasFilters = this.data.searchTerm || 
                      this.data.currentFilter !== 'all' || 
                      this.data.dateRange !== 'month';
    
    if (hasFilters) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Nenhuma venda encontrada</h3>
          <p>Tente ajustar os filtros de busca</p>
          <button class="btn btn-outline" onclick="C4App.modules.Sales.clearFilters()">
            Limpar filtros
          </button>
        </div>
      `;
    }
    
    return `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <h3>Nenhuma venda registrada</h3>
        <p>Comece registrando sua primeira venda</p>
        <button class="btn btn-primary" onclick="C4App.modules.Sales.openNewSaleModal()">
          ➕ Nova venda
        </button>
      </div>
    `;
  },
  
  setupSaleCardEvents() {
    // Ver venda
    document.querySelectorAll('.view-sale-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const saleId = btn.dataset.saleId;
        this.viewSale(saleId);
      });
    });
    
    // Concluir venda
    document.querySelectorAll('.complete-sale-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const saleId = btn.dataset.saleId;
        this.completeSale(saleId);
      });
    });
    
    // Editar venda
    document.querySelectorAll('.edit-sale-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const saleId = btn.dataset.saleId;
        this.editSale(saleId);
      });
    });
    
    // Cancelar venda
    document.querySelectorAll('.cancel-sale-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const saleId = btn.dataset.saleId;
        this.cancelSale(saleId);
      });
    });
  },
  
  updateStats() {
    const { filteredSales } = this.data;
    
    const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalOrders = filteredSales.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    if (this.elements.totalSales) {
      this.elements.totalSales.textContent = C4App.utils.formatCurrency(totalSales);
    }
    
    if (this.elements.totalOrders) {
      this.elements.totalOrders.textContent = totalOrders.toString();
    }
    
    if (this.elements.averageTicket) {
      this.elements.averageTicket.textContent = C4App.utils.formatCurrency(averageTicket);
    }
  },
  
  // ===== MODAIS =====
  
  openNewSaleModal() {
    this.openSaleModal();
  },
  
  openSaleModal(sale = null) {
    const isEdit = sale !== null;
    const title = isEdit ? 'Editar Venda' : 'Nova Venda';
    
    const formHtml = `
      <form id="sale-form" data-validate>
        <input type="hidden" name="id" value="${sale?.id || ''}">
        
        <!-- Seleção de Cliente -->
        <div class="form-group">
          <label for="sale-client">Cliente *</label>
          <select id="sale-client" name="clientId" class="form-control" required>
            <option value="">Selecione um cliente</option>
            ${this.data.clients.map(client => `
              <option value="${client.id}" ${sale?.clientId === client.id ? 'selected' : ''}>
                ${C4App.utils.escapeHtml(client.name)}
              </option>
            `).join('')}
            <option value="__new__">+ Novo cliente</option>
          </select>
        </div>
        
        <!-- Produtos -->
        <div class="form-group">
          <label>Produtos *</label>
          <div id="sale-items">
            ${this.renderSaleItemsForm(sale?.items || [])}
          </div>
          <button type="button" class="btn btn-outline btn-sm" id="add-item-btn">
            ➕ Adicionar produto
          </button>
        </div>
        
        <!-- Frete -->
        <div class="form-group">
          <label for="sale-shipping">Frete</label>
          <input 
            type="text" 
            id="sale-shipping" 
            name="shipping" 
            class="form-control" 
            value="${sale?.shipping || '0'}"
            data-mask="currency"
          >
        </div>
        
        <!-- Desconto -->
        <div class="form-group">
          <label for="sale-discount">Desconto</label>
          <input 
            type="text" 
            id="sale-discount" 
            name="discount" 
            class="form-control" 
            value="${sale?.discount || '0'}"
            data-mask="currency"
          >
        </div>
        
        <!-- Forma de pagamento -->
        <div class="form-group">
          <label for="sale-payment">Forma de pagamento *</label>
          <select id="sale-payment" name="paymentMethod" class="form-control" required>
            <option value="">Selecione</option>
            <option value="pix" ${sale?.paymentMethod === 'pix' ? 'selected' : ''}>PIX</option>
            <option value="cartao" ${sale?.paymentMethod === 'cartao' ? 'selected' : ''}>Cartão</option>
            <option value="dinheiro" ${sale?.paymentMethod === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
            <option value="transferencia" ${sale?.paymentMethod === 'transferencia' ? 'selected' : ''}>Transferência</option>
          </select>
        </div>
        
        <!-- Totais -->
        <div class="sale-totals-preview">
          <div class="total-line">
            <span>Subtotal:</span>
            <span id="preview-subtotal">R$ 0,00</span>
          </div>
          <div class="total-line">
            <span>Frete:</span>
            <span id="preview-shipping">R$ 0,00</span>
          </div>
          <div class="total-line">
            <span>Desconto:</span>
            <span id="preview-discount">R$ 0,00</span>
          </div>
          <div class="total-line total-final">
            <span><strong>Total:</strong></span>
            <span id="preview-total"><strong>R$ 0,00</strong></span>
          </div>
        </div>
      </form>
    `;
    
    const footer = `
      <button type="button" class="btn btn-outline" data-action="cancel">Cancelar</button>
      <button type="submit" form="sale-form" class="btn btn-primary">
        ${isEdit ? 'Atualizar' : 'Registrar'} venda
      </button>
    `;
    
    const modalId = C4App.components.Modal.open({
      title,
      body: formHtml,
      footer
    }, { size: 'large' });
    
    // Configurar eventos do modal
    setTimeout(() => {
      this.setupSaleModalEvents(modalId);
    }, 100);
  },
  
  renderSaleItemsForm(items) {
    if (items.length === 0) {
      return '<div class="no-items">Nenhum produto adicionado</div>';
    }
    
    return items.map((item, index) => `
      <div class="sale-item-form" data-index="${index}">
        <select name="items[${index}][productId]" class="form-control product-select" required>
          <option value="">Selecione um produto</option>
          ${this.data.products.map(product => `
            <option value="${product.id}" 
                    data-price="${product.price}" 
                    data-stock="${product.stock}"
                    ${item.productId === product.id ? 'selected' : ''}>
              ${C4App.utils.escapeHtml(product.name)} - ${C4App.utils.formatCurrency(product.price)}
            </option>
          `).join('')}
        </select>
        
        <input 
          type="number" 
          name="items[${index}][quantity]" 
          class="form-control quantity-input" 
          placeholder="Qtd" 
          min="1" 
          value="${item.quantity || 1}"
          required
        >
        
        <input 
          type="text" 
          name="items[${index}][price]" 
          class="form-control price-input" 
          placeholder="Preço" 
          value="${item.price || ''}"
          data-mask="currency"
          required
        >
        
        <button type="button" class="btn btn-danger btn-sm remove-item-btn">🗑️</button>
      </div>
    `).join('');
  },
  
  setupSaleModalEvents(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Adicionar item
    const addItemBtn = modal.querySelector('#add-item-btn');
    if (addItemBtn) {
      addItemBtn.addEventListener('click', () => {
        this.addSaleItem(modal);
      });
    }
    
    // Calcular totais em tempo real
    modal.addEventListener('input', () => {
      this.calculateSaleTotals(modal);
    });
    
    modal.addEventListener('change', () => {
      this.calculateSaleTotals(modal);
    });
    
    // Submit do formulário
    const form = modal.querySelector('#sale-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaleSubmit(form, modalId);
      });
    }
    
    // Botão cancelar
    modal.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'cancel') {
        C4App.components.Modal.close(modalId);
      }
    });
    
    // Calcular totais inicial
    this.calculateSaleTotals(modal);
  },
  
  addSaleItem(modal) {
    const itemsContainer = modal.querySelector('#sale-items');
    const existingItems = itemsContainer.querySelectorAll('.sale-item-form');
    const index = existingItems.length;
    
    const itemHtml = `
      <div class="sale-item-form" data-index="${index}">
        <select name="items[${index}][productId]" class="form-control product-select" required>
          <option value="">Selecione um produto</option>
          ${this.data.products.map(product => `
            <option value="${product.id}" 
                    data-price="${product.price}" 
                    data-stock="${product.stock}">
              ${C4App.utils.escapeHtml(product.name)} - ${C4App.utils.formatCurrency(product.price)}
            </option>
          `).join('')}
        </select>
        
        <input 
          type="number" 
          name="items[${index}][quantity]" 
          class="form-control quantity-input" 
          placeholder="Qtd" 
          min="1" 
          value="1"
          required
        >
        
        <input 
          type="text" 
          name="items[${index}][price]" 
          class="form-control price-input" 
          placeholder="Preço" 
          data-mask="currency"
          required
        >
        
        <button type="button" class="btn btn-danger btn-sm remove-item-btn">🗑️</button>
      </div>
    `;
    
    // Remover mensagem de "nenhum produto"
    const noItems = itemsContainer.querySelector('.no-items');
    if (noItems) {
      noItems.remove();
    }
    
    itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
    
    // Configurar eventos do novo item
    const newItem = itemsContainer.lastElementChild;
    this.setupSaleItemEvents(newItem);
  },
  
  setupSaleItemEvents(itemElement) {
    // Seleção de produto
    const productSelect = itemElement.querySelector('.product-select');
    const priceInput = itemElement.querySelector('.price-input');
    
    if (productSelect) {
      productSelect.addEventListener('change', (e) => {
        const option = e.target.selectedOptions[0];
        if (option && option.dataset.price) {
          priceInput.value = C4App.utils.formatCurrency(parseFloat(option.dataset.price));
        }
      });
    }
    
    // Remover item
    const removeBtn = itemElement.querySelector('.remove-item-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        itemElement.remove();
        this.calculateSaleTotals(itemElement.closest('.modal-content'));
      });
    }
  },
  
  calculateSaleTotals(modal) {
    const items = modal.querySelectorAll('.sale-item-form');
    const shippingInput = modal.querySelector('#sale-shipping');
    const discountInput = modal.querySelector('#sale-discount');
    
    let subtotal = 0;
    
    // Calcular subtotal
    items.forEach(item => {
      const quantity = parseFloat(item.querySelector('.quantity-input').value) || 0;
      const price = C4App.utils.parseCurrency(item.querySelector('.price-input').value);
      subtotal += quantity * price;
    });
    
    const shipping = C4App.utils.parseCurrency(shippingInput?.value || '0');
    const discount = C4App.utils.parseCurrency(discountInput?.value || '0');
    const total = subtotal + shipping - discount;
    
    // Atualizar preview
    const previewSubtotal = modal.querySelector('#preview-subtotal');
    const previewShipping = modal.querySelector('#preview-shipping');
    const previewDiscount = modal.querySelector('#preview-discount');
    const previewTotal = modal.querySelector('#preview-total');
    
    if (previewSubtotal) previewSubtotal.textContent = C4App.utils.formatCurrency(subtotal);
    if (previewShipping) previewShipping.textContent = C4App.utils.formatCurrency(shipping);
    if (previewDiscount) previewDiscount.textContent = C4App.utils.formatCurrency(discount);
    if (previewTotal) previewTotal.innerHTML = `<strong>${C4App.utils.formatCurrency(total)}</strong>`;
  },
  
  // ===== AÇÕES =====
  
  async handleSaleSubmit(form, modalId) {
    try {
      // Validar formulário
      if (!C4App.components.FormValidator.validateForm(form.id)) {
        return;
      }
      
      const formData = new FormData(form);
      const saleData = {
        clientId: formData.get('clientId'),
        items: [],
        shipping: C4App.utils.parseCurrency(formData.get('shipping') || '0'),
        discount: C4App.utils.parseCurrency(formData.get('discount') || '0'),
        paymentMethod: formData.get('paymentMethod'),
        status: 'completed'
      };
      
      // Processar itens
      const items = form.querySelectorAll('.sale-item-form');
      items.forEach((item, index) => {
        const productId = formData.get(`items[${index}][productId]`);
        const quantity = parseInt(formData.get(`items[${index}][quantity]`)) || 0;
        const price = C4App.utils.parseCurrency(formData.get(`items[${index}][price]`) || '0');
        
        if (productId && quantity > 0 && price > 0) {
          const product = this.data.products.find(p => p.id === productId);
          saleData.items.push({
            productId,
            productName: product?.name || 'Produto',
            quantity,
            price
          });
        }
      });
      
      if (saleData.items.length === 0) {
        C4App.components.Toast.error('Adicione pelo menos um produto');
        return;
      }
      
      // Calcular totais
      saleData.subtotal = saleData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      saleData.total = saleData.subtotal + saleData.shipping - saleData.discount;
      
      // Buscar nome do cliente
      const client = this.data.clients.find(c => c.id === saleData.clientId);
      saleData.clientName = client?.name || 'Cliente';
      
      // Salvar venda
      const isEdit = formData.get('id');
      let result;
      
      if (isEdit) {
        result = await C4App.utils.Database.updateSale(isEdit, saleData);
      } else {
        result = await C4App.utils.Database.createSale(saleData);
      }
      
      if (result) {
        C4App.components.Toast.success(
          isEdit ? 'Venda atualizada com sucesso!' : 'Venda registrada com sucesso!'
        );
        
        C4App.components.Modal.close(modalId);
        await this.refresh();
      } else {
        C4App.components.Toast.error('Erro ao salvar venda');
      }
      
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      C4App.components.Toast.error('Erro ao salvar venda');
    }
  },
  
  async viewSale(saleId) {
    const sale = this.data.sales.find(s => s.id === saleId);
    if (!sale) return;
    
    const client = this.data.clients.find(c => c.id === sale.clientId);
    const date = new Date(sale.created_at || sale.createdAt);
    
    const content = `
      <div class="sale-details">
        <div class="sale-header">
          <h4>Venda #${sale.id.slice(-8)}</h4>
          <span class="sale-status ${this.getStatusClass(sale.status)}">
            ${this.getStatusText(sale.status)}
          </span>
        </div>
        
        <div class="sale-info">
          <p><strong>Cliente:</strong> ${C4App.utils.escapeHtml(sale.clientName)}</p>
          <p><strong>Data:</strong> ${C4App.utils.formatDate(date)} às ${C4App.utils.formatTime(date)}</p>
          <p><strong>Pagamento:</strong> ${this.getPaymentMethodText(sale.paymentMethod)}</p>
        </div>
        
        <div class="sale-items">
          <h5>Produtos:</h5>
          ${this.renderSaleItems(sale.items)}
        </div>
        
        <div class="sale-totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${C4App.utils.formatCurrency(sale.subtotal || 0)}</span>
          </div>
          ${sale.shipping > 0 ? `
            <div class="total-line">
              <span>Frete:</span>
              <span>${C4App.utils.formatCurrency(sale.shipping)}</span>
            </div>
          ` : ''}
          ${sale.discount > 0 ? `
            <div class="total-line">
              <span>Desconto:</span>
              <span>-${C4App.utils.formatCurrency(sale.discount)}</span>
            </div>
          ` : ''}
          <div class="total-line total-final">
            <span><strong>Total:</strong></span>
            <span><strong>${C4App.utils.formatCurrency(sale.total || 0)}</strong></span>
          </div>
        </div>
      </div>
    `;
    
    C4App.components.Modal.open({
      title: 'Detalhes da Venda',
      body: content
    });
  },
  
  async completeSale(saleId) {
    try {
      const result = await C4App.utils.Database.updateSale(saleId, { status: 'completed' });
      
      if (result) {
        C4App.components.Toast.success('Venda concluída!');
        await this.refresh();
      }
    } catch (error) {
      console.error('Erro ao concluir venda:', error);
      C4App.components.Toast.error('Erro ao concluir venda');
    }
  },
  
  async editSale(saleId) {
    const sale = this.data.sales.find(s => s.id === saleId);
    if (sale) {
      this.openSaleModal(sale);
    }
  },
  
  async cancelSale(saleId) {
    try {
      const sale = this.data.sales.find(s => s.id === saleId);
      if (!sale) return;
      
      const confirmed = await C4App.components.Modal.confirm(
        `Tem certeza que deseja cancelar a venda #${sale.id.slice(-8)}?`,
        'Confirmar cancelamento'
      );
      
      if (!confirmed) return;
      
      const result = await C4App.utils.Database.updateSale(saleId, { status: 'cancelled' });
      
      if (result) {
        C4App.components.Toast.success('Venda cancelada!');
        await this.refresh();
      }
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      C4App.components.Toast.error('Erro ao cancelar venda');
    }
  },
  
  clearFilters() {
    this.data.searchTerm = '';
    this.data.currentFilter = 'all';
    this.data.dateRange = 'month';
    this.data.sortBy = 'date';
    this.data.sortOrder = 'desc';
    
    if (this.elements.searchInput) this.elements.searchInput.value = '';
    if (this.elements.statusFilter) this.elements.statusFilter.value = 'all';
    if (this.elements.dateRangeFilter) this.elements.dateRangeFilter.value = 'month';
    if (this.elements.sortSelect) this.elements.sortSelect.value = 'date-desc';
    
    this.applyFilters();
  },
  
  // ===== REFRESH =====
  
  async refresh() {
    try {
      await this.loadData();
      this.render();
    } catch (error) {
      console.error('Erro ao atualizar vendas:', error);
    }
  }
};

// Auto-inicializar quando página de vendas for ativada
window.addEventListener('c4:navigation:changed', (event) => {
  if (event.detail.page === 'sales') {
    C4App.modules.Sales.init();
  }
});

// Exportar para uso global
window.C4Sales = C4App.modules.Sales;

