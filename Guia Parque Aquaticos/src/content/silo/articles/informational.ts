import type { ArticleContent } from "./index.js";
import { S } from "./slugs.js";

export const INFORMATIONAL_ARTICLES: ArticleContent[] = [
  {
    key: "onde-fica",
    body: `
<h2>Aldeia das Águas onde fica: localização, distâncias e acesso</h2>
<p>A dúvida sobre <strong>aldeia das águas onde fica</strong> é uma das primeiras que aparecem ao planejar a visita. O resort está localizado em <strong>Barra do Piraí</strong>, cidade do interior do Rio de Janeiro, dentro de uma área acessível pela Rodovia Presidente Dutra — uma das rodovias mais movimentadas do país, que conecta Rio de Janeiro e São Paulo.</p>

<h2>Contexto geográfico</h2>
<p>Barra do Piraí fica no Vale do Paraíba fluminense, uma região que se beneficia da posição estratégica entre as duas maiores metrópoles do Brasil. Isso coloca a Aldeia das Águas em uma localização que atende bem dois grandes públicos: o carioca que quer uma escapada de fim de semana sem sair do estado, e o paulistano que busca um destino de resort aquático a menos de 6 horas de viagem.</p>
<ul>
  <li><strong>Rio de Janeiro (capital):</strong> aproximadamente 100 km pela BR-116</li>
  <li><strong>São Paulo (capital):</strong> aproximadamente 350 a 400 km pela Dutra</li>
  <li><strong>Volta Redonda:</strong> cerca de 30 km — cidade mais próxima de porte</li>
  <li><strong>Resende e Itatiaia:</strong> menos de 60 km — região turística do Vale</li>
</ul>

<h2>Por que a localização em Barra do Piraí faz sentido</h2>
<p>A escolha de um resort aquático de grande porte no interior do Rio de Janeiro não é coincidência. O Vale do Paraíba tem clima quente durante boa parte do ano, infraestrutura rodoviária desenvolvida e uma posição geográfica que facilita o acesso de grandes centros populacionais. Para o visitante, isso significa que chegar até a Aldeia das Águas não exige logística complexa — é estrada boa e rota conhecida para a maioria dos motoristas do Sudeste.</p>

<h2>Barra do Piraí: a cidade que sedia o resort</h2>
<p>Barra do Piraí é uma cidade de médio porte com serviços de apoio ao turismo razoáveis: postos de gasolina, supermercados, farmácias, pousadas e restaurantes. Não é um polo turístico com atrativos por si só, mas serve bem como base para quem hospeda fora do resort e precisa de serviços básicos durante a estadia.</p>
<p>O acesso ao resort dentro da cidade é simples: a sinalização na rodovia indica as saídas corretas, e o GPS resolve o restante sem dificuldade para quem conhece a região minimamente.</p>

<h2>Distância e tempo de viagem estimados</h2>
<ul>
  <li><strong>Saindo do Rio de Janeiro:</strong> em torno de 1h30 a 2h dependendo do trânsito — mais rápido em dias úteis e fora de horário de pico</li>
  <li><strong>Saindo de São Paulo:</strong> em torno de 4h a 5h dependendo do trânsito na Dutra e no trecho de Serra</li>
  <li><strong>Saindo de Volta Redonda:</strong> menos de 30 minutos</li>
  <li><strong>Saindo de Angra dos Reis ou Paraty:</strong> acesso mais difícil — estradas menores e mais tempo de viagem</li>
</ul>

<h2>Clima e sazonalidade</h2>
<p>O Vale do Paraíba tem verão quente e úmido — com chuvas concentradas entre novembro e março — e inverno seco com temperaturas mais amenas. Para visitar um parque aquático, os meses de verão são os mais procurados, mas também os mais movimentados. O período de março a junho e de agosto a outubro costuma ter clima ainda agradável para o parque com menos movimento.</p>

<h2>Próximos passos no planejamento</h2>
<p>Com a localização definida, o próximo passo costuma ser entender <a href="${S.comoChegar}">como chegar na Aldeia das Águas</a> com mais detalhes de rota, ou confirmar o <a href="${S.endereco}">endereço completo</a> para programar no GPS. Para quem ainda está definindo a data, o guia de <a href="${S.horario}">horário de funcionamento</a> ajuda a alinhar o calendário da visita.</p>
`,
  },
  {
    key: "como-chegar",
    body: `
<h2>Como chegar na Aldeia das Águas: rotas, transporte e dicas de navegação</h2>
<p>Saber <strong>como chegar na Aldeia das Águas</strong> com clareza antes de sair de casa evita imprevistos de rota e aproveita melhor o tempo disponível no dia da visita. O resort está em Barra do Piraí, no interior do Rio de Janeiro, com acesso principal pela Rodovia Presidente Dutra — uma das vias mais conhecidas do país para quem vem do eixo Rio-São Paulo.</p>

<h2>De carro: a opção mais usada</h2>
<p>A grande maioria dos visitantes chega de carro. É o meio de transporte com mais flexibilidade de horário, mais espaço para carregar o que o grupo precisa e o único que permite paradas livres ao longo da rota. Para a maior parte dos perfis de visitante, o carro continua sendo a escolha mais prática.</p>
<ul>
  <li>Saindo do <strong>Rio de Janeiro:</strong> pegue a BR-116 (Rodovia Presidente Dutra) sentido São Paulo. Siga até Barra do Piraí e use o GPS com o nome do resort para pegar a saída correta</li>
  <li>Saindo de <strong>São Paulo:</strong> pegue a Dutra sentido Rio e siga pela mesma rota. O trecho total dura em torno de 4 a 5 horas dependendo do tráfego</li>
  <li>Saindo de <strong>Volta Redonda ou Barra Mansa:</strong> menos de 30 minutos pela BR-393 ou pela Dutra</li>
</ul>

<h2>Como usar o GPS sem erros</h2>
<p>Ao programar o GPS, a dica mais importante é pesquisar pelo nome completo do resort — "Aldeia das Águas Park Resort" — em vez de só "Aldeia das Águas", que pode retornar pontos genéricos ou incorretos. Confirmar antes de iniciar a navegação que o resultado está em Barra do Piraí-RJ é suficiente para garantir que a rota está correta.</p>
<ul>
  <li>Use Waze ou Google Maps com o nome completo do resort</li>
  <li>Confirme que a cidade indicada é Barra do Piraí-RJ antes de iniciar</li>
  <li>Em feriados e fins de semana, cheque o status do trânsito na Dutra antes de sair — o trecho Serra das Araras (entre Rio e São Paulo) costuma ter lentidão</li>
</ul>

<h2>De ônibus: possível, mas exige planejamento</h2>
<p>Chegar de ônibus é viável, mas envolve uma etapa extra de deslocamento. Empresas como 1001 e Util fazem linhas regulares entre Rio de Janeiro e Barra do Piraí. Da rodoviária de Barra do Piraí até o resort, é necessário táxi, aplicativo de transporte ou uma carona combinada com antecedência — não há linha de ônibus urbano com acesso direto ao resort.</p>
<ul>
  <li>Ônibus Rio → Barra do Piraí: saídas frequentes pela Rodoviária Novo Rio</li>
  <li>Da rodoviária até o resort: táxi, aplicativo ou serviço combinado previamente</li>
  <li>Custo adicional e menor flexibilidade de horário são os principais pontos contra</li>
</ul>

<h2>Chegando de São Paulo de ônibus</h2>
<p>Para quem vem de São Paulo sem carro, outra opção é pegar ônibus para Volta Redonda ou Resende — cidades com mais saídas disponíveis — e depois resolver o trecho final até o resort por táxi ou aplicativo. O tempo total de viagem é maior e a logística menos prática, por isso é uma escolha que faz mais sentido para quem não tem acesso a carro.</p>

<h2>Horário recomendado para saída</h2>
<p>Para quem vem do Rio de Janeiro em dia útil, sair antes das 8h costuma evitar o pior do trânsito na saída da cidade. Para quem vem de São Paulo, a Dutra tem trânsito mais intenso na sexta à tarde — sair na quinta à noite ou na sexta muito cedo melhora bastante o tempo de viagem.</p>
<p>Em feriados, a recomendação é sair ainda mais cedo. O trecho Serra das Araras costuma travar em pontes de feriado, especialmente no sentido Rio no retorno.</p>

<h2>Próximos passos</h2>
<p>Com a rota definida, confirme o <a href="${S.endereco}">endereço completo da Aldeia das Águas</a> para finalizar a programação do GPS. Antes de sair, também vale checar o <a href="${S.horario}">horário de funcionamento</a> para planejar o horário de chegada com margem confortável.</p>
`,
  },
  {
    key: "endereco",
    body: `
<h2>Aldeia das Águas endereço: como chegar sem erros de navegação</h2>
<p>Quem pesquisa pelo <strong>aldeia das águas endereço</strong> normalmente está na etapa final do planejamento — já decidiu ir, já sabe quando e só precisa confirmar o ponto exato no GPS para não errar na hora de chegar. A localização é em Barra do Piraí, no interior do Rio de Janeiro, com acesso pela Rodovia Presidente Dutra.</p>

<h2>Endereço completo do resort</h2>
<p>O endereço oficial da Aldeia das Águas Park Resort é:</p>
<ul>
  <li><strong>Logradouro:</strong> Avenida Aldeia das Águas, s/n</li>
  <li><strong>Bairro:</strong> Aldeia das Águas</li>
  <li><strong>Cidade:</strong> Barra do Piraí — RJ</li>
  <li><strong>CEP:</strong> 27145-616</li>
</ul>
<p>Confirme o endereço no site oficial antes de sair, pois pode haver atualização ou complemento de informação. O site do resort é sempre a fonte mais confiável para dados de contato e localização.</p>

<h2>Como usar o GPS sem erros</h2>
<p>A dica mais importante para navegar até a Aldeia das Águas sem erro é pesquisar o nome completo do estabelecimento no aplicativo de mapa — "Aldeia das Águas Park Resort" — antes de inserir o endereço manualmente. O Google Maps e o Waze reconhecem o resort pelo nome e normalmente retornam o ponto correto diretamente.</p>
<ul>
  <li>Busque "Aldeia das Águas Park Resort" no Google Maps ou Waze</li>
  <li>Confirme que o resultado está em Barra do Piraí-RJ antes de iniciar a rota</li>
  <li>Se preferir usar o endereço, insira o CEP 27145-616 como ponto de partida</li>
  <li>Salve o ponto como favorito para facilitar na hora da visita</li>
</ul>

<h2>Saída correta na Dutra</h2>
<p>Para quem vem pela Rodovia Presidente Dutra — tanto do Rio quanto de São Paulo — o acesso a Barra do Piraí é sinalizado na própria rodovia. A saída mais comum leva diretamente ao centro de Barra do Piraí, de onde o GPS já direciona até o resort sem dificuldade. Em feriados e fins de semana movimentados, chegar alguns minutos mais cedo ajuda a evitar a fila de carros na entrada.</p>

<h2>Referências visuais de chegada</h2>
<p>O resort tem estrutura visível da rodovia de acesso. A entrada principal é bem sinalizada, e o estacionamento fica próximo ao portão de entrada. Visitantes de primeira vez costumam encontrar o resort sem dificuldade seguindo as instruções do GPS até o endereço exato.</p>

<h2>Estacionamento na chegada</h2>
<p>O resort tem estacionamento próprio. A cobrança varia conforme o pacote de visita: hóspedes do hotel geralmente têm estacionamento incluso, enquanto visitantes de day use podem pagar uma taxa separada. Confirmar esse detalhe no momento da compra do ingresso evita surpresa na chegada.</p>
<p>Para quem ainda está planejando a rota completa, o guia de <a href="${S.comoChegar}">como chegar na Aldeia das Águas</a> traz as orientações por tipo de transporte com mais detalhes. Para dúvidas diretamente com o resort, consulte os <a href="${S.telefone}">canais de contato da Aldeia das Águas</a>.</p>
`,
  },
  {
    key: "telefone",
    body: `
<h2>Aldeia das Águas telefone e canais de contato: quando e como usar</h2>
<p>O <strong>aldeia das águas telefone</strong> e os canais de contato do resort são úteis em situações específicas: confirmar reserva, esclarecer dúvidas sobre disponibilidade, verificar funcionamento em datas específicas ou resolver necessidades especiais que o site não cobre. Saber quando usar o contato direto — e quando o site já resolve — economiza tempo de ambos os lados.</p>

<h2>Quando o contato direto faz mais sentido</h2>
<p>A maioria das dúvidas sobre ingresso, preço e planejamento pode ser resolvida pelo site oficial do resort, que costuma ter informações atualizadas sobre calendário, modalidades e política de cancelamento. O contato direto por telefone ou e-mail entra quando a situação exige uma confirmação específica ou quando há algo que o canal digital não resolve.</p>
<ul>
  <li><strong>Reserva de hospedagem:</strong> para confirmar disponibilidade de tipo específico de acomodação em data específica</li>
  <li><strong>Cancelamento ou remarcação:</strong> quando a política online não é suficientemente clara</li>
  <li><strong>Funcionamento em datas especiais:</strong> feriados específicos, período de manutenção ou eventos no resort</li>
  <li><strong>Necessidades especiais:</strong> acessibilidade, grupos com requisitos específicos ou reservas corporativas</li>
  <li><strong>Pacotes personalizados:</strong> grupos grandes que querem negociar condições especiais</li>
</ul>

<h2>Como encontrar o contato oficial</h2>
<p>O número de telefone e o e-mail de contato do resort estão disponíveis no site oficial da Aldeia das Águas. Como esses dados podem mudar — especialmente número de atendimento comercial e canais de WhatsApp — a recomendação é sempre verificar diretamente no site oficial antes de ligar, para garantir que está usando o canal mais atualizado.</p>
<p>Alguns resorts também utilizam WhatsApp como canal primário de atendimento, o que pode ser mais rápido do que o telefone convencional para dúvidas simples.</p>

<h2>Horário de atendimento</h2>
<p>O atendimento telefônico normalmente segue o horário comercial — segunda a sexta, das 9h às 18h, com variação para sábados. Em períodos de alta temporada, o volume de contatos costuma ser maior e o tempo de resposta pode aumentar. Para questões urgentes ou de último momento, confirmar por telefone é mais eficaz do que aguardar resposta por e-mail.</p>

<h2>Evitar problemas comuns de contato</h2>
<ul>
  <li>Não confiar em números encontrados em sites de terceiros — usar sempre o site oficial</li>
  <li>Ter o número do pedido ou da reserva em mãos antes de ligar</li>
  <li>Para cancelamentos, guardar o protocolo ou confirmação por escrito do atendente</li>
  <li>Em feriados, ligar com pelo menos 48h de antecedência — o atendimento pode ter menor disponibilidade</li>
</ul>

<h2>Quando o site já resolve</h2>
<p>Para a maioria das dúvidas sobre planejamento — horário de funcionamento, preço, tipos de ingresso e regras para crianças — o site oficial do resort costuma ter a informação atualizada. Antes de ligar, vale verificar se a resposta já está disponível online. Isso economiza tempo e evita ficar na fila de atendimento por uma informação que está a dois cliques de distância.</p>
<p>Para o restante do planejamento da visita, continue pelos guias de <a href="${S.horario}">horário de funcionamento</a>, <a href="${S.comoChegar}">como chegar</a> e <a href="${S.atracoes}">atrações disponíveis</a>.</p>
`,
  },
  {
    key: "atracoes",
    body: `
<h2>Atrações da Aldeia das Águas: o que tem no parque e como organizar o roteiro</h2>
<p>Conhecer as <strong>atrações da Aldeia das Águas</strong> antes de chegar ao parque permite montar um roteiro mais inteligente e aproveitar melhor o tempo disponível. O parque tem estrutura ampla, com opções que atendem desde crianças pequenas até adultos que buscam adrenalina — e entender o que existe ajuda o grupo a priorizar o que não pode perder.</p>

<h2>Tobogãs: do tranquilo ao radical</h2>
<p>Os tobogãs são a atração central de qualquer parque aquático, e a Aldeia das Águas não decepciona nessa frente. O resort tem uma variedade que vai de descidas mais suaves — indicadas para crianças maiores e para quem prefere menos intensidade — até atrações radicais que são o destaque do parque.</p>
<ul>
  <li><strong>Tobogãs radicais:</strong> para adolescentes e adultos que querem velocidade e altura — podem ter restrição por peso ou altura</li>
  <li><strong>Tobogãs fechados (tubulares):</strong> experiência diferente com percurso fechado e curvas no escuro</li>
  <li><strong>Tobogãs abertos:</strong> descidas tradicionais em pista larga, geralmente mais acessíveis para toda a família</li>
</ul>

<h2>Kilimanjaro: a atração que todo mundo conhece</h2>
<p>O <a href="${S.kilimanjaro}">Kilimanjaro</a> é o tobogã mais famoso do parque — e um dos mais comentados do Brasil. Com quase 50 metros de altura, é a atração que concentra mais fila e mais adrenalina. Quem quer experimentar deve ir cedo: a fila no começo do dia costuma ser muito menor do que no meio da tarde.</p>

<h2>Piscina de ondas</h2>
<p>A piscina de ondas é uma das atrações mais democráticas do parque — funciona para adultos, adolescentes e crianças que já sabem nadar. As ondas mecânicas criam uma experiência parecida com o mar, e a área costuma ter boa movimentação durante todo o dia. Para quem vai com crianças, é importante verificar a profundidade e ficar atento ao sinal que indica quando as ondas serão ativadas.</p>

<h2>Rio lento</h2>
<p>O rio lento é o espaço de recuperação entre as atrações mais intensas. Com boias disponíveis para aluguel ou inclusas (confirmar no momento da visita), permite navegar pelo circuito em ritmo tranquilo. É especialmente popular no calor do meio-dia, quando fazer uma pausa sem sair da água é a melhor opção.</p>

<h2>Área infantil</h2>
<p>Crianças pequenas têm uma área específica com profundidade reduzida, brinquedos aquáticos adaptados e tobogãs de menor intensidade. Essa seção do parque foi projetada para a faixa de 2 a 7 anos, com estrutura pensada para que os pais possam acompanhar de perto sem preocupação com profundidade ou velocidade das atrações.</p>
<ul>
  <li>Profundidade reduzida em toda a área infantil</li>
  <li>Brinquedos e jatos d'água adequados para crianças pequenas</li>
  <li>Tobogãs infantis de baixa velocidade</li>
  <li>Área sombreada com estrutura de apoio para os acompanhantes</li>
</ul>

<h2>Piscinas externas e espaços de descanso</h2>
<p>Além das atrações ativas, o resort tem piscinas externas mais tranquilas e áreas de descanso com espreguiçadeiras. Esses espaços são importantes para quem quer intercalar momentos de descanso com as atrações — especialmente útil em dias quentes, quando uma pausa na sombra faz muita diferença no aproveitamento do dia inteiro.</p>

<h2>Como organizar o roteiro das atrações</h2>
<p>A estratégia que funciona melhor na prática: comece pelas atrações mais concorridas logo na abertura do parque. Tobogãs radicais — principalmente o Kilimanjaro — têm filas muito menores nas primeiras horas. Reserve as atrações mais tranquilas (rio lento, piscina de ondas) para o meio do dia, quando o calor é mais intenso e as filas nas atrações radicais estão maiores.</p>
<ul>
  <li>Primeiras 2 horas: atrações radicais e tobogãs mais disputados</li>
  <li>Meio do dia: rio lento, piscina de ondas, pausa para almoço fora do pico</li>
  <li>Tarde: atrações menos concorridas e área de descanso</li>
</ul>
<p>Para mais dicas de como aproveitar melhor o dia, veja o guia de <a href="${S.dicas}">dicas para a visita</a>. Para entender o horário de funcionamento e planejar a chegada, consulte o guia de <a href="${S.horario}">horário da Aldeia das Águas</a>.</p>
`,
  },
  {
    key: "kilimanjaro",
    body: `
<h2>Kilimanjaro Aldeia das Águas: o tobogã mais radical do parque</h2>
<p>O <strong>Kilimanjaro da Aldeia das Águas</strong> é a atração mais icônica do resort e uma das mais comentadas entre parques aquáticos do Brasil. Com quase 50 metros de altura e inclinação acentuada, é o tobogã que concentra a maior fila e a maior adrenalina — e merece lugar garantido no roteiro de quem visita o parque pela primeira vez.</p>

<h2>O que torna o Kilimanjaro especial</h2>
<p>Poucos tobogãs no país chegam à combinação de altura, velocidade e sensação de queda livre que o Kilimanjaro oferece. A descida começa quase vertical, com velocidade que pode ultrapassar os 90 km/h no trecho mais íngreme, e termina num poço de água que para a corrida de forma brusca. É uma experiência curta em duração — a descida em si dura segundos — mas intensa o suficiente para virar assunto depois.</p>
<ul>
  <li><strong>Altura:</strong> aproximadamente 49 metros</li>
  <li><strong>Inclinação:</strong> aproximadamente 60 graus no ponto mais vertical</li>
  <li><strong>Velocidade estimada:</strong> acima de 90 km/h na fase mais rápida</li>
  <li><strong>Formato:</strong> descida individual em colchonete — sem boia ou barco</li>
</ul>

<h2>Requisitos para usar o Kilimanjaro</h2>
<p>Como qualquer atração radical de grande porte, o Kilimanjaro tem restrições de segurança que precisam ser respeitadas. As condições exatas variam e podem ser atualizadas pelo resort, mas o padrão costuma incluir:</p>
<ul>
  <li>Altura mínima — geralmente em torno de 1,40m a 1,50m</li>
  <li>Peso máximo — limitação por segurança da estrutura e velocidade de descida</li>
  <li>Proibido para gestantes, cardíacos e pessoas com problemas de coluna</li>
  <li>Crianças abaixo da altura mínima não têm acesso, mesmo acompanhadas de adulto</li>
</ul>
<p>Confirmar as regras atualizadas no site oficial ou na entrada da atração antes de entrar na fila evita decepção depois de esperar.</p>

<h2>A fila: como minimizar o tempo de espera</h2>
<p>A fila do Kilimanjaro é, de longe, a mais longa do parque. Em dias de alta demanda — fins de semana, feriados e férias — o tempo de espera pode facilmente ultrapassar 1 hora. Em dias úteis de baixa temporada, a mesma fila às vezes dura menos de 20 minutos.</p>
<p>A estratégia que funciona melhor é simples: ir ao Kilimanjaro logo na abertura do parque. Nas primeiras duas horas de funcionamento, a fila costuma ser uma fração do que será no final da manhã e começo da tarde. Quem chega no horário de abertura e vai direto para o Kilimanjaro costuma conseguir fazer a atração duas vezes antes que a fila cresça de verdade.</p>
<ul>
  <li>Chegue próximo do horário de abertura do parque</li>
  <li>Vá direto para o Kilimanjaro antes de qualquer outra atração</li>
  <li>Se possível, faça duas descidas enquanto a fila ainda está curta</li>
  <li>Evite o Kilimanjaro entre 11h e 15h — pico das filas</li>
</ul>

<h2>Experiência de antes e depois</h2>
<p>A subida até o topo do Kilimanjaro já faz parte da experiência. São vários lances de escada e, a cada degrau, a perspectiva lá de baixo vai ficando mais impressionante. No topo, a vista do parque é ampla — e a perspectiva da descida impressiona até quem já foi antes.</p>
<p>A descida em si é rápida. A sensação de queda e a velocidade elevada fazem muita gente querer repetir imediatamente. É uma atração que tem esse efeito: quem faz quer fazer de novo.</p>

<h2>Vale a pena para quem?</h2>
<p>O Kilimanjaro não é para todo mundo. Quem não gosta de altura, velocidade extrema ou sensação de queda livre pode não aproveitar — e isso é válido. O parque tem muitas outras atrações excelentes que funcionam bem para perfis menos radicais.</p>
<p>Mas para quem busca adrenalina, é a atração principal do parque. Se você está indo à Aldeia das Águas e não tem restrição física, o Kilimanjaro entra como prioridade máxima no roteiro.</p>
<p>Para planejar o restante do dia, veja as outras <a href="${S.atracoes}">atrações da Aldeia das Águas</a> e confira as <a href="${S.dicas}">dicas para aproveitar melhor a visita</a>.</p>
`,
  },
  {
    key: "horario",
    body: `
<h2>Aldeia das Águas horário de funcionamento: quando o parque abre e como planejar</h2>
<p>Consultar o <strong>aldeia das águas horário de funcionamento</strong> antes de sair de casa é uma das verificações mais importantes do planejamento. O parque não opera com horário fixo o ano todo: abertura, encerramento e dias de funcionamento variam conforme a temporada, feriados e demanda. Chegar sem confirmar pode significar encontrar o parque fechado ou perder horas de aproveitamento por ter saído tarde.</p>

<h2>Variação por temporada</h2>
<p>O parque funciona em regime de temporada, com operação mais ampla nos períodos de maior demanda e restrição ou fechamento em datas de baixa procura. O padrão geral costuma ser:</p>
<ul>
  <li><strong>Alta temporada (dezembro a fevereiro e julho):</strong> funcionamento diário, com horário expandido — geralmente 9h ou 10h até 17h ou 18h</li>
  <li><strong>Feriados nacionais e pontes:</strong> funcionamento pleno, com possibilidade de maior lotação</li>
  <li><strong>Fins de semana de março a novembro:</strong> operação regular, mas confirmar horário exato</li>
  <li><strong>Dias úteis fora de férias:</strong> operação pode ser restrita ou inexistente — sempre confirmar antes</li>
</ul>

<h2>Como confirmar o horário para a data exata</h2>
<p>A única forma confiável de saber o horário para a data específica da sua visita é verificar no site oficial do resort ou ligar para a central de atendimento. As informações em blogs e guias — incluindo este — refletem o padrão histórico, mas podem estar desatualizadas. O resort é a fonte definitiva.</p>
<ul>
  <li>Acesse o site oficial da Aldeia das Águas e procure o calendário de funcionamento</li>
  <li>Se não encontrar, ligue para a central de reservas e confirme para a data específica</li>
  <li>Confirme com pelo menos 48h de antecedência para ter tempo de ajustar o planejamento</li>
</ul>

<h2>Horário de chegada ideal</h2>
<p>Independente do horário de abertura do parque, chegar próximo do início é a estratégia que mais melhora a experiência. As atrações mais disputadas — especialmente o Kilimanjaro — têm filas muito menores nas primeiras horas. Quem chega com atraso de 1 ou 2 horas já encontra o parque em ritmo acelerado e filas formadas.</p>
<ul>
  <li>Planeje a saída para chegar no resort na abertura ou até 30 minutos depois</li>
  <li>Em dias de alta temporada, considere sair antes do previsto para absorver eventuais atrasos no caminho</li>
  <li>Com crianças pequenas, chegada cedo permite pausa para almoço antes do pico da tarde</li>
</ul>

<h2>Encerramento do parque</h2>
<p>O horário de fechamento das atrações costuma ser antes do horário oficial de encerramento do resort. Tobogãs e piscinas normalmente param de receber novos visitantes 30 a 60 minutos antes do fechamento geral para dar tempo de todos saírem das atrações de forma organizada. Planejar o último horário das atrações com essa margem evita frustração no final do dia.</p>

<h2>Calendário de manutenção</h2>
<p>Parques aquáticos de grande porte costumam ter períodos de manutenção anual — normalmente concentrados em meses de baixa temporada como abril, maio e junho. Durante esses períodos, o resort pode estar completamente fechado ou com parte das atrações fora de operação. Confirmar isso antes de planejar a visita nesses meses é essencial para não se deparar com uma estrutura parcial.</p>
<p>Para organizar o dia completo com base no horário confirmado, veja as <a href="${S.dicas}">dicas para aproveitar ao máximo a visita</a>. Para entender qual é o <a href="${S.melhorDia}">melhor dia para ir</a> à Aldeia das Águas, continue pelo próximo guia.</p>
`,
  },
];
