// js/ui.js
// Renders the menu card from data

import { getData, getImage } from './storage.js';

export function renderCardapio() {
  const data = getData();
  renderAllProducts(data);
  renderFooter(data);
  renderAllImages();
}

function renderAllProducts(data) {
  data.products.forEach(product => renderProduct(product));
}

function renderProduct(product) {
  const article = document.querySelector(`[data-id="${product.id}"]`);
  if (!article) return;

  // Name
  const nameEl = article.querySelector('[data-field="name"]');
  if (nameEl) nameEl.textContent = product.name;

  switch (product.id) {
    case 'pratoDia':
      renderPratoDia(product, article);
      break;
    case 'picadinho':
      renderPicadinho(product, article);
      break;
    case 'salada':
      renderSalada(product, article);
      break;
    case 'parmegiana':
    case 'luis':
    case 'barca':
      renderProductWithVariants(product, article);
      break;
  }
}

function renderPratoDia(product, article) {
  // Price
  const priceEl = article.querySelector('[data-field="price"]');
  if (priceEl) priceEl.textContent = product.price;

  // Ingredients list
  const listEl = article.querySelector('[data-field="ingredients"]');
  if (listEl) {
    listEl.innerHTML = product.ingredients
      .map(i => `<li>${i}</li>`)
      .join('');
  }
}

function renderPicadinho(product, article) {
  // Subtitle
  const subEl = article.querySelector('[data-field="subtitle"]');
  if (subEl) subEl.textContent = product.subtitle || '';

  // Price
  const priceEl = article.querySelector('[data-field="price"]');
  if (priceEl) priceEl.textContent = `R$${product.price}`;

  // Items list
  const itemsEl = article.querySelector('[data-field="items"]');
  if (itemsEl) {
    itemsEl.innerHTML = product.items
      .map(i => `<div class="linha-item">${i} <span></span></div>`)
      .join('');
  }
}

function renderSalada(product, article) {
  // Variants
  const variantsEl = article.querySelector('[data-field="variants"]');
  if (variantsEl) {
    variantsEl.innerHTML = product.variants
      .map(v => `<p>${v.label} <strong>R$${v.price}</strong></p>`)
      .join('');
  }

  // Ingredients title
  const titleEl = article.querySelector('[data-field="ingredientsTitle"]');
  if (titleEl) titleEl.textContent = product.ingredientsTitle || '';

  // Ingredients grid
  const ingsEl = article.querySelector('[data-field="ingredients"]');
  if (ingsEl) {
    ingsEl.innerHTML = product.ingredients
      .map(i => `<div>${i}</div>`)
      .join('');
  }
}

function renderProductWithVariants(product, article) {
  // Variants
  const variantsEl = article.querySelector('[data-field="variants"]');
  if (variantsEl) {
    variantsEl.innerHTML = product.variants
      .map(v => `<p>${v.label} <strong>R$${v.price}</strong></p>`)
      .join('');
  }

  // Items list
  const itemsEl = article.querySelector('[data-field="items"]');
  if (itemsEl) {
    itemsEl.innerHTML = product.items
      .map(i => `<div class="linha-item">${i} <span></span></div>`)
      .join('');
  }
}

function renderFooter(data) {
  // Footer title
  const titleEl = document.querySelector('[data-field="footer-title"]');
  if (titleEl) titleEl.textContent = data.footer.title;

  // Footer items
  const itemsEl = document.querySelector('[data-field="footer-items"]');
  if (itemsEl) {
    itemsEl.innerHTML = data.footer.items
      .map(item => `
        <div class="adicional">
          <span>${item.name}</span>
          <span class="linha"></span>
          <span class="preco">R$ ${item.price}</span>
        </div>
      `)
      .join('');
  }
}

function renderAllImages() {
  const productIds = ['pratoDia', 'picadinho', 'parmegiana', 'salada', 'luis', 'barca'];
  productIds.forEach(id => {
    const dataUrl = getImage(id);
    const img = document.querySelector(`[data-img="${id}"]`);
    if (dataUrl && img) {
      img.src = dataUrl;
    }
  });
}
