/**
 * LexAI - Content Script v1.2
 *
 * Correções:
 *  - "Extension context invalidated": testa chrome.runtime antes de cada sendMessage.
 *    Quando o contexto invalida (extensão recarregada), o script se auto-remove
 *    silenciosamente em vez de lançar exceção.
 *  - TTS agora envia o idioma nativo do usuário (salvo nas configs) para o background.
 *  - Debounce de 150ms mantido para percepção de velocidade máxima.
 */

(function () {
  "use strict";

  // Evita inicialização dupla em iframes
  if (window.__lexaiInitialized) return;
  window.__lexaiInitialized = true;

  // ─── Estado ────────────────────────────────────────────────────────────────
  let popupEl        = null;
  let requestId      = 0;
  let selectionTimer = null;
  let lastText       = "";
  let isDragging     = false;
  let dragSX = 0, dragSY = 0, popSX = 0, popSY = 0;
  let nativeLang     = "pt-BR"; // será preenchido ao inicializar

  const DEBOUNCE_MS = 150;
  const MIN_LEN     = 2;
  const MAX_LEN     = 800;
  const OFFSET      = 14;

  // ─── Verificação de contexto válido ────────────────────────────────────────
  // Retorna false se a extensão foi recarregada/desabilitada (contexto inválido)
  function isContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (_) {
      return false;
    }
  }

  /**
   * Wrapper seguro para chrome.runtime.sendMessage.
   * Se o contexto estiver inválido, chama onError em vez de lançar exceção.
   */
  function safeSend(message, callback) {
    if (!isContextValid()) {
      // Contexto inválido — extensão foi recarregada. Remove listeners e para.
      cleanup();
      return;
    }
    try {
      chrome.runtime.sendMessage(message, (response) => {
        // Verifica lastError para evitar "unchecked runtime.lastError"
        if (chrome.runtime.lastError) {
          const errMsg = chrome.runtime.lastError.message || "";
          // "Extension context invalidated" ou "Could not establish connection"
          if (
            errMsg.includes("context invalidated") ||
            errMsg.includes("Could not establish connection") ||
            errMsg.includes("message channel closed")
          ) {
            cleanup();
            return;
          }
          if (callback) callback(null);
          return;
        }
        if (callback) callback(response);
      });
    } catch (err) {
      // Captura qualquer erro síncrono (ex: runtime já destruído)
      cleanup();
    }
  }

  // ─── Cleanup ao invalidar contexto ────────────────────────────────────────
  // Remove todos os listeners e esconde o popup para não deixar lixo visual
  function cleanup() {
    hide();
    document.removeEventListener("mouseup",    onMouseUp);
    document.removeEventListener("mousedown",  onMouseDown);
    document.removeEventListener("keydown",    onKeyDown);
    document.removeEventListener("scroll",     onScroll, true);
    if (popupEl) {
      popupEl.remove();
      popupEl = null;
    }
    // Permite que um novo content script (da nova versão da extensão) se inicialize
    delete window.__lexaiInitialized;
  }

  // ─── Carrega idioma do usuário ─────────────────────────────────────────────
  function loadNativeLang() {
    if (!isContextValid()) return;
    safeSend({ action: "getNativeLang" }, (res) => {
      if (res && res.lang) nativeLang = res.lang;
    });
  }
  loadNativeLang();

  // ─── SVG Icons ─────────────────────────────────────────────────────────────
  const I = {
    copy:      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    speak:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
    close:     `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    check:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    drag:      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>`,
    logo:      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#0A1A2F"/><path d="M5 6 L5 18 L15 18 L15 16 L7 16 L7 6 Z" fill="#1E90FF"/><circle cx="18" cy="7" r="3" fill="#00BFFF" opacity="0.9"/><circle cx="18" cy="7" r="1.5" fill="#fff"/></svg>`,
    translate: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`,
    info:      `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    book:      `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
  };

  // ─── Criar popup ───────────────────────────────────────────────────────────
  function createPopup() {
    if (popupEl) return;
    popupEl = document.createElement("div");
    popupEl.id = "lexai-popup";
    popupEl.setAttribute("role", "dialog");
    popupEl.setAttribute("aria-label", "LexAI");

    popupEl.innerHTML = `
      <div class="lexai-header">
        <div class="lexai-brand">
          ${I.logo}
          <span class="lexai-brand-name">LexAI</span>
          <span class="lexai-badge" id="lexai-badge">—</span>
        </div>
        <div class="lexai-hactions">
          <button class="lexai-ibtn lexai-drag-handle" title="Mover">${I.drag}</button>
          <button class="lexai-ibtn" id="lexai-close" title="Fechar">${I.close}</button>
        </div>
      </div>

      <div class="lexai-body" id="lexai-body">
        <!-- Skeleton de loading -->
        <div id="lexai-skeleton" class="lexai-skeleton">
          <div class="sk-section">
            <div class="sk-label"></div>
            <div class="sk-line sk-w80"></div>
          </div>
          <div class="sk-section">
            <div class="sk-label"></div>
            <div class="sk-line sk-w100"></div>
            <div class="sk-line sk-w60"></div>
          </div>
          <div class="sk-section">
            <div class="sk-label"></div>
            <div class="sk-line sk-w100"></div>
            <div class="sk-line sk-w90"></div>
            <div class="sk-line sk-w50"></div>
          </div>
        </div>

        <!-- Conteúdo real -->
        <div id="lexai-content" class="lexai-content" style="display:none">
          <section class="lexai-sec" id="lexai-sec-t">
            <div class="lexai-sec-hd">${I.translate}<span>Tradução</span>
              <button class="lexai-copy" data-t="translation" title="Copiar">${I.copy}</button>
            </div>
            <p class="lexai-text lexai-text-main" id="lexai-translation"></p>
          </section>
          <section class="lexai-sec" id="lexai-sec-s">
            <div class="lexai-sec-hd">${I.info}<span>Em poucas palavras</span>
              <button class="lexai-copy" data-t="simple" title="Copiar">${I.copy}</button>
            </div>
            <p class="lexai-text" id="lexai-simple"></p>
          </section>
          <section class="lexai-sec" id="lexai-sec-d">
            <div class="lexai-sec-hd">${I.book}<span>Significado</span>
              <button class="lexai-copy" data-t="detailed" title="Copiar">${I.copy}</button>
            </div>
            <p class="lexai-text lexai-text-sm" id="lexai-detailed"></p>
          </section>
        </div>

        <!-- Erro -->
        <div id="lexai-error" class="lexai-error" style="display:none">
          <span id="lexai-errmsg"></span>
        </div>
      </div>

      <div class="lexai-footer">
        <span class="lexai-preview" id="lexai-preview"></span>
        <button class="lexai-speak" id="lexai-speak">${I.speak}<span>Ouvir</span></button>
      </div>
    `;

    document.documentElement.appendChild(popupEl);
    bindEvents();
  }

  // ─── Eventos do popup ──────────────────────────────────────────────────────
  function bindEvents() {
    $("lexai-close").onclick = hide;
    popupEl.querySelector(".lexai-drag-handle").onmousedown = startDrag;
    popupEl.querySelectorAll(".lexai-copy").forEach(b => b.onclick = doCopy);
    $("lexai-speak").onclick = doSpeak;
    popupEl.addEventListener("mousedown", e => e.stopPropagation());
  }

  function doCopy(e) {
    const id  = e.currentTarget.dataset.t;
    const el  = $(`lexai-${id}`);
    if (!el) return;
    navigator.clipboard.writeText(el.textContent).then(() => {
      const btn = e.currentTarget;
      btn.innerHTML = I.check;
      btn.classList.add("copied");
      setTimeout(() => { btn.innerHTML = I.copy; btn.classList.remove("copied"); }, 1800);
    }).catch(() => {});
  }

  function doSpeak() {
    if (!lastText) return;
    // Envia o idioma nativo do usuário para o background
    safeSend({ action: "speak", text: lastText, lang: nativeLang });
    const btn = $("lexai-speak");
    btn.classList.add("speaking");
    setTimeout(() => btn.classList.remove("speaking"), 3000);
  }

  // ─── Drag ──────────────────────────────────────────────────────────────────
  function startDrag(e) {
    isDragging = true;
    dragSX = e.clientX; dragSY = e.clientY;
    const r = popupEl.getBoundingClientRect();
    popSX = r.left; popSY = r.top;
    popupEl.classList.add("dragging");
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup",   stopDrag);
    e.preventDefault();
  }
  function onDrag(e) {
    if (!isDragging) return;
    const nx = Math.max(8, Math.min(window.innerWidth  - popupEl.offsetWidth  - 8, popSX + e.clientX - dragSX));
    const ny = Math.max(8, Math.min(window.innerHeight - popupEl.offsetHeight - 8, popSY + e.clientY - dragSY));
    popupEl.style.cssText += `left:${nx}px;top:${ny}px;right:auto;bottom:auto;`;
  }
  function stopDrag() {
    isDragging = false;
    popupEl.classList.remove("dragging");
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup",   stopDrag);
  }

  // ─── Posicionamento ────────────────────────────────────────────────────────
  function position(x, y) {
    requestAnimationFrame(() => {
      if (!popupEl) return;
      const pw = popupEl.offsetWidth  || 340;
      const ph = popupEl.offsetHeight || 300;
      let lx = x + OFFSET, ly = y + OFFSET;
      if (lx + pw > window.innerWidth  - 8) lx = x - pw - OFFSET;
      if (ly + ph > window.innerHeight - 8) ly = y - ph - OFFSET;
      popupEl.style.left = Math.max(8, lx) + "px";
      popupEl.style.top  = Math.max(8, ly) + "px";
    });
  }

  // ─── Mostrar / Esconder ────────────────────────────────────────────────────
  function show(x, y, text) {
    if (!popupEl) createPopup();
    setLoading(text);
    popupEl.style.left   = x + "px";
    popupEl.style.top    = y + "px";
    popupEl.style.right  = "auto";
    popupEl.style.bottom = "auto";
    popupEl.classList.remove("lexai-hide");
    void popupEl.offsetWidth;
    popupEl.classList.add("lexai-show");
    position(x, y);
  }

  function hide() {
    if (!popupEl) return;
    popupEl.classList.remove("lexai-show");
    popupEl.classList.add("lexai-hide");
  }

  // ─── Estados do popup ──────────────────────────────────────────────────────
  function setLoading(text) {
    $("lexai-skeleton").style.display = "block";
    $("lexai-content").style.display  = "none";
    $("lexai-error").style.display    = "none";
    $("lexai-badge").textContent       = "...";
    $("lexai-preview").textContent     = clip(text, 55);
  }

  function setContent(data, text) {
    $("lexai-skeleton").style.display = "none";
    $("lexai-error").style.display    = "none";
    $("lexai-content").style.display  = "flex";

    $("lexai-translation").textContent = data.translation || "—";
    $("lexai-simple").textContent      = data.simple      || "—";
    $("lexai-detailed").textContent    = data.detailed    || "—";
    $("lexai-badge").textContent = langName(nativeLang);
    $("lexai-preview").textContent     = clip(text, 55);

    ["lexai-sec-t", "lexai-sec-s", "lexai-sec-d"].forEach((id, i) => {
      const el = $(id);
      el.style.animationDelay = `${i * 60}ms`;
      el.classList.remove("sec-in");
      void el.offsetWidth;
      el.classList.add("sec-in");
    });
  }

  function setError(msg) {
    $("lexai-skeleton").style.display = "none";
    $("lexai-content").style.display  = "none";
    $("lexai-error").style.display    = "flex";
    $("lexai-errmsg").textContent     = msg || "Erro desconhecido.";
    $("lexai-badge").textContent      = "!";
  }

  // ─── Seleção de texto ──────────────────────────────────────────────────────
  function getSelInfo() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const text = sel.toString().trim();
    if (!text || text.length < MIN_LEN || text.length > MAX_LEN) return null;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    return {
      text,
      x: rect.right  + window.scrollX,
      y: rect.bottom + window.scrollY
    };
  }

  function handleSelection() {
    if (!isContextValid()) { cleanup(); return; }

    const sel = getSelInfo();
    if (!sel) return;
    if (sel.text === lastText) return;

    lastText = sel.text;
    const myId = ++requestId;

    show(sel.x, sel.y, sel.text);

    safeSend({ action: "translate", text: sel.text }, (res) => {
      if (myId !== requestId) return; // seleção mudou enquanto aguardava

      if (!res) {
        setError("Falha na comunicação. Tente recarregar a página.");
        return;
      }
      if (res.error) {
        setError(res.noKey
          ? "Configure sua API Key do OpenRouter clicando no icone da extensao."
          : res.message
        );
        return;
      }
      setContent(res, sel.text);
    });
  }

  // ─── Event handlers nomeados (para remoção no cleanup) ────────────────────
  function onMouseUp(e) {
    if (popupEl && popupEl.contains(e.target)) return;
    clearTimeout(selectionTimer);
    selectionTimer = setTimeout(handleSelection, DEBOUNCE_MS);
  }

  function onMouseDown(e) {
    if (popupEl && !popupEl.contains(e.target)) {
      const s = window.getSelection();
      if (!s || !s.toString().trim()) hide();
    }
  }

  function onKeyDown(e) {
    if (e.key === "Escape") hide();
  }

  function onScroll() {
    if (popupEl && popupEl.classList.contains("lexai-show")) hide();
  }

  // ─── Registra listeners ────────────────────────────────────────────────────
  document.addEventListener("mouseup",   onMouseUp);
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("keydown",   onKeyDown);
  document.addEventListener("scroll",    onScroll, { passive: true });

  // ─── Utils ─────────────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function clip(t, n) { return t && t.length > n ? t.slice(0, n) + "…" : (t || ""); }

})();


function langName(code) {
  const map = {
    "pt-BR": "Português",
    "en-US": "English",
    "es-ES": "Español",
    "fr-FR": "Français",
    "de-DE": "Deutsch",
    "it-IT": "Italiano",
    "ja-JP": "日本語",
    "zh-CN": "中文",
    "ko-KR": "한국어"
  };
  return map[code] || code;
}


function getSelectedText() {
  let text = "";

  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type !== "Control") {
    text = document.selection.createRange().text;
  }

  return text.trim();
}

document.addEventListener("selectionchange", () => {
  const text = getSelectedText();
  if (text) {
    console.log("Selecionado:", text);
  }
});

