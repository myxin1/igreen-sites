"use strict";

const DEFAULT_TEMPLATE = "https://s.shopee.com.br/{{AFFILIATE_ID}}?url={{URL_ENCODED}}";

const elements = {
  downloadMediaButton: document.getElementById("downloadMediaButton"),
  statusField: document.getElementById("statusField"),
  detectedLinkField: document.getElementById("detectedLinkField"),
  affiliateLinkField: document.getElementById("affiliateLinkField"),
  mediaTypeField: document.getElementById("mediaTypeField"),
  confidenceField: document.getElementById("confidenceField"),
  captureTabButton: document.getElementById("captureTabButton"),
  settingsTabButton: document.getElementById("settingsTabButton"),
  captureTab: document.getElementById("captureTab"),
  settingsTab: document.getElementById("settingsTab"),
  affiliateIdField: document.getElementById("popupAffiliateIdField"),
  templateField: document.getElementById("popupTemplateField"),
  saveSettingsButton: document.getElementById("saveSettingsButton"),
  settingsStatus: document.getElementById("settingsStatus"),
  manualLinkField: document.getElementById("manualLinkField"),
  manualConvertButton: document.getElementById("manualConvertButton"),
  manualResultField: document.getElementById("manualResultField")
};

let lastCapture = null;
let lastAffiliateLink = "";

elements.downloadMediaButton.addEventListener("click", downloadCurrentStoryMedia);
elements.captureTabButton.addEventListener("click", () => showTab("capture"));
elements.settingsTabButton.addEventListener("click", () => showTab("settings"));
elements.saveSettingsButton.addEventListener("click", saveSettings);
elements.manualConvertButton.addEventListener("click", convertManualLink);
document.addEventListener("DOMContentLoaded", loadSettings);

loadSettings();

async function downloadCurrentStoryMedia() {
  setBusy(true);
  setStatus("Detectando midia do story...");
  clearOutputs();

  try {
    const captureResponse = await chrome.runtime.sendMessage({ type: "CAPTURE_CURRENT_STORY" });
    if (!captureResponse?.ok) {
      throw new Error(captureResponse?.error || "Nao foi possivel detectar o story.");
    }

    lastCapture = captureResponse.data;
    await renderCapture(lastCapture);

    if (!lastCapture?.mediaUrl) {
      throw new Error("Nenhuma midia detectada no story atual.");
    }

    setStatus("Midia detectada. Iniciando download...");

    const downloadResponse = await chrome.runtime.sendMessage({
      type: "DOWNLOAD_STORY",
      payload: {
        capture: lastCapture,
        originalLink: lastCapture.originalLink,
        affiliateLink: lastAffiliateLink
      }
    });

    if (!downloadResponse?.ok) {
      throw new Error(downloadResponse?.error || "Nao foi possivel baixar a midia.");
    }

    const warnings = downloadResponse.warnings || [];
    setStatus(warnings.length ? `Download iniciado.\n${warnings.join("\n")}` : "Download da midia iniciado.");
  } catch (error) {
    setStatus(error.message || "Erro inesperado ao baixar a midia.");
  } finally {
    setBusy(false);
  }
}

async function renderCapture(capture) {
  const settings = await getSettings();
  const conversion = convertShopeeAffiliate(
    capture.originalLink,
    applyAffiliateId(settings.affiliateTemplate, settings.affiliateId)
  );

  lastAffiliateLink = conversion.ok ? conversion.url : "";
  elements.detectedLinkField.value = capture.originalLink || "";
  elements.affiliateLinkField.value = lastAffiliateLink;
  elements.mediaTypeField.value = labelMediaType(capture.mediaType);
  elements.confidenceField.value = labelConfidence(capture.confidence);

  const messages = [];
  messages.push(capture.mediaUrl ? `Midia detectada: ${labelMediaType(capture.mediaType)}.` : "Nenhuma midia detectada no story atual.");

  if (!capture.originalLink) {
    messages.push("Nenhum link da Shopee encontrado.");
  } else if (!conversion.ok) {
    messages.push(conversion.error);
  } else {
    messages.push("Link afiliado gerado.");
  }

  if (capture.pageName) {
    messages.push(`Pagina/perfil: ${capture.pageName}.`);
  }

  if (Array.isArray(capture.notes) && capture.notes.length) {
    messages.push(...capture.notes);
  }

  setStatus(Array.from(new Set(messages)).join("\n"));
}

