"use strict";

(() => {
  const DETECTOR_VERSION = "1.2.0";

  if (window.__storyShopeeSaverVersion === DETECTOR_VERSION) {
    return;
  }

  window.__storyShopeeSaverVersion = DETECTOR_VERSION;
  window.__storyShopeeSaverCaptureStory = captureStory;
  window.__storyShopeeSaverShowOverlay = showOverlay;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "STORYSHOPEE_CAPTURE") {
      return false;
    }

    sendResponse(captureStory());
    return false;
  });

  function captureStory() {
    const notes = [];

    if (!isFacebookPage()) {
      return emptyResult("Este script roda apenas em paginas do Facebook.");
    }

    const video = findBestVideo(notes);
    const image = findBestImage(notes);
    const media = chooseMedia(video, image, notes);
    const linkResult = findShopeeLink(notes);
    const pageName = detectPageName();
    const confidence = calculateConfidence(media, linkResult.originalLink);

    if (!media.mediaUrl) {
      notes.push("Nenhuma mídia detectada no story atual.");
    }

    if (!linkResult.originalLink) {
      notes.push("Nenhum link da Shopee encontrado.");
    }

    return {
      mediaType: media.mediaType,
      mediaUrl: media.mediaUrl,
      originalLink: linkResult.originalLink,
      pageName,
      confidence,
      notes
    };
  }

  function emptyResult(note) {
    return {
      mediaType: "unknown",
      mediaUrl: null,
      originalLink: null,
      pageName: null,
      confidence: "low",
      notes: [note]
    };
  }

  function isFacebookPage() {
    return location.hostname === "facebook.com" || location.hostname.endsWith(".facebook.com");
  }

  function findBestVideo(notes) {
    const candidates = Array.from(document.querySelectorAll("video"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const mediaUrl = getVideoUrl(element);
        return {
          element,
          rect,
          mediaUrl,
          score: scoreVideoElement(element, rect),
          centered: isNearViewportCenter(rect)
        };
      })
      .filter((candidate) => isUsableVideoCandidate(candidate));

    candidates.sort((a, b) => Number(b.centered) - Number(a.centered) || b.score - a.score);
    const best = candidates[0];

    if (best?.mediaUrl?.startsWith("blob:")) {
      notes.push("Video detectado com URL blob temporaria; o download pode falhar fora da aba atual.");
    }

    return best || null;
  }

  function getVideoUrl(video) {
    const directUrl = video.currentSrc || video.src || findSourceChild(video);
    if (directUrl) {
      return directUrl;
    }

    const attributeUrl = findVideoUrlInAttributes(video);
    if (attributeUrl) {
      return attributeUrl;
    }

    return "";
  }

  function findVideoUrlInAttributes(video) {
    const values = [];
    let current = video;

    for (let depth = 0; depth < 5 && current; depth += 1) {
      for (const attribute of current.getAttributeNames()) {
        const value = current.getAttribute(attribute);
        if (value) {
          values.push(value, safeDecode(value));
        }
      }
      current = current.parentElement;
    }

    return values
      .flatMap(extractUrls)
      .map(normalizePossibleFacebookRedirect)
      .find((url) => isLikelyVideoUrl(url)) || "";
  }

  function isLikelyVideoUrl(url) {
    try {
      const parsed = new URL(url);
      const value = parsed.href.toLowerCase();
      const host = parsed.hostname.toLowerCase();
      return (
        host.endsWith("fbcdn.net") &&
        (
          value.includes(".mp4") ||
          value.includes("video") ||
          value.includes("/v/") ||
          value.includes("fbcdn-video")
        )
      );
    } catch (_error) {
      return false;
    }
  }

  function findBestImage(notes) {
    const candidates = Array.from(document.querySelectorAll("img"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const naturalWidth = element.naturalWidth || rect.width;
        const naturalHeight = element.naturalHeight || rect.height;
        const mediaUrl = element.currentSrc || element.src || "";
        return {
          element,
          rect,
          mediaUrl,
          score: scoreElement(rect, naturalWidth, naturalHeight),
          centered: isNearViewportCenter(rect)
        };
      })
      .filter((candidate) => isUsableMediaCandidate(candidate, 220, 260))
      .filter((candidate) => !looksLikeAvatarOrIcon(candidate.element, candidate.rect));

    candidates.sort((a, b) => Number(b.centered) - Number(a.centered) || b.score - a.score);

    if (!candidates.length) {
      notes.push("Imagens pequenas, avatares e icones foram ignorados.");
    }

    return candidates[0] || null;
  }

  function chooseMedia(video, image, notes) {
    if (video && (!image || video.score >= image.score * 0.75)) {
      return { mediaType: "video", mediaUrl: video.mediaUrl };
    }

    if (image) {
      return { mediaType: "image", mediaUrl: image.mediaUrl };
    }

    notes.push("Nao foi possivel identificar uma tag video ou img principal no viewport.");
    return { mediaType: "unknown", mediaUrl: null };
  }

  function findSourceChild(video) {
    const source = video.querySelector("source[src]");
    return source?.src || "";
  }

  function isUsableMediaCandidate(candidate, minWidth, minHeight) {
    return Boolean(
      candidate.mediaUrl &&
      isVisibleRect(candidate.rect) &&
      candidate.rect.width >= minWidth &&
      candidate.rect.height >= minHeight
    );
  }

  function isUsableVideoCandidate(candidate) {
    const video = candidate.element;
    const hasUsefulSource = Boolean(candidate.mediaUrl);
    const hasPlaybackData = video.readyState > 0 || video.videoWidth > 0 || video.videoHeight > 0;
    const largeEnough = candidate.rect.width >= 120 && candidate.rect.height >= 120;

    return Boolean(
      hasUsefulSource &&
      (isVisibleRect(candidate.rect) || hasPlaybackData) &&
      largeEnough
    );
  }

  function scoreVideoElement(video, rect) {
    let score = scoreElement(rect, video.videoWidth || rect.width, video.videoHeight || rect.height);
    if (isNearViewportCenter(rect)) score += 700000;
    if (!video.paused && !video.ended) score += 500000;
    if (video.currentTime > 0) score += 100000;
    if (video.readyState >= 2) score += 75000;
    if (video.currentSrc && !video.currentSrc.startsWith("blob:")) score += 50000;
    return score;
  }

  function isVisibleRect(rect) {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const intersects = rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
    return intersects && rect.width > 0 && rect.height > 0;
  }

  function isNearViewportCenter(rect) {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const inCenterColumn = centerX >= viewportWidth * 0.22 && centerX <= viewportWidth * 0.78;
    const inCenterRows = centerY >= viewportHeight * 0.08 && centerY <= viewportHeight * 0.94;
    const coversUsefulArea = rect.width * rect.height >= viewportWidth * viewportHeight * 0.08;
    return inCenterColumn && inCenterRows && coversUsefulArea;
  }

  function scoreElement(rect, naturalWidth, naturalHeight) {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    const visibleArea = visibleWidth * visibleHeight;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceFromCenter = Math.hypot(centerX - viewportWidth / 2, centerY - viewportHeight / 2);
    const sourceArea = Number(naturalWidth || 0) * Number(naturalHeight || 0);

    return visibleArea + sourceArea * 0.15 - distanceFromCenter * 8;
  }

  function looksLikeAvatarOrIcon(element, rect) {
    const alt = (element.alt || "").toLowerCase();
    const aria = (element.getAttribute("aria-label") || "").toLowerCase();
    const className = String(element.className || "").toLowerCase();
    const roundish = Math.abs(rect.width - rect.height) < 12 && rect.width < 220;
    const namedSmallAsset = /avatar|profile|foto do perfil|icon|icone|emoji|logo/.test(`${alt} ${aria} ${className}`);

    return rect.width < 220 || rect.height < 220 || roundish || namedSmallAsset;
  }

  function findShopeeLink(notes) {
    const containers = getLikelyStoryContainers();
    const rawValues = [];

    for (const container of containers) {
      collectCandidateStrings(container, rawValues);
    }

    if (rawValues.length < 2) {
      collectCandidateStrings(document.body, rawValues, true);
    }

    for (const rawValue of rawValues) {
      const urls = extractUrls(rawValue);
      for (const url of urls) {
        const normalized = normalizePossibleFacebookRedirect(url);
        if (isShopeeUrl(normalized)) {
          return { originalLink: normalized };
        }
      }
    }

    const anyNonShopeeLink = rawValues.some((value) => extractUrls(value).length > 0);
    if (anyNonShopeeLink) {
      notes.push("Link detectado, mas não parece ser da Shopee.");
    }

    return { originalLink: null };
  }

  function getLikelyStoryContainers() {
    const visibleMedia = Array.from(document.querySelectorAll("video,img"))
      .filter((element) => isVisibleRect(element.getBoundingClientRect()))
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return (bRect.width * bRect.height) - (aRect.width * aRect.height);
      })
      .slice(0, 4);

    const containers = [];
    for (const media of visibleMedia) {
      let current = media;
      for (let index = 0; index < 6 && current; index += 1) {
        containers.push(current);
        current = current.parentElement;
      }
    }

    containers.push(document.body);
    return Array.from(new Set(containers)).filter(Boolean);
  }

  function collectCandidateStrings(root, output, shallow = false) {
    if (!root) {
      return;
    }

    const elements = shallow
      ? Array.from(root.querySelectorAll("a[href], [aria-label]")).slice(0, 300)
      : Array.from(root.querySelectorAll("a[href], [aria-label], [data-lynx-uri], [data-hovercard], [data-testid]")).slice(0, 180);

    if (root.textContent && root.textContent.length < 2500) {
      output.push(root.textContent);
    }

    for (const element of elements) {
      if (!isVisibleEnoughForLinkSearch(element)) {
        continue;
      }

      for (const attribute of element.getAttributeNames()) {
        const value = element.getAttribute(attribute);
        if (value && (attribute === "href" || attribute === "aria-label" || attribute.startsWith("data-"))) {
          output.push(value);
        }
      }

      const text = element.innerText || element.textContent || "";
      if (text) {
        output.push(text);
      }
    }
  }

  function isVisibleEnoughForLinkSearch(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && isVisibleRect(rect);
  }

  function extractUrls(value) {
    if (!value || typeof value !== "string") {
      return [];
    }

    const decodedOnce = safeDecode(value);
    const values = [value, decodedOnce];
    const urls = [];
    const urlPattern = /https?:\/\/[^\s"'<>\\)]+/gi;
    const looseShopeePattern = /(?:s\.)?shopee\.com\.br\/[^\s"'<>\\)]*|shope\.ee\/[^\s"'<>\\)]*/gi;

    for (const candidate of values) {
      urls.push(...(candidate.match(urlPattern) || []));
      urls.push(...(candidate.match(looseShopeePattern) || []).map((match) => `https://${match}`));
    }

    return Array.from(new Set(urls.map(cleanUrl)));
  }

  function cleanUrl(url) {
    return url.replace(/&amp;/g, "&").replace(/[.,;:!?]+$/g, "");
  }

  function normalizePossibleFacebookRedirect(url) {
    try {
      const parsed = new URL(url);
      const redirectParam = parsed.searchParams.get("u") || parsed.searchParams.get("url");
      if (parsed.hostname.endsWith("facebook.com") && redirectParam) {
        return safeDecode(redirectParam);
      }
      return parsed.href;
    } catch (_error) {
      return url;
    }
  }

  function safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch (_error) {
      return value;
    }
  }

  function isShopeeUrl(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname === "shopee.com.br" || hostname.endsWith(".shopee.com.br") || hostname === "shope.ee";
    } catch (_error) {
      return false;
    }
  }

  function detectPageName() {
    const ariaCurrent = document.querySelector("[aria-current='page']");
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,[role='heading']"));
    const candidates = [
      ariaCurrent?.textContent,
      ...headings.map((heading) => heading.textContent),
      document.title?.replace(/\| Facebook$/i, "").replace(/Facebook$/i, "")
    ];

    return candidates
      .map((value) => String(value || "").replace(/\s+/g, " ").trim())
      .find((value) => value.length >= 2 && value.length <= 80) || null;
  }

  function calculateConfidence(media, originalLink) {
    if (media.mediaUrl && originalLink) {
      return "high";
    }
    if (media.mediaUrl || originalLink) {
      return "medium";
    }
    return "low";
  }

  function showOverlay() {
    const existing = document.getElementById("storyshopee-overlay-host");
    if (existing) {
      existing.style.display = "block";
      const minimizedBody = existing.shadowRoot?.querySelector(".body");
      if (minimizedBody) {
        minimizedBody.style.display = "block";
      }
      return;
    }

    const host = document.createElement("div");
    host.id = "storyshopee-overlay-host";
    host.style.position = "fixed";
    host.style.top = "86px";
    host.style.right = "24px";
    host.style.zIndex = "2147483647";
    document.documentElement.appendChild(host);

    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host { all: initial; }
        .window {
          width: 390px;
          min-width: 320px;
          min-height: 220px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 32px);
          resize: both;
          overflow: auto;
          background: #ffffff;
          color: #1f2933;
          border: 1px solid #d8dde6;
          border-radius: 12px;
          box-shadow: 0 18px 52px rgba(15, 23, 42, 0.22);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          line-height: 1.4;
        }
        .titlebar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          background: #f7f8fb;
          border-bottom: 1px solid #e4e7ec;
          border-radius: 12px 12px 0 0;
          cursor: move;
          user-select: none;
        }
        .brand { min-width: 0; }
        .eyebrow {
          margin: 0;
          color: #ee4d2d;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        h1 {
          margin: 0;
          font-size: 16px;
          line-height: 1.2;
          letter-spacing: 0;
          color: #111827;
        }
        .controls {
          display: flex;
          gap: 6px;
          flex: 0 0 auto;
        }
        .icon-btn {
          width: 28px;
          height: 28px;
          border: 1px solid #d8dde6;
          border-radius: 8px;
          background: #fff;
          color: #344054;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
        }
        .body {
          display: block;
          padding: 14px;
        }
        .tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          background: #e9edf3;
          border: 1px solid #d8dde6;
          border-radius: 8px;
          margin-bottom: 12px;
          padding: 4px;
        }
        .tab {
          min-height: 32px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #667085;
          cursor: pointer;
          font: inherit;
          font-weight: 700;
        }
        .tab.active {
          background: #fff;
          color: #1f2933;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.08);
        }
        .panel { display: none; }
        .panel.active { display: block; }
        .primary, .secondary {
          width: 100%;
          min-height: 40px;
          border: 0;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-weight: 700;
          padding: 10px 12px;
        }
        .primary { background: #ee4d2d; }
        .secondary { background: #2563eb; }
        button:disabled { opacity: .55; cursor: not-allowed; }
        .field {
          display: grid;
          gap: 6px;
          margin: 11px 0;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        label {
          color: #667085;
          font-size: 12px;
          font-weight: 700;
        }
        input, textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d8dde6;
          border-radius: 8px;
          background: #fff;
          color: #1f2933;
          font: inherit;
          padding: 9px 10px;
          resize: vertical;
        }
        textarea[readonly], input[readonly] { background: #f9fafb; }
        .hint {
          margin: 10px 0 0;
          color: #667085;
          font-size: 12px;
        }
      </style>
      <section class="window" role="dialog" aria-label="StoryShopee Saver">
        <header class="titlebar">
          <div class="brand">
            <p class="eyebrow">Extensao local</p>
            <h1>StoryShopee Saver</h1>
          </div>
          <div class="controls">
            <button class="icon-btn" id="minimizeBtn" type="button" title="Minimizar">-</button>
            <button class="icon-btn" id="closeBtn" type="button" title="Fechar">x</button>
          </div>
        </header>
        <div class="body">
          <nav class="tabs">
            <button class="tab active" id="captureTabBtn" type="button">Captura</button>
            <button class="tab" id="configTabBtn" type="button">Config</button>
          </nav>
          <section class="panel active" id="capturePanel">
            <button class="primary" id="downloadBtn" type="button">Baixar midia do story</button>
            <div class="field grid">
              <div>
                <label>Gravacao</label>
                <input id="recordSeconds" type="number" min="3" max="60" value="15">
              </div>
              <div>
                <label>&nbsp;</label>
                <button class="secondary" id="recordBtn" type="button">Gravar story visivel</button>
              </div>
            </div>
            <div class="field">
              <label>Status</label>
              <textarea id="status" rows="4" readonly>Nenhuma acao ainda.</textarea>
            </div>
            <div class="field grid">
              <div>
                <label>Midia</label>
                <input id="mediaType" type="text" readonly>
              </div>
              <div>
                <label>Confianca</label>
                <input id="confidence" type="text" readonly>
              </div>
            </div>
            <div class="field">
              <label>Link detectado</label>
              <textarea id="originalLink" rows="2" readonly></textarea>
            </div>
            <div class="field">
              <label>Link afiliado</label>
              <textarea id="affiliateLink" rows="2" readonly></textarea>
            </div>
          </section>
          <section class="panel" id="configPanel">
            <div class="field">
              <label>ID/tag/codigo Shopee</label>
              <input id="affiliateId" type="text" placeholder="SEU_CODIGO">
            </div>
            <div class="field">
              <label>Template afiliado</label>
              <textarea id="template" rows="4" spellcheck="false"></textarea>
            </div>
            <button class="secondary" id="saveConfigBtn" type="button">Salvar configuracao</button>
            <p class="hint" id="configStatus"></p>
          </section>
        </div>
      </section>
    `;

    wireOverlay(root, host);
  }

  function wireOverlay(root, host) {
    const $ = (selector) => root.querySelector(selector);
    const body = $(".body");
    const titlebar = $(".titlebar");
    const downloadBtn = $("#downloadBtn");
    const recordBtn = $("#recordBtn");
    const recordSeconds = $("#recordSeconds");
    const status = $("#status");
    const mediaType = $("#mediaType");
    const confidence = $("#confidence");
    const originalLink = $("#originalLink");
    const affiliateLink = $("#affiliateLink");
    const affiliateId = $("#affiliateId");
    const template = $("#template");
    const configStatus = $("#configStatus");
    const defaultTemplate = "https://s.shopee.com.br/{{AFFILIATE_ID}}?url={{URL_ENCODED}}";

    $("#closeBtn").addEventListener("click", () => {
      host.remove();
    });

    $("#minimizeBtn").addEventListener("click", () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    $("#captureTabBtn").addEventListener("click", () => setOverlayTab(root, "capture"));
    $("#configTabBtn").addEventListener("click", () => setOverlayTab(root, "config"));

    chrome.storage.sync.get({ affiliateId: "", affiliateTemplate: defaultTemplate }, (settings) => {
      affiliateId.value = settings.affiliateId || "";
      template.value = settings.affiliateTemplate || defaultTemplate;
    });

    $("#saveConfigBtn").addEventListener("click", () => {
      if (!template.value.includes("{{URL_ENCODED}}")) {
        configStatus.textContent = "O template precisa conter {{URL_ENCODED}}.";
        return;
      }

      chrome.storage.sync.set({
        affiliateId: affiliateId.value.trim(),
        affiliateTemplate: template.value.trim()
      }, () => {
        configStatus.textContent = "Configuracao salva.";
      });
    });

    downloadBtn.addEventListener("click", async () => {
      downloadBtn.disabled = true;
      status.value = "Detectando midia visivel do story...";
      mediaType.value = "";
      confidence.value = "";
      originalLink.value = "";
      affiliateLink.value = "";

      try {
        const capture = captureStory();
        mediaType.value = labelMediaType(capture.mediaType);
        confidence.value = labelConfidence(capture.confidence);
        originalLink.value = capture.originalLink || "";

        const settings = await chrome.storage.sync.get({ affiliateId: "", affiliateTemplate: defaultTemplate });
        const converted = convertShopeeAffiliate(
          capture.originalLink,
          applyAffiliateId(settings.affiliateTemplate, settings.affiliateId)
        );
        affiliateLink.value = converted.ok ? converted.url : "";

        const messages = [
          capture.mediaUrl ? `Midia detectada: ${labelMediaType(capture.mediaType)}.` : "Nenhuma midia detectada no story atual.",
          capture.originalLink ? (converted.ok ? "Link afiliado gerado." : converted.error) : "Nenhum link da Shopee encontrado.",
          ...(capture.notes || [])
        ];
        status.value = Array.from(new Set(messages)).join("\n");

        if (!capture.mediaUrl) {
          throw new Error("Nenhuma midia detectada no story atual.");
        }

        const response = await chrome.runtime.sendMessage({
          type: "DOWNLOAD_STORY",
          payload: { capture, originalLink: capture.originalLink, affiliateLink: affiliateLink.value }
        });

        if (!response?.ok) {
          throw new Error(response?.error || "Nao foi possivel baixar a midia.");
        }

        const warnings = response.warnings || [];
        status.value = warnings.length ? `Download iniciado.\n${warnings.join("\n")}` : "Download iniciado.";
      } catch (error) {
        status.value = error.message || "Nao foi possivel baixar a midia.";
      } finally {
        downloadBtn.disabled = false;
      }
    });

    recordBtn.addEventListener("click", async () => {
      recordBtn.disabled = true;
      status.value = "O Chrome vai pedir para escolher a aba/tela. Selecione a aba do story.";

      try {
        const seconds = Math.min(60, Math.max(3, Number(recordSeconds.value || 15)));
        await recordVisibleStory(seconds, (message) => {
          status.value = message;
        });
      } catch (error) {
        status.value = error.message || "Nao foi possivel gravar o story visivel.";
      } finally {
        recordBtn.disabled = false;
      }
    });

    makeOverlayDraggable(host, titlebar);
  }

  function setOverlayTab(root, tab) {
    const capture = tab === "capture";
    root.querySelector("#captureTabBtn").classList.toggle("active", capture);
    root.querySelector("#configTabBtn").classList.toggle("active", !capture);
    root.querySelector("#capturePanel").classList.toggle("active", capture);
    root.querySelector("#configPanel").classList.toggle("active", !capture);
  }

  function makeOverlayDraggable(host, handle) {
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) {
        return;
      }

      const rect = host.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      host.style.right = "auto";
      host.setPointerCapture?.(event.pointerId);

      const onMove = (moveEvent) => {
        host.style.left = `${Math.max(8, startLeft + moveEvent.clientX - startX)}px`;
        host.style.top = `${Math.max(8, startTop + moveEvent.clientY - startY)}px`;
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
    });
  }

  function convertShopeeAffiliate(originalUrl, template) {
    if (!originalUrl) {
      return { ok: false, error: "Nenhum link da Shopee encontrado." };
    }

    if (!isShopeeUrl(originalUrl)) {
      return { ok: false, error: "Link detectado, mas nao parece ser da Shopee." };
    }

    if (!template || !template.includes("{{URL_ENCODED}}")) {
      return { ok: false, error: "Configure seu template de afiliado antes de converter." };
    }

    return {
      ok: true,
      url: template.trim().replaceAll("{{URL_ENCODED}}", encodeURIComponent(originalUrl))
    };
  }

  function applyAffiliateId(template, affiliateId) {
    return String(template || "").replaceAll("{{AFFILIATE_ID}}", encodeURIComponent(affiliateId || ""));
  }

  function labelMediaType(mediaType) {
    if (mediaType === "video") return "Video";
    if (mediaType === "image") return "Imagem";
    return "Desconhecida";
  }

  function labelConfidence(confidenceValue) {
    if (confidenceValue === "high") return "Alta";
    if (confidenceValue === "medium") return "Media";
    return "Baixa";
  }

  async function recordVisibleStory(seconds, onStatus) {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Este Chrome nao disponibilizou captura de tela para a pagina.");
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 30
      },
      audio: true
    });

    const mimeType = getSupportedRecordingMimeType();
    const chunks = [];
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) {
        chunks.push(event.data);
      }
    });

    const stopped = new Promise((resolve) => {
      recorder.addEventListener("stop", resolve, { once: true });
    });

    recorder.start(1000);

    for (let remaining = seconds; remaining > 0; remaining -= 1) {
      onStatus(`Gravando story visivel... ${remaining}s restantes.`);
      await delay(1000);
    }

    recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    await stopped;

    if (!chunks.length) {
      throw new Error("A gravacao terminou sem dados.");
    }

    const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
    const url = URL.createObjectURL(blob);
    const filename = `storyshopee_recording_${formatTimestamp(new Date())}.webm`;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.documentElement.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    onStatus(`Gravacao salva como ${filename}.`);
  }

  function getSupportedRecordingMimeType() {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
})();
