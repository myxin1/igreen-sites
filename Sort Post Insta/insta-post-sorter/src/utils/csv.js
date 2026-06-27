(function attachCsv(global) {
  "use strict";

  const COLUMNS = [
    "profile_url",
    "post_url",
    "type",
    "likes",
    "comments",
    "views",
    "shares",
    "engagement_score",
    "caption",
    "thumbnail_url",
    "video_url",
    "detected_at"
  ];

  function escapeCsv(value) {
    const text = value === null || value === undefined ? "" : String(value);
    if (!/[",\n\r]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function toCsv(posts) {
    const rows = [COLUMNS.join(",")];
    posts.forEach((post) => {
      rows.push([
        post.profileUrl,
        post.postUrl,
        post.type,
        post.likes,
        post.comments,
        post.views,
        post.shares === null ? "" : post.shares,
        Math.round((post.engagementScore || 0) * 100) / 100,
        post.caption,
        post.thumbnailUrl,
        post.videoUrl,
        post.detectedAt
      ].map(escapeCsv).join(","));
    });
    return rows.join("\n");
  }

  function downloadCsv(posts, filename) {
    const blob = new Blob([toCsv(posts)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || `insta-post-sorter-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function serializePosts(posts) {
    return posts.map((post) => ({
      profileUrl: post.profileUrl,
      postUrl: post.postUrl,
      type: post.type,
      likes: post.likes,
      comments: post.comments,
      views: post.views,
      shares: post.shares,
      engagementScore: post.engagementScore,
      caption: post.caption,
      thumbnailUrl: post.thumbnailUrl,
      videoUrl: post.videoUrl,
      detectedAt: post.detectedAt,
      date: post.date
    }));
  }

  global.InstaPostSorterCsv = {
    COLUMNS,
    toCsv,
    downloadCsv,
    serializePosts
  };
})(window);
