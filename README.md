# 🎯 Cotação Pro — Cloudfy Partners

Sistema completo de cotação comercial com controle de leads, licenças, cotações com cálculo automático de descontos globais, royalties por categoria de canal e geração de propostas em PDF.

---

## ✅ Funcionalidades

- **Login e Controle de Acesso** (Admin / Vendedor)
- **CRUD de Leads** (empresa, CNPJ, contato, responsável financeiro)
- **CRUD de Licenças** (com flag de obrigatório e dependências)
- **Importação de Planilha** (.xlsx / .csv) para popular licenças
- **Cotação Inteligente**:
  - Seleção de licenças com **quantidade**
  - **Desconto global %** sobre a mensalidade
  - **Royalties automáticos** por categoria de canal (Ouro/Prata/Bronze)
  - Visão interna (com royalties) vs. Proposta comercial (sem royalties)
- **Exportação de Proposta para PDF** com layout profissional
- **Dashboard** com métricas de leads, cotações e faturamento

---

## 🚀 Guia de Instalação

### Pré-requisitos
- [Node.js](https://nodejs.org/) 18+ (recomendado: 20 LTS)
- npm ou yarn

### Passo 1: Criar o projeto
Abra o terminal no VS Code e execute:

```bash
# Crie uma pasta para o projeto
mkdir cotacao-pro
cd cotacao-pro

# Inicialize o projeto Vite + React + TypeScript
npm create vite@latest . -- --template react-ts
```

### Passo 2: Instalar dependências
```bash
npm install
npm install react-router-dom lucide-react xlsx @react-pdf/renderer react-toastify uuid
npm install -D tailwindcss postcss autoprefixer @types/uuid

# Inicialize o Tailwind
npx tailwindcss init -p
```

### Passo 3: Configurar o Tailwind
Substitua o conteúdo de `tailwind.config.js` por:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: { 850: '#1e293b' }
      }
    },
  },
  plugins: [],
}
```

E em `src/index.css` adicione no topo:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Passo 4: Copiar os arquivos do projeto
Copie todos os arquivos gerados para dentro da pasta `cotacao-pro/src/` mantendo a estrutura de pastas:
```
src/
  main.tsx
  App.tsx
  index.css
  types/index.ts
  utils/formatters.ts
  services/db.ts
  context/AuthContext.tsx
  components/layout/Sidebar.tsx
  components/layout/ProtectedRoute.tsx
  components/pdf/PropostaPDF.tsx
  components/ImportPlanilha.tsx
  pages/Login.tsx
  pages/Dashboard.tsx
  pages/Leads/LeadsList.tsx
  pages/Leads/LeadForm.tsx
  pages/Licencas/LicencasList.tsx
  pages/Licencas/LicencaForm.tsx
  pages/Cotacoes/CotacoesList.tsx
  pages/Cotacoes/CotacaoForm.tsx
  pages/Usuarios/UsuariosList.tsx
  pages/Usuarios/UsuarioForm.tsx
```

### Passo 5: Ajustar o `index.html`
Certifique-se de que o `index.html` na raiz contenha:
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cotação Pro - Cloudfy Partners</title>
  </head>
  <body class="bg-slate-950 text-slate-100">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Passo 6: Rodar a aplicação
```bash
npm run dev
```

Acesse no navegador: **http://localhost:5173**

---

## 🔐 Usuários de Teste

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@cloudfy.com | admin123 | Administrador |
| joao@cloudfy.com | joao123 | Vendedor |

---

## 📊 Estrutura da Planilha para Importação

Crie um arquivo `.xlsx` com as seguintes colunas (na primeira linha):

| Descrição | Categoria | Periodicidade | Valor Integral | Obrigatorio | Dependencias |
|-----------|-----------|---------------|----------------|-------------|--------------|
| PDV Frente de Caixa | PDV | mensal | 125 | Sim | |
| Totem Auto Atendimento | Totem | mensal | 250 | Não | TEF |

---

## 🔧 Migração para Firebase (Futuro)

O arquivo `src/services/db.ts` usa **localStorage** como banco mockado. Para migrar para Firebase:

1. Instale: `npm install firebase`
2. Crie `src/firebase.ts` com as configurações do seu projeto
3. Substitua as funções `get`/`set` do `db.ts` pelas operações do Firestore (`getDocs`, `addDoc`, `updateDoc`, `deleteDoc`)
4. O restante da aplicação permanece inalterada — a API do `db` é a mesma.

---

## 📝 Licença
Uso interno — Cloudfy Partners.
