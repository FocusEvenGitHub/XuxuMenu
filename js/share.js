// js/share.js
// Gera uma imagem do cardápio (900×1600, igual à tela do caixa) para baixar no PC
// ou levar para o celular por QR Code.
//
// Fluxo:
//   1. Admin → "Baixar / Compartilhar Cardápio"
//   2. A imagem é gerada e aparece numa pré-visualização
//   3. "Baixar no computador": salva o JPG na pasta Downloads
//      "Enviar para o celular": envia o JPG ao servidor local (iniciar.ps1), que devolve
//      um link temporário na rede Wi-Fi; o link vira um QR Code para o celular escanear.
//
// Depende de (carregados no index.html):
//   js/vendor/html-to-image.js → window.htmlToImage (captura da tela)
//   js/vendor/qrcode.js        → window.qrcode      (QR Code, funciona sem internet)

// Tamanho exato do layout (feito pixel a pixel para a tela do caixa).
const LARGURA = 900;
const ALTURA = 1600;
const ESCALA = 1;

let arquivoAtual = null;
let urlAtual = null;

// ─── API pública ───────────────────────────────────────

export async function abrirCompartilharCardapio() {
  clearInterval(timerValidade);
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

let timerValidade = null;

function baixar() {
  const a = document.createElement('a');
  a.href = urlAtual;
  a.download = arquivoAtual.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  mostrarEstado('baixado');
}

async function enviarParaCelular() {
  mostrarEstado('enviando');

  let resposta, dados = {};
  try {
    resposta = await fetch('/api/compartilhar', {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg', 'X-XuxuMenu': '1' },
      body: arquivoAtual
    });
    dados = await resposta.json().catch(() => ({}));
  } catch (err) {
    console.error(err);
    return mostrarErroCelular('servidor');
  }

  if (!resposta.ok || !dados.url) {
    // 404/405/501: página aberta sem o iniciar.bat (Live Server, Python...)
    const codigo = dados.erro || ([404, 405, 501].includes(resposta.status) ? 'servidor' : 'desconhecido');
    return mostrarErroCelular(codigo, dados);
  }

  mostrarQrCode(dados.url, dados.validadeSegundos || 600);
}

function mostrarQrCode(url, validadeSegundos) {
  const qr = window.qrcode(0, 'M');
  qr.addData(url);
  qr.make();

  const overlay = document.getElementById('shareOverlay');
  overlay.querySelector('[data-campo="qr"]').innerHTML =
    qr.createSvgTag({ cellSize: 6, margin: 4, scalable: true, alt: 'QR Code do cardápio' });
  overlay.querySelector('[data-campo="url"]').textContent = url;
  mostrarEstado('celular');

  // Contagem regressiva da validade do link
  const fim = Date.now() + validadeSegundos * 1000;
  const campo = overlay.querySelector('[data-campo="validade"]');
  clearInterval(timerValidade);
  const atualizar = () => {
    const resta = Math.max(0, Math.round((fim - Date.now()) / 1000));
    campo.textContent = `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`;
    if (resta === 0) {
      clearInterval(timerValidade);
      mostrarErroCelular('expirado');
    }
  };
  atualizar();
  timerValidade = setInterval(atualizar, 1000);
}

const MENSAGENS_ERRO = {
  servidor:      'Não foi possível falar com o servidor do cardápio. Abra o cardápio pelo <b>iniciar.bat</b> e tente de novo.',
  sem_rede:      'Este computador não está conectado a nenhuma rede (Wi-Fi ou cabo). Conecte-o e tente de novo.',
  porta_ocupada: 'A porta {porta} já está sendo usada por outro programa. Feche o cardápio (parar.bat), abra de novo pelo iniciar.bat e tente outra vez.',
  tamanho:       'A imagem ficou grande demais para enviar.',
  expirado:      'O QR Code expirou. Gere um novo para continuar.',
  desconhecido:  'Algo deu errado ao preparar o QR Code. Tente de novo.'
};

function mostrarErroCelular(codigo, dados = {}) {
  clearInterval(timerValidade);
  const texto = (MENSAGENS_ERRO[codigo] || MENSAGENS_ERRO.desconhecido)
    .replace('{porta}', dados.porta || '8091');
  const overlay = document.getElementById('shareOverlay');
  overlay.querySelector('[data-campo="erro-celular"]').innerHTML = texto;
  overlay.querySelector('[data-acao="enviar-celular"][data-tentar]').textContent =
    codigo === 'expirado' ? '🔄 Gerar novo QR Code' : '🔄 Tentar de novo';
  mostrarEstado('celular-erro');
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
      <h2>Baixar / Compartilhar</h2>

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
        <div class="share-acoes">
          <button class="share-btn-principal" data-acao="baixar">💻 Baixar no computador</button>
          <button class="share-btn-principal" data-acao="enviar-celular">📱 Enviar para o celular</button>
          <p class="share-dica share-dica-ok" data-estado-dica="baixado">
            ✅ Imagem salva na pasta <b>Downloads</b> (<span data-campo="nome-arquivo"></span>).
          </p>
        </div>
      </div>

      <div class="share-estado" data-estado="enviando">
        <div class="share-spinner"></div>
        <p>Preparando o QR Code...</p>
      </div>

      <div class="share-estado" data-estado="celular">
        <div class="share-qr" data-campo="qr"></div>
        <p class="share-dica"><b>Aponte a c&acirc;mera do celular para o QR Code</b> e toque em <b>Baixar imagem</b>.</p>
        <p class="share-dica">O celular precisa estar no <b>mesmo Wi-Fi</b> deste computador.
          V&aacute;lido por <b data-campo="validade"></b>.</p>
        <details class="share-ajuda">
          <summary>O celular n&atilde;o abriu a p&aacute;gina?</summary>
          <ul>
            <li>Confira se o celular est&aacute; no Wi-Fi da loja, e n&atilde;o nos dados m&oacute;veis.</li>
            <li>Na primeira vez, o Windows pode mostrar um aviso do <b>Firewall</b>: clique em <b>Permitir acesso</b>.
              Se o aviso n&atilde;o apareceu ou foi recusado, veja o readme.</li>
            <li>Voc&ecirc; tamb&eacute;m pode digitar o endere&ccedil;o no navegador do celular:<br>
              <code data-campo="url"></code></li>
          </ul>
        </details>
        <button class="share-btn-secundario" data-acao="voltar">← Voltar</button>
      </div>

      <div class="share-estado" data-estado="celular-erro">
        <p class="share-erro" data-campo="erro-celular"></p>
        <div class="share-acoes">
          <button class="share-btn-principal" data-acao="enviar-celular" data-tentar>🔄 Tentar de novo</button>
          <button class="share-btn-secundario" data-acao="voltar">← Voltar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) return fecharOverlay();
    const acao = e.target.closest('[data-acao]')?.dataset.acao;
    if (acao === 'fechar') fecharOverlay();
    if (acao === 'tentar') abrirCompartilharCardapio();
    if (acao === 'baixar') baixar();
    if (acao === 'enviar-celular') enviarParaCelular();
    if (acao === 'voltar') { clearInterval(timerValidade); mostrarEstado('pronto'); }
  });

  overlay.style.display = 'flex';
}

function mostrarEstado(estado) {
  const overlay = document.getElementById('shareOverlay');
  if (!overlay) return;

  overlay.querySelectorAll('.share-estado').forEach(el => {
    el.style.display = el.dataset.estado.split(' ').includes(estado) ? '' : 'none';
  });

  overlay.querySelectorAll('[data-estado-dica]').forEach(el => {
    el.style.display = el.dataset.estadoDica === estado ? '' : 'none';
  });

  const nome = overlay.querySelector('[data-campo="nome-arquivo"]');
  if (nome && arquivoAtual) nome.textContent = arquivoAtual.name;
}

function fecharOverlay() {
  clearInterval(timerValidade);
  const overlay = document.getElementById('shareOverlay');
  if (overlay) overlay.style.display = 'none';
}
