(function bootstrapInstaPostSorter(global) {
  "use strict";

  const MESSAGE_SOURCE = "insta-post-sorter";
  const DEFAULT_LOAD_LIMIT = 100;
  const SCROLL_STEP_PX = 900;
  const SCROLL_DELAY_MS = 900;
  const DEFAULT_ANALYZE_LIMIT = 120;
  const DEFAULT_ENRICH_LIMIT = 12;
  const DEFAULT_API_LIMIT = 1000;

  let cachedPosts = [];
  let cachedDiagnostics = null;
  let activeController = null;

  async function analyze(options) {
    cancelActiveAnalysis();
    activeController = new AbortController();

    const activeOptions = Object.assign({
      maxPosts: DEFAULT_ANALYZE_LIMIT,
      enrichLimit: DEFAULT_ENRICH_LIMIT
    }, options || {}, {
      signal: activeController.signal
    });

    try {
      const result = await getBestAnalysis(activeOptions);
      cachedPosts = result.posts;
      cachedDiagnostics = result.diagnostics;
      global.InstaPostSorterDom.renderBadges(cachedPosts);

      return {
        ok: true,
        posts: global.InstaPostSorterCsv.serializePosts(cachedPosts),
        diagnostics: cachedDiagnostics
      };
    } finally {
      activeController = null;
    }
  }

  async function ensureAnalysis(options) {
    if (!cachedPosts.length) {
      await analyze(options);
    }
  }

  async function sort(sortKey) {
    await ensureAnalysis();
    hydrateDomCards(cachedPosts);
    const result = global.InstaPostSorterSorter.applyVisualSort(cachedPosts, sortKey);
    if (result.ok) {
      global.InstaPostSorterDom.renderBadges(cachedPosts);
    }
    return Object.assign({}, result, {
      nativeGridSorted: Boolean(result.ok),
      posts: global.InstaPostSorterCsv.serializePosts(cachedPosts)
    });
  }

  function restore() {
    return global.InstaPostSorterSorter.restoreOriginalOrder();
  }

  function cancelActiveAnalysis() {
    if (activeController) {
      activeController.abort();
      activeController = null;
      return true;
    }
    return false;
  }

  async function loadMore(options) {
    const limit = Number(options && options.limit) || DEFAULT_LOAD_LIMIT;
    const maxSteps = Number(options && options.maxSteps) || 8;
    let lastCount = cachedPosts.length;
    let stableSteps = 0;

    for (let step = 0; step < maxSteps && cachedPosts.length < limit; step += 1) {
      window.scrollBy({ top: SCROLL_STEP_PX, left: 0, behavior: "smooth" });
      await wait(SCROLL_DELAY_MS);
      await analyze({ maxPosts: limit, enrichLimit: 8, maxApiPosts: limit });

      if (cachedPosts.length <= lastCount) {
        stableSteps += 1;
      } else {
        stableSteps = 0;
      }

      lastCount = cachedPosts.length;
      if (stableSteps >= 2) break;
    }

    return {
      ok: true,
      posts: global.InstaPostSorterCsv.serializePosts(cachedPosts),
      diagnostics: cachedDiagnostics,
      limit,
      count: cachedPosts.length
    };
  }

  async function exportCsv(options) {
    await ensureAnalysis();
    if (options && options.download === true) {
      global.InstaPostSorterCsv.downloadCsv(cachedPosts, options.filename);
    }

    return {
      ok: true,
      filename: options && options.filename ? options.filename : null,
      csv: global.InstaPostSorterCsv.toCsv(cachedPosts),
      count: cachedPosts.length
    };
  }

  async function diagnostics() {
    await ensureAnalysis();
    return {
      ok: true,
      diagnostics: cachedDiagnostics
    };
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  async function getBestAnalysis(options) {
    let apiFailureReason = "";

    if (options && options.useApi !== false && global.InstaPostSorterApi) {
      const apiResult = await global.InstaPostSorterApi.fetchProfilePosts(Object.assign({
        maxApiPosts: DEFAULT_API_LIMIT
      }, options));

      if (apiResult && apiResult.ok && apiResult.posts.length) {
        hydrateDomCards(apiResult.posts);
        return {
          posts: apiResult.posts,
          diagnostics: Object.assign(
            global.InstaPostSorterParser.buildDiagnostics(apiResult.posts),
            {
              source: "instagram_api",
              totalAvailable: apiResult.totalCount,
              indexedCount: apiResult.posts.length,
              possibleIssues: buildApiIssues(apiResult)
            }
          )
        };
      }

      apiFailureReason = apiResult
        ? apiResult.reason || `API retornou ok=${Boolean(apiResult.ok)} com ${Array.isArray(apiResult.posts) ? apiResult.posts.length : 0} posts.`
        : "API nao retornou resposta para o content script.";
    }

    const fallback = await global.InstaPostSorterParser.analyze(options);
    fallback.diagnostics.source = "dom";
    fallback.diagnostics.indexedCount = fallback.posts.length;
    fallback.diagnostics.totalAvailable = fallback.posts.length;
    if (apiFailureReason) {
      fallback.diagnostics.possibleIssues = fallback.diagnostics.possibleIssues || [];
      fallback.diagnostics.possibleIssues.unshift(`Fallback DOM ativo: ${apiFailureReason}`);
    }
    return fallback;
  }

  function buildApiIssues(apiResult) {
    const issues = [];
    const indexedCount = apiResult.posts ? apiResult.posts.length : 0;
    if (indexedCount && apiResult.totalCount && indexedCount < apiResult.totalCount) {
      issues.push(`Indexados ${indexedCount} de ${apiResult.totalCount} posts disponiveis.`);
    }
    if (apiResult.totalCount > indexedCount) {
      issues.push(`Limite atual de leitura: ${indexedCount} posts. Aumente o limite no painel se precisar mais.`);
    }
    issues.push("A ordenacao visual afeta somente os cards que o Instagram ja renderizou na pagina.");
    return issues;
  }

  function hydrateDomCards(posts) {
    const anchorsByUrl = new Map();
    global.InstaPostSorterDom.getPostAnchors(document).forEach((anchor) => {
      const url = normalizePostUrl(global.InstaPostSorterDom.getAbsolutePostUrl(anchor));
      if (url) anchorsByUrl.set(url, anchor);
    });

    posts.forEach((post) => {
      const anchor = anchorsByUrl.get(normalizePostUrl(post.postUrl));
      if (!anchor) return;
      post.anchorElement = anchor;
      post.cardElement = global.InstaPostSorterDom.getCardElement(anchor);
    });
  }

  function normalizePostUrl(url) {
    try {
      const parsed = new URL(url, location.origin);
      return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}/`;
    } catch (_error) {
      return "";
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.source !== MESSAGE_SOURCE) {
      return false;
    }

    Promise.resolve()
      .then(() => {
        switch (message.type) {
          case "ANALYZE_POSTS":
            return analyze(message.options);
          case "CANCEL_ANALYSIS":
            return { ok: true, cancelled: cancelActiveAnalysis() };
          case "SORT_POSTS":
            return sort(message.sortKey);
          case "RESTORE_ORIGINAL_ORDER":
            return restore();
          case "LOAD_MORE_POSTS":
            return loadMore(message.options);
          case "EXPORT_CSV":
            return exportCsv(message.options);
          case "GET_DIAGNOSTICS":
            return diagnostics();
          default:
            return {
              ok: false,
              error: `Mensagem nao suportada: ${message.type || "sem tipo"}`
            };
        }
      })
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error && error.message ? error.message : "Erro inesperado no content script."
        });
      });

    return true;
  });

  global.InstaPostSorter = {
    analyze,
    sort,
    restore,
    cancel: cancelActiveAnalysis,
    loadMore,
    exportCsv,
    diagnostics
  };
})(window);
