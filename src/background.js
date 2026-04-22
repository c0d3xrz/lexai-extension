/**
 * LexAI - Background Service Worker v1.3
 *
 * Melhorias:
 *  - Usa idioma escolhido pelo usuário no prompt da IA
 *  - Mantém fallback de modelos gratuitos
 *  - Cache otimizado (RAM + disco)
 *  - TTS já integrado com idioma correto
 */

const OPENROUTER_URL  = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT = 13000;
const CACHE_MAX       = 200;

// Modelos gratuitos (fallback automático)
const FREE_MODELS = [
  "openai/gpt-oss-120b:free",
  "qwen/qwen-2-7b-instruct:free",
];

// Cache em memória
const memCache = new Map();


// ─── 🔤 MAPA DE IDIOMAS ───────────────────────────────────────────────
function getLangName(code) {
  const map = {
    "pt-BR": "português brasileiro",
    "pt-PT": "português de portugal",
    "en-US": "inglês americano",
    "en-GB": "inglês britânico",
    "es-ES": "espanhol",
    "es-MX": "espanhol mexicano",
    "fr-FR": "francês",
    "de-DE": "alemão",
    "it-IT": "italiano",
    "ja-JP": "japonês",
    "zh-CN": "chinês simplificado",
    "ko-KR": "coreano"
  };

  return map[code] || "português brasileiro";
}


// ─── 🔄 TRADUÇÃO PRINCIPAL ───────────────────────────────────────────
async function fetchTranslation(text, apiKey) {
  if (!apiKey || !apiKey.startsWith("sk-or-")) {
    return { error: true, noKey: true, message: "Configure sua chave do OpenRouter." };
  }

  const key = cacheKey(text);

  // 1) RAM
  if (memCache.has(key)) return { ...memCache.get(key), fromCache: true };

  // 2) Disco
  try {
    const stored = await chrome.storage.local.get(key);
    if (stored[key]) {
      memCache.set(key, stored[key]);
      return { ...stored[key], fromCache: true };
    }
  } catch (_) {}

  // 🔥 pega idioma do usuário
  const { nativeLang } = await chrome.storage.sync.get("nativeLang");

  // 3) API com fallback de modelos
  let lastError = null;

  for (const model of FREE_MODELS) {
    try {
      const result = await callModel(text, apiKey, model, nativeLang);
      persist(key, result);
      return result;
    } catch (err) {
      lastError = err;

      const isRetryable =
        err.status === 429 ||
        (err.status >= 500 && err.status < 600);

      if (!isRetryable) break;

      await sleep(300);
    }
  }

  return {
    error: true,
    message: lastError?.message || "Todos os modelos falharam."
  };
}


// ─── 🤖 CHAMADA AO MODELO ───────────────────────────────────────────
async function callModel(text, apiKey, model, nativeLang) {

  const langName = getLangName(nativeLang);

  const prompt =
    `Traduza e explique para ${langName}.\n` +
    `Use linguagem natural de um falante nativo.\n` +
    `Se o texto já estiver em ${langName}, apenas repliqueio no mesmo idioma.\n` +
    `Responda SOMENTE JSON puro, zero markdown, zero texto fora do JSON:\n` +
    `{"translation":"...","simple":"1-2 frases simples","detailed":"2-3 frases contextuais","language":"idioma original","type":"palavra|frase|termo técnico|citação"}\n\n` +
    `Texto: ${JSON.stringify(text.slice(0, 400))}`;

  const ctrl    = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);

  let response;

  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer":  "https://lexai-extension",
        "X-Title":       "LexAI Translator"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 260,
        temperature: 0.1,
        stream: false
      }),
      signal: ctrl.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));

    const err = new Error(
      response.status === 401 ? "API key inválida." :
      response.status === 429 ? `Rate limit (${model})` :
      response.status === 402 ? "Sem créditos." :
      errData?.error?.message || `Erro HTTP ${response.status}`
    );

    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const raw  = data?.choices?.[0]?.message?.content || "";

  return parseJSON(raw);
}


// ─── 🧠 PARSE JSON ───────────────────────────────────────────────────
function parseJSON(raw) {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const obj   = JSON.parse(clean);
    if (obj.translation) return obj;
  } catch (_) {}

  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const obj = JSON.parse(match[0]);
      if (obj.translation) return obj;
    } catch (_) {}
  }

  return {
    translation: raw.trim().slice(0, 300) || "Sem resposta.",
    simple: "",
    detailed: "",
    language: "—",
    type: "—"
  };
}


// ─── ⚙️ HELPERS ─────────────────────────────────────────────────────
function cacheKey(t) {
  return "lx_" + t.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);
}

function persist(key, data) {
  memCache.set(key, data);

  if (memCache.size > CACHE_MAX) {
    memCache.delete(memCache.keys().next().value);
  }

  chrome.storage.local.set({ [key]: data }).catch(() => {});
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}


// ─── 📡 LISTENER ─────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, respond) => {

  if (msg.action === "translate") {
    chrome.storage.sync.get("openrouterKey", ({ openrouterKey }) => {
      fetchTranslation(msg.text, openrouterKey).then(respond);
    });
    return true;
  }

  if (msg.action === "speak") {
    chrome.storage.sync.get("nativeLang", ({ nativeLang }) => {
      const lang = nativeLang || "pt-BR";

      chrome.tts.speak(msg.text, {
        lang: lang,
        rate: 0.88,
        pitch: 1.0,
        onEvent: (e) => {
          if (e.type === "error") {
            chrome.tts.speak(msg.text, { rate: 0.88 });
          }
        }
      });

      respond({ ok: true });
    });
    return true;
  }

  if (msg.action === "getStats") {
    chrome.storage.local.get(null, items => {
      respond({
        cacheCount: Object.keys(items).filter(k => k.startsWith("lx_")).length,
        memoryCache: memCache.size
      });
    });
    return true;
  }

  if (msg.action === "clearCache") {
    memCache.clear();

    chrome.storage.local.get(null, items => {
      const keys = Object.keys(items).filter(k => k.startsWith("lx_"));
      chrome.storage.local.remove(keys, () => {
        respond({ ok: true, cleared: keys.length });
      });
    });

    return true;
  }

  if (msg.action === "ping") {
    respond({ pong: true });
    return true;
  }

  if (msg.action === "getNativeLang") {
    chrome.storage.sync.get("nativeLang", ({ nativeLang }) => {
      respond({ lang: nativeLang || "pt-BR" });
    });
    return true;
  }
});