import urllib.request
from xml.etree import ElementTree as ET

USER = 'ClaudeBot'
PASS = 'p8Np bMs8 Xnsh MfH2 cZ7u w5xy'
URL  = 'https://bauernfest.org/xmlrpc.php'

pages_seo = [
    {
        'id': 579,
        'title': 'FAQ Bauernfest — Perguntas Frequentes sobre o Festival | bauernfest.org',
        'description': 'Tire todas as suas duvidas sobre a Bauernfest de Petropolis: quando e, o que e, quantos dias dura, horarios, datas 2026 e muito mais.',
        'keyword': 'faq bauernfest petropolis'
    },
    {
        'id': 580,
        'title': 'Quando e a Bauernfest Petropolis 2026? Datas e Horarios',
        'description': 'A Bauernfest Petropolis 2026 acontece de 19 de junho a 5 de julho, no Palacio de Cristal. Saiba tudo sobre as datas e como se programar.',
        'keyword': 'quando e a bauernfest petropolis'
    },
    {
        'id': 581,
        'title': 'O que e a Bauernfest? Tudo sobre a Festa Germanica de Petropolis',
        'description': 'A Bauernfest e o maior festival de cultura germanica do Brasil, realizado em Petropolis RJ. Origem, historia, o que acontece e por que visitar.',
        'keyword': 'o que e a bauernfest'
    },
    {
        'id': 582,
        'title': 'Quantos Dias Dura a Bauernfest? 17 Dias em 2026',
        'description': 'A Bauernfest dura 17 dias — de 19 de junho a 5 de julho de 2026 em Petropolis RJ. Saiba como aproveitar cada dia do festival germanico.',
        'keyword': 'quantos dias dura a bauernfest'
    },
    {
        'id': 583,
        'title': 'Quem a Bauernfest Homenageia? Os Imigrantes Alemaes de Petropolis',
        'description': 'A Bauernfest homenageia os imigrantes alemaes que chegaram a Petropolis a convite de Dom Pedro II em 1845. Conheca a historia dessa celebracao.',
        'keyword': 'quem a bauernfest homenageia'
    },
    {
        'id': 584,
        'title': 'O que Fazer na Bauernfest Petropolis — Guia Completo 2026',
        'description': 'O que fazer na Bauernfest: gastronomia alema, dancas folcloricas, shows ao vivo, artesanato e Palacio de Cristal. Guia completo do festival.',
        'keyword': 'o que fazer na bauernfest'
    },
    {
        'id': 585,
        'title': 'Significado de Bauernfest — Festa dos Lavradores em Alemao',
        'description': 'Bauernfest significa Festa dos Lavradores em alemao: Bauer (lavrador) + Fest (festa). Entenda a origem e a diferenca com o Oktoberfest.',
        'keyword': 'significado de bauernfest'
    },
    {
        'id': 586,
        'title': 'Como Funciona a Bauernfest Petropolis? Entrada, Estrutura e Dicas',
        'description': 'A Bauernfest tem entrada gratuita. Entenda como funciona o festival: zonas de gastronomia, palco, artesanato, Palacio de Cristal e dicas praticas.',
        'keyword': 'como funciona a bauernfest'
    },
    {
        'id': 587,
        'title': 'Bauernfest 2026 Petropolis — Datas, Horarios e Programacao',
        'description': 'Bauernfest 2026 acontece de 19 de junho a 5 de julho em Petropolis RJ. Confira datas, horarios por dia, programacao e como chegar ao festival.',
        'keyword': 'bauernfest 2026'
    },
    {
        'id': 588,
        'title': 'Datas da Bauernfest 2026 — Quando e o Festival em Petropolis',
        'description': 'As datas da Bauernfest 2026 sao 19 de junho a 5 de julho — 17 dias de festival no Palacio de Cristal, Petropolis RJ. Planeje sua visita.',
        'keyword': 'datas da bauernfest'
    },
    {
        'id': 589,
        'title': 'Horario da Bauernfest em Petropolis 2026 — Dias e Horas de Funcionamento',
        'description': 'Horario da Bauernfest 2026: sexta e sabado das 12h as 22h; domingo e feriado das 11h as 21h. Saiba o melhor horario para visitar o festival.',
        'keyword': 'horario bauernfest petropolis'
    },
]


def xmlrpc_edit_post(page_id, custom_fields):
    fields_xml = ''
    for key, val in custom_fields.items():
        fields_xml += f'''
              <value>
                <struct>
                  <member><name>key</name><value><string>{key}</string></value></member>
                  <member><name>value</name><value><string>{val}</string></value></member>
                </struct>
              </value>'''

    body = f'''<?xml version='1.0'?>
<methodCall>
  <methodName>wp.editPost</methodName>
  <params>
    <param><value><int>1</int></value></param>
    <param><value><string>{USER}</string></value></param>
    <param><value><string>{PASS}</string></value></param>
    <param><value><int>{page_id}</int></value></param>
    <param>
      <value>
        <struct>
          <member>
            <name>custom_fields</name>
            <value>
              <array>
                <data>{fields_xml}
                </data>
              </array>
            </value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>'''

    req = urllib.request.Request(
        URL,
        data=body.encode('utf-8'),
        headers={'Content-Type': 'text/xml'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        response = r.read().decode()
    root = ET.fromstring(response)
    fault = root.find('.//fault')
    if fault:
        code = fault.find('.//member[name="faultCode"]/value/int')
        msg = fault.find('.//member[name="faultString"]/value/string')
        raise Exception(f'Fault {code.text if code is not None else "?"}: {msg.text if msg is not None else response}')
    return True


for page in pages_seo:
    try:
        xmlrpc_edit_post(page['id'], {
            'rank_math_title': page['title'],
            'rank_math_description': page['description'],
            'rank_math_focus_keyword': page['keyword'],
        })
        print(f'OK page {page["id"]}: {page["keyword"]}')
    except Exception as e:
        print(f'ERRO page {page["id"]}: {e}')

print('\nSEO Rank Math configurado via XML-RPC.')
