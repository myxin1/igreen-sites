import json
import urllib.error
import urllib.request

from new_post import WP_API_BASE
from sync_article_shells import BF_CSS_BLOCK, auth_headers


BLOCKER = """<script id="bf-disable-reader-revenue-manager">
(function(){
  var noopQueue = { push: function(){ return 0; } };
  try {
    Object.defineProperty(window, 'SWG_BASIC', {
      configurable: true,
      get: function(){ return noopQueue; },
      set: function(){ return noopQueue; }
    });
  } catch (e) {
    window.SWG_BASIC = noopQueue;
  }
})();
</script>"""


def wp_request(path, method="GET", payload=None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        f"{WP_API_BASE}{path}",
        data=body,
        method=method,
        headers=auth_headers(),
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    block = wp_request(f"/blocks/{BF_CSS_BLOCK}?context=edit")
    content = block.get("content", {}).get("raw", "")
    if "bf-disable-reader-revenue-manager" in content:
        print("blocker already present")
        return
    updated = content.rstrip() + "\n\n" + BLOCKER
    wp_request(f"/blocks/{BF_CSS_BLOCK}", method="POST", payload={"content": updated, "status": "publish"})
    print(f"updated BF-CSS block {BF_CSS_BLOCK}")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code}: {detail[:500]}")
