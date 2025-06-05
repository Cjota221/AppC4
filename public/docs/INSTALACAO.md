# 🚀 GUIA DE INSTALAÇÃO E USO - C4 APP

## 📋 **REQUISITOS**

### **Navegador:**
- Chrome 80+ (recomendado)
- Firefox 75+
- Safari 13+
- Edge 80+

### **Dispositivo:**
- Qualquer dispositivo com navegador
- Resolução mínima: 320px
- Conexão com internet (opcional)

---

## 🔧 **INSTALAÇÃO**

### **OPÇÃO 1 - USO LOCAL (RECOMENDADO):**

1. **Baixe os arquivos:**
   - Faça download da pasta `c4-app` completa
   - Mantenha a estrutura de pastas intacta

2. **Abra o aplicativo:**
   - Navegue até a pasta `c4-app`
   - Clique duas vezes em `index.html`
   - O app abrirá no seu navegador padrão

3. **Primeiro acesso:**
   - Clique em "Usar dados demo"
   - Explore as funcionalidades
   - Os dados ficam salvos no seu navegador

### **OPÇÃO 2 - DEPLOY ONLINE:**

#### **Netlify (Gratuito):**
1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta `c4-app` para a área de deploy
3. Aguarde o upload e receba o link público

#### **Vercel (Gratuito):**
1. Instale: `npm i -g vercel`
2. Na pasta do projeto: `vercel --prod`
3. Siga as instruções e receba o link

#### **GitHub Pages:**
1. Crie um repositório no GitHub
2. Faça upload dos arquivos
3. Ative GitHub Pages nas configurações
4. Acesse via `usuario.github.io/repositorio`

---

## 📱 **PRIMEIRO USO**

### **1. TELA DE LOGIN:**
- **Dados demo:** Clique em "Usar dados demo"
- **Novo usuário:** Clique em "Cadastre-se"
- **Login:** Use email/senha se já tem conta

### **2. DASHBOARD:**
- Visualize estatísticas gerais
- Explore os cards informativos
- Use botões de ação rápida

### **3. NAVEGAÇÃO:**
- **Barra inferior:** 5 seções principais
- **Botão flutuante:** Nova venda rápida
- **Header:** Menu do usuário

---

## 🎯 **FUNCIONALIDADES PRINCIPAIS**

### **📦 PRODUTOS:**

#### **Adicionar Produto:**
1. Vá em "Produtos"
2. Clique "Adicionar Produto"
3. Preencha os dados:
   - Nome (obrigatório)
   - Categoria
   - Custo (obrigatório)
   - Preço de venda (obrigatório)
   - Estoque atual
   - Estoque mínimo
   - Descrição (opcional)
4. Veja a margem calculada automaticamente
5. Clique "Cadastrar produto"

#### **Gerenciar Produtos:**
- **Buscar:** Digite no campo de busca
- **Filtrar:** Clique nas categorias
- **Editar:** Botão "✏️ Editar"
- **Duplicar:** Botão "📋 Duplicar"
- **Excluir:** Botão "🗑️ Excluir"

### **💰 VENDAS:**

#### **Nova Venda:**
1. Clique no botão flutuante rosa OU
2. Vá em "Vendas" → "Nova Venda"
3. Selecione o cliente
4. Adicione produtos:
   - Escolha o produto
   - Defina quantidade
   - Confirme o preço
5. Configure frete e desconto
6. Escolha forma de pagamento
7. Veja o total calculado
8. Clique "Registrar venda"

#### **Gerenciar Vendas:**
- **Filtrar:** Por status ou período
- **Buscar:** Por cliente ou ID
- **Ver detalhes:** Botão "👁️ Ver"
- **Concluir:** Botão "✅ Concluir"
- **Editar:** Botão "✏️ Editar"
- **Cancelar:** Botão "❌ Cancelar"

### **📊 DASHBOARD:**

#### **Estatísticas:**
- **Vendas do mês:** Total em reais
- **Margem de lucro:** Percentual médio
- **Produtos top:** Mais vendidos
- **Vendas recentes:** Últimas transações
- **Meta do mês:** Progresso atual

