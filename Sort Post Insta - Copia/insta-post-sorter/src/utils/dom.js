(function attachDomUtils(global) {
  "use strict";

  const POST_PATH_PATTERN = /\/(p|reel|tv)\//;

  function isInstagramPage() {
    return location.hostname === "www.instagram.com" || location.hostname === "instagram.com";
  }

  function getProfileUrl() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (!parts.length) return location.origin;
    return `${location.origin}/${parts[0]}/`;
  }

  function getProfileHandle() {
    const parts = location.pathname.split("/").filter(Boolean);
    const reserved = new Set([
      "accounts",
      "direct",
      "explore",
      "p",
      "reel",
      "reels",
      "stories",
      "tv"
    ]);

    if (!parts.length || reserved.has(parts[0])) return "";
    return `@${parts[0]}`;
  }

  function getPostAnchors(root) {
    return Array.from((root || document).querySelectorAll("a[href]"))
      .filter((anchor) => POST_PATH_PATTERN.test(anchor.getAttribute("href") || ""));
  }

  function getAbsolutePostUrl(anchor) {
    try {
      return new URL(anchor.getAttribute("href"), location.origin).toString();
    } catch (_error) {
      return "";
    }
  }

  function getCardElement(anchor) {
    const article = anchor.closest("article");
    if (article) return article;

    return getSortableTile(anchor) || anchor;
  }

  function getSortableTile(anchor) {
    let current = anchor;

    for (let depth = 0; current && current.parentElement && depth < 10; depth += 1) {
      const parent = current.parentElement;
      const siblingsWithPosts = Array.from(parent.children)
        .filter((child) => getPostAnchors(child).length > 0);

      if (siblingsWithPosts.length >= 2 && siblingsWithPosts.includes(current)) {
        return current;
      }

      current = parent;
    }

    return null;
  }

  function getSortableGridFromPosts(posts) {
    const groups = new Map();

    posts.forEach((post) => {
      const anchor = post.anchorElement;
      if (!anchor) return;

      const tile = getSortableTile(anchor);
      if (!tile || !tile.parentElement) return;

      const group = groups.get(tile.parentElement) || [];
      group.push({
        post,
        tile
      });
      groups.set(tile.parentElement, group);
    });

    let best = null;
    groups.forEach((items, container) => {
      if (!best || items.length > best.items.length) {
        best = {
          container,
          items
        };
      }
    });

    return best;
  }

  function ensureBadge(card, text) {
    const existing = card.querySelector(":scope > [data-insta-post-sorter-badge]");
    const badge = existing || document.createElement("div");
    badge.dataset.instaPostSorterBadge = "true";
    badge.textContent = text;
    badge.setAttribute("aria-label", "Metricas detectadas pelo Insta Post Sorter");
    badge.style.cssText = [
      "position:absolute",
      "left:6px",
      "bottom:6px",
      "z-index:20",
      "max-width:calc(100% - 12px)",
      "padding:4px 6px",
      "border-radius:6px",
      "background:rgba(0,0,0,.72)",
      "color:#fff",
      "font:11px/1.3 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "pointer-events:none",
      "box-sizing:border-box"
    ].join(";");

    const position = getComputedStyle(card).position;
    if (position === "static") {
      card.style.position = "relative";
    }

    if (!existing) {
      card.appendChild(badge);
    }
  }

  function formatMetric(value) {
    return Number.isFinite(value) && value > 0 ? String(Math.round(value)) : "n/d";
  }

  function renderBadges(posts) {
    posts.forEach((post) => {
      if (!post.cardElement) return;
      ensureBadge(
        post.cardElement,
        `L ${formatMetric(post.likes)} | C ${formatMetric(post.comments)} | V ${formatMetric(post.views)} | S ${formatMetric(post.engagementScore)}`
      );
    });
  }

  function removeBadges(root) {
    Array.from((root || document).querySelectorAll("[data-insta-post-sorter-badge]"))
      .forEach((badge) => badge.remove());
  }

  global.InstaPostSorterDom = {
    isInstagramPage,
    getProfileUrl,
    getProfileHandle,
    getPostAnchors,
    getAbsolutePostUrl,
    getCardElement,
    getSortableTile,
    getSortableGridFromPosts,
    renderBadges,
    removeBadges
  };
})(window);
