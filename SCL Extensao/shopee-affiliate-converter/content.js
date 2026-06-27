// content.js — Executado em páginas da Shopee
// Detecta URLs da Shopee copiadas pelo usuário

(function () {
  'use strict';

  // Evitar dupla inicialização se o script for injetado mais de uma vez
  if (window.__shopeeAffiliateConverterMounted) return;
  window.__shopeeAffiliateConverterMounted = true;

  // ─── Detector de cópia ──────────────────────────────────────
  // Escuta o evento "copy" para detectar quando o usuário copia
  // uma URL da Shopee — sem precisar da permissão clipboardRead.
  document.addEventListener('copy', function () {
    // Aguarda o ciclo de eventos para que a seleção esteja disponível
    setTimeout(function () {
      var selection = window.getSelection();
      if (!selection) return;

      var text = selection.toString().trim();
      if (!text) return;

      // Verifica se é uma URL da Shopee (usa a função do shopee-converter.js)
      if (!isShopeeUrl(text)) {
        // Tenta extrair uma URL do texto selecionado caso seja texto misto
        var match = text.match(/https?:\/\/[^\s"'<>]+/);
        if (!match || !isShopeeUrl(match[0])) return;
        text = match[0];
      }

      // Notifica o background para exibir o prompt de conversão
      safeMessage({ type: 'SHOPEE_URL_COPIED', data: { url: text } });
    }, 50);
  });

  // ─── Utilitário de mensagem segura ──────────────────────────
  function safeMessage(msg) {
    try {
      chrome.runtime.sendMessage(msg).catch(function () {
        // Contexto da extensão pode ter sido invalidado após update
      });
    } catch (e) {
      // Extension context invalidated — silencioso
    }
  }

})();
