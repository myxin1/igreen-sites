"""
Para páginas sem arquivo local, busca o HTML do WordPress,
atualiza o bloco NAV com o nav.html atual e republica.
"""
import urllib.request, base64, json, os, re, uuid

creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
headers = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

BASE_LOCAL = 'c:/Users/User/Downloads/Projeto Claude Code/Bauernfest Claud/site-bauernfest'

# IDs sem arquivo local
REMOTE_ONLY_IDS = [77, 216, 73, 79, 89, 97, 95, 93, 103, 99, 105, 101, 81, 83, 85, 87]

# Ler nav.html atual
with open(os.path.join(BASE_LOCAL, 'Rodape', 'nav.html'), encoding='utf-8') as f:
    NEW_NAV = f.read().strip()

# Ler footer.html atual
with open(os.path.join(BASE_LOCAL, 'Rodape', 'footer.html'), encoding='utf-8') as f:
    NEW_FOOTER = f.read().strip()

# Ler shared-bottom.css
with open(os.path.join(BASE_LOCAL, 'Rodape', 'shared-bottom.css'), encoding='utf-8') as f:
    NEW_BOTTOM_CSS = f.read().strip()

# Ler nav-breadcrumb.css
with open(os.path.join(BASE_LOCAL, 'Rodape', 'nav-breadcrumb.css'), encoding='utf-8') as f:
    NEW_NAV_CSS = f.read().strip()

NAV_SCRIPT = """<script>
(function(){
  var burger=document.getElementById('bfBurger'),menu=document.getElementById('bfMenu');
  if(burger&&menu){
    burger.addEventListener('click',function(){
      var open=menu.classList.toggle('bfopen');
      burger.classList.toggle('open',open);
      burger.setAttribute('aria-expanded',String(open));
    });
    document.addEventListener('click',function(e){
      if(!burger.contains(e.target)&&!menu.contains(e.target)){
        menu.classList.remove('bfopen');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded','false');
      }
    });
  }
})();
</script>
</body>
</html>"""

def rand_id():
    return uuid.uuid4().hex[:7]

def apply_bauerup(html):
    changed = False

    # 1. Nav CSS
    p = re.compile(r'/\* NAV \*/.*?\.bf-breadcrumb span\{opacity:\.5\}', re.DOTALL)
    if re.search(p, html):
        html = re.sub(p, NEW_NAV_CSS, html)
        changed = True

    # 2. Bottom CSS
    p2 = re.compile(r'/\* NEWSLETTER \*/.*?(?=</style>)', re.DOTALL)
    if re.search(p2, html):
        html = re.sub(p2, NEW_BOTTOM_CSS + '\n', html)
        changed = True

    # 3. Nav HTML
    p3 = re.compile(r'<!-- NAV -->.*?(?=<!-- BREADCRUMB -->)', re.DOTALL)
    if re.search(p3, html):
        html = re.sub(p3, '<!-- NAV -->\n' + NEW_NAV + '\n\n', html)
        changed = True

    # 4. Footer HTML
    p4 = re.compile(r'(?:<!--\s*={4,}[\s\S]*?-->\s*)?<!-- NEWSLETTER -->.*', re.DOTALL)
    if re.search(p4, html):
        html = re.sub(p4, NEW_FOOTER + '\n\n' + NAV_SCRIPT, html)
        changed = True

    return html, changed

def make_elementor_data(html_content):
    return json.dumps([{
        "id": rand_id(),
        "elType": "section",
        "settings": {"layout": "full_width"},
        "elements": [{
            "id": rand_id(),
            "elType": "column",
            "settings": {"_column_size": 100, "_inline_size": None},
            "elements": [{
                "id": rand_id(),
                "elType": "widget",
                "widgetType": "html",
                "settings": {"html": html_content},
                "elements": []
            }]
        }]
    }])

ok = skip = err = 0
for page_id in REMOTE_ONLY_IDS:
    # Fetch current page
    req = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}?context=edit',
        headers={'Authorization': f'Basic {creds}'}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            page = json.loads(r.read())
    except Exception as e:
        print(f'  ERRO fetch [{page_id}]: {e}')
        err += 1
        continue

    el_data_raw = page.get('meta', {}).get('_elementor_data', '') or ''
    if not el_data_raw:
        print(f'  SKIP [{page_id}] {page.get("slug","")}: no elementor data')
        skip += 1
        continue

    try:
        el_data = json.loads(el_data_raw)
        widget = el_data[0]['elements'][0]['elements'][0]
        html = widget['settings']['html']
    except Exception as e:
        print(f'  SKIP [{page_id}]: cannot parse elementor data: {e}')
        skip += 1
        continue

    updated_html, changed = apply_bauerup(html)

    if not changed:
        # Fallback: replace <nav class="bfnav"...>...</nav> directly
        nav_pattern = re.compile(r'<nav class="bfnav"[^>]*>.*?</nav>', re.DOTALL)
        if re.search(nav_pattern, updated_html):
            updated_html = re.sub(nav_pattern, NEW_NAV, updated_html)
            changed = '/faq/' in updated_html
            if not changed:
                print(f'  WARN [{page_id}] {page.get("slug","")} — nav replaced but FAQ still missing')
                skip += 1
                continue
        else:
            if '/faq/' in html:
                print(f'  OK   [{page_id}] {page.get("slug","")} — already up to date')
                ok += 1
            else:
                print(f'  WARN [{page_id}] {page.get("slug","")} — no nav pattern found')
                skip += 1
            continue

    # Push updated HTML
    new_el_data = make_elementor_data(updated_html)
    payload = json.dumps({
        'meta': {
            '_elementor_edit_mode': 'builder',
            '_elementor_template_type': 'wp-page',
            '_elementor_data': new_el_data,
        }
    }).encode()
    req2 = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}',
        data=payload, headers=headers, method='POST'
    )
    try:
        with urllib.request.urlopen(req2, timeout=30) as r:
            json.loads(r.read())
        print(f'  UPDATED [{page_id}] {page.get("slug","")}')
        ok += 1
    except urllib.error.HTTPError as e:
        print(f'  ERRO push [{page_id}]: {e.code} — {e.read().decode()[:80]}')
        err += 1

print(f'\nOK: {ok}  SKIP: {skip}  ERRO: {err}')
