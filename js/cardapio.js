// js/cardapio.js

// ===================== LOCAL STORAGE =====================
const STORAGE_KEYS = {
    pratoDia: 'img_pratoDia',
    salada: 'img_salada',
    luis: 'img_luis',
    barca: 'img_barca',
    ingredientes: 'ingredientes_pratoDia'
};

// Redimensiona e converte imagem para data URL (maxLado em px)
function fileToDataUrl(file, maxLado = 400) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > h) {
                    if (w > maxLado) { h *= maxLado / w; w = maxLado; }
                } else {
                    if (h > maxLado) { w *= maxLado / h; h = maxLado; }
                }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Salva uma imagem no localStorage
function salvarImagem(chave, dataUrl) {
    localStorage.setItem(STORAGE_KEYS[chave], dataUrl);
}

// Obtém uma imagem do localStorage
function obterImagem(chave) {
    return localStorage.getItem(STORAGE_KEYS[chave]);
}

// Carrega a imagem salva para um elemento <img> (por ID)
function carregarImagemNaTela(chave, idImg) {
    const dataUrl = obterImagem(chave);
    const img = document.getElementById(idImg);
    if (dataUrl && img) img.src = dataUrl;
}

// Atualiza todas as imagens do cardápio
function atualizarTodasImagens() {
    carregarImagemNaTela('pratoDia', 'imgPratoDia');
    carregarImagemNaTela('salada', 'imgSalada');
    carregarImagemNaTela('luis', 'imgLuis');
    carregarImagemNaTela('barca', 'imgBarca');
}

// ================== INGREDIENTES ==================
function obterIngredientes() {
    const json = localStorage.getItem(STORAGE_KEYS.ingredientes);
    return json ? JSON.parse(json) : [];
}

function salvarIngredientes(lista) {
    localStorage.setItem(STORAGE_KEYS.ingredientes, JSON.stringify(lista));
}

function exibirIngredientesNaTela() {
    const lista = document.getElementById('listaPratoDia');
    if (lista) {
        const ingredientes = obterIngredientes();
        lista.innerHTML = ingredientes.map(i => `<li>${i}</li>`).join('');
    }
}

// ================== INICIALIZAÇÃO ==================
window.addEventListener('DOMContentLoaded', () => {
    atualizarTodasImagens();
    exibirIngredientesNaTela();
    prepararModalAdmin();
});

// ================== MODAL ADMIN ==================
function prepararModalAdmin() {
    const logo = document.querySelector('.logo');
    if (!logo) return;

    logo.style.cursor = 'pointer';
    logo.addEventListener('click', abrirModalAdmin);
}

// Cria o HTML do modal dinamicamente e adiciona ao body
function criarModalAdmin() {
    if (document.getElementById('modalAdminOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'modalAdminOverlay';
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
        <div class="modal-admin">
            <span class="modal-fechar" id="fecharModal">&times;</span>
            <h2>⚙️ Administração</h2>

            <h3>📷 Imagens</h3>
            <div class="admin-imagens">
                ${['pratoDia','salada','luis','barca'].map(chave => `
                    <div class="admin-img-item">
                        <label>${chave === 'pratoDia' ? 'Prato do Dia' : chave.charAt(0).toUpperCase() + chave.slice(1)}</label>
                        <img id="preview_${chave}" src="${obterImagem(chave) || ''}" alt="">
                        <input type="file" accept="image/*" id="input_${chave}">
                        <button class="btn-salvar-img" data-chave="${chave}">💾 Salvar Imagem</button>
                    </div>
                `).join('')}
            </div>

            <h3>🥘 Ingredientes do Prato do Dia</h3>
            <div id="listaAdminIngredientes" class="admin-ingredientes"></div>
            <button id="btnAddIngrediente">+ Adicionar</button>
            <button id="btnSalvarIngredientes">💾 Salvar Ingredientes</button>
            <div id="msgAdmin" style="color:green; margin-top:10px;"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Configura eventos
    overlay.querySelector('#fecharModal').addEventListener('click', fecharModalAdmin);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) fecharModalAdmin();
    });

    // Upload de imagens
    overlay.querySelectorAll('.btn-salvar-img').forEach(btn => {
        btn.addEventListener('click', async () => {
            const chave = btn.dataset.chave;
            const input = document.getElementById(`input_${chave}`);
            const file = input.files[0];
            if (!file) return alert('Selecione uma imagem.');

            try {
                const dataUrl = await fileToDataUrl(file, 400);
                salvarImagem(chave, dataUrl);
                document.getElementById(`preview_${chave}`).src = dataUrl;
                // Atualiza a imagem correspondente no cardápio
                carregarImagemNaTela(chave, `img${chave.charAt(0).toUpperCase() + chave.slice(1)}`);
                input.value = '';
            } catch (e) {
                alert('Erro ao processar imagem: ' + e);
            }
        });
    });

    // Ingredientes
    renderizarAdminIngredientes();

    document.getElementById('btnAddIngrediente').addEventListener('click', () => {
        const ingredientes = obterIngredientes();
        ingredientes.push('');
        salvarIngredientes(ingredientes);
        renderizarAdminIngredientes();
    });

    document.getElementById('btnSalvarIngredientes').addEventListener('click', () => {
        const inputs = document.querySelectorAll('.admin-ingredientes input');
        const novos = Array.from(inputs).map(inp => inp.value.trim()).filter(v => v);
        salvarIngredientes(novos);
        exibirIngredientesNaTela(); // atualiza o cardápio principal
        document.getElementById('msgAdmin').textContent = 'Ingredientes salvos!';
        setTimeout(() => document.getElementById('msgAdmin').textContent = '', 3000);
    });
}

function renderizarAdminIngredientes() {
    const container = document.getElementById('listaAdminIngredientes');
    if (!container) return;
    const ingredientes = obterIngredientes();
    container.innerHTML = ingredientes.map((ing, i) => `
        <div class="ing-item">
            <input type="text" value="${ing.replace(/"/g, '&quot;')}" data-index="${i}">
            <button class="btn-remover-ing" data-index="${i}">✕</button>
        </div>
    `).join('');

    // Remover ingrediente
    container.querySelectorAll('.btn-remover-ing').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            const ingrs = obterIngredientes();
            ingrs.splice(idx, 1);
            salvarIngredientes(ingrs);
            renderizarAdminIngredientes();
        });
    });

    // Atualizar array enquanto digita (não é obrigatório, mas deixa o estado consistente)
    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            const ingrs = obterIngredientes();
            const idx = parseInt(input.dataset.index);
            ingrs[idx] = input.value;
            salvarIngredientes(ingrs); // salva a cada alteração (pode ser pesado, mas é simples)
        });
    });
}

function abrirModalAdmin() {
    criarModalAdmin();
    document.getElementById('modalAdminOverlay').style.display = 'flex';
}

function fecharModalAdmin() {
    document.getElementById('modalAdminOverlay').style.display = 'none';
}