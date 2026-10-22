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
- **📥 Baixar / Compartilhar Cardápio** – gera uma imagem do cardápio em 900×1600 (igual à tela do caixa) para baixar no PC ou passar ao celular por QR Code

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
│   ├── share.js           ← Imagem do cardápio + download / QR Code
│   ├── vendor/
│   │   ├── html-to-image.js ← Biblioteca de captura (MIT)
│   │   └── qrcode.js        ← Gerador de QR Code (MIT, funciona offline)
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

### 4. Baixar ou levar o cardápio para o celular

1. Clique na **logo** para abrir o admin e depois em **"📥 Baixar / Compartilhar Cardápio"**.
2. Aparece uma prévia da imagem (900×1600, igual à tela do caixa).
3. Escolha:
   - **💻 Baixar no computador** – o JPG vai para a pasta *Downloads* (`cardapio-AAAA-MM-DD.jpg`).
   - **📱 Enviar para o celular** – aparece um **QR Code**. Aponte a câmera do celular, abra o link e toque em **Baixar imagem**.

> A imagem usa o cardápio **salvo**: salve as alterações antes.
> É preciso estar com internet para as fontes saírem iguais às da tela.

**Como funciona o envio para o celular**

- Só funciona com o cardápio aberto pelo `iniciar.bat`.
- Se aparecer o aviso de abrir pelo `iniciar.bat` mesmo assim, um servidor antigo pode ter ficado aberto: rode o `parar.bat` e depois o `iniciar.bat`. Para conferir, abra `http://localhost:8090/api/compartilhar` no navegador: a versão atual responde `{"erro":"metodo"}`.
- O celular precisa estar no **mesmo Wi-Fi** do computador.
- O link do QR Code vale **10 minutos** e usa um código aleatório; a imagem fica só na memória do servidor (nada é gravado em disco).
- Para isso, o servidor abre a porta **8091** na rede local. Ela entrega **apenas** a imagem compartilhada: o cardápio, o admin e os arquivos do projeto continuam acessíveis só pelo próprio computador.
- **Firewall do Windows:** na primeira vez que usar, o Windows pode perguntar se o *Windows PowerShell* pode acessar a rede. Marque **Redes privadas** e clique em **Permitir acesso**.
  Se o aviso foi recusado ou não apareceu e o celular não abre a página, libere manualmente: *Segurança do Windows → Firewall e proteção de rede → Permitir um aplicativo pelo firewall → Windows PowerShell → marcar "Privada"*. Confira também se a rede Wi-Fi está como **Privada** nas configurações de rede do Windows.
- As portas e a validade podem ser alteradas no início do `iniciar.ps1` (`$portaCelular`, `$validadeMinutos`).

---

## 🔧 Tecnologias

- HTML5, CSS3 (custom properties, grid, flexbox)
- JavaScript vanilla (ES6 modules, async/await, FileReader, Canvas)
- `localStorage` para persistência
- PowerShell (`System.Net.HttpListener` para o cardápio, `TcpListener` para o link do celular) como servidor local

---

Projeto criado para facilitar a atualização de cardápios sem depender de um CMS.  
Sinta-se à vontade para adaptar ao seu restaurante!
