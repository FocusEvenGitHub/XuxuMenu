// js/cardapio.js

// ===================== LOCAL STORAGE =====================
const STORAGE_KEYS = {
    pratoDia: 'img_pratoDia',
    salada: 'img_salada',
    luis: 'img_luis',
    barca: 'img_barca',
    ingredientes: 'ingredientes_pratoDia',
    precoPratoDia: 'preco_pratoDia'
};

// ---------- PREÇO ----------
function obterPrecoPratoDia() {
    return localStorage.getItem(STORAGE_KEYS.precoPratoDia) || '20,00';
}

function salvarPrecoPratoDia(preco) {
    localStorage.setItem(STORAGE_KEYS.precoPratoDia, preco);
}

function atualizarPrecoNaTela() {
    const el = document.getElementById('precoPratoDia');
    if (el) el.textContent = obterPrecoPratoDia();
}

// ---------- IMAGENS (redimensionamento e conversão para base64) ----------
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

function salvarImagem(chave, dataUrl) {
    localStorage.setItem(STORAGE_KEYS[chave], dataUrl);
}

function obterImagem(chave) {
    return localStorage.getItem(STORAGE_KEYS[chave]);
}

function carregarImagemNaTela(chave, idImg) {
    const dataUrl = obterImagem(chave);
    const img = document.getElementById(idImg);
    if (dataUrl && img) img.src = dataUrl;
}

function atualizarTodasImagens() {
    carregarImagemNaTela('pratoDia', 'imgPratoDia');
    carregarImagemNaTela('salada', 'imgSalada');
    carregarImagemNaTela('luis', 'imgLuis');
    carregarImagemNaTela('barca', 'imgBarca');
}

// ---------- INGREDIENTES ----------
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
    atualizarPrecoNaTela();
    prepararModalAdmin();
});

// ================== MODAL ADMIN ==================
function prepararModalAdmin() {
    const logo = document.querySelector('.logo');
    if (!logo) return;
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', abrirModalAdmin);
}

