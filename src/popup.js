/**
 * LexAI - Popup Script v1.2
 * Fluxo de dois passos:
 *   1) Seleção de idioma nativo (para TTS)
 *   2) Configuração de API Key do OpenRouter
 * Tela principal quando já configurado.
 */

// ── Lista de idiomas disponíveis para TTS ──────────────────────────────────
const LANGUAGES = [
  { code: "pt-BR", flag: "🇧🇷", label: "Português", sub: "Brasil" },
  { code: "pt-PT", flag: "🇵🇹", label: "Português", sub: "Portugal" },
  { code: "en-US", flag: "🇺🇸", label: "English",   sub: "US" },
  { code: "en-GB", flag: "🇬🇧", label: "English",   sub: "UK" },
  { code: "es-ES", flag: "🇪🇸", label: "Español",   sub: "España" },
  { code: "es-MX", flag: "🇲🇽", label: "Español",   sub: "México" },
  { code: "fr-FR", flag: "🇫🇷", label: "Français",  sub: "France" },
  { code: "de-DE", flag: "🇩🇪", label: "Deutsch",   sub: "Deutschland" },
  { code: "it-IT", flag: "🇮🇹", label: "Italiano",  sub: "Italia" },
  { code: "ja-JP", flag: "🇯🇵", label: "日本語",    sub: "Japan" },
  { code: "zh-CN", flag: "🇨🇳", label: "中文",      sub: "简体" },
  { code: "ko-KR", flag: "🇰🇷", label: "한국어",    sub: "Korea" },
];

// Label legível para exibir na tela principal
function langLabel(code) {
  const l = LANGUAGES.find(x => x.code === code);
  return l ? `${l.flag} ${l.label} (${l.sub})` : code;
}

