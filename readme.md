# Cardápio Digital – Cozinha da Xuxu

Cardápio digital responsivo e editável, com painel de administração secreto acessível ao clicar na logo.  
As alterações (imagens dos pratos e ingredientes do prato do dia) são salvas no navegador e persistem entre acessos.

## 📸 Demonstração

- Visual moderno com fontes estilizadas, preços e layout em grid.
- Imagens e lista de ingredientes atualizáveis sem recarregar a página.
- Painel admin oculto – apenas para quem conhece o segredo (clique na logo).

## 🚀 Funcionalidades

- Troca de imagens dos pratos (Prato do Dia, Salada, Luís, Barça).
- Edição dos ingredientes do Prato do Dia (adicionar, remover, editar).
- Armazenamento via `localStorage` – nada é perdido ao fechar o navegador.
- Design responsivo e pronto para impressão.
- Totalmente offline – não requer servidor backend.

## 📁 Estrutura de arquivos
````
cardapio/
├── index.html ← Cardápio + modal admin oculto
├── css/
│ └── style.css ← Estilos do cardápio e do modal
├── img/
│ ├── logo.png ← Clique nela para abrir o admin
│ └── ... ← Imagens padrão (fallbacks)
└── js/
└── cardapio.js ← Lógica de armazenamento e controle do modal
````

## ⚙️ Como usar

### 1. Iniciar o projeto

**⚠️ Importante:** O `localStorage` não funciona de forma confiável ao abrir os arquivos diretamente (`file://`).  
Execute um servidor local simples:

- **VS Code**: instale a extensão “Live Server” e clique com o botão direito em `index.html` → “Open with Live Server”.
- **Node.js**: `npx http-server ./cardapio -p 8080`
- **Python**: `python -m http.server 8000`

Acesse `http://localhost:8080` (ou a porta que escolher).

### 2. Usar o cardápio

- O cardápio abre normalmente com as imagens e ingredientes salvos (ou os padrão).
- **Para administrar**: clique na imagem da logo (canto superior direito).
- Um modal será exibido com:
    - Upload de novas imagens (cada botão “Salvar Imagem” substitui a foto atual).
    - Lista de ingredientes do prato do dia – adicione, remova ou edite os itens e clique em “Salvar Ingredientes”.
- Ao fechar o modal (X ou clique fora), o cardápio já reflete as mudanças.

Os dados ficam salvos no seu navegador. Para restaurar as imagens e ingredientes originais, limpe o `localStorage` do domínio.

## 🔧 Tecnologias

- HTML5, CSS3 (custom properties, grid, flexbox)
- JavaScript (vanilla, async/await, FileReader, Canvas)
- `localStorage` para persistência

---

Projeto criado para facilitar a atualização de cardápios sem depender de um CMS.  
Sinta-se à vontade para adaptar ao seu restaurante!