import urllib.request, base64, json

creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
headers = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

pages_seo = [
    {'id': 579, 'description': 'Tire todas as suas duvidas sobre a Bauernfest de Petropolis: quando e, o que e, quantos dias dura, horarios, datas 2026 e muito mais.'},
    {'id': 580, 'description': 'A Bauernfest Petropolis 2026 acontece de 19 de junho a 5 de julho, no Palacio de Cristal. Saiba tudo sobre as datas e como se programar.'},
    {'id': 581, 'description': 'A Bauernfest e o maior festival de cultura germanica do Brasil, realizado em Petropolis RJ. Origem, historia, o que acontece e por que visitar.'},
    {'id': 582, 'description': 'A Bauernfest dura 17 dias — de 19 de junho a 5 de julho de 2026 em Petropolis RJ. Saiba como aproveitar cada dia do festival germanico.'},
    {'id': 583, 'description': 'A Bauernfest homenageia os imigrantes alemaes que chegaram a Petropolis a convite de Dom Pedro II em 1845. Conheca a historia dessa celebracao.'},
    {'id': 584, 'description': 'O que fazer na Bauernfest: gastronomia alema, dancas folcloricas, shows ao vivo, artesanato e Palacio de Cristal. Guia completo do festival.'},
    {'id': 585, 'description': 'Bauernfest significa Festa dos Lavradores em alemao: Bauer (lavrador) + Fest (festa). Entenda a origem e a diferenca com o Oktoberfest.'},
    {'id': 586, 'description': 'A Bauernfest tem entrada gratuita. Entenda como funciona o festival: zonas de gastronomia, palco, artesanato, Palacio de Cristal e dicas praticas.'},
    {'id': 587, 'description': 'Bauernfest 2026 acontece de 19 de junho a 5 de julho em Petropolis RJ. Confira datas, horarios por dia, programacao e como chegar ao festival.'},
    {'id': 588, 'description': 'As datas da Bauernfest 2026 sao 19 de junho a 5 de julho — 17 dias de festival no Palacio de Cristal, Petropolis RJ. Planeje sua visita.'},
    {'id': 589, 'description': 'Horario da Bauernfest 2026: sexta e sabado das 12h as 22h; domingo e feriado das 11h as 21h. Saiba o melhor horario para visitar o festival.'},
]

for page in pages_seo:
    payload = json.dumps({'excerpt': page['description']}).encode()
    req = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page["id"]}',
        data=payload, headers=headers, method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            result = json.loads(r.read())
        print(f'OK page {page["id"]}: excerpt set')
    except Exception as e:
        print(f'ERRO page {page["id"]}: {e}')

print('\nExcerpts (meta description fallback) configurados.')
print('\nPara configurar Rank Math SEO com permissao admin:')
print('Wordpress Admin > ClaudeBot > mudar role para Administrator')
print('Ou: Rank Math > Role Manager > dar permissao de edicao SEO para Editor')
