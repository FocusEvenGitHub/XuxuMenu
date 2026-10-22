# Cardápio Digital – Cozinha da Xuxu

Cardápio digital responsivo e totalmente editável, com painel de administração secreto acessível ao clicar na logo.  
As alterações são salvas no navegador e persistem entre acessos.

---

## 🚀 Funcionalidades

- **Painel admin com 7 abas:** 6 produtos + Adicionais ("Monte seu Prato")
- **Edição completa:** nome, preço, ingredientes, itens, variantes (Frango/Carne/Tilápia) de todos os produtos
- **Upload de imagens** para todos os 6 pratos (redimensionamento automático via Canvas)
- **Listas dinâmicas:** adicione ou remova ingredientes, itens e variantes livremente
- **Seção "Monte seu Prato":** lista dinâmica de itens adicionais com nome e preço
- **Design responsivo** e pronto para impressão (900×1600 px)
- **Persistência via `localStorage`** – nada se perde ao fechar o navegador
- **Launcher de 1 clique** (`iniciar.bat`) – sobe servidor local oculto e abre o navegador
- **Valores padrão embutidos** – ao abrir num PC novo, o cardápio já aparece completo
- **📸 Postar no Instagram** – gera uma imagem do cardápio em 900×1600 (igual à tela do caixa, formato Story) direto do admin

---

## 📁 Estrutura de arquivos

```
XuxuMenu/
├── iniciar.bat            ← Duplo clique para iniciar!
├── iniciar.ps1            ← Servidor HTTP (automático)
├── parar.bat              ← Duplo clique para parar o servidor
├── index.html             ← Cardápio + estrutura do admin
├── css/
│   ├── base.css           ← Reset, variáveis, fonte
│   ├── cardapio.css       ← Estilos do cardápio
│   ├── admin.css          ← Estilos do modal admin
│   └── print.css          ← Configuração de impressão
├── js/
│   ├── storage.js         ← Modelo de dados + localStorage
│   ├── ui.js              ← Renderização do cardápio
│   ├── admin.js           ← Modal admin com 7 abas
│   ├── share.js           ← Imagem do cardápio + postagem no Instagram
│   ├── vendor/
│   │   └── html-to-image.js ← Biblioteca de captura (MIT)
│   └── app.js             ← Inicialização
├── img/
│   ├── logo.png           ← Clique nela para abrir o admin
│   └── ...                ← Imagens padrão dos pratos
└── readme.md
```

---

## ⚙️ Como usar

### 1. Iniciar (mais fácil)

Dê **duplo clique** no arquivo `iniciar.bat`:
- Uma janela preta pisca rapidamente e some
- O navegador abre automaticamente com o cardápio
- O servidor fica rodando em segundo plano

Para desligar, dê duplo clique no `parar.bat`.

### 2. Iniciar (alternativas manuais)

Se preferir iniciar manualmente, use um servidor local simples:

- **VS Code:** extensão Live Server → botão direito no `index.html` → "Open with Live Server"
- **Node.js:** `npx http-server . -p 8090`
- **Python:** `python -m http.server 8000`

Acesse `http://localhost:8090` (ou a porta escolhida).

> ⚠️ O `localStorage` não funciona de forma confiável ao abrir pelo `file://`.

### 3. Usar o cardápio

- O cardápio abre normalmente com os valores padrão ou os últimos salvos.
- **Para administrar:** clique na **logo** (canto superior direito).
- O modal admin será exibido com **7 abas** no topo:

```
🥘 Prato Dia │ 🥩 Picadinho │ 🧀 Parmegiana │ 🥗 Salada │ 🍖 Luís │ 🍛 Barça │ ➕ Adicionais
```

Cada aba de produto permite editar:
- **Imagem** – upload de nova foto com preview
- **Nome** do prato
- **Preço** (ou variantes como Frango/Carne/Tilápia com preços individuais)
- **Ingredientes / Itens** – lista dinâmica (adicione ou remova)

A aba **"Adicionais"** permite editar o título da seção e a lista completa de itens do "Monte seu Prato" (nome + preço).

Após as alterações, clique em **"💾 Salvar Tudo"** – o cardápio é atualizado na hora.

### 4. Postar no Instagram

1. Clique na **logo** para abrir o admin e depois em **"📸 Postar no Instagram"**.
2. Aparece uma prévia da imagem do cardápio (900×1600, o mesmo que aparece na tela do caixa).
3. **No PC:** clique em **"Baixar e abrir o Instagram"**. A imagem vai para a pasta *Downloads* e o Meta Business Suite abre; lá, crie um **Story** e escolha o arquivo `cardapio-AAAA-MM-DD.jpg`.
4. **No celular:** toque em **"Compartilhar no Instagram"**, escolha **Instagram → Story** e publique.

> A imagem usa o cardápio **salvo**: salve as alterações antes de postar.
> É preciso estar com internet para as fontes saírem iguais às da tela.

---

## 🔧 Tecnologias

- HTML5, CSS3 (custom properties, grid, flexbox)
- JavaScript vanilla (ES6 modules, async/await, FileReader, Canvas)
- `localStorage` para persistência
- PowerShell (`System.Net.HttpListener`) para servidor local

---

Projeto criado para facilitar a atualização de cardápios sem depender de um CMS.  
Sinta-se à vontade para adaptar ao seu restaurante!
