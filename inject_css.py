import json, urllib.request, base64

css = """:root{--voe-blue:#0EA5E9;--voe-blue-dark:#0284C7;--voe-blue-deep:#0369A1;--voe-blue-soft:rgba(14,165,233,.1);--voe-blue-mid:rgba(14,165,233,.2);--voe-dark:#0d1117;--voe-text:#1f2328;--voe-text2:#57606a;--voe-border:#d0d7de;--voe-bg:#f0f6ff;}
body{background:var(--voe-bg);color:var(--voe-text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;font-size:16px;line-height:1.75;}
a{color:var(--voe-blue);}a:hover{color:var(--voe-blue-dark);text-decoration:none;}
.site-header{background:#fff;border-bottom:3px solid var(--voe-blue);box-shadow:0 2px 8px rgba(14,165,233,.12);}
.site-title a{color:var(--voe-blue-deep);font-weight:800;}
.site-title a:hover{color:var(--voe-blue);}
.main-navigation a{color:var(--voe-text);font-weight:600;}
.main-navigation a:hover{color:var(--voe-blue);}
.inside-article{background:#fff;border:1px solid var(--voe-border);border-top:3px solid var(--voe-blue);border-radius:10px;padding:28px;margin-bottom:28px;box-shadow:0 2px 6px rgba(0,0,0,.05);transition:box-shadow .2s,transform .2s;}
.inside-article:hover{box-shadow:0 6px 20px rgba(14,165,233,.18);transform:translateY(-2px);}
.entry-title a{color:var(--voe-text);font-size:1.35rem;font-weight:700;text-decoration:none;}
.entry-title a:hover{color:var(--voe-blue);}
.entry-meta,.entry-meta a{color:var(--voe-text2);font-size:.82rem;}
.cat-links a{background:var(--voe-blue-soft);color:var(--voe-blue-dark);padding:3px 12px;border-radius:99px;font-size:.75rem;font-weight:700;text-decoration:none;text-transform:uppercase;border:1px solid var(--voe-blue-mid);}
.cat-links a:hover{background:var(--voe-blue);color:#fff;}
.entry-header{border-bottom:2px solid var(--voe-blue-soft);padding-bottom:20px;margin-bottom:28px;}
.entry-header .entry-title{font-size:2rem;font-weight:800;line-height:1.25;}
.entry-content{font-size:1.05rem;line-height:1.8;}
.entry-content p{margin-bottom:1.3rem;}
.entry-content a{color:var(--voe-blue);text-decoration:underline;}
.entry-content h2{font-size:1.5rem;font-weight:800;color:var(--voe-blue-deep);border-left:4px solid var(--voe-blue);padding-left:14px;margin:2.5rem 0 1rem;}
.entry-content h3{font-size:1.2rem;font-weight:700;color:var(--voe-text);margin:2rem 0 .75rem;padding-bottom:6px;border-bottom:1px solid var(--voe-blue-mid);}
.entry-content ul,.entry-content ol{padding-left:1.5rem;margin-bottom:1.3rem;}
.entry-content li{margin-bottom:.4rem;}
.entry-content ul li::marker{color:var(--voe-blue);}
.entry-content blockquote{border-left:4px solid var(--voe-blue);background:var(--voe-blue-soft);padding:16px 20px;margin:1.5rem 0;border-radius:0 8px 8px 0;font-style:italic;color:var(--voe-blue-deep);}
.entry-content th{background:var(--voe-blue);color:#fff;padding:10px 14px;text-align:left;font-weight:700;}
.entry-content td{padding:10px 14px;border-bottom:1px solid var(--voe-border);}
.entry-content tr:nth-child(even) td{background:var(--voe-blue-soft);}
.voe-cta{background:linear-gradient(135deg,var(--voe-blue) 0%,var(--voe-blue-deep) 100%);color:#fff;border-radius:14px;padding:32px 28px;margin:2.5rem 0;text-align:center;box-shadow:0 8px 24px rgba(14,165,233,.3);}
.voe-cta h3{color:#fff;font-size:1.3rem;margin:0 0 10px;border:none;padding:0;}
.voe-cta p{color:rgba(255,255,255,.88);margin:0 0 20px;}
.voe-cta a{background:#fff;color:var(--voe-blue-dark)!important;border-radius:8px;padding:12px 28px;font-weight:800;text-decoration:none!important;display:inline-block;}
.widget{background:#fff;border:1px solid var(--voe-border);border-top:3px solid var(--voe-blue);border-radius:10px;padding:22px;margin-bottom:24px;}
.widget-title,.wp-block-heading{font-size:.9rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--voe-blue-deep);margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--voe-blue-soft);}
.widget ul{list-style:none;padding:0;margin:0;}
.widget ul li{padding:6px 0;border-bottom:1px solid var(--voe-bg);font-size:.93rem;}
.widget ul li a{color:var(--voe-text);text-decoration:none;font-weight:500;}
.widget ul li a:hover{color:var(--voe-blue);}
.wp-block-search__button{background:var(--voe-blue)!important;color:#fff!important;border:none!important;border-radius:0 6px 6px 0!important;font-weight:600!important;}
.wp-block-search__input{border:1px solid var(--voe-border)!important;border-radius:6px 0 0 6px!important;}
.wp-block-button__link{background:var(--voe-blue)!important;color:#fff!important;border-radius:8px!important;font-weight:700!important;}
.wp-block-button__link:hover{background:var(--voe-blue-dark)!important;}
.site-footer{background:var(--voe-dark);color:rgba(255,255,255,.65);font-size:.875rem;padding:28px 0;border-top:3px solid var(--voe-blue);margin-top:48px;}
.site-footer a{color:var(--voe-blue);}
.read-more a{background:var(--voe-blue);color:#fff!important;border-radius:8px;padding:9px 20px;font-weight:600;text-decoration:none;display:inline-block;}
@media(max-width:768px){.inside-article{padding:18px;}.entry-header .entry-title{font-size:1.5rem;}.entry-content h2{font-size:1.25rem;}.voe-cta{padding:24px 18px;}}"""

content = '<!-- wp:html --><style>' + css + '</style><!-- /wp:html -->'
payload = json.dumps({'id_base': 'block', 'sidebar': 'sidebar-1', 'content': content})

creds = base64.b64encode(b'Daniel:cbwO cgzm A6Vx Vjhx RlHH BBmG').decode()
req = urllib.request.Request(
    'https://blog.voesimulados.com/wp-json/wp/v2/widgets',
    data=payload.encode(),
    headers={'Content-Type': 'application/json', 'Authorization': 'Basic ' + creds},
    method='POST'
)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print('OK - Widget ID:', data.get('id'), '| Sidebar:', data.get('sidebar'))
