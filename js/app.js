// js/app.js — Entry point
import { renderCardapio } from './ui.js';
import { prepararModalAdmin } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Render the menu from saved data (or defaults)
  renderCardapio();

  // 2. Attach admin modal to logo click
  prepararModalAdmin();

  // 3. Print on title click (existing behaviour)
  const titulo = document.getElementById('tituloCardapio');
  if (titulo) {
    titulo.addEventListener('click', () => {
      const modal = document.getElementById('modalAdminOverlay');
      if (modal && modal.style.display === 'flex') {
        modal.style.display = 'none';
      }
      window.print();
    });
  }
});
