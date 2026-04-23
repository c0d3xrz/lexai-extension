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

## 🆕 Novidades da versão 2.0

A versão **v2.0** trouxe uma grande melhoria de estabilidade, especialmente no uso com IA:

### 🧱 Sistema de fila inteligente
- Todas as requisições agora são processadas **uma por vez**
- Evita múltiplas chamadas simultâneas
- Reduz drasticamente erros de rate limit

### 📈 Retry com backoff exponencial
- Tentativas automáticas em caso de erro
- Delay inteligente (1s → 2s → 4s → 8s…)
- Mais compatível com limites de APIs

### 🎲 Jitter (anti-congestionamento)
- Pequena variação aleatória no tempo de retry
- Evita sobrecarga simultânea nos servidores

### 🔁 Fallback de modelos otimizado
- Troca de modelo apenas quando necessário
- Tentativas múltiplas antes de desistir

### 💬 Mensagens de erro melhoradas
- Feedback claro para o usuário
- Ex: *"⏳ Rate limit atingido. Aguarde alguns segundos."*

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
* ✅ Sistema de fila anti-rate-limit  
* ✅ Retry automático inteligente  
* ✅ Copiar resultados  
* ✅ Áudio (Text-to-Speech)  
* ✅ Interface flutuante com drag  

---

## 🧠 Como funciona

1. O `content.js` detecta seleção de texto  
2. Envia requisição para o `background.js`  
3. O sistema verifica cache local  
4. As requisições entram em uma **fila inteligente**  
5. Caso necessário, consulta a API do OpenRouter  
6. Em caso de erro:
   - Aplica retry com backoff  
   - Alterna modelos automaticamente  
7. Exibe o resultado no popup  

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

* Manifest V3 (Chrome Extensions)  
* JavaScript puro  
* API OpenRouter (OpenAI / Qwen / LLaMA)  
* Chrome TTS API  
* chrome.storage (cache local)  

---

## 🔐 Privacidade

* ❌ Não coleta dados pessoais  
* ❌ Não armazena histórico sensível  
* ✅ Processamento local + API sob controle do usuário  

---

## ⚠️ Limitações

* Modelos gratuitos possuem limite de uso diário  
* Pode ocorrer atraso em horários de pico  
* Requer conexão com internet  

💡 Dica: adicionar créditos no OpenRouter melhora muito a estabilidade

---

## 🚀 Roadmap

* Tradução automática ao selecionar texto  
* Suporte a mais idiomas  
* Melhorias na interface  
* Publicação na Chrome Web Store  
* Sistema de planos (free/pro)  

---

## 📄 Licença

Uso pessoal e educacional.

---

## 🤖 Sobre o desenvolvimento

Este projeto foi desenvolvido **100% com o auxílio de Inteligência Artificial**.

---

## 📥 Download

👉 [Baixar última versão do LexAI](https://github.com/c0d3xrz/lexai-extension/releases/tag/v2.0.0)

---

## 💬 Feedback

Sugestões e melhorias são sempre bem-vindas!
