"use strict";

const ACTIONS = {
  CAPTURE_CURRENT_STORY: "CAPTURE_CURRENT_STORY",
  DOWNLOAD_STORY: "DOWNLOAD_STORY"
};

chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.id) {
    await chrome.storage.session.set({
      storyShopeeTargetTabId: tab.id,
      storyShopeeTargetTabUrl: tab.url || ""
    });
  }

  if (!tab?.id || !isFacebookUrl(tab.url || "")) {
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      if (typeof window.__storyShopeeSaverShowOverlay === "function") {
        window.__storyShopeeSaverShowOverlay();
      }
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === ACTIONS.CAPTURE_CURRENT_STORY) {
    captureCurrentStory()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: friendlyError(error) }));
    return true;
  }

  if (message.type === ACTIONS.DOWNLOAD_STORY) {
    downloadStoryMedia(message.payload, _sender)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: friendlyError(error) }));
    return true;
  }

  return false;
});

async function captureCurrentStory() {
  const tab = await getTargetFacebookTab();

  if (!tab?.id || !isFacebookUrl(tab.url || "")) {
    throw new Error("Abra um story do Facebook antes de baixar.");
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  const [execution] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      if (typeof window.__storyShopeeSaverCaptureStory !== "function") {
        throw new Error("Detector nao carregado na pagina.");
      }
      return window.__storyShopeeSaverCaptureStory();
    }
  });

  return { ok: true, data: execution?.result };
}

async function downloadStoryMedia(payload, sender) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Nada para baixar. Abra o story e tente novamente.");
  }

  const capture = payload.capture || {};
  if (!capture.mediaUrl) {
    throw new Error("Nenhuma midia detectada no story atual.");
  }

  const tab = sender?.tab || await getTargetFacebookTab();
  const downloadableUrl = await getDownloadableMediaUrl(tab?.id, capture);
  const timestamp = formatTimestamp(new Date());
  const extension = capture.mediaType === "video" ? "mp4" : "jpg";

  await chrome.downloads.download({
    url: downloadableUrl,
    filename: `storyshopee_${timestamp}.${extension}`,
    conflictAction: "uniquify",
    saveAs: false
  });

  return {
    ok: true,
    warnings: buildDownloadWarnings(capture, downloadableUrl)
  };
}

async function getDownloadableMediaUrl(tabId, capture) {
  const mediaUrl = capture.mediaUrl || "";

  if (!mediaUrl.startsWith("blob:")) {
    return mediaUrl;
  }

  if (!tabId) {
    throw new Error("Video detectado como blob temporario, mas a aba do Facebook nao foi encontrada.");
  }

  const [execution] = await chrome.scripting.executeScript({
    target: { tabId },
    func: async (blobUrl) => {
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Falha ao ler blob do video: ${response.status}`);
      }

      const blob = await response.blob();
      if (blob.size > 50 * 1024 * 1024) {
        throw new Error("Video blob grande demais para converter localmente pela extensao.");
      }

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Falha ao converter blob do video."));
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    },
    args: [mediaUrl]
  });

  if (!execution?.result) {
    throw new Error("Video blob temporario nao pode ser convertido para download.");
  }

  return execution.result;
}

async function getTargetFacebookTab() {
  const session = await chrome.storage.session.get({
    storyShopeeTargetTabId: null,
    storyShopeeTargetTabUrl: ""
  });

  if (session.storyShopeeTargetTabId) {
    try {
      const tab = await chrome.tabs.get(session.storyShopeeTargetTabId);
      if (isFacebookUrl(tab.url || "")) {
        return tab;
      }
    } catch (_error) {
      await chrome.storage.session.remove(["storyShopeeTargetTabId", "storyShopeeTargetTabUrl"]);
    }
  }

  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (activeTab?.id && isFacebookUrl(activeTab.url || "")) {
    return activeTab;
  }

  const facebookTabs = await chrome.tabs.query({
    url: ["https://*.facebook.com/*", "https://facebook.com/*"]
  });

  return facebookTabs.find((tab) => /\/stories\//.test(tab.url || "")) || facebookTabs[0] || null;
}

function buildDownloadWarnings(capture, downloadableUrl) {
  const warnings = [];

  if (capture.mediaType === "video" && capture.mediaUrl?.startsWith("blob:")) {
    warnings.push("Video era blob temporario; a extensao tentou converter localmente pela aba do Facebook.");
  }

  if (/^https:\/\/.*fbcdn\.net/i.test(downloadableUrl)) {
    warnings.push("Se o download falhar, recarregue o story e tente novamente. URLs do Facebook podem expirar rapido.");
  }

  return warnings;
}

function isFacebookUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === "facebook.com" || hostname.endsWith(".facebook.com");
  } catch (_error) {
    return false;
  }
}

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + "_" + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("-");
}

function friendlyError(error) {
  if (!error) {
    return "Erro desconhecido.";
  }

  return error.message || String(error);
}
