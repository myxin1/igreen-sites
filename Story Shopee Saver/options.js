"use strict";

const fields = {
  affiliateId: document.getElementById("affiliateIdField"),
  template: document.getElementById("templateField"),
  saveButton: document.getElementById("saveButton"),
  saveStatus: document.getElementById("saveStatus"),
  manualLink: document.getElementById("manualLinkField"),
  convertButton: document.getElementById("convertButton"),
  manualResult: document.getElementById("manualResultField"),
  manualStatus: document.getElementById("manualStatus")
};

fields.saveButton.addEventListener("click", saveSettings);
fields.convertButton.addEventListener("click", convertManualLink);
document.addEventListener("DOMContentLoaded", loadSettings);

loadSettings();

async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    affiliateId: "",
    affiliateTemplate: "https://s.shopee.com.br/SEU_CODIGO?url={{URL_ENCODED}}"
  });

  fields.affiliateId.value = settings.affiliateId || "";
  fields.template.value = settings.affiliateTemplate || "";
}

async function saveSettings() {
  const affiliateId = fields.affiliateId.value.trim();
  const affiliateTemplate = fields.template.value.trim();

  if (!affiliateTemplate) {
    fields.saveStatus.textContent = "Configure seu template de afiliado antes de converter.";
    return;
  }

  if (!affiliateTemplate.includes("{{URL_ENCODED}}")) {
    fields.saveStatus.textContent = "O template precisa conter {{URL_ENCODED}}.";
    return;
  }

  await chrome.storage.sync.set({ affiliateId, affiliateTemplate });
  fields.saveStatus.textContent = "Configuracoes salvas.";
}

async function convertManualLink() {
  const { affiliateTemplate, affiliateId } = await chrome.storage.sync.get({
    affiliateTemplate: "",
    affiliateId: ""
  });
  const template = applyAffiliateId(affiliateTemplate, affiliateId);
  const conversion = convertShopeeAffiliate(fields.manualLink.value.trim(), template);

  if (!conversion.ok) {
    fields.manualResult.value = "";
    fields.manualStatus.textContent = conversion.error;
    return;
  }

  fields.manualResult.value = conversion.url;
  fields.manualStatus.textContent = "Link afiliado gerado.";
}

function convertShopeeAffiliate(originalUrl, template) {
  if (!originalUrl) {
    return { ok: false, error: "Cole um link da Shopee para converter." };
  }

  if (!isShopeeUrl(originalUrl)) {
    return { ok: false, error: "Link detectado, mas não parece ser da Shopee." };
  }

  if (!template || !template.trim()) {
    return { ok: false, error: "Configure seu template de afiliado antes de converter." };
  }

  if (!template.includes("{{URL_ENCODED}}")) {
    return { ok: false, error: "O template precisa conter {{URL_ENCODED}}." };
  }

  return {
    ok: true,
    url: template.trim().replaceAll("{{URL_ENCODED}}", encodeURIComponent(originalUrl))
  };
}

function applyAffiliateId(template, affiliateId) {
  return String(template || "").replaceAll("{{AFFILIATE_ID}}", encodeURIComponent(affiliateId || ""));
}

function isShopeeUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "shopee.com.br" || hostname.endsWith(".shopee.com.br") || hostname === "shope.ee";
  } catch (_error) {
    return false;
  }
}
