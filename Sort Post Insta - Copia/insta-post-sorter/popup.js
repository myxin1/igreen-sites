"use strict";

const SOURCE = "insta-post-sorter";
const CONTENT_FILES = [
  "src/utils/dom.js",
  "src/utils/parser.js",
  "src/utils/instagram-api.js",
  "src/utils/sorter.js",
  "src/utils/csv.js",
  "src/content.js",
  "src/panel.js"
];

async function sendToTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (_error) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: CONTENT_FILES
    });
    return chrome.tabs.sendMessage(tabId, message);
  }
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isInstagram = tab && tab.url && tab.url.startsWith("https://www.instagram.com/");

  const btn = document.getElementById("btn-toggle");
  const msg = document.getElementById("msg-not-instagram");
  const hint = document.getElementById("hint");

  if (!isInstagram) {
    msg.style.display = "block";
    hint.style.display = "none";
    return;
  }

  btn.disabled = false;

  btn.addEventListener("click", async () => {
    try {
      await sendToTab(tab.id, { source: SOURCE, type: "TOGGLE_PANEL" });
    } catch (error) {
      hint.textContent = error && error.message ? error.message : "Nao foi possivel abrir o painel nesta aba.";
      hint.style.display = "block";
      return;
    }
    window.close();
  });
}

document.addEventListener("DOMContentLoaded", init);
