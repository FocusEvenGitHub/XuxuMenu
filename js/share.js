// js/share.js
// Gera uma imagem do cardápio (900×1600, igual à tela do caixa) e ajuda a postar no Instagram.
//
// Fluxo:
//   1. Admin → "📸 Postar no Instagram"
//   2. A imagem é gerada e aparece numa pré-visualização
//   3. Celular: botão "Compartilhar" abre o menu do sistema → Instagram → Story
//      PC: botão "Baixar e abrir" salva o JPG e abre o Meta Business Suite
//
// Depende de js/vendor/html-to-image.js (carregado no index.html, expõe window.htmlToImage).

// Página aberta no PC depois de baixar a imagem.
// O Meta Business Suite permite publicar Stories pelo computador (o instagram.com não).
const LINK_POSTAR_PC = 'https://business.facebook.com/';

// Tamanho exato do layout (feito pixel a pixel para a tela do caixa).
// 900×1600 já é 9:16, o formato de Story; o Instagram ajusta a resolução sozinho.
const LARGURA = 900;
const ALTURA = 1600;
const ESCALA = 1;

let arquivoAtual = null;
let urlAtual = null;

// ─── API pública ───────────────────────────────────────

export async function abrirPostagemInstagram() {
  criarOverlay();
  mostrarEstado('gerando');

  try {
    const blob = await gerarImagemCardapio();
    arquivoAtual = new File([blob], nomeArquivo(), { type: 'image/jpeg' });

    if (urlAtual) URL.revokeObjectURL(urlAtual);
    urlAtual = URL.createObjectURL(blob);
    document.getElementById('shareImgPreview').src = urlAtual;

    mostrarEstado('pronto');
  } catch (err) {
    console.error('Erro ao gerar imagem do cardápio:', err);
    mostrarEstado('erro');
  }
}

// ─── Geração da imagem ─────────────────────────────────

export async function gerarImagemCardapio() {
  const lib = window.htmlToImage;
  if (!lib) throw new Error('html-to-image não carregado');

  const node = document.querySelector('.cardapio');
  if (!node) throw new Error('Elemento .cardapio não encontrado');

  // Garante fontes e imagens prontas antes de "fotografar"
  if (document.fonts?.ready) await document.fonts.ready;
  await Promise.all(Array.from(node.querySelectorAll('img')).map(esperarImagem));

  const opcoes = {
    width: LARGURA,
    height: ALTURA,
    canvasWidth: LARGURA * ESCALA,
    canvasHeight: ALTURA * ESCALA,
    pixelRatio: 1,
    quality: 0.92,
    backgroundColor: getComputedStyle(node).backgroundColor || '#490408',
    cacheBust: false,
    style: { boxShadow: 'none', borderRadius: '0', margin: '0' }
  };

  // O Safari às vezes omite imagens na primeira captura; a segunda sai completa.
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    await lib.toJpeg(node, opcoes);
  }

  const dataUrl = await lib.toJpeg(node, opcoes);
  return dataUrlParaBlob(dataUrl);
}

function esperarImagem(img) {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise(resolve => {
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  });
}

function dataUrlParaBlob(dataUrl) {
  const [cabecalho, base64] = dataUrl.split(',');
  const mime = cabecalho.match(/:(.*?);/)[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function nomeArquivo() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `cardapio-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.jpg`;
}

// ─── Ações ─────────────────────────────────────────────

function podeCompartilharArquivo() {
  // Só usa o menu de compartilhar em celular/tablet: no PC ele não leva ao Instagram.
  const toque = window.matchMedia('(pointer: coarse)').matches;
  return toque && !!arquivoAtual && !!navigator.canShare?.({ files: [arquivoAtual] });
}

async function compartilhar() {
  // Chamado direto no clique (o navegador exige um toque recente do usuário)
  try {
    await navigator.share({ files: [arquivoAtual] });
    fecharOverlay();
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error(err);
      baixar();
    }
  }
}

function baixar() {
  const a = document.createElement('a');
  a.href = urlAtual;
  a.download = arquivoAtual.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function baixarEAbrir() {
  baixar();
  window.open(LINK_POSTAR_PC, '_blank', 'noopener');
  mostrarEstado('baixado');
}

// ─── Interface (overlay de pré-visualização) ───────────

function criarOverlay() {
  if (document.getElementById('shareOverlay')) {
    document.getElementById('shareOverlay').style.display = 'flex';
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'shareOverlay';
  overlay.className = 'share-overlay';
  overlay.innerHTML = `
    <div class="share-box">
      <span class="modal-fechar" data-acao="fechar">&times;</span>
      <h2>📸 Postar no Instagram</h2>

      <div class="share-estado" data-estado="gerando">
        <div class="share-spinner"></div>
        <p>Gerando a imagem do card&aacute;pio...</p>
      </div>

      <div class="share-estado" data-estado="erro">
        <p>❌ N&atilde;o foi poss&iacute;vel gerar a imagem.</p>
        <button data-acao="tentar">Tentar de novo</button>
      </div>

      <div class="share-estado" data-estado="pronto baixado">
        <img id="shareImgPreview" class="share-preview" alt="Pr&eacute;via do card&aacute;pio">

        <div class="share-acoes" data-so="celular">
          <button class="share-btn-principal" data-acao="compartilhar">📤 Compartilhar no Instagram</button>
          <p class="share-dica">No menu que abrir, toque em <b>Instagram</b> e escolha <b>Story</b>.</p>
          <button class="share-btn-secundario" data-acao="baixar">⬇️ S&oacute; baixar a imagem</button>
        </div>

        <div class="share-acoes" data-so="pc">
          <button class="share-btn-principal" data-acao="baixar-abrir">⬇️ Baixar e abrir o Instagram</button>
          <p class="share-dica" data-estado-dica="pronto">
            A imagem ser&aacute; salva em <b>Downloads</b> e o Meta Business Suite vai abrir.
          </p>
          <p class="share-dica share-dica-ok" data-estado-dica="baixado">
            ✅ Imagem salva em <b>Downloads</b>.<br>
            No Meta Business Suite, crie um <b>Story</b> e escolha o arquivo
            <b data-campo="nome-arquivo"></b>.
          </p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) return fecharOverlay();
    const acao = e.target.closest('[data-acao]')?.dataset.acao;
    if (acao === 'fechar') fecharOverlay();
    if (acao === 'tentar') abrirPostagemInstagram();
    if (acao === 'compartilhar') compartilhar();
    if (acao === 'baixar') baixar();
    if (acao === 'baixar-abrir') baixarEAbrir();
  });

  overlay.style.display = 'flex';
}

function mostrarEstado(estado) {
  const overlay = document.getElementById('shareOverlay');
  if (!overlay) return;

  overlay.querySelectorAll('.share-estado').forEach(el => {
    el.style.display = el.dataset.estado.split(' ').includes(estado) ? '' : 'none';
  });

  const celular = podeCompartilharArquivo();
  overlay.querySelector('[data-so="celular"]').style.display = celular ? '' : 'none';
  overlay.querySelector('[data-so="pc"]').style.display = celular ? 'none' : '';

  overlay.querySelectorAll('[data-estado-dica]').forEach(el => {
    el.style.display = el.dataset.estadoDica === estado ? '' : 'none';
  });

  const nome = overlay.querySelector('[data-campo="nome-arquivo"]');
  if (nome && arquivoAtual) nome.textContent = arquivoAtual.name;
}

function fecharOverlay() {
  const overlay = document.getElementById('shareOverlay');
  if (overlay) overlay.style.display = 'none';
}
