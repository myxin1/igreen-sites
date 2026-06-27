"use strict";

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.getPlatformInfo(() => {
    // Keeps the service worker warm only during install diagnostics.
  });
});

const pendingDownloadNames = [];

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  const filename = claimPendingDownloadName(downloadItem);
  if (!filename) return;
  suggest({
    filename,
    conflictAction: "uniquify"
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.source !== "insta-post-sorter") {
    return false;
  }

  if (message.type === "GET_TAB_STATUS") {
    const url = sender.tab && sender.tab.url ? sender.tab.url : "";
    sendResponse({
      ok: true,
      isInstagram: url.startsWith("https://www.instagram.com/")
    });
    return false;
  }

  if (message.type === "FETCH_INSTAGRAM_RESOURCE") {
    fetchInstagramResource(message)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          ok: false,
          status: 0,
          error: error && error.message ? error.message : "Falha ao buscar recurso do Instagram."
        });
      });
    return true;
  }

  if (message.type === "DOWNLOAD_MEDIA") {
    downloadMedia(message)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error && error.message ? error.message : "Falha ao baixar midia."
        });
      });
    return true;
  }

  if (message.type === "DOWNLOAD_MEDIA_BATCH") {
    downloadMediaBatch(message)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error && error.message ? error.message : "Falha ao baixar lote de midias."
        });
      });
    return true;
  }

  return false;
});

async function fetchInstagramResource(message) {
  const url = String(message.url || "");
  const responseType = message.responseType === "text" ? "text" : "json";

  if (!isAllowedInstagramUrl(url)) {
    return {
      ok: false,
      status: 0,
      error: "URL bloqueada fora do escopo permitido."
    };
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: Object.assign({
      "accept": responseType === "json" ? "application/json" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "x-requested-with": "XMLHttpRequest"
    }, message.headers || {})
  });

  const text = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      statusText: response.statusText,
      bodyPreview: text.slice(0, 300)
    };
  }

  if (responseType === "text") {
    return {
      ok: true,
      status: response.status,
      text
    };
  }

  try {
    return {
      ok: true,
      status: response.status,
      json: JSON.parse(text)
    };
  } catch (_error) {
    return {
      ok: false,
      status: response.status,
      error: "Resposta nao era JSON valido.",
      bodyPreview: text.slice(0, 300)
    };
  }
}

function isAllowedInstagramUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "www.instagram.com" || url.hostname === "i.instagram.com")
    );
  } catch (_error) {
    return false;
  }
}

async function downloadMedia(message) {
  const url = String(message.url || "");
  if (!isAllowedMediaUrl(url)) {
    return {
      ok: false,
      error: "URL de midia fora do escopo permitido."
    };
  }

  const filename = sanitizeDownloadPath(message.filename || "insta-post-sorter/video.mp4");
  reserveDownloadName(url, filename);

  const downloadId = await chrome.downloads.download({
    url,
    filename,
    saveAs: false,
    conflictAction: "uniquify"
  });

  return {
    ok: true,
    downloadId
  };
}

async function downloadMediaBatch(message) {
  const items = Array.isArray(message.items) ? message.items : [];
  const results = [];

  for (const item of items) {
    if (!item || !isAllowedMediaUrl(item.url)) {
      results.push({ ok: false, error: "URL invalida ou fora do escopo." });
      continue;
    }

    try {
      const filename = sanitizeDownloadPath(item.filename || "insta-post-sorter/video.mp4");
      reserveDownloadName(item.url, filename);
      const downloadId = await chrome.downloads.download({
        url: item.url,
        filename,
        saveAs: false,
        conflictAction: "uniquify"
      });
      results.push({ ok: true, downloadId, filename });
    } catch (error) {
      results.push({
        ok: false,
        error: error && error.message ? error.message : "Falha no download."
      });
    }
  }

  return {
    ok: true,
    requested: items.length,
    started: results.filter((result) => result.ok).length,
    results
  };
}

function reserveDownloadName(url, filename) {
  cleanupPendingDownloadNames();
  pendingDownloadNames.push({
    url: String(url || ""),
    filename,
    createdAt: Date.now()
  });
}

function claimPendingDownloadName(downloadItem) {
  cleanupPendingDownloadNames();
  if (!pendingDownloadNames.length) return "";

  const itemUrls = [
    downloadItem.url,
    downloadItem.finalUrl,
    canonicalMediaUrl(downloadItem.url),
    canonicalMediaUrl(downloadItem.finalUrl)
  ].filter(Boolean);

  let index = pendingDownloadNames.findIndex((entry) => {
    const entryUrls = [entry.url, canonicalMediaUrl(entry.url)].filter(Boolean);
    return entryUrls.some((url) => itemUrls.includes(url));
  });

  if (index < 0 && downloadItem.byExtensionId === chrome.runtime.id) {
    index = 0;
  }

  if (index < 0) return "";
  const [entry] = pendingDownloadNames.splice(index, 1);
  return entry.filename;
}

function cleanupPendingDownloadNames() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (let index = pendingDownloadNames.length - 1; index >= 0; index -= 1) {
    if (pendingDownloadNames[index].createdAt < cutoff) {
      pendingDownloadNames.splice(index, 1);
    }
  }
}

function canonicalMediaUrl(value) {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch (_error) {
    return "";
  }
}

function isAllowedMediaUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return (
      url.hostname.endsWith("cdninstagram.com") ||
      url.hostname.endsWith("fbcdn.net") ||
      url.hostname.endsWith("instagram.com")
    );
  } catch (_error) {
    return false;
  }
}

function sanitizeDownloadPath(value) {
  return String(value)
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.replace(/[<>:"|?*\x00-\x1F]/g, "_").slice(0, 120) || "file")
    .join("/");
}