// Chaves das imagens usadas no modal
const CHAVES_IMAGENS = ['pratoDia', 'salada', 'luis', 'barca'];

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
                ${CHAVES_IMAGENS.map(chave => `
                    <div class="admin-img-item">
                        <label>${chave === 'pratoDia' ? 'Prato do Dia' : chave.charAt(0).toUpperCase() + chave.slice(1)}</label>
                        <img id="preview_${chave}" src="${obterImagem(chave) || ''}" alt="">
                        <input type="file" accept="image/*" id="input_${chave}">
                    </div>
                `).join('')}
            </div>

            <h3>🥘 Ingredientes do Prato do Dia</h3>
            <div id="listaAdminIngredientes" class="admin-ingredientes"></div>
            <button id="btnAddIngrediente">+ Adicionar</button>

            <h3>💰 Preço do Prato do Dia</h3>
            <div style="display:flex; gap:10px; align-items:center; margin-bottom:20px;">
                <input type="text" id="inputPrecoPratoDia" value="${obterPrecoPratoDia()}" placeholder="ex: 20,00" style="width:120px;">
            </div>

            <button id="btnSalvarTudo" style="display:block; margin: 20px auto 0; padding: 10px 30px; font-size: 18px;">💾 Salvar Tudo</button>
            <div id="msgAdmin" style="color:green; text-align:center; margin-top:10px;"></div>
        </div>
    `;

    // Adiciona ao DOM
    document.body.appendChild(overlay);

    // Fechar modal
    document.getElementById('fecharModal').addEventListener('click', fecharModalAdmin);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) fecharModalAdmin();
    });

    // Renderizar ingredientes
    renderizarAdminIngredientes();

    // Adicionar novo ingrediente (apenas adiciona à lista, não salva)
    document.getElementById('btnAddIngrediente').addEventListener('click', () => {
        const container = document.getElementById('listaAdminIngredientes');
        const div = document.createElement('div');
        div.className = 'ing-item';
        div.innerHTML = `
            <input type="text" value="" placeholder="Novo ingrediente">
            <button class="btn-remover-ing">✕</button>
        `;
        container.appendChild(div);
        // Adiciona evento de remover ao botão recém-criado
        div.querySelector('.btn-remover-ing').addEventListener('click', () => div.remove());
        // Atualiza o array temporário ao digitar (não salva no storage ainda)
        const input = div.querySelector('input');
        input.addEventListener('input', () => {
            // Não é necessário fazer nada aqui, apenas manter consistência visual
        });
    });

    // Botão "Salvar Tudo"
    document.getElementById('btnSalvarTudo').addEventListener('click', async () => {
        const msg = document.getElementById('msgAdmin');
        msg.textContent = 'Salvando...';
        msg.style.color = 'blue';

        try {
            // 1. Processar imagens
            for (const chave of CHAVES_IMAGENS) {
                const input = document.getElementById(`input_${chave}`);
                if (input.files && input.files[0]) {
                    const file = input.files[0];
                    const dataUrl = await fileToDataUrl(file, 400);
                    salvarImagem(chave, dataUrl);
                    // Atualiza preview
                    document.getElementById(`preview_${chave}`).src = dataUrl;
                    // Limpa o input
                    input.value = '';
                }
                // Se não selecionou arquivo, mantém a imagem atual
            }

            // 2. Salvar ingredientes
            const inputsIngredientes = document.querySelectorAll('#listaAdminIngredientes input');
            const novosIngredientes = Array.from(inputsIngredientes)
                .map(inp => inp.value.trim())
                .filter(v => v !== '');
            salvarIngredientes(novosIngredientes);

            // 3. Salvar preço
            const inputPreco = document.getElementById('inputPrecoPratoDia');
            let novoPreco = inputPreco.value.replace(',', '.').trim();
            if (novoPreco && !isNaN(parseFloat(novoPreco))) {
                const formatado = parseFloat(novoPreco).toFixed(2).replace('.', ',');
                salvarPrecoPratoDia(formatado);
            } else if (novoPreco === '') {
                // Mantém o preço atual, não faz nada
            } else {
                alert('Preço inválido. Use formato como 20,00');
                msg.textContent = 'Erro: preço inválido. Corrija e tente novamente.';
                msg.style.color = 'red';
                return;
            }

            // 4. Atualizar a página principal
            atualizarTodasImagens();
            exibirIngredientesNaTela();
            atualizarPrecoNaTela();

            msg.textContent = 'Tudo salvo com sucesso!';
            msg.style.color = 'green';
            setTimeout(() => msg.textContent = '', 3000);

            // Re-renderizar ingredientes no modal para refletir o estado salvo (limpa os inputs?)
            // Apenas mantenha a lista como estava, mas atualize a referência interna
            renderizarAdminIngredientes();
        } catch (err) {
            console.error(err);
            msg.textContent = 'Erro ao salvar. Verifique o console.';
            msg.style.color = 'red';
        }
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

    // Remover ingrediente (apenas da lista visual, não salva ainda)
    container.querySelectorAll('.btn-remover-ing').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            const ingrs = obterIngredientes();
            ingrs.splice(idx, 1);
            salvarIngredientes(ingrs); // Atualiza o storage imediatamente para manter consistência
            renderizarAdminIngredientes();
        });
    });

    // Atualizar ingrediente enquanto digita (já salva no storage em tempo real)
    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            const ingrs = obterIngredientes();
            const idx = parseInt(input.dataset.index);
            if (!isNaN(idx)) {
                ingrs[idx] = input.value;
                salvarIngredientes(ingrs);
            }
        });
    });
}

document.getElementById('tituloCardapio').addEventListener('click', () => {
    // Se o modal admin estiver aberto, feche-o antes de imprimir
    const modal = document.getElementById('modalAdminOverlay');
    if (modal && modal.style.display === 'flex') {
        modal.style.display = 'none';
    }
    window.print();
});

function abrirModalAdmin() {
    criarModalAdmin();
    document.getElementById('modalAdminOverlay').style.display = 'flex';
}

function fecharModalAdmin() {
    document.getElementById('modalAdminOverlay').style.display = 'none';
}