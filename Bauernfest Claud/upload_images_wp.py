import urllib.request, base64, json, os

creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
auth_headers = {'Authorization': f'Basic {creds}'}

BASE = 'site-bauernfest/FAQ'

images = [
    {'page_id': 580, 'slug': 'quando-e-a-bauernfest-petropolis', 'alt': 'Quando e a Bauernfest Petropolis 2026 — Festival germanico de 19 de junho a 5 de julho no Palacio de Cristal'},
    {'page_id': 581, 'slug': 'o-que-e-a-bauernfest', 'alt': 'O que e a Bauernfest — Festa dos imigrantes alemaes em Petropolis Rio de Janeiro'},
    {'page_id': 582, 'slug': 'quantos-dias-dura-a-bauernfest', 'alt': 'Quantos dias dura a Bauernfest — 17 dias de festival germanico em Petropolis de 19 junho a 5 julho'},
    {'page_id': 583, 'slug': 'quem-a-bauernfest-homenageia', 'alt': 'Quem a Bauernfest homenageia — Imigrantes alemaes e a historia germanica de Petropolis desde 1845'},
    {'page_id': 584, 'slug': 'o-que-fazer-na-bauernfest', 'alt': 'O que fazer na Bauernfest Petropolis — Gastronomia alema dancas folcloricas shows ao vivo e artesanato'},
    {'page_id': 585, 'slug': 'significado-de-bauernfest', 'alt': 'Significado de Bauernfest — Bauer lavrador mais Fest festa em alemao Festa dos Lavradores em Petropolis'},
    {'page_id': 586, 'slug': 'como-funciona-a-bauernfest', 'alt': 'Como funciona a Bauernfest Petropolis — Entrada gratuita zonas de gastronomia palco principal e Palacio de Cristal'},
    {'page_id': 587, 'slug': 'bauernfest-2026', 'alt': 'Bauernfest 2026 Petropolis — Datas horarios e programacao completa do festival alemao no Palacio de Cristal'},
    {'page_id': 588, 'slug': 'datas-da-bauernfest', 'alt': 'Datas da Bauernfest 2026 — 19 de junho a 5 de julho no Palacio de Cristal em Petropolis RJ'},
    {'page_id': 589, 'slug': 'horario-bauernfest-petropolis', 'alt': 'Horario da Bauernfest Petropolis 2026 — Sexta e sabado das 12h as 22h domingo e feriado das 11h as 21h'},
]

for img in images:
    jpg_path = f'{BASE}/{img["slug"]}/{img["slug"]}.jpg'
    if not os.path.exists(jpg_path):
        print(f'SKIP: {jpg_path}')
        continue

    with open(jpg_path, 'rb') as f:
        data = f.read()

    upload_headers = {
        'Authorization': f'Basic {creds}',
        'Content-Disposition': f'attachment; filename="{img["slug"]}.jpg"',
        'Content-Type': 'image/jpeg',
    }
    req = urllib.request.Request(
        'https://bauernfest.org/wp-json/wp/v2/media',
        data=data, headers=upload_headers, method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            media = json.loads(r.read())
        media_id = media['id']

        # Set alt text
        payload = json.dumps({'alt_text': img['alt']}).encode()
        req2 = urllib.request.Request(
            f'https://bauernfest.org/wp-json/wp/v2/media/{media_id}',
            data=payload, headers={**auth_headers, 'Content-Type': 'application/json'}, method='POST'
        )
        with urllib.request.urlopen(req2, timeout=15) as r:
            pass

        # Set as featured image
        payload2 = json.dumps({'featured_media': media_id}).encode()
        req3 = urllib.request.Request(
            f'https://bauernfest.org/wp-json/wp/v2/pages/{img["page_id"]}',
            data=payload2, headers={**auth_headers, 'Content-Type': 'application/json'}, method='POST'
        )
        with urllib.request.urlopen(req3, timeout=15) as r:
            pass

        print(f'OK media_id={media_id} — {img["slug"]}')

    except Exception as e:
        print(f'ERRO {img["slug"]}: {e}')

print('\nUpload concluido.')