#### **Gráficos:**
- **Vendas:** Últimos 7 dias
- **Produtos:** Top 5 mais vendidos
- **Meta:** Progresso visual

---

## ⚙️ **CONFIGURAÇÕES AVANÇADAS**

### **PERSONALIZAR CORES:**

Edite o arquivo `assets/css/01-variables.css`:

```css
:root {
  /* Cores principais */
  --primary: #ec4899;     /* Rosa principal */
  --secondary: #facc15;   /* Dourado */
  --background: #fdf2f8;  /* Fundo rosa suave */
  
  /* Personalize aqui */
  --primary: #sua-cor;
  --secondary: #sua-cor;
}
```

### **CONFIGURAR SUPABASE:**

1. Crie conta no [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Copie URL e chave pública
4. Edite `assets/js/core/config.js`:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://seu-projeto.supabase.co',
  anonKey: 'sua-chave-publica-aqui'
};
```

### **DADOS PERSONALIZADOS:**

Edite `assets/js/demo/demo-data.js`:

```javascript
products: [
  {
    name: 'Seu Produto',
    category: 'sua-categoria',
    cost: 20.00,
    price: 40.00,
    stock: 10,
    // ...
  }
]
```

---

## 🔍 **SOLUÇÃO DE PROBLEMAS**

### **APP NÃO CARREGA:**
- Verifique se todos os arquivos estão na pasta
- Teste em outro navegador
- Desative extensões do navegador
- Limpe cache e cookies

### **DADOS NÃO SALVAM:**
- Verifique se localStorage está habilitado
- Não use modo privado/incógnito
- Teste em outro navegador

### **LAYOUT QUEBRADO:**
- Verifique se arquivos CSS estão carregando
- Teste em dispositivo diferente
- Atualize a página (F5)

### **FUNCIONALIDADES NÃO FUNCIONAM:**
- Abra console do navegador (F12)
- Verifique erros JavaScript
- Teste com dados demo limpos

---

## 📞 **SUPORTE**

### **PROBLEMAS TÉCNICOS:**
1. Verifique este guia primeiro
2. Teste com dados demo limpos
3. Documente o erro encontrado
4. Inclua navegador e dispositivo usado

### **PERSONALIZAÇÕES:**
- Edite arquivos CSS para visual
- Modifique dados demo para conteúdo
- Configure Supabase para produção

### **MELHORIAS:**
- Liste funcionalidades desejadas
- Descreva comportamento esperado
- Priorize por importância

---

## 🎯 **DICAS DE USO**

### **PRODUTIVIDADE:**
- Use atalhos do botão flutuante
- Configure dados demo com seus produtos
- Mantenha categorias organizadas
- Atualize estoque regularmente

### **ORGANIZAÇÃO:**
- Categorize produtos consistentemente
- Use descrições claras
- Mantenha preços atualizados
- Monitore estoque mínimo

### **ANÁLISE:**
- Acompanhe dashboard diariamente
- Analise produtos mais vendidos
- Monitore margem de lucro
- Defina metas realistas

---

## 🚀 **PRÓXIMOS PASSOS**

### **APÓS INSTALAÇÃO:**
1. ✅ Teste todas as funcionalidades
2. ✅ Configure com seus dados reais
3. ✅ Personalize cores se desejar
4. ✅ Faça backup dos dados
5. ✅ Considere deploy online

### **PARA PRODUÇÃO:**
1. Configure Supabase
2. Deploy em plataforma confiável
3. Configure domínio próprio
4. Implemente backup automático
5. Monitore performance

### **EXPANSÕES FUTURAS:**
- Relatórios avançados
- Sistema de metas
- CRM de clientes
- Calculadoras de frete
- Integração com marketplaces

---

**O C4 App está pronto para revolucionar sua gestão financeira! 💪✨**

---

*Guia atualizado em: 04/06/2025*  
*Versão do app: 1.0.0*

