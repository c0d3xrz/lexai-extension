# 🚀 LexAI — Tradutor Inteligente para Navegador

> Traduza, entenda e ouça textos diretamente em qualquer site ou PDF com ajuda de IA.

---

## ✨ Sobre o projeto

O **LexAI** é uma extensão para navegadores Chromium (Chrome, Edge, Brave) que permite:

* 🌎 Traduzir textos selecionados
* 🧠 Entender significados de forma simples
* 🔊 Ouvir a pronúncia (TTS)
* 📄 Funcionar também em PDFs no navegador
* ⚡ Interface rápida, moderna e leve

Tudo isso utilizando inteligência artificial via OpenRouter.

---

## 📥 Instalação

### 🔧 Pré-requisitos

* Navegador baseado em Chromium (Chrome, Edge, Brave)
* API Key do OpenRouter: https://openrouter.ai/workspaces/default/keys

---

### 📦 Passo a passo

1. **Baixe o projeto**

   * Extraia a pasta `lexai-extension` em um local fixo

2. **Abra as extensões**

   * Chrome: `chrome://extensions`
   * Edge: `edge://extensions`
   * Brave: `brave://extensions`

3. **Ative o modo desenvolvedor**

   * Ative o botão no canto superior direito

4. **Instale a extensão**

   * Clique em **Carregar sem compactação**
   * Selecione a pasta `lexai-extension`

5. **Configure a API**

   * Clique no ícone da extensão
   * Selecione seu Idioma
   * Cole sua API Key do OpenRouter
   * Salve as configurações

---

## 🎯 Como usar

1. Acesse qualquer site ou PDF
2. Selecione um texto
3. O LexAI exibirá automaticamente:

   * Tradução
   * Explicação
   * Significado
   * Botão de áudio

---

## ⚙️ Funcionalidades

* ✅ Tradução de textos
* ✅ Explicação simplificada
* ✅ Significado contextual
* ✅ Funciona em PDFs
* ✅ Cache local (mais rápido)
* ✅ Copiar resultados
* ✅ Áudio (Text-to-Speech)
* ✅ Interface flutuante com drag

---

## 🧠 Como funciona

1. O `content.js` detecta seleção de texto
2. Envia requisição para o `background.js`
3. O sistema verifica cache local
4. Caso necessário, consulta a API do OpenRouter
5. Exibe o resultado no popup

---

## 🗂️ Estrutura do projeto

```
lexai-extension/
├── manifest.json
├── icons/
├── src/
│   ├── background.js
│   ├── content.js
│   ├── content.css
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
```

---

## 🛠️ Tecnologias

* Manifest V3 (Chrome Extensions)
* JavaScript puro
* API OpenRouter (OpenAI/QWEN)
* Chrome TTS API
* chrome.storage (cache local)

---

## 🔐 Privacidade

* ❌ Não coleta dados pessoais
* ❌ Não armazena histórico sensível
* ✅ Processamento local + API sob controle do usuário

---

## 🚀 Roadmap

* Tradução automática ao selecionar texto
* Suporte a mais idiomas
* Melhorias na interface
* Publicação na Chrome Web Store

---

## 📄 Licença

Uso pessoal e educacional.

---

## 🤖 Sobre o desenvolvimento

Este projeto foi desenvolvido 100% com o auxílio de Inteligência Artificial, desde a ideia até a implementação.

---
## 📥 Download

👉 [Baixar última versão do LexAI]([https://github.com/c0d3xrz/lexai-extension/releases/tag/v1.0.0])

---

## 💬 Feedback

Sugestões e melhorias são sempre bem-vindas!

