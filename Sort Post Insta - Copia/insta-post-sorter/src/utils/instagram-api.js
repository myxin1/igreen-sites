(function attachInstagramApi(global) {
  "use strict";

  const WEB_APP_ID = "936619743392459";
  const PROFILE_POSTS_QUERY_HASH = "003056d32c2554def87228bc3fd9668a";
  const DEFAULT_MAX_POSTS = 1000;
  const PAGE_SIZE = 50;
  let lastFailureReason = "";

  async function fetchProfilePosts(options) {
    const username = getUsername();
    if (!username) {
      return {
        ok: false,
        reason: "Nao foi possivel identificar o @perfil nesta pagina.",
        posts: [],
        totalCount: 0
      };
    }

    throwIfAborted(options);

    lastFailureReason = "";

    const profile = await fetchProfileInfo(username, options) || await fetchProfileFromPage(username, options);
    if (!profile || !profile.user) {
      return {
        ok: false,
        reason: lastFailureReason || "O endpoint de perfil do Instagram nao respondeu com dados de posts.",
        posts: [],
        totalCount: 0
      };
    }

    const user = profile.user;
    const maxPosts = Number(options && options.maxApiPosts) || DEFAULT_MAX_POSTS;
    const posts = [];
    const seen = new Set();

    appendGraphqlEdges(posts, seen, user.edge_owner_to_timeline_media && user.edge_owner_to_timeline_media.edges);

    let cursor = getInitialCursor(user);
    let shouldFetchFeed = Boolean(user.id) && posts.length < maxPosts;

    while (shouldFetchFeed && posts.length < maxPosts) {
      throwIfAborted(options);
      const page = await fetchNextPage(user.id, cursor, options);
      if (!page) break;
      if (!page.posts.length && !page.hasNextPage) break;

      page.posts.forEach((post) => appendPost(posts, seen, post));
      cursor = page.cursor || "";
      shouldFetchFeed = Boolean(page.hasNextPage && cursor);
    }

    if (!posts.length) {
      return {
        ok: false,
        reason: lastFailureReason || "Perfil encontrado, mas nenhum endpoint retornou lista de posts.",
        username,
        userId: user.id || "",
        posts: [],
        totalCount: Number(user.edge_owner_to_timeline_media && user.edge_owner_to_timeline_media.count) || 0
      };
    }

    return {
      ok: true,
      username,
      userId: user.id || "",
      totalCount: Number(user.edge_owner_to_timeline_media && user.edge_owner_to_timeline_media.count) || posts.length,
      posts: posts.slice(0, maxPosts)
    };
  }

  function getUsername() {
    const handle = global.InstaPostSorterDom.getProfileHandle();
    return handle ? handle.replace(/^@/, "") : "";
  }

  async function fetchProfileInfo(username, options) {
    const paths = [
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`
    ];

    for (const url of paths) {
      const response = await fetchViaBackground(url, "json", buildHeaders(), options);

      if (!response.ok) {
        lastFailureReason = formatFetchFailure(`Perfil API ${new URL(url).hostname}`, response);
        continue;
      }

      const json = response.json;
      if (json && json.data && json.data.user) return json.data;
      lastFailureReason = `Perfil API ${new URL(url).hostname} respondeu sem data.user.`;
    }

    return null;
  }

  async function fetchFeedPage(userId, cursor, options) {
    const params = new URLSearchParams({
      count: String(PAGE_SIZE),
      max_id: cursor
    });
    const paths = [
      `https://www.instagram.com/api/v1/feed/user/${encodeURIComponent(userId)}/?${params.toString()}`,
      `https://i.instagram.com/api/v1/feed/user/${encodeURIComponent(userId)}/?${params.toString()}`
    ];

    for (const url of paths) {
      const response = await fetchViaBackground(url, "json", buildHeaders(), options);

      if (!response.ok) {
        lastFailureReason = formatFetchFailure(`Feed API ${new URL(url).hostname}`, response);
        continue;
      }

      return response.json;
    }

    return null;
  }

  async function fetchGraphqlPage(userId, cursor, options) {
    const variables = {
      id: userId,
      first: PAGE_SIZE,
      after: cursor
    };
    const params = new URLSearchParams({
      query_hash: PROFILE_POSTS_QUERY_HASH,
      variables: JSON.stringify(variables)
    });
    const response = await fetchViaBackground(
      `https://www.instagram.com/graphql/query/?${params.toString()}`,
      "json",
      buildHeaders(),
      options
    );

    if (!response.ok) {
      lastFailureReason = formatFetchFailure("GraphQL", response);
      return null;
    }
    return response.json;
  }

  async function fetchProfileFromPage(username, options) {
    const response = await fetchViaBackground(
      `https://www.instagram.com/${encodeURIComponent(username)}/`,
      "text",
      {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      options
    );

    if (!response.ok) {
      lastFailureReason = formatFetchFailure("Pagina do perfil", response);
      return null;
    }

    const html = response.text || "";
    const userId = extractUserIdFromHtml(html, username);
    const totalCount = extractTotalCountFromHtml(html);
    const edges = extractEdgesFromHtml(html);

    if (!userId && !edges.length) {
      lastFailureReason = "Pagina do perfil nao trouxe user id nem posts embutidos.";
      return null;
    }

    return {
      user: {
        id: userId,
        edge_owner_to_timeline_media: {
          count: totalCount || edges.length,
          edges,
          page_info: {
            has_next_page: Boolean(userId && totalCount > edges.length),
            end_cursor: ""
          }
        }
      }
    };
  }

  function extractUserIdFromHtml(html, username) {
    const patterns = [
      new RegExp(`"profile_id"\\s*:\\s*"(\\d+)"[^<]{0,500}"username"\\s*:\\s*"${escapeRegExp(username)}"`, "i"),
      new RegExp(`"id"\\s*:\\s*"(\\d+)"[^<]{0,500}"username"\\s*:\\s*"${escapeRegExp(username)}"`, "i"),
      /"owner"\s*:\s*\{\s*"id"\s*:\s*"(\d+)"/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1];
    }

    return "";
  }

  function extractTotalCountFromHtml(html) {
    const match = html.match(/"edge_owner_to_timeline_media"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
    return match ? Number(match[1]) || 0 : 0;
  }

  function extractEdgesFromHtml(html) {
    const marker = '"edge_owner_to_timeline_media"';
    const index = html.indexOf(marker);
    if (index === -1) return [];

    const slice = html.slice(index, index + 200000);
    const shortcodes = Array.from(slice.matchAll(/"shortcode"\s*:\s*"([^"]+)"/g)).slice(0, 50);
    return shortcodes.map((match) => ({
      node: {
        shortcode: match[1],
        edge_liked_by: { count: 0 },
        edge_media_to_comment: { count: 0 }
      }
    }));
  }

  async function fetchNextPage(userId, cursor, options) {
    const feedPage = await fetchFeedPage(userId, cursor, options);
    if (feedPage && Array.isArray(feedPage.items) && feedPage.items.length) {
      const posts = [];
      const seen = new Set();
      appendFeedItems(posts, seen, feedPage.items);
      return {
        posts,
        cursor: feedPage.next_max_id || "",
        hasNextPage: Boolean(feedPage.more_available && feedPage.next_max_id)
      };
    }

    const graphqlPage = await fetchGraphqlPage(userId, cursor, options);
    const media = graphqlPage &&
      graphqlPage.data &&
      graphqlPage.data.user &&
      graphqlPage.data.user.edge_owner_to_timeline_media;

    if (!media) return null;

    const posts = [];
    const seen = new Set();
    appendGraphqlEdges(posts, seen, media.edges);

    return {
      posts,
      cursor: media.page_info && media.page_info.end_cursor ? media.page_info.end_cursor : "",
      hasNextPage: Boolean(media.page_info && media.page_info.has_next_page)
    };
  }

  function getInitialCursor(user) {
    const media = user.edge_owner_to_timeline_media || {};
    const pageInfo = media.page_info || {};
    return pageInfo.has_next_page ? pageInfo.end_cursor || "" : "";
  }

  function appendGraphqlEdges(posts, seen, edges) {
    (edges || []).forEach((edge) => {
      const post = mapGraphqlNode(edge && edge.node);
      appendPost(posts, seen, post);
    });
  }

  function appendFeedItems(posts, seen, items) {
    (items || []).forEach((item) => {
      const post = mapFeedItem(item);
      appendPost(posts, seen, post);
    });
  }

  function appendPost(posts, seen, post) {
    if (!post || !post.postUrl || seen.has(post.postUrl)) return;
    seen.add(post.postUrl);
    posts.push(post);
  }

  function mapGraphqlNode(node) {
    if (!node || !node.shortcode) return null;

    const likes = getCount(node.edge_liked_by) || getCount(node.edge_media_preview_like) || 0;
    const comments = getCount(node.edge_media_to_comment) || 0;
    const views = Number(node.video_view_count || node.video_play_count || 0) || 0;
    const captionEdge = node.edge_media_to_caption && node.edge_media_to_caption.edges && node.edge_media_to_caption.edges[0];
    const caption = captionEdge && captionEdge.node ? captionEdge.node.text || "" : "";
    const type = node.is_video ? "reel" : node.__typename === "GraphSidecar" ? "carousel" : "post";
    const date = node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toISOString() : "";

    return buildPost({
      shortcode: node.shortcode,
      type,
      likes,
      comments,
      views,
      caption,
      thumbnailUrl: node.thumbnail_src || node.display_url || "",
      videoUrl: node.video_url || "",
      date
    });
  }

  function mapFeedItem(item) {
    if (!item || !item.code) return null;

    const likes = Number(item.like_count || 0) || 0;
    const comments = Number(item.comment_count || 0) || 0;
    const views = Number(item.play_count || item.view_count || item.video_view_count || 0) || 0;
    const image = item.image_versions2 && item.image_versions2.candidates && item.image_versions2.candidates[0];
    const video = item.video_versions && item.video_versions[0];
    const caption = item.caption && item.caption.text ? item.caption.text : "";
    const type = inferFeedType(item);
    const date = item.taken_at ? new Date(item.taken_at * 1000).toISOString() : "";

    return buildPost({
      shortcode: item.code,
      type,
      likes,
      comments,
      views,
      caption,
      thumbnailUrl: image ? image.url || "" : "",
      videoUrl: video ? video.url || "" : "",
      date
    });
  }

  function buildPost(data) {
    const metrics = {
      likes: data.likes || 0,
      comments: data.comments || 0,
      views: data.views || 0
    };

    return {
      profileUrl: global.InstaPostSorterDom.getProfileUrl(),
      postUrl: `https://www.instagram.com/${data.type === "reel" ? "reel" : "p"}/${data.shortcode}/`,
      type: data.type || "post",
      likes: metrics.likes,
      comments: metrics.comments,
      views: metrics.views,
      shares: null,
      engagementScore: global.InstaPostSorterParser.calculateEngagement(metrics),
      caption: data.caption || "",
      thumbnailUrl: data.thumbnailUrl || "",
      videoUrl: data.videoUrl || "",
      detectedAt: new Date().toISOString(),
      date: data.date || "",
      cardElement: null
    };
  }

  function inferFeedType(item) {
    if (item.product_type === "clips" || item.media_type === 2) return "reel";
    if (item.carousel_media_count || Array.isArray(item.carousel_media)) return "carousel";
    return "post";
  }

  function getCount(value) {
    return value && Number.isFinite(Number(value.count)) ? Number(value.count) : 0;
  }

  function buildHeaders() {
    const csrfToken = getCookie("csrftoken");
    const headers = {
      "accept": "application/json",
      "x-asbd-id": "129477",
      "x-ig-app-id": WEB_APP_ID,
      "x-requested-with": "XMLHttpRequest"
    };

    if (csrfToken) headers["x-csrftoken"] = csrfToken;
    return headers;
  }

  function getCookie(name) {
    return document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) || "";
  }

  async function fetchViaBackground(url, responseType, headers, options) {
    throwIfAborted(options);

    try {
      const response = await chrome.runtime.sendMessage({
        source: "insta-post-sorter",
        type: "FETCH_INSTAGRAM_RESOURCE",
        url,
        responseType,
        headers
      });

      throwIfAborted(options);
      return response || {
        ok: false,
        status: 0,
        error: "Background nao retornou resposta."
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error && error.message ? error.message : "Falha na ponte background."
      };
    }
  }

  function formatFetchFailure(label, response) {
    const status = response && response.status ? `HTTP ${response.status}` : "sem status HTTP";
    const detail = response && response.error ? `: ${response.error}` : "";
    const preview = response && response.bodyPreview ? ` (${response.bodyPreview.slice(0, 120)})` : "";
    return `${label} falhou com ${status}${detail}${preview}.`;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function throwIfAborted(options) {
    if (options && options.signal && options.signal.aborted) {
      const error = new Error("Analise cancelada pelo usuario.");
      error.name = "AbortError";
      throw error;
    }
  }

  global.InstaPostSorterApi = {
    fetchProfilePosts
  };
})(window);
