import urllib.request, base64, json

creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
headers = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}
FAQ_ID = 579

articles = [
    {
        'slug': 'quando-e-a-bauernfest-petropolis',
        'title': 'Quando e a Bauernfest Petropolis? Datas 2026',
        'content': '<p><strong>Quando e a Bauernfest Petropolis?</strong> Em 2026, a Bauernfest acontece de <strong>19 de junho a 5 de julho</strong>, no Palacio de Cristal, Petropolis RJ.</p><h2>Por que junho?</h2><p>O mes de junho foi escolhido por coincidir com o inverno brasileiro. As temperaturas amenas de Petropolis criam uma atmosfera perfeita para um festival de origem europeia, remetendo ao clima da Alemanha.</p><h2>Historico de datas</h2><p>A Bauernfest acontece sempre em junho, com inicio proximo ao dia 19 e encerramento na primeira semana de julho. Para 2026, as datas oficiais confirmadas sao <strong>19 de junho a 5 de julho</strong>.</p><h2>Como se programar</h2><p>Se voce vem de fora de Petropolis, o ideal e planejar com antecedencia, especialmente para fins de semana. Os hoteis proximos ao Palacio de Cristal costumam lotar nas semanas do festival.</p><h2>O que esperar em 2026</h2><p>Gastronomia alema autentica, dancas folcloricas, shows ao vivo, artesanato e toda a atmosfera germanica de Petropolis. A entrada e gratuita.</p><p><a href="https://bauernfest.org/faq/">Voltar para o FAQ</a></p>'
    },
    {
        'slug': 'o-que-e-a-bauernfest',
        'title': 'O que e a Bauernfest? Festa Germanica de Petropolis',
        'content': '<p><strong>O que e a Bauernfest?</strong> A Bauernfest e o maior festival de cultura germanica do Brasil, realizado anualmente em Petropolis RJ. O nome vem do alemao: <em>Bauer</em> (lavrador) + <em>Fest</em> (festa) = <strong>Festa dos Lavradores</strong>.</p><h2>Origem em Petropolis</h2><p>A festa nasceu em 1995 para celebrar a heranca cultural dos imigrantes alemaes que vieram a Petropolis a convite de Dom Pedro II a partir de 1845. Esses lavradores transformaram a regiao serrana fluminense.</p><h2>O que acontece na Bauernfest</h2><p>Durante 17 dias, o Palacio de Cristal se transforma em um vilarejo germanico. Shows, dancas folcloricas, gastronomia tipica alema (eisbein, bratwurst, strudel), artesanato e cerveja artesanal.</p><h2>Por que a Bauernfest e especial</h2><p>Diferente do Oktoberfest, a Bauernfest tem foco na cultura agraria e nas tradicoes dos imigrantes. E uma celebracao familiar e autentica, com entrada gratuita.</p><h2>Bauernfest 2026</h2><p>A proxima edicao acontece de <strong>19 de junho a 5 de julho de 2026</strong>, no Palacio de Cristal, Petropolis.</p><p><a href="https://bauernfest.org/faq/">Voltar para o FAQ</a></p>'
    },
    {
        'slug': 'quantos-dias-dura-a-bauernfest',
        'title': 'Quantos dias dura a Bauernfest? 17 Dias em 2026',
        'content': '<p><strong>Quantos dias dura a Bauernfest?</strong> A Bauernfest dura <strong>17 dias</strong>. Em 2026, o festival vai de 19 de junho a 5 de julho, com programacao diaria de shows, gastronomia e atrações culturais.</p><h2>Programacao nos 17 dias</h2><p>O festival funciona de quarta a domingo. Finais de semana tem mais atrações e maior publico. Durante a semana, o ambiente e mais tranquilo.</p><h2>Qual dia visitar</h2><p>Para shows e mais movimento, va nos fins de semana. Para tranquilidade e filas menores, va na semana — gastronomia e atrações culturais estao disponiveis em todos os dias de funcionamento.</p><h2>Vale voltar mais de uma vez?</h2><p>Com certeza. A Bauernfest tem programacao variada ao longo dos 17 dias, com atrações diferentes a cada fim de semana.</p><p><a href="https://bauernfest.org/faq/">Voltar para o FAQ</a></p>'
    },
    {
        'slug': 'quem-a-bauernfest-homenageia',
        'title': 'Quem a Bauernfest homenageia? Imigrantes Alemaes',
        'content': '<p><strong>Quem a Bauernfest homenageia?</strong> A Bauernfest homenageia os <strong>imigrantes alemaes</strong> que chegaram a Petropolis a partir de 1845, a convite de Dom Pedro II, e que moldaram a identidade cultural da cidade.</p><h2>Dom Pedro II e os imigrantes</h2><p>Em 1845, Dom Pedro II convidou familias de lavradores alemaes, principalmente da regiao da Renania, para ocupar as terras serranas de Petropolis. Esses colonos trouxeram lingua, costumes, gastronomia e tecnicas de cultivo que transformaram a regiao.</p><h2>O legado germanico em Petropolis</h2><p>A influencia alema ainda e visivel em Petropolis: sobrenomes alemaes, arquitetura tipica, gastronomia e o proprio festival. O Museu Imperial e o Palacio de Cristal guardam parte dessa memoria historica.</p><h2>Bauer — o lavrador homenageado</h2><p>O nome Bauernfest (Festa dos Lavradores) homenageia os <em>Bauern</em> — os camponeses alemaes que vieram ao Brasil e com seu trabalho e cultura enriqueceram Petropolis.</p><p><a href="https://bauernfest.org/faq/">Voltar para o FAQ</a></p>'
    },
    {
        'slug': 'o-que-fazer-na-bauernfest',
        'title': 'O que fazer na Bauernfest Petropolis — Guia Completo',
        'content': '<p><strong>O que fazer na Bauernfest?</strong> Voce encontra gastronomia alema autentica, dancas folcloricas, shows ao vivo, artesanato tipico e toda a atmosfera do maior festival germanico do Brasil.</p><h2>1. Gastronomia alema</h2><p>Experimente o <strong>eisbein</strong> (joelho de porco), bratwurst, sauerkraut, strudel de maca, pretzel e chopp artesanal. Os barraquinhas ficam espalhados pelo Palacio de Cristal e arredores.</p><h2>2. Dancas folcloricas</h2><p>Grupos de danca se apresentam no palco principal. O <strong>Schuhplattler</strong> e o Landler sao as dancas tipicas. Alguns grupos aceitam participantes para dancas coletivas.</p><h2>3. Shows ao vivo</h2><p>O palco principal recebe bandas todos os dias. Nas sextas e sabados os shows se estendem ate as 22h, com repertorio que mistura musicas alemas tradicionais com hits contemporaneos.</p><h2>4. Artesanato germanico</h2><p>Dezenas de expositores oferecem artesanato tipicamente alemao: madeira, roupas tipicas (dirndl e lederhosen), ceramicas e itens de colecionador.</p><h2>5. Palacio de Cristal</h2><p>O historico Palacio de Cristal, construido no seculo XIX, serve como palco central da Bauernfest. Vale explorar o espaco e tirar fotos.</p><p><a href="https://bauernfest.org/faq/">Voltar para o FAQ</a></p>'
    },
    {
        'slug': 'significado-de-bauernfest',
        'title': 'Significado de Bauernfest — Festa dos Lavradores em Alemao',
        'content': '<p><strong>Qual o significado de Bauernfest?</strong> Bauernfest e uma palavra composta do alemao: <em>Bauer</em> (lavrador, fazendeiro) + <em>Fest</em> (festa, festival) = <strong>Festa dos Lavradores</strong>.</p><h2>Etimologia: Bauer + Fest</h2><p><strong>Bauer</strong> em alemao significa lavrador, agricultor ou campones. Historicamente, os <em>Bauern</em> eram a classe agraria da sociedade germanica medieval. <strong>Fest</strong> significa simplesmente festa ou festival — e a mesma palavra que aparece em Oktoberfest, Winzerfest, etc.</p><h2>Bauernfest vs Oktoberfest</h2><p>Muita gente confunde os dois, mas sao festivais bem diferentes. O Oktoberfest tem foco em cerveja e entretenimento em massa. A Bauernfest e uma celebracao da cultura agraria e das tradicoes dos imigrantes alemaes — mais familiar, mais historica e mais cultural.</p><h2>O nome e a essencia do festival</h2><p>O nome Bauernfest captura perfeitamente a essencia do festival de Petropolis: uma homenagem aos lavradores alemaes que chegaram ao Brasil no seculo XIX e construiram, com suas maos e sua cultura, uma das cidades mais europeias do pais.</p><p><a href="https://bauernfest.org/faq/">Voltar para o FAQ</a></p>'
    },
    {
        'slug': 'como-funciona-a-bauernfest',
        'title': 'Como funciona a Bauernfest Petropolis — Entrada e Estrutura',
        'content': '<p><strong>Como funciona a Bauernfest?</strong> A Bauernfest tem <strong>entrada gratuita</strong> e acontece no Palacio de Cristal e arredores, em Petropolis RJ. O evento e organizado em zonas tematicas com gastronomia, palco principal, artesanato e area cultural.</p><h2>Entrada gratuita</h2><p>Sim, a Bauernfest e gratuita para entrar. Voce paga apenas pelo que consumir dentro do festival — comida, bebida, artesanato. Essa e uma das grandes vantagens em relacao a outros festivais similares.</p><h2>Estrutura do evento</h2><p>O festival se divide em grandes areas: <strong>Zona de Gastronomia</strong> com barracoes de comida e bebida tipica alema; <strong>Palco Principal</strong> com shows e apresentacoes culturais; <strong>Area de Artesanato</strong> com expositores; e o proprio <strong>Palacio de Cristal</strong> como centro historico.</p><h2>O que e pago, o que e gratuito</h2><p>Gratuito: entrada, shows no palco principal, apresentacoes de danca folclorica. Pago: alimentacao, bebidas, artesanato e produtos a venda. Os precos variam por barraquinha.</p><h2>Dicas praticas</h2><p>Leve dinheiro em especie, pois nem todos os expositores aceitam cartao. Use roupas confortaveis e apropriadas para o frio de Petropolis. Chegue cedo nos fins de semana para evitar filas.</p><p><a href="https://bauernfest.org/faq/">Voltar para o FAQ</a></p>'
    },
    {
        'slug': 'bauernfest-2026',
        'title': 'Bauernfest 2026 — Datas, Horarios e Programacao Petropolis',
        'content': '<p><strong>Bauernfest 2026</strong> acontece de <strong>19 de junho a 5 de julho</strong> em Petropolis, RJ. O maior festival de cultura germanica do Brasil volta ao Palacio de Cristal com 17 dias de gastronomia, shows, dancas folcloricas e artesanato alemao.</p><h2>Datas confirmadas 2026</h2><p>A Bauernfest 2026 tem inicio marcado para <strong>19 de junho (sexta-feira)</strong> e encerramento em <strong>5 de julho (domingo)</strong>. Sao 17 dias de festival no Palacio de Cristal, centro historico de Petropolis.</p><h2>Horarios Bauernfest 2026</h2><table><tr><th>Dia</th><th>Horario</th></tr><tr><td>Sexta-feira</td><td>12h as 22h</td></tr><tr><td>Sabado</td><td>12h as 22h</td></tr><tr><td>Domingo</td><td>11h as 21h</td></tr><tr><td>Feriado</td><td>11h as 21h</td></tr></table><h2>Como chegar na Bauernfest 2026</h2><p>O Palacio de Cristal fica na Rua Alfredo Pachá, s/n, Centro, Petropolis RJ. De carro saindo do Rio de Janeiro, pegue a BR-040 e siga as placas para Petropolis. Tempo estimado: 1h30 a partir do Rio.</p><p><a href="https://bauernfest.org/faq/">Voltar para o FAQ</a></p>'
    },
    {
        'slug': 'datas-da-bauernfest',
        'title': 'Datas da Bauernfest 2026 — Quando e o Festival em Petropolis',
        'content': '<p><strong>Quais sao as datas da Bauernfest?</strong> Em 2026, a Bauernfest acontece de <strong>19 de junho a 5 de julho</strong> — 17 dias de festival no Palacio de Cristal, Petropolis RJ.</p><h2>Por que junho e julho?</h2><p>O festival e realizado no inverno brasileiro porque o clima frio de Petropolis (entre 10 e 18 graus em junho) remete as tradicoes germanicas. Alem disso, o periodo e estrategico para movimentar o turismo na baixa temporada.</p><h2>Calendario detalhado 2026</h2><p>O festival tem inicio na <strong>terceira sexta-feira de junho</strong> e encerra no primeiro domingo de julho. Os dias de maior movimento sao sempre os fins de semana, especialmente o primeiro e o ultimo fim de semana.</p><h2>Dicas de planejamento</h2><p>Reserve hospedagem com antecedencia se voce vem de outra cidade. Os hoteis de Petropolis ficam com alta ocupacao durante a Bauernfest, especialmente nos fins de semana do festival.</p><h2>Risco de cancelamento</h2><p>Eventuais cancelamentos ou alteracoes nas datas sao comunicados pelo site oficial e pelas redes sociais da Bauernfest. Acompanhe bauernfest.org para informacoes oficiais.</p><p><a href="https://bauernfest.org/faq/">Voltar para o FAQ</a></p>'
    },
    {
        'slug': 'horario-bauernfest-petropolis',
        'title': 'Horario da Bauernfest em Petropolis 2026 — Dias e Horas',
        'content': '<p><strong>Qual e o horario da Bauernfest em Petropolis?</strong> Os horarios oficiais da Bauernfest 2026 sao: <strong>sextas e sabados das 12h as 22h</strong>; <strong>domingos e feriados das 11h as 21h</strong>. De segunda a quinta o festival nao funciona, exceto quando houver feriado.</p><h2>Tabela de horarios por dia</h2><table><tr><th>Dia</th><th>Abertura</th><th>Encerramento</th></tr><tr><td>Sexta-feira</td><td>12h</td><td>22h</td></tr><tr><td>Sabado</td><td>12h</td><td>22h</td></tr><tr><td>Domingo</td><td>11h</td><td>21h</td></tr><tr><td>Feriado</td><td>11h</td><td>21h</td></tr><tr><td>Seg a Qui</td><td>Fechado</td><td>Fechado</td></tr></table><h2>Melhor horario para visitar</h2><p>Para evitar filas e maior movimento, chegue logo na abertura. As primeiras horas do festival sao mais tranquilas. O pico de publico acontece geralmente entre 15h e 20h nos fins de semana.</p><h2>Dicas praticas</h2><p>Leve agasalho: Petropolis e fria em junho, especialmente a noite. Traga dinheiro em especie para facilitar as compras nos barraquinhas. E informe-se sobre o estacionamento disponivel nas proximidades do Palacio de Cristal.</p><p><a href="https://bauernfest.org/faq/">Voltar para o FAQ</a></p>'
    },
]

created = []
for art in articles:
    payload = json.dumps({
        'title': art['title'],
        'slug': art['slug'],
        'content': art['content'],
        'status': 'publish',
        'parent': FAQ_ID
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://bauernfest.org/wp-json/wp/v2/pages',
        data=payload, headers=headers, method='POST'
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        result = json.loads(r.read())
    created.append({'id': result['id'], 'slug': art['slug'], 'link': result['link']})
    print(f'OK ID={result["id"]} — {art["slug"]}')

print(f'\nTotal criados: {len(created)}')
with open('faq_ids.json', 'w') as f:
    json.dump(created, f, indent=2)
print('IDs salvos em faq_ids.json')
