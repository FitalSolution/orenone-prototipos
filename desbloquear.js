// Desbloqueio das páginas cifradas do site público dos protótipos (D-148 e a decisão da senha fixa). Roda no navegador, copiado
// para a raiz do site como desbloquear.js, e também no Node, nos testes. Cada página do site é um invólucro com o texto cifrado
// (AES-GCM, chave derivada da senha por PBKDF2-SHA256); este código usa a chave guardada no navegador ou pede a senha, decifra e
// escreve a página clara no lugar do invólucro. Os mesmos parâmetros estão em cifra-prototipos.mjs; mude os dois juntos.
(() => {
  const ARMAZEM = 'orenon-prototipos-chave';
  const SAL = 'orenon-prototipos/v1';
  const ITERACOES = 600000;
  const codificar = (texto) => new TextEncoder().encode(texto);
  const dosBytes = (base64) => Uint8Array.from(atob(base64.trim()), (c) => c.charCodeAt(0));
  const paraBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));

  async function derivar(senha) {
    const base = await crypto.subtle.importKey('raw', codificar(senha), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: codificar(SAL), iterations: ITERACOES, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      true,
      ['decrypt'],
    );
  }

  async function decifrar(chave, ivBase64, cifradoBase64) {
    const aberto = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: dosBytes(ivBase64) }, chave, dosBytes(cifradoBase64));
    return new TextDecoder().decode(aberto);
  }

  const exportarChave = async (chave) => paraBase64(await crypto.subtle.exportKey('raw', chave));
  const importarChave = (base64) => crypto.subtle.importKey('raw', dosBytes(base64), 'AES-GCM', false, ['decrypt']);

  const guardada = () => { try { return localStorage.getItem(ARMAZEM); } catch { return null; } };
  const guardar = (valor) => { try { localStorage.setItem(ARMAZEM, valor); } catch { /* sem armazenamento: pede a senha a cada página */ } };
  const esquecer = () => { try { localStorage.removeItem(ARMAZEM); } catch { /* nada a esquecer */ } };

  // Troca o invólucro pela página decifrada sem document.open/write, que em alguns navegadores (com extensões que mexem no
  // documento) deixa o invólucro no lugar e acrescenta a página dentro dele, e o CSS do formulário de senha desfigura a tela.
  // Os scripts da página são recriados, em ordem, depois de o CSS carregar, e o evento load é redisparado porque o moldura.js
  // depende dele para avisar a altura das telas embutidas.
  async function mostrar(html) {
    if (document.readyState === 'loading') await new Promise((pronto) => document.addEventListener('DOMContentLoaded', pronto, { once: true }));
    const pagina = new DOMParser().parseFromString(html, 'text/html');
    document.head.replaceChildren(...[...pagina.head.childNodes].map((no) => document.importNode(no, true)));
    document.title = pagina.title;
    for (const atributo of [...document.body.attributes]) document.body.removeAttribute(atributo.name);
    for (const atributo of [...pagina.body.attributes]) document.body.setAttribute(atributo.name, atributo.value);
    document.body.replaceChildren(...[...pagina.body.childNodes].map((no) => document.importNode(no, true)));
    const estilos = [...document.querySelectorAll('link[rel="stylesheet"]')].filter((estilo) => !estilo.sheet);
    await Promise.all(estilos.map((estilo) => new Promise((pronto) => {
      estilo.addEventListener('load', pronto, { once: true });
      estilo.addEventListener('error', pronto, { once: true });
    })));
    const carregados = [];
    for (const antigo of document.querySelectorAll('script')) {
      const novo = document.createElement('script');
      for (const atributo of antigo.attributes) novo.setAttribute(atributo.name, atributo.value);
      novo.textContent = antigo.textContent;
      novo.async = false;
      if (antigo.src) {
        carregados.push(new Promise((pronto) => {
          novo.addEventListener('load', pronto, { once: true });
          novo.addEventListener('error', pronto, { once: true });
        }));
      }
      antigo.replaceWith(novo);
    }
    await Promise.all(carregados);
    window.dispatchEvent(new Event('load'));
  }

  async function iniciar() {
    const corpo = document.body;
    const iv = corpo.dataset.iv;
    const cifrado = document.getElementById('cifrado').textContent;
    const formulario = document.getElementById('formulario-senha');
    const campo = document.getElementById('senha');
    const erro = document.getElementById('erro-senha');

    const antiga = guardada();
    if (antiga) {
      let aberta;
      try {
        aberta = await decifrar(await importarChave(antiga), iv, cifrado);
      } catch {
        esquecer();
      }
      if (aberta !== undefined) {
        await mostrar(aberta);
        return;
      }
    }
    formulario.hidden = false;
    campo.focus();
    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      erro.textContent = '';
      formulario.querySelector('button').disabled = true;
      let html;
      try {
        const chave = await derivar(campo.value);
        html = await decifrar(chave, iv, cifrado);
        guardar(await exportarChave(chave));
      } catch {
        erro.textContent = 'Senha incorreta. Confira e tente de novo.';
        formulario.querySelector('button').disabled = false;
        campo.select();
        return;
      }
      await mostrar(html);
    });
  }

  globalThis.OrenOnDesbloqueio = { derivar, decifrar, exportarChave, importarChave, ARMAZEM };
  if (typeof document !== 'undefined' && document.body?.hasAttribute('data-cifrado')) iniciar();
})();
