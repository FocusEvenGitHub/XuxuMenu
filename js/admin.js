// js/admin.js
// Admin modal with 7 tabs (6 products + Adicionais)

import { getData, setData, getImage, saveImage, fileToDataUrl } from './storage.js';
import { renderCardapio } from './ui.js';

const PRODUCT_IDS = ['pratoDia', 'picadinho', 'parmegiana', 'salada', 'luis', 'barca'];

const TAB_LABELS = {
  pratoDia:   '🥘 Prato Dia',
  picadinho:  '🥩 Picadinho',
  parmegiana: '🧀 Parmegiana',
  salada:     '🥗 Salada',
  luis:       '🍖 Luís',
  barca:      '🍛 Barça'
};

// ─── Open / Close ──────────────────────────────────────

export function prepararModalAdmin() {
  const logo = document.querySelector('.logo');
  if (!logo) return;
  logo.style.cursor = 'pointer';
  logo.addEventListener('click', abrirModalAdmin);
}

function abrirModalAdmin() {
  criarModalAdmin();
  const overlay = document.getElementById('modalAdminOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function fecharModalAdmin() {
  const overlay = document.getElementById('modalAdminOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ─── Create modal ──────────────────────────────────────

function criarModalAdmin() {
  if (document.getElementById('modalAdminOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'modalAdminOverlay';
  overlay.className = 'modal-overlay';

  // Build tabs HTML
  const tabsHtml = PRODUCT_IDS
    .map(id => `<button class="admin-tab" data-tab="${id}">${TAB_LABELS[id]}</button>`)
    .join('') +
    `<button class="admin-tab" data-tab="adicionais">➕ Adicionais</button>`;

  // Build content panels HTML
  const contentHtml = PRODUCT_IDS
    .map(id => `<div class="admin-content" id="content-${id}"></div>`)
    .join('') +
    `<div class="admin-content" id="content-adicionais"></div>`;

  overlay.innerHTML = `
    <div class="modal-admin">
      <span class="modal-fechar" id="fecharModal">&times;</span>
      <h2>⚙️ Administra&ccedil;&atilde;o</h2>

      <div class="admin-tabs" id="adminTabs">${tabsHtml}</div>

      <div class="admin-contents">${contentHtml}</div>

      <div style="text-align:center; margin-top:24px;">
        <button id="btnSalvarTudo" style="padding:12px 40px; font-size:18px;">💾 Salvar Tudo</button>
      </div>
      <div id="msgAdmin" style="text-align:center; margin-top:10px; font-weight:bold;"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close events
  document.getElementById('fecharModal').addEventListener('click', fecharModalAdmin);
  overlay.addEventListener('click', e => { if (e.target === overlay) fecharModalAdmin(); });

  // Tab switching
  overlay.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Fill initial content
  renderAllTabs();

  // Save button
  document.getElementById('btnSalvarTudo').addEventListener('click', salvarTudo);

  // Start on first tab
  switchTab('pratoDia');
}

// ─── Tab switching ─────────────────────────────────────

function switchTab(tabId) {
  // Update tab buttons
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  // Show corresponding content panel
  document.querySelectorAll('.admin-content').forEach(el => {
    el.style.display = el.id === `content-${tabId}` ? 'block' : 'none';
  });
}

// ─── Render all tab contents ───────────────────────────

function renderAllTabs() {
  const data = getData();

  PRODUCT_IDS.forEach(id => {
    const product = data.products.find(p => p.id === id);
    if (product) renderProductTab(id, product);
  });

  renderAdicionaisTab(data);
}

// ─── Render a single product tab ───────────────────────

function renderProductTab(id, product) {
  const container = document.getElementById(`content-${id}`);
  if (!container) return;

  const imgDataUrl = getImage(id);

  let html = `
    <!-- Image -->
    <div class="admin-img-item">
      <label>Imagem</label>
      <img id="preview_${id}" src="${imgDataUrl || ''}" alt="">
      <input type="file" accept="image/*" id="input_${id}">
    </div>

    <!-- Name -->
    <div class="admin-field">
      <label>Nome</label>
      <input type="text" class="admin-input" data-prod="${id}" data-field="name"
             value="${escAttr(product.name)}">
    </div>
  `;

  switch (id) {
    case 'pratoDia':
      html += `
        <div class="admin-field">
          <label>Pre&ccedil;o Adulto</label>
          <input type="text" class="admin-input" data-prod="${id}" data-field="price"
                 value="${escAttr(product.price)}">
        </div>
        <div class="admin-field">
          <label>Pre&ccedil;o Kids</label>
          <input type="text" class="admin-input" data-prod="${id}" data-field="priceKids"
                 value="${escAttr(product.priceKids || '')}">
        </div>
        <div class="admin-field">
          <label>Ingredientes</label>
          <div class="dynamic-list" id="list_${id}_ingredients">
            ${product.ingredients.map(ing => `
              <div class="list-item">
                <input type="text" class="list-input" value="${escAttr(ing)}">
                <button class="btn-remove-list-item">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="btn-add-list-item" data-prod="${id}" data-list="ingredients">+ Adicionar</button>
        </div>
      `;
      break;

    case 'picadinho':
      html += `
        <div class="admin-field">
          <label>Subt&iacute;tulo</label>
          <input type="text" class="admin-input" data-prod="${id}" data-field="subtitle"
                 value="${escAttr(product.subtitle || '')}">
        </div>
        <div class="admin-field">
          <label>Pre&ccedil;o</label>
          <input type="text" class="admin-input" data-prod="${id}" data-field="price"
                 value="${escAttr(product.price)}">
        </div>
        <div class="admin-field">
          <label>Itens</label>
          <div class="dynamic-list" id="list_${id}_items">
            ${product.items.map(item => `
              <div class="list-item">
                <input type="text" class="list-input" value="${escAttr(item)}">
                <button class="btn-remove-list-item">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="btn-add-list-item" data-prod="${id}" data-list="items">+ Adicionar</button>
        </div>
      `;
      break;

    case 'salada':
      html += `
        <div class="admin-field">
          <label>Variantes (prote&iacute;nas)</label>
          <div class="dynamic-list" id="list_${id}_variants">
            ${product.variants.map(v => `
              <div class="list-item variant-item">
                <input type="text" class="variant-label" value="${escAttr(v.label)}" placeholder="Ex: Frango">
                <input type="text" class="variant-price" value="${escAttr(v.price)}" placeholder="Pre&ccedil;o">
                <button class="btn-remove-list-item">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="btn-add-list-item" data-prod="${id}" data-list="variants">+ Adicionar variante</button>
        </div>
        <div class="admin-field">
          <label>T&iacute;tulo dos Ingredientes</label>
          <input type="text" class="admin-input" data-prod="${id}" data-field="ingredientsTitle"
                 value="${escAttr(product.ingredientsTitle || '')}">
        </div>
        <div class="admin-field">
          <label>Ingredientes</label>
          <div class="dynamic-list" id="list_${id}_ingredients">
            ${product.ingredients.map(ing => `
              <div class="list-item">
                <input type="text" class="list-input" value="${escAttr(ing)}">
                <button class="btn-remove-list-item">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="btn-add-list-item" data-prod="${id}" data-list="ingredients">+ Adicionar</button>
        </div>
      `;
      break;

    // parmegiana, luis, barca
    default:
      html += `
        <div class="admin-field">
          <label>Variantes (prote&iacute;nas)</label>
          <div class="dynamic-list" id="list_${id}_variants">
            ${product.variants.map(v => `
              <div class="list-item variant-item">
                <input type="text" class="variant-label" value="${escAttr(v.label)}" placeholder="Ex: Frango">
                <input type="text" class="variant-price" value="${escAttr(v.price)}" placeholder="Pre&ccedil;o">
                <button class="btn-remove-list-item">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="btn-add-list-item" data-prod="${id}" data-list="variants">+ Adicionar variante</button>
        </div>
        <div class="admin-field">
          <label>Itens</label>
          <div class="dynamic-list" id="list_${id}_items">
            ${product.items.map(item => `
              <div class="list-item">
                <input type="text" class="list-input" value="${escAttr(item)}">
                <button class="btn-remove-list-item">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="btn-add-list-item" data-prod="${id}" data-list="items">+ Adicionar</button>
        </div>
      `;
      break;
  }

  container.innerHTML = html;

  // Wire up dynamic-list add buttons
  container.querySelectorAll('.btn-add-list-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const prodId = btn.dataset.prod;
      const listType = btn.dataset.list;
      addListItem(prodId, listType);
    });
  });

  // Wire up remove buttons
  container.querySelectorAll('.btn-remove-list-item').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.list-item').remove();
    });
  });
}

// ─── Render Adicionais tab ─────────────────────────────

function renderAdicionaisTab(data) {
  const container = document.getElementById('content-adicionais');
  if (!container) return;

  let html = `
    <div class="admin-field">
      <label>T&iacute;tulo da se&ccedil;&atilde;o</label>
      <input type="text" class="admin-input" data-field="footer-title"
             value="${escAttr(data.footer.title)}">
    </div>
    <div class="admin-field">
      <label>Itens</label>
      <div class="dynamic-list" id="list_footer_items">
        ${data.footer.items.map(item => `
          <div class="list-item footer-item">
            <input type="text" class="footer-name" value="${escAttr(item.name)}" placeholder="Nome">
            <input type="text" class="footer-price" value="${escAttr(item.price)}" placeholder="Pre&ccedil;o">
            <button class="btn-remove-list-item">✕</button>
          </div>
        `).join('')}
      </div>
      <button class="btn-add-list-item" data-list="footer">+ Adicionar</button>
    </div>
  `;

  container.innerHTML = html;

  // Add button for footer
  container.querySelector('.btn-add-list-item')?.addEventListener('click', () => {
    const list = document.getElementById('list_footer_items');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'list-item footer-item';
    div.innerHTML = `
      <input type="text" class="footer-name" value="" placeholder="Nome">
      <input type="text" class="footer-price" value="" placeholder="Pre&ccedil;o">
      <button class="btn-remove-list-item">✕</button>
    `;
    list.appendChild(div);
    div.querySelector('.btn-remove-list-item').addEventListener('click', () => div.remove());
  });

  // Remove buttons
  container.querySelectorAll('.btn-remove-list-item').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.list-item').remove();
    });
  });
}

// ─── Dynamic list helpers ──────────────────────────────

function addListItem(prodId, listType) {
  const list = document.getElementById(`list_${prodId}_${listType}`);
  if (!list) return;

  const div = document.createElement('div');
  div.className = 'list-item';

  if (listType === 'variants') {
    div.classList.add('variant-item');
    div.innerHTML = `
      <input type="text" class="variant-label" value="" placeholder="Ex: Frango">
      <input type="text" class="variant-price" value="" placeholder="Pre&ccedil;o">
      <button class="btn-remove-list-item">✕</button>
    `;
  } else {
    div.innerHTML = `
      <input type="text" class="list-input" value="">
      <button class="btn-remove-list-item">✕</button>
    `;
  }

  list.appendChild(div);
  div.querySelector('.btn-remove-list-item').addEventListener('click', () => div.remove());
}

// ─── Save everything ───────────────────────────────────

async function salvarTudo() {
  const msg = document.getElementById('msgAdmin');
  msg.textContent = 'Salvando...';
  msg.style.color = 'blue';

  try {
    const data = getData(); // start from current saved data

    // 1 ── Process images ──────────────────────────────
    for (const id of PRODUCT_IDS) {
      const input = document.getElementById(`input_${id}`);
      if (input && input.files && input.files[0]) {
        const dataUrl = await fileToDataUrl(input.files[0], 400);
        saveImage(id, dataUrl);
        const preview = document.getElementById(`preview_${id}`);
        if (preview) preview.src = dataUrl;
        input.value = '';
      }
    }

    // 2 ── Gather product data from DOM ────────────────
    for (const id of PRODUCT_IDS) {
      const product = data.products.find(p => p.id === id);
      if (!product) continue;

      // Simple fields
      const nameInp = document.querySelector(`[data-prod="${id}"][data-field="name"]`);
      if (nameInp) product.name = nameInp.value;

      const priceInp = document.querySelector(`[data-prod="${id}"][data-field="price"]`);
      if (priceInp) product.price = priceInp.value;

      const priceKidsInp = document.querySelector(`[data-prod="${id}"][data-field="priceKids"]`);
      if (priceKidsInp) product.priceKids = priceKidsInp.value.trim();

      const subInp = document.querySelector(`[data-prod="${id}"][data-field="subtitle"]`);
      if (subInp) product.subtitle = subInp.value;

      const ingTitleInp = document.querySelector(`[data-prod="${id}"][data-field="ingredientsTitle"]`);
      if (ingTitleInp) product.ingredientsTitle = ingTitleInp.value;

      // Dynamic lists – ingredients
      const listIng = document.getElementById(`list_${id}_ingredients`);
      if (listIng) {
        const inputs = listIng.querySelectorAll('.list-input');
        product.ingredients = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
      }

      // Dynamic lists – items
      const listItems = document.getElementById(`list_${id}_items`);
      if (listItems) {
        const inputs = listItems.querySelectorAll('.list-input');
        product.items = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
      }

      // Dynamic lists – variants
      const listVars = document.getElementById(`list_${id}_variants`);
      if (listVars) {
        const items = listVars.querySelectorAll('.variant-item');
        product.variants = Array.from(items).map(el => ({
          label: (el.querySelector('.variant-label')?.value || '').trim(),
          price: (el.querySelector('.variant-price')?.value || '').trim()
        })).filter(v => v.label || v.price);
      }
    }

    // 3 ── Footer ─────────────────────────────────────
    const ftContainer = document.getElementById('content-adicionais');
    const ftTitle = ftContainer?.querySelector('[data-field="footer-title"]');
    if (ftTitle) data.footer.title = ftTitle.value;

    const ftList = document.getElementById('list_footer_items');
    if (ftList) {
      const items = ftList.querySelectorAll('.footer-item');
      data.footer.items = Array.from(items).map(el => ({
        name: (el.querySelector('.footer-name')?.value || '').trim(),
        price: (el.querySelector('.footer-price')?.value || '').trim()
      })).filter(v => v.name || v.price);
    }

    // 4 ── Persist ────────────────────────────────────
    setData(data);

    // 5 ── Re-render menu ─────────────────────────────
    renderCardapio();

    // 6 ── Refresh admin forms ────────────────────────
    renderAllTabs();

    msg.textContent = '✅ Tudo salvo com sucesso!';
    msg.style.color = 'green';
    setTimeout(() => { msg.textContent = ''; }, 3000);
  } catch (err) {
    console.error(err);
    msg.textContent = '❌ Erro ao salvar. Verifique o console.';
    msg.style.color = 'red';
  }
}

// ─── Utility ───────────────────────────────────────────

function escAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
