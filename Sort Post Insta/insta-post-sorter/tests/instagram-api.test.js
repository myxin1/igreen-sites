"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

async function loadApiWithResponses(responses) {
  const calls = [];
  const sandbox = {
    URL,
    URLSearchParams,
    Date,
    Set,
    Number,
    Boolean,
    String,
    Array,
    RegExp,
    document: { cookie: "" },
    chrome: {
      runtime: {
        sendMessage: async (message) => {
          calls.push(message.url);
          const response = responses.find((entry) => entry.match.test(message.url));
          return response ? response.value : { ok: false, status: 404, error: "not mocked" };
        }
      }
    }
  };
  sandbox.window = sandbox;
  sandbox.InstaPostSorterDom = {
    getProfileHandle: () => "@perfil",
    getProfileUrl: () => "https://www.instagram.com/perfil/"
  };
  sandbox.InstaPostSorterParser = {
    calculateEngagement: ({ likes, comments, views }) => likes + comments * 2 + views * 0.01
  };

  const source = fs.readFileSync(path.join(__dirname, "..", "src", "utils", "instagram-api.js"), "utf8");
  vm.runInNewContext(source, sandbox, { filename: "instagram-api.js" });

  return {
    api: sandbox.InstaPostSorterApi,
    calls
  };
}

async function testFeedVideoUsesAlternativeThumbnailCandidate() {
  const { api } = await loadApiWithResponses([
    {
      match: /web_profile_info/,
      value: {
        ok: true,
        json: {
          data: {
            user: {
              id: "123",
              edge_owner_to_timeline_media: {
                count: 1,
                edges: [],
                page_info: { has_next_page: true, end_cursor: "first" }
              }
            }
          }
        }
      }
    },
    {
      match: /feed\/user/,
      value: {
        ok: true,
        json: {
          items: [{
            code: "ABC123",
            media_type: 2,
            like_count: 10,
            comment_count: 2,
            play_count: 100,
            thumbnail_url: "https://cdninstagram.com/thumb.jpg",
            video_versions: [{ url: "https://cdninstagram.com/video.mp4" }],
            caption: { text: "Video com thumb alternativa" },
            taken_at: 1710000000
          }],
          more_available: false
        }
      }
    }
  ]);

  const result = await api.fetchProfilePosts({ maxApiPosts: 1 });

  assert.equal(result.ok, true);
  assert.equal(result.posts.length, 1);
  assert.equal(result.posts[0].type, "reel");
  assert.equal(result.posts[0].thumbnailUrl, "https://cdninstagram.com/thumb.jpg");
  assert.equal(result.posts[0].videoUrl, "https://cdninstagram.com/video.mp4");
}

async function run() {
  await testFeedVideoUsesAlternativeThumbnailCandidate();
  console.log("instagram-api tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
