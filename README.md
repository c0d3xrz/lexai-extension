# 🚀 LexAI — Tradutor Inteligente para Navegador

> Traduza, entenda e ouça textos diretamente em qualquer site ou PDF com ajuda de IA.

---

## ✨ Sobre o projeto

O **LexAI** é uma extensão para navegadores Chromium (Chrome, Edge, Brave) que permite:

- 🌎 Traduzir textos selecionados
- 🧠 Entender significados de forma simples
- 🔊 Ouvir a pronúncia (TTS)
- 📄 Funcionar também em PDFs no navegador
- ⚡ Interface rápida, moderna e leve

Tudo isso utilizando inteligência artificial via OpenRouter.

---

## 🆕 Novidades da versão 2.1

A versão **v2.1** trouxe suporte completo e robusto para diferentes tipos de PDF:

### 📄 Compatibilidade total com PDFs

#### 1. PDFs remotos (com texto selecionável)

- Funciona em PDFs abertos no viewer nativo do Chrome (PDF.js)
- Detecta automaticamente a `.textLayer`
- Funciona igual a qualquer página web

#### 2. PDFs locais (`file://`)

- Adicionado `file:///*` no `host_permissions`
- Corrigido bloqueio do Chrome em arquivos locais
- Detecção de PDF local mais confiável

#### 3. PDFs sem seleção (escaneados/protegidos)

Agora há duas formas de usar:

- 🖱️ **Menu de contexto personalizado**
  - Botão flutuante: **"🔤 Traduzir com LexAI"**

- 📋 **Menu nativo do Chrome**
  - Opção **"🔤 Traduzir com LexAI"**
  - Funciona mesmo quando a seleção não vem do PDF.js

---

## 📥 Instalação

### 🔧 Pré-requisitos

- Navegador baseado em Chromium (Chrome, Edge, Brave)
- API Key do OpenRouter: https://openrouter.ai/workspaces/default/keys

---

### 📦 Passo a passo

1. **Baixe o projeto**
   - Extraia a pasta `lexai-extension`

2. **Abra as extensões**
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`

3. **Ative o modo desenvolvedor**

4. **Instale a extensão**
   - Clique em **Carregar sem compactação**
   - Selecione a pasta do projeto

5. **(IMPORTANTE para PDFs locais)**
   - Clique no ícone da extensão
   - Vá em `...`
   - Ative **"Permitir acesso a URLs de arquivo"**

6. **Configure a API**
   - Escolha idioma
   - Cole sua API Key
   - Salve

---

## 🎯 Como usar

1. Acesse qualquer site ou PDF
2. Selecione um texto

O LexAI exibirá:

- Tradução
- Explicação
- Significado
- Botão de áudio

💡 Em PDFs sem seleção, use o botão ou menu **"Traduzir com LexAI"**

---

## ⚙️ Funcionalidades

- ✅ Tradução de textos
- ✅ Explicação simplificada
- ✅ Significado contextual
- ✅ Suporte completo a PDFs (remoto, local e escaneado)
- ✅ Cache local
- ✅ Sistema de fila anti-rate-limit
- ✅ Retry automático inteligente
- ✅ Copiar resultados
- ✅ Áudio (TTS)
- ✅ Interface flutuante com drag
- ✅ Menu de contexto integrado

---

## 🧠 Como funciona

1. `content.js` detecta seleção
2. Envia para `background.js`
3. Verifica cache
4. Entra na fila inteligente
5. Consulta OpenRouter
6. Em erro:
   - Retry com backoff
   - Fallback de modelo
7. Exibe no popup

---

## 🗂️ Estrutura do projeto

```
lexai-extension/
├── manifest.json           # Configuração da extensão (Manifest V3)
├── icons/
│   ├── icon16.svg          # Ícone 16x16
│   ├── icon48.svg          # Ícone 48x48
│   └── icon128.svg         # Ícone 128x128
└── src/
    ├── background.js       # Service worker — gerencia API e cache
    ├── content.js          # Injetado nas páginas — detecta seleção e exibe popup
    ├── content.css         # Estilos do popup flutuante
    ├── popup.html          # Interface de configurações da extensão
    ├── popup.css           # Estilos da interface de configurações
    └── popup.js            # Lógica da interface de configurações
```

---

## 🛠️ Tecnologias

- Manifest V3
- JavaScript puro
- OpenRouter (OpenAI / Qwen)
- Chrome TTS API
- chrome.storage

---

## 🔐 Privacidade

- ❌ Não coleta dados pessoais
- ❌ Não armazena dados sensíveis
- ✅ Controle total do usuário

---

## ⚠️ Limitações

- Limite de uso em modelos gratuitos
- Possível lentidão em horários de pico
- Requer internet

💡 Dica: usar créditos no OpenRouter melhora bastante a estabilidade

---

## 🚀 Roadmap

- Tradução automática ao selecionar
- Mais idiomas
- Melhorias de UI
- Publicação na Chrome Web Store

---

## 📄 Licença

Uso pessoal e educacional.

---

## 🤖 Sobre o desenvolvimento

Este projeto foi desenvolvido **100% com o auxílio de Inteligência Artificial**.

---

## 📥 Download

👉 https://github.com/c0d3xrz/lexai-extension/releases

---

## 💬 Feedback

Sugestões e melhorias são bem-vindas 🚀