async function loadSettings() {
  const settings = await getSettings();
  elements.affiliateIdField.value = settings.affiliateId;
  elements.templateField.value = settings.affiliateTemplate || DEFAULT_TEMPLATE;
}

async function saveSettings() {
  const affiliateId = elements.affiliateIdField.value.trim();
  const affiliateTemplate = elements.templateField.value.trim();

  const validation = validateTemplate(affiliateTemplate);
  if (!validation.ok) {
    elements.settingsStatus.textContent = validation.error;
    return;
  }

  await chrome.storage.sync.set({ affiliateId, affiliateTemplate });
  elements.settingsStatus.textContent = "Configuracao salva.";
}

async function convertManualLink() {
  const settings = await getSettings();
  const conversion = convertShopeeAffiliate(
    elements.manualLinkField.value.trim(),
    applyAffiliateId(settings.affiliateTemplate, settings.affiliateId)
  );

  if (!conversion.ok) {
    elements.manualResultField.value = "";
    elements.settingsStatus.textContent = conversion.error;
    return;
  }

  elements.manualResultField.value = conversion.url;
  elements.settingsStatus.textContent = "Link manual convertido.";
}

async function getSettings() {
  return chrome.storage.sync.get({
    affiliateId: "",
    affiliateTemplate: DEFAULT_TEMPLATE
  });
}

function validateTemplate(template) {
  if (!template || !template.trim()) {
    return { ok: false, error: "Configure seu template de afiliado antes de converter." };
  }

  if (!template.includes("{{URL_ENCODED}}")) {
    return { ok: false, error: "O template precisa conter {{URL_ENCODED}}." };
  }

  return { ok: true };
}

function convertShopeeAffiliate(originalUrl, template) {
  if (!originalUrl) {
    return { ok: false, error: "Nenhum link da Shopee encontrado." };
  }

  if (!isShopeeUrl(originalUrl)) {
    return { ok: false, error: "Link detectado, mas nao parece ser da Shopee." };
  }

  const validation = validateTemplate(template);
  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    url: template.trim().replaceAll("{{URL_ENCODED}}", encodeURIComponent(originalUrl))
  };
}

function isShopeeUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "shopee.com.br" || hostname.endsWith(".shopee.com.br") || hostname === "shope.ee";
  } catch (_error) {
    return false;
  }
}

function applyAffiliateId(template, affiliateId) {
  return String(template || "").replaceAll("{{AFFILIATE_ID}}", encodeURIComponent(affiliateId || ""));
}

function showTab(tabName) {
  const isCapture = tabName === "capture";
  elements.captureTab.classList.toggle("active", isCapture);
  elements.settingsTab.classList.toggle("active", !isCapture);
  elements.captureTabButton.classList.toggle("active", isCapture);
  elements.settingsTabButton.classList.toggle("active", !isCapture);
}

function clearOutputs() {
  lastCapture = null;
  lastAffiliateLink = "";
  elements.detectedLinkField.value = "";
  elements.affiliateLinkField.value = "";
  elements.mediaTypeField.value = "";
  elements.confidenceField.value = "";
}

function labelMediaType(mediaType) {
  if (mediaType === "video") return "Video";
  if (mediaType === "image") return "Imagem";
  return "Desconhecida";
}

function labelConfidence(confidence) {
  if (confidence === "high") return "Alta";
  if (confidence === "medium") return "Media";
  return "Baixa";
}

function setStatus(message) {
  elements.statusField.value = message;
}

function setBusy(isBusy) {
  elements.downloadMediaButton.disabled = isBusy;
}
