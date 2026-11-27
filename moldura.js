// Monta a moldura comum (topo e menu) em toda tela com data-moldura, para cada protótipo trazer só o conteúdo (D-84).
// data-moldura="escritorio" usa data-usuario e data-atual (o módulo da tela, D-144); o menu mostra o módulo Administração só para o Administrador.
// data-trilha="Clientes › Carteiras" desenha, no topo do conteúdo, a trilha que começa pelo módulo (Cadastros › Clientes › Carteiras).
// data-menu-modulo="aberto" mostra a lista de rotinas do módulo aberta sob o item do menu.
// data-sessao="carregando" mostra a moldura enquanto "minha sessão" não chegou (menu e nomes em esqueleto); data-sessao="erro" mostra o aviso de sessão vencida.
// data-menu="aberto" mostra, no celular, o menu aberto pelo ☰ (gaveta com cada módulo e as suas rotinas).
// data-menu-usuario="aberto" mostra o menu do nome do usuário aberto (Minha conta › Meus dados, Aparência e Segurança, e Sair); data-menu-usuario-atual="Aparência" marca o item de onde a tela chegou.
// data-moldura="plataforma" é a moldura da equipe OrenOn, com o menu Escritórios. O tema vem de data-modo e data-cor no <html>.
// data-fundo="caminho.html" na tela de um diálogo mostra, por trás do véu, a tela de onde o usuário chegou (a própria página, num iframe);
// data-origem="Texto do botão" destaca nela o botão clicado, com uma moldura tracejada e a etiqueta "Você clicou aqui", e escurece só o resto.
// A página de fundo é aberta com #fundo=<texto>, esconde a legenda e avisa a altura e a posição do botão, para o iframe ter o tamanho dela.
// Fora do fundo, o véu é clicável como o diálogo real: clicar fora do diálogo ou apertar Esc volta à tela de origem.
document.querySelectorAll('.tela[data-fundo]').forEach((tela) => {
  if (!location.hash.startsWith('#fundo')) {
    const voltar = () => { location.href = tela.dataset.fundo; };
    tela.classList.add('volta-ao-fundo');
    tela.addEventListener('click', (evento) => { if (!evento.target.closest('.dialogo')) voltar(); });
    document.addEventListener('keydown', (evento) => { if (evento.key === 'Escape') voltar(); });
  }
  const fundo = document.createElement('iframe');
  fundo.className = 'fundo';
  const origem = tela.dataset.origem ? `=${encodeURIComponent(tela.dataset.origem)}` : '';
  fundo.src = `${tela.dataset.fundo}#fundo${origem}`;
  fundo.setAttribute('scrolling', 'no');
  fundo.setAttribute('aria-hidden', 'true');
  fundo.setAttribute('tabindex', '-1');
  tela.prepend(fundo);
  window.addEventListener('message', (evento) => {
    if (evento.source !== fundo.contentWindow || !evento.data?.alturaFundo) return;
    fundo.style.minHeight = `${evento.data.alturaFundo}px`;
    const caixa = evento.data.origem;
    if (caixa) {
      let marca = tela.querySelector('.origem');
      if (!marca) {
        marca = document.createElement('div');
        marca.className = 'origem';
        fundo.after(marca);
        tela.classList.add('com-marca');
      }
      marca.style.cssText = `left:${caixa.x - 4}px;top:${caixa.y - 4}px;width:${caixa.w + 8}px;height:${caixa.h + 8}px`;
      marca.classList.toggle('abaixo', caixa.y < 36);
      // Com o diálogo à direita (vela direita), a etiqueta fica à esquerda do botão, para não ficar atrás do diálogo.
      marca.classList.toggle('esquerda', caixa.x < 140 || !!tela.querySelector('.vela.direita'));
    }
    avisarAltura();
  });
});
// data-veio-de="caminho.html" numa tela cheia (que não é diálogo) mostra, acima dela, a tela de onde o usuário veio, em miniatura,
// com o botão de data-origem marcado ("Você clicou aqui"), para a imagem mostrar o clique que abriu a tela.
// A miniatura e o nome da tela de origem são links para ela, para navegar de volta pelos protótipos.
// data-entrada="menu|inicio|estado" diz por que a tela cheia não tem miniatura (aberta pelo menu principal, primeira tela
// de uma jornada, ou outro estado da mesma tela); o gerar-indice-telas.mjs --verificar exige uma das três marcações.
const ESCALA_MINIATURA = 0.55;
if (!location.hash.startsWith('#fundo')) document.querySelectorAll('.tela[data-veio-de]:not([data-fundo])').forEach((tela) => {
  const origem = tela.dataset.origem ?? '';
  const bloco = document.createElement('div');
  bloco.className = 'veio-de';
  bloco.innerHTML = `<p class="veio-de-titulo">Veio de: <a class="veio-de-nome" href="${tela.dataset.veioDe}"></a>${origem ? ` · clicou em <b>${origem}</b>` : ''}</p>` +
    `<a class="miniatura" href="${tela.dataset.veioDe}" title="Abrir a tela de origem"><iframe src="${tela.dataset.veioDe}#fundo=${encodeURIComponent(origem)}" scrolling="no" aria-hidden="true" tabindex="-1"></iframe></a>` +
    '<p class="veio-de-seta">↓ abre esta tela</p>';
  tela.before(bloco);
  const miniatura = bloco.querySelector('.miniatura');
  const quadro = bloco.querySelector('iframe');
  window.addEventListener('message', (evento) => {
    if (evento.source !== quadro.contentWindow || !evento.data?.alturaFundo) return;
    quadro.style.height = `${evento.data.alturaFundo}px`;
    miniatura.style.height = `${Math.ceil(evento.data.alturaFundo * ESCALA_MINIATURA)}px`;
    bloco.querySelector('.veio-de-nome').textContent = (evento.data.titulo || tela.dataset.veioDe).split(' · ')[0];
    const caixa = evento.data.origem;
    if (!caixa) return;
    let marca = miniatura.querySelector('.origem');
    if (!marca) {
      marca = document.createElement('div');
      marca.className = 'origem';
      miniatura.append(marca);
    }
    const e = ESCALA_MINIATURA;
    marca.style.cssText = `left:${caixa.x * e - 4}px;top:${caixa.y * e - 4}px;width:${caixa.w * e + 8}px;height:${caixa.h * e + 8}px`;
    marca.classList.toggle('abaixo', caixa.y * e < 36);
    marca.classList.toggle('esquerda', caixa.x * e < 140);
  });
});
function textoSemTecla(elemento) {
  const copia = elemento.cloneNode(true);
  copia.querySelectorAll('kbd').forEach((tecla) => tecla.remove());
  return copia.textContent.replace(/\s+/g, ' ').trim();
}
function localizarOrigem() {
  const alvo = decodeURIComponent((location.hash.split('=')[1] || '')).trim();
  if (!alvo) return null;
  const candidatos = [...document.querySelectorAll('.botao, .link, .abas span, nav a, .menu-usuario a, .menu-modulo a, .usuario, td, th, .busca, .resultado')];
  const achado = candidatos.find((el) => textoSemTecla(el) === alvo) || candidatos.find((el) => textoSemTecla(el).startsWith(alvo));
  if (!achado) return null;
  const r = achado.getBoundingClientRect();
  return { x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
}
function avisarAltura() {
  if (!location.hash.startsWith('#fundo') || window.parent === window) return;
  window.parent.postMessage({ alturaFundo: document.documentElement.offsetHeight, origem: localizarOrigem(), titulo: document.title }, '*');
}
if (location.hash.startsWith('#fundo')) {
  document.documentElement.classList.add('embutido');
  window.addEventListener('load', () => { avisarAltura(); setTimeout(avisarAltura, 150); setTimeout(avisarAltura, 600); });
}

// Módulos do escritório (D-144), na ordem do menu, com as rotinas de cada um. Só entra o módulo que já tem tela refinada (D-140).
// "soAdministrador" esconde o módulo de quem não tem a permissão; o protótipo usa o Administrador como exemplo dela.
const MODULOS = [
  { nome: 'Cadastros', rotinas: ['Clientes', 'Grupos de clientes'] },
  { nome: 'Administração', rotinas: ['Usuários', 'Grupos'], soAdministrador: true },
];

document.querySelectorAll('.tela[data-moldura]:not([data-fundo])').forEach((tela) => {
  const plataforma = tela.dataset.moldura === 'plataforma';
  const usuario = tela.dataset.usuario || (plataforma ? 'operador@orenon' : 'Bruno (Fiscal)');
  const modulos = MODULOS.filter((modulo) => !modulo.soAdministrador || usuario.includes('Administrador'));
  const menu = plataforma ? ['Escritórios'] : ['Início'].concat(modulos.map((modulo) => modulo.nome));
  const atual = tela.dataset.atual ?? menu[0];
  const moduloAtual = modulos.find((modulo) => modulo.nome === atual);
  // Trilha "Módulo › rotina › ... › onde está": cada nível é clicável, menos o último (D-144).
  if (moduloAtual && tela.dataset.trilha) {
    const niveis = [atual].concat(tela.dataset.trilha.split('›').map((nivel) => nivel.trim()));
    const trilha = niveis.map((nivel, i) => (i < niveis.length - 1 ? `<a>${nivel}</a>` : nivel)).join(' › ');
    tela.querySelector('main')?.insertAdjacentHTML('afterbegin', `<div class="trilha">${trilha}</div>`);
  }
  const nome = plataforma ? 'Plataforma' : 'Contabilidade Exemplo Ltda';
  const sessao = tela.dataset.sessao;
  const itens = sessao === 'carregando'
    ? '<a class="esqueleto-item"><span class="esqueleto"></span></a>'.repeat(3)
    : menu.map((item) => `<a class="${item === atual ? 'atual' : ''}">${item}</a>`).join('');
  // No celular, a gaveta lista cada módulo com as suas rotinas, para um toque levar direto à rotina.
  const rotinaAtual = (tela.dataset.trilha ?? '').split('›')[0].trim();
  const gaveta = plataforma ? itens : `<a class="${atual === 'Início' ? 'atual' : ''}">Início</a>` + modulos
    .map((modulo) => `<span class="grupo-menu">${modulo.nome}</span>` + modulo.rotinas
      .map((rotina) => `<a class="${modulo.nome === atual && rotina === rotinaAtual ? 'atual' : ''}">${rotina}</a>`)
      .join(''))
    .join('');
  const quem = sessao === 'carregando' ? '<span class="usuario"><span class="esqueleto" style="width:120px;display:inline-block"></span></span>' : `<span class="usuario">${usuario} ▾</span>`;
  const escritorio = sessao === 'carregando' ? '<span class="esqueleto" style="width:140px;display:inline-block"></span>' : nome;
  const aviso = sessao === 'erro'
    ? '<div class="aviso erro" role="alert"><b>Sua sessão venceu.</b> Entre de novo para continuar. <span class="botao">Entrar de novo</span></div>'
    : '';
  tela.insertAdjacentHTML('afterbegin',
    `<div class="topo"><span class="menu-celular" aria-label="Menu">☰</span><span class="marca">OrenOn <small>· ${escritorio}</small></span>` +
    (plataforma ? '<span class="busca" style="visibility:hidden"></span>' : '<span class="busca">Buscar… <kbd>Ctrl+K</kbd></span>') +
    `${quem}</div>${aviso}<nav>${itens}</nav>` +
    (tela.dataset.menu === 'aberto' ? `<div class="gaveta">${gaveta}</div>` : ''));
  // data-menu-modulo="aberto" mostra a lista de rotinas do módulo atual aberta sob o item do menu, com a rotina de data-trilha marcada.
  if (tela.dataset.menuModulo === 'aberto' && moduloAtual) {
    const rotinaAtual = (tela.dataset.trilha ?? '').split('›')[0].trim();
    const lista = moduloAtual.rotinas.map((rotina) => `<a class="${rotina === rotinaAtual ? 'atual' : ''}">${rotina}</a>`).join('');
    const item = [...tela.querySelectorAll('nav a')].find((a) => a.textContent === atual);
    item?.insertAdjacentHTML('afterend', `<div class="menu-modulo" role="menu" style="left:${item.offsetLeft}px">${lista}</div>`);
  }
  if (tela.dataset.menuUsuario === 'aberto') {
    const item = (nome) => `<a class="${nome === tela.dataset.menuUsuarioAtual ? 'atual' : ''}">${nome}</a>`;
    tela.querySelector('.topo').insertAdjacentHTML('beforeend', `<div class="menu-usuario" role="menu"><span class="grupo-menu">Minha conta</span>${item('Meus dados')}${item('Aparência')}${item('Segurança')}<hr>${item('Sair')}</div>`);
  }
});

// No celular, as ações secundárias do rodapé ficam atrás de um botão "Mais" (o CSS esconde as outras).
document.querySelectorAll('.rodape .acoes').forEach((acoes) => {
  if (acoes.querySelectorAll('.botao:not(.principal)').length) acoes.insertAdjacentHTML('afterbegin', '<span class="botao mais">⋯ Mais</span>');
});

// No celular, a lista vira cartões: o valor das colunas numéricas ou marcadas com "rotular" recebe o nome da coluna,
// o valor vazio ("—") some, e os filtros recolhem num botão.
document.querySelectorAll('table').forEach((tabela) => {
  const nomes = [...tabela.querySelectorAll('th')].map((th) => th.textContent.trim());
  tabela.querySelectorAll('tr').forEach((linha) => [...linha.children].forEach((celula, i) => {
    if (celula.tagName !== 'TD' || i === 0) return;
    const th = tabela.querySelectorAll('th')[i];
    if (celula.textContent.trim() === '—') celula.classList.add('vazio');
    else if (th && (th.classList.contains('numero') || th.classList.contains('rotular'))) celula.dataset.rotulo = nomes[i];
  }));
});
document.querySelectorAll('.linha.filtros').forEach((filtros) => {
  const escolhas = [...filtros.querySelectorAll('.campo.lista')].map((c) => c.textContent.trim()).join(' · ');
  filtros.insertAdjacentHTML('beforebegin', `<span class="botao filtrar"><span>Filtrar</span><span class="nota" style="margin:0">${escolhas}</span></span>`);
});

// Seletor de variações (só para quem abre o protótipo no navegador): modo claro ou escuro, cor (D-90) e largura do computador ou do celular.
// A escolha vale para todas as telas (localStorage, quando o navegador deixa) e desce para as telas embutidas (fundo do diálogo e visão de celular).
// Não aparece nas imagens geradas (navegador automatizado) nem nas telas embutidas.
const COR_DO_TEMA = [['azul', 'Azul'], ['petroleo', 'Petróleo'], ['violeta', 'Violeta'], ['indigo', 'Índigo'], ['grafite', 'Grafite']];
let temaEscolhido = null;
function lerTemaGuardado() {
  try { return JSON.parse(localStorage.getItem('orenon-prototipo-tema')); } catch { return null; }
}
function guardarTema(tema) {
  try { localStorage.setItem('orenon-prototipo-tema', JSON.stringify(tema)); } catch { /* sem armazenamento: vale só nesta tela */ }
}
function aplicarTema(tema) {
  const html = document.documentElement;
  temaEscolhido = tema;
  if (tema.modo === 'escuro') html.dataset.modo = 'escuro'; else delete html.dataset.modo;
  if (tema.cor && tema.cor !== 'azul') html.dataset.cor = tema.cor; else delete html.dataset.cor;
  document.querySelectorAll('.seletor-tema [data-escolhe-modo]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.escolheModo === 'escuro') === (tema.modo === 'escuro'))));
  document.querySelectorAll('.seletor-tema [data-escolhe-cor]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.escolheCor === (tema.cor || 'azul'))));
  document.querySelectorAll('iframe').forEach((quadro) => quadro.contentWindow?.postMessage({ tema }, '*'));
}
window.addEventListener('message', (evento) => {
  if (evento.source === window.parent && evento.data?.tema) aplicarTema(evento.data.tema);
});
document.addEventListener('load', (evento) => {
  if (evento.target.tagName === 'IFRAME' && temaEscolhido) evento.target.contentWindow?.postMessage({ tema: temaEscolhido }, '*');
}, true);

const emTelaEmbutida = location.hash.startsWith('#fundo') || location.hash === '#celular';
if (location.hash === '#celular') document.documentElement.classList.add('embutido', 'celular');
const guardado = lerTemaGuardado();
if (guardado) aplicarTema(guardado);

if (!emTelaEmbutida && !navigator.webdriver) {
  const atual = () => temaEscolhido || { modo: document.documentElement.dataset.modo === 'escuro' ? 'escuro' : 'claro', cor: document.documentElement.dataset.cor || 'azul' };
  const amostras = COR_DO_TEMA.map(([cor, nome]) => `<button type="button" data-escolhe-cor="${cor}" aria-label="${nome}" title="${nome}"><i data-cor="${cor}"></i></button>`).join('');
  document.body.insertAdjacentHTML('afterbegin',
    '<div class="seletor-tema" role="group" aria-label="Variações do protótipo"><span class="rotulo">Ver como</span>' +
    '<span class="grupo" role="group" aria-label="Modo"><button type="button" data-escolhe-modo="claro">Claro</button><button type="button" data-escolhe-modo="escuro">Escuro</button></span>' +
    `<span class="grupo" role="group" aria-label="Cor">${amostras}</span>` +
    '<span class="grupo" role="group" aria-label="Largura"><button type="button" data-escolhe-largura="computador" aria-pressed="true">Computador</button><button type="button" data-escolhe-largura="celular" aria-pressed="false">Celular</button></span></div>');
  const barra = document.querySelector('.seletor-tema');
  aplicarTema(atual());
  barra.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button');
    if (!botao) return;
    if (botao.dataset.escolheModo) { const t = { ...atual(), modo: botao.dataset.escolheModo }; aplicarTema(t); guardarTema(t); }
    if (botao.dataset.escolheCor) { const t = { ...atual(), cor: botao.dataset.escolheCor }; aplicarTema(t); guardarTema(t); }
    if (botao.dataset.escolheLargura) {
      const celular = botao.dataset.escolheLargura === 'celular';
      barra.querySelectorAll('[data-escolhe-largura]').forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));
      document.querySelector('.visao-celular')?.remove();
      document.documentElement.classList.toggle('vendo-celular', celular);
      if (celular) {
        const visao = document.createElement('div');
        visao.className = 'visao-celular';
        visao.innerHTML = `<iframe title="Esta tela no celular" src="${location.pathname.split('/').pop()}#celular"></iframe>`;
        document.body.append(visao);
      }
    }
  });
}
