(function attachSorter(global) {
  "use strict";

  const SORTERS = {
    likes_desc: (a, b) => compareNumber(b.likes, a.likes),
    likes_asc: (a, b) => compareNumber(a.likes, b.likes),
    comments_desc: (a, b) => compareNumber(b.comments, a.comments),
    comments_asc: (a, b) => compareNumber(a.comments, b.comments),
    views_desc: (a, b) => compareNumber(b.views, a.views),
    views_asc: (a, b) => compareNumber(a.views, b.views),
    engagement_desc: (a, b) => compareNumber(b.engagementScore, a.engagementScore),
    engagement_asc: (a, b) => compareNumber(a.engagementScore, b.engagementScore),
    date_desc: (a, b) => compareDate(b.date, a.date),
    date_asc: (a, b) => compareDate(a.date, b.date)
  };

  let originalOrder = null;

  function compareNumber(a, b) {
    return (Number(a) || 0) - (Number(b) || 0);
  }

  function compareDate(a, b) {
    const left = Date.parse(a || "") || 0;
    const right = Date.parse(b || "") || 0;
    return left - right;
  }

  function sortPosts(posts, sortKey) {
    const sorter = SORTERS[sortKey] || SORTERS.engagement_desc;
    return posts.slice().sort((a, b) => sorter(a, b));
  }

  function applyVisualSort(posts, sortKey) {
    const grid = global.InstaPostSorterDom.getSortableGridFromPosts(posts);
    if (!grid || !grid.container || !grid.items.length) {
      return {
        ok: false,
        error: "Nao foi possivel encontrar cards carregados do grid para ordenar. Role um pouco a pagina e tente novamente."
      };
    }

    const container = grid.container;
    const sortableItems = grid.items.map((item) => Object.assign({}, item.post, { sortElement: item.tile }));

    if (!originalOrder) {
      originalOrder = {
        container,
        cards: Array.from(container.children)
      };
    }

    sortPosts(sortableItems, sortKey).forEach((post) => {
      if (post.sortElement.parentElement === container) {
        container.appendChild(post.sortElement);
      }
    });

    return {
      ok: true,
      sortKey,
      sortedCount: sortableItems.length,
      totalIndexed: posts.length
    };
  }

  function restoreOriginalOrder() {
    if (!originalOrder || !originalOrder.container) {
      return {
        ok: false,
        error: "Nenhuma ordem original foi salva nesta pagina."
      };
    }

    originalOrder.cards.forEach((card) => {
      if (card.parentElement === originalOrder.container) {
        originalOrder.container.appendChild(card);
      }
    });

    global.InstaPostSorterDom.removeBadges(document);
    originalOrder = null;

    return {
      ok: true
    };
  }

  global.InstaPostSorterSorter = {
    SORTERS,
    sortPosts,
    applyVisualSort,
    restoreOriginalOrder
  };
})(window);