document.addEventListener("DOMContentLoaded", () => {

  // ── Elementos ─────────────────────────────────────────────────────────────
  const screenSetup = document.getElementById("screen-setup");
  const screenMain  = document.getElementById("screen-main");

  // Cards de setup
  const cardLang  = document.getElementById("card-lang");
  const cardKey   = document.getElementById("card-key");

  // Lang step
  const langGrid      = document.getElementById("lang-grid");
  const btnLangNext   = document.getElementById("btn-lang-next");

  // Key step
  const keyInput      = document.getElementById("key-input");
  const keyInputWrap  = document.getElementById("key-input-wrap");
  const keyError      = document.getElementById("key-error");
  const keyToggleEye  = document.getElementById("key-toggle-eye");
  const eyeSvg        = document.getElementById("eye-svg");
  const btnKeySave    = document.getElementById("btn-key-save");
  const btnKeySaveTxt = document.getElementById("btn-key-save-text");
  const btnKeyBack    = document.getElementById("btn-key-back");

  // Main screen
  const statCache    = document.getElementById("stat-cache");
  const statMemory   = document.getElementById("stat-memory");
  const clearCacheBtn = document.getElementById("clear-cache");
  const changeKeyBtn  = document.getElementById("change-key-btn");
  const changeLangBtn = document.getElementById("change-lang-btn");
  const langRowValue  = document.getElementById("lang-row-value");

  // ── Estado local ──────────────────────────────────────────────────────────
  let selectedLang = "pt-BR"; // default

  // ── Inicialização: decide qual tela mostrar ────────────────────────────────
  chrome.storage.sync.get(["openrouterKey", "nativeLang"], ({ openrouterKey, nativeLang }) => {
    if (openrouterKey && openrouterKey.startsWith("sk-or-")) {
      selectedLang = nativeLang || "pt-BR";
      showMainScreen();
    } else {
      selectedLang = nativeLang || "pt-BR";
      showSetupScreen("lang");
    }
  });

  // ── Monta a grade de idiomas ───────────────────────────────────────────────
  function buildLangGrid(selected) {
    langGrid.innerHTML = "";
    LANGUAGES.forEach(lang => {
      const btn = document.createElement("button");
      btn.className = "lang-btn" + (lang.code === selected ? " selected" : "");
      btn.dataset.code = lang.code;
      btn.innerHTML = `
        <span class="lang-flag">${lang.flag}</span>
        <span class="lang-label">
          <span class="lang-label-main">${lang.label}</span>
          <span class="lang-label-sub">${lang.sub}</span>
        </span>
      `;
      btn.addEventListener("click", () => {
        langGrid.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedLang = lang.code;
      });
      langGrid.appendChild(btn);
    });
  }

  // ── STEP 1: Idioma → avança para STEP 2 ───────────────────────────────────
  btnLangNext.addEventListener("click", () => {
    // Salva o idioma imediatamente
    chrome.storage.sync.set({ nativeLang: selectedLang });
    // Avança para o card de API key
    cardLang.classList.add("hidden");
    cardKey.classList.remove("hidden");
    keyInput.focus();
  });

  // ── STEP 2: Voltar ─────────────────────────────────────────────────────────
  btnKeyBack.addEventListener("click", () => {
    cardKey.classList.add("hidden");
    cardLang.classList.remove("hidden");
    buildLangGrid(selectedLang); // re-renderiza com seleção atual
  });

  // ── Toggle olho ───────────────────────────────────────────────────────────
  keyToggleEye.addEventListener("click", () => {
    const isPass = keyInput.type === "password";
    keyInput.type = isPass ? "text" : "password";
    eyeSvg.innerHTML = isPass
      ? `<path d="M17.94 17.94A10 10 0 0 1 10 20C3 20 1 10 1 10a18 18 0 0 1 3.06-4.94M9.9 4.24A9 9 0 0 1 10 4c7 0 9 10 9 10a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="19" y2="19"/>`
      : `<path d="M1 10s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7z"/><circle cx="10" cy="10" r="3"/>`;
  });

  // Remove erro ao digitar
  keyInput.addEventListener("input", () => {
    keyError.textContent = "";
    keyInputWrap.classList.remove("error");
  });

  // ── Salvar API Key ─────────────────────────────────────────────────────────
  btnKeySave.addEventListener("click", saveKey);
  keyInput.addEventListener("keydown", e => { if (e.key === "Enter") saveKey(); });

  async function saveKey() {
    const key = keyInput.value.trim();
    if (!key) {
      showKeyError("Cole sua API key do OpenRouter aqui.");
      return;
    }
    if (!key.startsWith("sk-or-")) {
      showKeyError("Chave inválida — deve começar com sk-or-");
      return;
    }
    if (key.length < 30) {
      showKeyError("Chave muito curta. Verifique se copiou completa.");
      return;
    }

    btnKeySave.classList.add("saving");
    btnKeySaveTxt.textContent = "Salvando...";

    await chrome.storage.sync.set({ openrouterKey: key, nativeLang: selectedLang });

    btnKeySave.classList.remove("saving");
    btnKeySave.classList.add("success");
    btnKeySaveTxt.textContent = "Ativado!";

    setTimeout(() => showMainScreen(), 700);
  }

  function showKeyError(msg) {
    keyError.textContent = msg;
    keyInputWrap.classList.add("error");
    keyInput.focus();
  }

  // ── Navegação entre telas ─────────────────────────────────────────────────
  function showSetupScreen(step = "lang") {
    screenMain.classList.add("hidden");
    screenSetup.classList.remove("hidden");

    if (step === "lang") {
      cardKey.classList.add("hidden");
      cardLang.classList.remove("hidden");
      buildLangGrid(selectedLang);
    } else {
      cardLang.classList.add("hidden");
      cardKey.classList.remove("hidden");
    }

    // Reseta botão de salvar
    btnKeySave.classList.remove("saving", "success");
    btnKeySaveTxt.textContent = "Ativar LexAI";
    keyError.textContent = "";
    keyInputWrap.classList.remove("error");

    // Pré-preenche key se já existir
    chrome.storage.sync.get("openrouterKey", ({ openrouterKey }) => {
      if (openrouterKey) keyInput.value = openrouterKey;
    });
  }

  function showMainScreen() {
    screenSetup.classList.add("hidden");
    screenMain.classList.remove("hidden");
    // Atualiza exibição do idioma
    langRowValue.textContent = langLabel(selectedLang);
    loadStats();
  }

  // ── Trocar key / idioma ───────────────────────────────────────────────────
  changeKeyBtn.addEventListener("click", () => showSetupScreen("key"));

  changeLangBtn.addEventListener("click", () => {
    chrome.storage.sync.get("nativeLang", ({ nativeLang }) => {
      selectedLang = nativeLang || "pt-BR";
      showSetupScreen("lang");
    });
  });

  // ── Cache ─────────────────────────────────────────────────────────────────
  clearCacheBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "clearCache" }, (res) => {
      if (res) loadStats();
    });
  });

  function loadStats() {
    chrome.runtime.sendMessage({ action: "getStats" }, (res) => {
      statCache.textContent  = res ? res.cacheCount  : "0";
      statMemory.textContent = res ? res.memoryCache : "0";
    });
  }
});
