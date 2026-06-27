(function attachParser(global) {
  "use strict";

  const DEFAULT_WEIGHTS = {
    likes: 1,
    comments: 2,
    views: 0.01
  };

  const METRIC_LABELS = {
    likes: ["like", "likes", "curtida", "curtidas"],
    comments: ["comment", "comments", "comentario", "comentarios"],
    views: ["view", "views", "visualizacao", "visualizacoes", "reproducoes"],
    shares: ["share", "shares", "compartilhamento", "compartilhamentos"]
  };

  const DEFAULT_ENRICH_LIMIT = 12;
  const DEFAULT_MAX_POSTS = 120;

  function normalizeText(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function parseNumber(raw) {
    let text = normalizeText(raw).replace(/\u00a0/g, " ");
    if (!text) return null;

    const compactMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(mi|m|mil|k)\b/i);
    if (compactMatch) {
      const compactValue = Number.parseFloat(compactMatch[1].replace(",", "."));
      if (!Number.isFinite(compactValue)) return null;
      const suffix = compactMatch[2] || "";
      if (suffix === "mi" || suffix === "m") return Math.round(compactValue * 1000000);
      if (suffix === "mil" || suffix === "k") return Math.round(compactValue * 1000);
    }

    text = text.replace(/\b(\d{1,3}(?:[.,]\d{3})+)\b/g, (match) => match.replace(/[.,]/g, ""));
    const match = text.match(/(\d+(?:[.,]\d+)?)/i);
    if (!match) return null;

    const value = Number.parseFloat(match[1].replace(",", "."));
    if (!Number.isFinite(value)) return null;

    return Math.round(value);
  }

  function textContainsAny(text, words) {
    const normalized = normalizeText(text);
    return words.some((word) => normalized.includes(word));
  }

  function extractMetricFromText(text, metric) {
    const normalized = normalizeText(text);
    const labels = METRIC_LABELS[metric] || [];

    for (const label of labels) {
      const afterNumber = new RegExp(`(\\d[\\d.,]*\\s*(?:mi|m|mil|k)?)\\s+${label}\\b`, "i");
      const beforeNumber = new RegExp(`${label}\\D{0,24}(\\d[\\d.,]*\\s*(?:mi|m|mil|k)?)`, "i");
      const afterMatch = normalized.match(afterNumber);
      const beforeMatch = normalized.match(beforeNumber);

      if (afterMatch) return parseNumber(afterMatch[1]);
      if (beforeMatch) return parseNumber(beforeMatch[1]);
    }

    return null;
  }

  // Fallback: extract metrics positionally from hover-overlay list (ul > li pattern).
  // Instagram profile grids show likes/comments as bare numbers inside a <ul> — no labels.
  function extractMetricsFromOverlay(anchor) {
    const card = global.InstaPostSorterDom.getCardElement(anchor);
    const lists = Array.from(card.querySelectorAll("ul"));
    for (const list of lists) {
      const items = Array.from(list.children);
      if (items.length < 2) continue;
      const n0 = parseNumber(items[0].textContent);
      const n1 = parseNumber(items[1].textContent);
      if (n0 !== null && n1 !== null) {
        return { likes: n0, comments: n1 };
      }
    }
    return null;
  }

  function getNearbyText(anchor) {
    const chunks = [];
    const card = global.InstaPostSorterDom.getCardElement(anchor);
    const candidates = [anchor, card, card && card.parentElement].filter(Boolean);

    candidates.forEach((node) => {
      chunks.push(node.getAttribute && node.getAttribute("aria-label"));
      chunks.push(node.textContent);
      Array.from(node.querySelectorAll ? node.querySelectorAll("[aria-label], img[alt]") : [])
        .forEach((child) => {
          chunks.push(child.getAttribute("aria-label"));
          chunks.push(child.getAttribute("alt"));
        });
    });

    return chunks.filter(Boolean).join(" ");
  }

  function inferType(url, anchor) {
    if (url.includes("/reel/")) return "reel";
    if (url.includes("/tv/")) return "video";

    const text = getNearbyText(anchor);
    if (textContainsAny(text, ["carrossel", "carousel"])) return "carousel";
    if (url.includes("/p/")) return "post";
    return "unknown";
  }

  function getThumbnail(anchor) {
    const image = anchor.querySelector("img") || global.InstaPostSorterDom.getCardElement(anchor).querySelector("img");
    return image ? image.currentSrc || image.src || "" : "";
  }

  function getVideoUrl(anchor) {
    const video = anchor.querySelector("video") || global.InstaPostSorterDom.getCardElement(anchor).querySelector("video");
    return video ? video.currentSrc || video.src || "" : "";
  }

  function getCaption(anchor) {
    const image = anchor.querySelector("img") || global.InstaPostSorterDom.getCardElement(anchor).querySelector("img");
    return image ? image.getAttribute("alt") || "" : "";
  }

  function getDate(anchor) {
    const time = global.InstaPostSorterDom.getCardElement(anchor).querySelector("time[datetime]");
    return time ? time.getAttribute("datetime") : "";
  }

  function calculateEngagement(metrics, weights) {
    const activeWeights = Object.assign({}, DEFAULT_WEIGHTS, weights || {});
    return (
      (metrics.likes || 0) * activeWeights.likes +
      (metrics.comments || 0) * activeWeights.comments +
      (metrics.views || 0) * activeWeights.views
    );
  }

  function parsePost(anchor, options) {
    const text = getNearbyText(anchor);
    const metrics = {
      likes:    extractMetricFromText(text, "likes")    || 0,
      comments: extractMetricFromText(text, "comments") || 0,
      views:    extractMetricFromText(text, "views")    || 0,
      shares:   extractMetricFromText(text, "shares")
    };

    // If keyword-based extraction found nothing, try the hover-overlay positional fallback.
    if (!metrics.likes && !metrics.comments) {
      const overlay = extractMetricsFromOverlay(anchor);
      if (overlay) {
        metrics.likes    = overlay.likes    || 0;
        metrics.comments = overlay.comments || 0;
      }
    }
    const url = global.InstaPostSorterDom.getAbsolutePostUrl(anchor);
    const cardElement = global.InstaPostSorterDom.getCardElement(anchor);

    return {
      profileUrl: global.InstaPostSorterDom.getProfileUrl(),
      postUrl: url,
      type: inferType(url, anchor),
      likes: metrics.likes,
      comments: metrics.comments,
      views: metrics.views,
      shares: metrics.shares,
      engagementScore: calculateEngagement(metrics, options && options.weights),
      caption: getCaption(anchor),
      thumbnailUrl: getThumbnail(anchor),
      videoUrl: getVideoUrl(anchor),
      detectedAt: new Date().toISOString(),
      date: getDate(anchor),
      anchorElement: anchor,
      cardElement
    };
  }

  async function analyze(options) {
    throwIfAborted(options);

    const seen = new Set();
    const maxPosts = Number(options && options.maxPosts) || DEFAULT_MAX_POSTS;
    const posts = global.InstaPostSorterDom.getPostAnchors(document)
      .filter((post) => {
        const postUrl = global.InstaPostSorterDom.getAbsolutePostUrl(post);
        if (!postUrl || seen.has(postUrl)) return false;
        seen.add(postUrl);
        return true;
      })
      .slice(0, maxPosts)
      .map((anchor) => parsePost(anchor, options));

    await enrichMissingMetrics(posts, options);

    return {
      posts,
      diagnostics: buildDiagnostics(posts)
    };
  }

  async function enrichMissingMetrics(posts, options) {
    if (options && options.enrich === false) return;

    const limit = Number(options && options.enrichLimit) || DEFAULT_ENRICH_LIMIT;
    const targets = posts
      .filter((post) => !post.likes && !post.comments && post.postUrl)
      .slice(0, limit);

    for (const post of targets) {
      throwIfAborted(options);
      const metadata = await fetchPostMetadata(post.postUrl, options);
      if (!metadata) continue;

      post.likes = metadata.likes || post.likes || 0;
      post.comments = metadata.comments || post.comments || 0;
      post.views = metadata.views || post.views || 0;
      post.shares = metadata.shares === null || metadata.shares === undefined ? post.shares : metadata.shares;
      post.caption = metadata.caption || post.caption;
      post.thumbnailUrl = metadata.thumbnailUrl || post.thumbnailUrl;
      post.videoUrl = metadata.videoUrl || post.videoUrl;
      post.date = metadata.date || post.date;
      post.engagementScore = calculateEngagement(post, options && options.weights);
    }
  }

  async function fetchPostMetadata(url, options) {
    try {
      const response = await fetch(url, {
        credentials: "include",
        cache: "force-cache",
        signal: options && options.signal
      });
      if (!response.ok) return null;

      return parsePostHtml(await response.text());
    } catch (_error) {
      return null;
    }
  }

  function throwIfAborted(options) {
    if (options && options.signal && options.signal.aborted) {
      const error = new Error("Analise cancelada pelo usuario.");
      error.name = "AbortError";
      throw error;
    }
  }

  function parsePostHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const description = getMetaContent(doc, "og:description") || "";
    const title = getMetaContent(doc, "og:title") || "";
    const image = getMetaContent(doc, "og:image") || "";
    const video = getMetaContent(doc, "og:video") || getMetaContent(doc, "og:video:url") || "";
    const jsonText = Array.from(doc.querySelectorAll("script[type='application/ld+json']"))
      .map((script) => script.textContent || "")
      .join(" ");
    const text = `${description} ${title} ${jsonText}`;

    return {
      likes: extractMetricFromText(text, "likes") || 0,
      comments: extractMetricFromText(text, "comments") || 0,
      views: extractMetricFromText(text, "views") || 0,
      shares: extractMetricFromText(text, "shares"),
      caption: description,
      thumbnailUrl: image,
      videoUrl: video,
      date: extractDateFromText(text)
    };
  }

  function getMetaContent(doc, property) {
    const selector = `meta[property="${property}"], meta[name="${property}"]`;
    const meta = doc.querySelector(selector);
    return meta ? meta.getAttribute("content") || "" : "";
  }

  function extractDateFromText(text) {
    const match = String(text || "").match(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/);
    return match ? match[0] : "";
  }

  function countAvailable(posts, key) {
    return posts.filter((post) => Number.isFinite(post[key]) && post[key] > 0).length;
  }

  function buildDiagnostics(posts) {
    const metricsFound = {
      likes: countAvailable(posts, "likes"),
      comments: countAvailable(posts, "comments"),
      views: countAvailable(posts, "views"),
      shares: countAvailable(posts, "shares")
    };

    return {
      pageUrl: location.href,
      profileHandle: global.InstaPostSorterDom.getProfileHandle(),
      profileUrl: global.InstaPostSorterDom.getProfileUrl(),
      pageType: inferPageType(),
      postsFound: posts.length,
      metricsFound,
      unavailableMetrics: Object.keys(metricsFound).filter((key) => metricsFound[key] === 0),
      possibleIssues: getPossibleIssues(posts, metricsFound)
    };
  }

  function inferPageType() {
    const path = location.pathname;
    if (path.includes("/explore/")) return "explore";
    if (path.includes("/reels/")) return "reels";
    if (path.includes("/saved/")) return "saved";
    if (/^\/[^/]+\/?$/.test(path)) return "profile";
    return "unknown";
  }

  function getPossibleIssues(posts, metricsFound) {
    const issues = [];
    if (!global.InstaPostSorterDom.isInstagramPage()) {
      issues.push("A pagina atual nao parece ser do Instagram.");
    }
    if (!posts.length) {
      issues.push("Nenhum link de post, reel ou video foi encontrado no DOM carregado.");
    }
    if (posts.length && metricsFound.likes === 0 && metricsFound.comments === 0) {
      issues.push(
        "Metricas nao detectadas nos posts carregados. O Instagram pode estar ocultando estes dados para esta conta, idioma ou layout."
      );
    }
    if (metricsFound.shares === 0) {
      issues.push("Compartilhamentos geralmente nao ficam publicamente visiveis no Instagram.");
    }
    return issues;
  }

  global.InstaPostSorterParser = {
    DEFAULT_WEIGHTS,
    parseNumber,
    parsePostHtml,
    analyze,
    calculateEngagement,
    buildDiagnostics
  };
})(window);
