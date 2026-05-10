import { escapeHtml } from "../../utils/text.js";
import type { SiloPageDefinition } from "../types.js";
import { articleLinkTargets, groupForPage } from "./linking.js";

interface ArticleSeed {
  attention: string;
  bullets: string[];
  closing: string;
  profile: string;
  summary: string;
}

const ARTICLE_SEEDS: Record<string, ArticleSeed> = {
  "aldeia-das-aguas": {
    summary:
      "Aldeia das Aguas Park Resort e um destino que mistura parque aquatico, hospedagem e passeio de fim de semana. Quem chega a essa busca normalmente quer entender se o parque combina com o perfil da viagem, quanto tempo vale reservar e quais partes da experiencia merecem mais atencao.",
    profile:
      "O destino funciona melhor para familias, casais e grupos que querem estrutura completa, areas para perfis diferentes e margem para transformar o passeio em um dia mais confortavel. Quem pensa em bate-volta tambem pode aproveitar, mas precisa olhar com cuidado para distancia, horario de chegada e energia do grupo.",
    attention:
      "O erro mais comum e tentar decidir tudo de uma vez. Quando ingresso, hospedagem, rota e atracoes entram no mesmo pacote mental, fica mais dificil perceber o que realmente vai pesar na qualidade do passeio.",
    closing:
      "Este guia principal funciona melhor como uma visao geral do parque. Depois de entender o destino, fica mais facil aprofundar apenas no assunto que ainda esta travando a decisao, como compra, hospedagem ou planejamento da visita.",
    bullets: [
      "entender o perfil do parque antes de olhar apenas para preco",
      "separar a etapa de compra da etapa de hospedagem",
      "validar horario, rota e atracoes antes de fechar a data",
      "usar as categorias como caminho natural da pesquisa",
    ],
  },
  preco: {
    summary:
      "Quem procura pelo preco da Aldeia das Aguas normalmente ja saiu da curiosidade inicial e entrou na fase de orcamento. A duvida principal deixa de ser se o parque existe ou onde fica, e passa a ser quanto custara a visita no formato certo.",
    profile:
      "O melhor uso deste tema e comparar custo com contexto. Preco bom nao significa apenas numero menor: significa pagar por um formato que encaixa na sua data, no seu grupo e na forma como voce pretende aproveitar o parque.",
    attention:
      "O ponto de atencao e nao avaliar o valor isoladamente. Um ingresso barato em uma data ruim, com parque cheio e pouca margem de escolha, pode render uma experiencia pior do que uma compra mais organizada alguns dias antes.",
    closing:
      "Quando o foco fica claro, fica mais facil decidir se vale seguir em ingresso, desconto ou pacote. O objetivo aqui e ajudar voce a sair com um criterio de compra, e nao apenas com um numero solto na cabeca.",
    bullets: [
      "data da visita e epoca do ano",
      "compra antecipada ou decisao em cima da hora",
      "day use contra pacote com mais itens",
      "perfil do grupo e ritmo esperado para o dia",
    ],
  },
  ingresso: {
    summary:
      "A busca por ingresso da Aldeia das Aguas e mais pratica do que teorica. A pessoa quer saber como comprar, o que revisar antes do pagamento e qual formato evita surpresa na hora de entrar no parque.",
    profile:
      "Este tema faz mais sentido para quem ja definiu a ideia da visita e agora precisa transformar interesse em compra. Nessa etapa, seguranca da reserva, canal confiavel e clareza sobre o que esta incluso pesam mais do que qualquer promessa vaga.",
    attention:
      "O cuidado principal e nao tratar todos os formatos como equivalentes. Ingresso de um dia, compra antecipada e pacote com outros itens podem parecer parecidos no titulo, mas resolvem necessidades bem diferentes.",
    closing:
      "Este artigo rende melhor quando responde compra de forma direta. Se a duvida continuar comercial, faz sentido comparar ingresso, desconto e pacote antes de pagar; se mudar para hospedagem ou roteiro, vale partir para o artigo certo desse novo assunto.",
    bullets: [
      "canal de compra e confianca do parceiro",
      "regras de uso na data escolhida",
      "diferenca entre bilheteria, online e pacote",
      "politica de alteracao e cancelamento",
    ],
  },
  desconto: {
    summary:
      "Quem pesquisa por desconto quer economizar sem cair em atalho ruim. Na pratica, a melhor economia costuma vir de combinacao inteligente entre data, antecedencia e formato da compra, e nao de promessa milagrosa.",
    profile:
      "Esse assunto combina com viajantes flexiveis, pessoas que podem fugir do pico de demanda e familias que estao abertas a ajustar data ou formato da compra para reduzir custo sem desmontar o passeio.",
    attention:
      "O cuidado e nao reduzir desconto a cupom. Muitas vezes o ganho real aparece quando voce troca um domingo cheio por um dia util, ou quando compara um pacote mais coerente em vez de comprar tudo de forma separada.",
    closing:
      "O artigo fica mais util quando simplifica a decisao: onde a economia costuma acontecer, quando ela deixa de compensar e quando vale trocar a busca por desconto por uma compra mais coerente com o seu roteiro.",
    bullets: [
      "dias uteis e baixa temporada",
      "janelas de compra com antecedencia",
      "diferenca entre promocao real e oferta confusa",
      "impacto do formato da viagem no custo final",
    ],
  },
  "day-use": {
    summary:
      "Day use e a leitura natural para quem quer curtir o parque sem transformar a visita em hospedagem. O tema interessa principalmente a quem mora perto ou consegue encaixar o passeio em um dia so.",
    profile:
      "A modalidade costuma render melhor para grupos leves, casais e familias que querem controlar o gasto total. Ela tambem pode ser boa para quem quer testar o parque antes de decidir se volta em uma viagem com hospedagem.",
    attention:
      "O erro comum e aplicar a mesma logica do day use a um roteiro cansativo, com criancas pequenas ou estrada longa. Quando a viagem exige mais energia, a economia aparente pode virar desgaste logo no inicio do passeio.",
    closing:
      "Um artigo simples de day use precisa responder se vale para o seu perfil e o que muda quando a ideia evolui para um fim de semana completo. A resposta mais util aparece quando voce pesa economia, distancia e cansaco na mesma conta.",
    bullets: [
      "distancia entre casa e parque",
      "horario de chegada e saida no mesmo dia",
      "nivel de cansaco do grupo",
      "diferenca entre economizar e apertar demais o roteiro",
    ],
  },
  pacote: {
    summary:
      "O pacote da Aldeia das Aguas entra na conversa quando a viagem deixa de ser apenas uma entrada no parque e passa a incluir descanso, pernoite e mais planejamento. O principal ganho e simplificar uma decisao que poderia ficar espalhada em varias etapas.",
    profile:
      "Esse formato costuma funcionar melhor para familias, casais em fim de semana e visitantes que vem de longe. Quando existe deslocamento relevante, o pacote pode ser menos sobre luxo e mais sobre praticidade, descanso e menos etapas para organizar.",
    attention:
      "Antes de concluir que pacote sempre compensa, vale revisar o que esta incluso. O numero de dias de parque, a qualidade da hospedagem e a politica da reserva mudam bastante o custo-beneficio percebido.",
    closing:
      "Neste tema, a leitura fica mais util quando voce separa praticidade real de itens que parecem vantajosos no papel. O pacote vale mais quando simplifica a viagem e evita que voce tenha de comprar tudo em etapas separadas.",
    bullets: [
      "quantos dias de parque entram na oferta",
      "qual o nivel de praticidade para familias",
      "se alimentacao e extras mudam o valor real",
      "quando comprar separado ainda faz sentido",
    ],
  },
  hotel: {
    summary:
      "Falar do hotel da Aldeia das Aguas e falar de conveniencia. O visitante que procura esse tema normalmente ja entendeu o parque e agora quer saber se dormir no complexo reduz atrito suficiente para justificar a escolha.",
    profile:
      "O hotel costuma se destacar para familias com criancas, casais em escapada curta e quem vem de longe. Nessas situacoes, a facilidade de dormir no proprio complexo conta mais do que uma comparacao seca de diaria.",
    attention:
      "O principal ponto de cuidado e nao olhar apenas para o valor da hospedagem. Em muitos casos, a avaliacao precisa incluir energia do grupo, deslocamento, tempo de chegada ao parque e o tipo de rotina que a viagem pede.",
    closing:
      "Neste artigo, o objetivo e deixar claro quando o hotel compra conforto real e quando a hospedagem externa ainda pode fazer sentido. A resposta mais util quase sempre aparece quando voce mede diaria, deslocamento e cansaco na mesma conta.",
    bullets: [
      "ganho logistico de dormir no resort",
      "perfil de grupo que valoriza conforto",
      "impacto do deslocamento na experiencia",
      "relacao entre diaria e praticidade",
    ],
  },
  "onde-ficar": {
    summary:
      "A pergunta sobre onde ficar perto da Aldeia das Aguas existe porque a hospedagem nao tem uma resposta unica. Para alguns perfis, o hotel interno e o melhor caminho; para outros, pousadas e alugueis ao redor aliviam o custo total.",
    profile:
      "Esse artigo faz mais sentido para quem ainda esta comparando perfis de estadia. Nao e apenas uma questao de preco: e uma escolha entre mais conveniencia, mais espaco, mais autonomia ou menos deslocamento no dia do parque.",
    attention:
      "A leitura fica ruim quando a pessoa compara diaria sem incluir trajeto, estacionamento, cansaco e rotina do grupo. Uma hospedagem aparentemente barata pode perder a vantagem quando o resto da conta entra no papel.",
    closing:
      "Este tema fica mais claro quando voce compara apenas opcoes que resolvem a mesma pergunta: dormir no resort, ficar perto ou buscar mais autonomia fora do complexo. Assim a resposta aparece mais rapido e fica mais facil escolher o perfil certo de hospedagem.",
    bullets: [
      "hotel dentro do resort contra opcoes externas",
      "grupo pequeno contra grupo grande",
      "economia por pessoa contra praticidade",
      "tempo de deslocamento em cada cenario",
    ],
  },
  airbnb: {
    summary:
      "Airbnb perto da Aldeia das Aguas interessa a quem procura mais espaco, cozinha e divisao de custos. Em geral, a ideia aparece quando a viagem envolve mais gente ou quando o grupo quer um formato de estadia menos dependente do resort.",
    profile:
      "Esse tipo de hospedagem tende a ficar mais atraente para grupos maiores e estadias um pouco mais longas. O ganho principal nao esta so no valor, mas na autonomia para organizar refeicoes, horarios e convivencia de um jeito mais livre.",
    attention:
      "O ponto fraco aparece na logistica. Ficar fora do resort exige mais deslocamento, mais combinacao entre os viajantes e menos margem para improviso, o que pode pesar em viagens com criancas ou roteiro curto.",
    closing:
      "Por isso este artigo foi mantido simples: quando o Airbnb faz sentido, quando ele perde para o hotel e quando a autonomia compensa a logistica extra fora do complexo.",
    bullets: [
      "espaco para grupos e familias",
      "possibilidade de cozinhar e dividir gastos",
      "rotina menos pratica no dia do parque",
      "diferenca entre autonomia e excesso de deslocamento",
    ],
  },
  "onde-fica": {
    summary:
      "A busca por onde fica a Aldeia das Aguas marca uma fase inicial, mas ainda bastante pratica, da pesquisa. A pessoa quer saber se o destino cabe no roteiro e se a distancia combina com o tipo de passeio que imagina fazer.",
    profile:
      "Este tema funciona melhor para quem esta validando deslocamento e contexto geografico. Saber a cidade, o eixo rodoviario e o perfil da regiao ajuda a definir se a viagem tende a ser bate-volta, fim de semana ou algo maior.",
    attention:
      "O erro e parar apenas no mapa. Localizacao sem contexto nao resolve quase nada. O que importa de verdade e entender como essa distancia conversa com horario, cansaco, necessidade de pernoite e perfil do grupo.",
    closing:
      "Este artigo funciona como ponto de partida para quem quer confirmar localizacao e medir deslocamento. Depois disso, a leitura costuma evoluir de forma natural para rota, endereco ou horario de saida.",
    bullets: [
      "cidade base e acesso rodoviario",
      "viabilidade para bate-volta",
      "impacto da distancia em familias com criancas",
      "relacao entre localizacao e necessidade de hospedagem",
    ],
  },
  "como-chegar": {
    summary:
      "Como chegar na Aldeia das Aguas e uma pergunta operacional. Quem abre esse tema quer evitar erro de rota, atraso na chegada e improviso logo antes de um passeio que depende bastante de horario.",
    profile:
      "O artigo e mais util para quem esta com a data praticamente definida e precisa transformar intencao em deslocamento real. Nessa fase, mapa, estrada e tempo de saida pesam mais do que opinioes amplas sobre o destino.",
    attention:
      "O cuidado central e nao tratar a rota como detalhe. Chegar tarde, errar acesso ou esquecer o tempo total de estrada muda completamente a experiencia, especialmente quando o parque esta mais cheio.",
    closing:
      "O melhor uso deste artigo e resolver a logistica sem improviso. Quando rota, horario e ponto certo no GPS ficam claros, a visita tende a comecar de forma muito mais leve.",
    bullets: [
      "rota principal e margem para transito",
      "uso correto do GPS",
      "diferenca entre carro proprio e transporte misto",
      "horario ideal para sair de casa",
    ],
  },
  endereco: {
    summary:
      "O endereco da Aldeia das Aguas parece um detalhe pequeno, mas ele costuma aparecer quando o visitante ja quer chegar sem erro. Nessa etapa, o objetivo nao e mais descobrir o parque, e sim localizar o ponto certo com seguranca.",
    profile:
      "Esse assunto ajuda principalmente quem esta validando a navegacao no aplicativo de mapa ou dividindo a viagem com outras pessoas. Um ponto bem conferido evita ruído logo antes da saida.",
    attention:
      "O erro comum e confiar em uma referencia antiga ou buscar apenas palavras soltas no mapa. Vale mais confirmar o nome correto do destino e revisar a cidade antes de iniciar a rota.",
    closing:
      "O artigo foi mantido simples porque ele nao precisa disputar espaco com outros temas. Ele existe para resolver o passo do endereco e empurrar a leitura apenas para paginas de planejamento que continuam na mesma trilha.",
    bullets: [
      "confirmar o destino correto no aplicativo",
      "revisar cidade e ponto de chegada",
      "evitar buscas vagas em cima da hora",
      "alinhar o endereco com o horario de saida",
    ],
  },
  telefone: {
    summary:
      "Quem procura pelo telefone da Aldeia das Aguas normalmente quer uma resposta objetiva: qual numero ligar ou chamar no WhatsApp para falar com o parque, o hotel ou o escritorio de atendimento.",
    profile:
      "Esse tipo de busca costuma aparecer quando existe uma necessidade pontual, como confirmar funcionamento, pedir orientacao sobre compra, resolver uma reserva ou falar diretamente com a equipe certa sem perder tempo.",
    attention:
      "O principal cuidado aqui e ligar para o canal errado. Quando a duvida e do parque, vale priorizar a Secretaria ou o WhatsApp; quando o assunto e hotel, a central de reservas tende a ser o caminho mais direto.",
    closing:
      "Nesta pagina, a ideia e entregar o contato sem enrolacao e mostrar rapidamente qual numero serve melhor para cada tipo de atendimento. Isso ajuda o usuario a resolver a duvida na primeira tentativa.",
    bullets: [
      "qual numero usar para falar com o parque",
      "quando vale mandar mensagem no WhatsApp",
      "qual contato atende hospedagem no Hotel Quartzo",
      "qual canal procurar para atendimento em Volta Redonda",
    ],
  },
  atracoes: {
    summary:
      "Falar das atracoes da Aldeia das Aguas e ajudar o visitante a imaginar o dia no parque. Essa leitura fica mais util quando organiza o destino por perfil de experiencia, e nao como uma lista solta de brinquedos.",
    profile:
      "O tema interessa tanto a familias quanto a grupos que querem balancear adrenalina e descanso. Saber o tipo de atracao antes da viagem ajuda a definir ritmo, ordem do roteiro e expectativa do grupo sem chegar ao parque no improviso.",
    attention:
      "O risco e tratar todas as areas como se servissem da mesma forma para qualquer publico. Criancas pequenas, adolescentes e adultos que querem relaxar usam o parque de maneiras bem diferentes.",
    closing:
      "O artigo de atracoes fica mais util quando ajuda o visitante a imaginar o ritmo do dia, o perfil das areas e a ordem das prioridades. Assim a expectativa fica mais alinhada com a experiencia real do parque e a visita rende melhor.",
    bullets: [
      "atracoes mais radicais contra areas tranquilas",
      "espacos para familias com criancas",
      "ordem do roteiro para evitar filas",
      "diferenca entre expectativa e experiencia real",
    ],
  },
  horario: {
    summary:
      "Horario da Aldeia das Aguas e um dado pequeno, mas decisivo. O visitante que consulta essa pagina normalmente ja entendeu o destino e precisa proteger a experiencia contra erro de calendario ou chegada fora do melhor momento.",
    profile:
      "Esse tema e importante para quem depende de estrada, viaja com criancas ou tenta aproveitar o parque com menos fila. O horario certo organiza desde a saida de casa ate a ordem das primeiras atracoes.",
    attention:
      "O principal cuidado e nao assumir que todos os dias funcionam do mesmo jeito. Temporada, feriado e demanda alteram bastante a rotina, por isso o horario precisa ser verificado com foco na data exata da visita.",
    closing:
      "Na nova estrutura, o artigo de horario fecha uma duvida especifica e aponta apenas para outras paginas de planejamento. Isso mantem a leitura objetiva e evita que a pessoa salte de tema cedo demais.",
    bullets: [
      "calendario do dia escolhido",
      "chegada perto da abertura",
      "impacto do horario em filas e ritmo",
      "relacao entre horario e rota de viagem",
    ],
  },
  kilimanjaro: {
    summary:
      "Kilimanjaro e a atracao mais lembrada por quem associa Aldeia das Aguas a adrenalina. A busca existe porque a pessoa quer medir intensidade, decidir se vale priorizar a descida e entender para quem ela realmente faz sentido.",
    profile:
      "O tema combina com visitantes que gostam de brinquedos radicais ou que querem montar um roteiro com uma ou duas experiencias mais marcantes. Nessa fase, expectativa correta vale mais do que hype.",
    attention:
      "O erro e transformar a atracao em parametro unico para avaliar o parque inteiro. Para alguns grupos ela e destaque; para outros, e apenas um complemento dentro de um dia que depende mais de conforto e organizacao.",
    closing:
      "A pagina do Kilimanjaro rende melhor quando ajuda a medir intensidade, fila e encaixe no roteiro do dia. Isso permite decidir se a atracao sera prioridade ou apenas um extra dentro da visita.",
    bullets: [
      "nivel real de intensidade",
      "perfil de publico que aproveita melhor",
      "regras e fila no dia da visita",
      "papel da atracao dentro do roteiro total",
    ],
  },
  "vale-a-pena": {
    summary:
      "Perguntar se a Aldeia das Aguas vale a pena e tentar medir custo-beneficio sem depender apenas de propaganda. A resposta nao e universal, porque muda conforme expectativa, data, companhia e formato da viagem.",
    profile:
      "Esse artigo faz mais sentido para quem ja reuniu informacao basica e agora quer interpretar se o destino entrega o que promete para o seu perfil. A pergunta certa nao e se o parque e bom para todo mundo, e sim se ele e bom para voce e para o jeito como voce pretende usar a viagem.",
    attention:
      "A analise perde qualidade quando mistura preco alto em um dia cheio com experiencia planejada em baixa temporada. Vale a pena julgar o parque a partir de um cenario realista, e nao de um caso extremo isolado.",
    closing:
      "Por isso a pagina foi simplificada: mostrar para quem o destino tende a funcionar, em que contexto ele rende melhor e como separar expectativa real de propaganda ou impressao isolada.",
    bullets: [
      "expectativa do visitante",
      "data escolhida e nivel de movimento",
      "combinacao entre parque e hospedagem",
      "equilibrio entre custo e estrutura entregue",
    ],
  },
  dicas: {
    summary:
      "As melhores dicas para a Aldeia das Aguas sao as que reduzem atrito no dia real da visita. Nao se trata de criar uma lista enorme, e sim de destacar o que muda fila, conforto, ritmo e aproveitamento do grupo.",
    profile:
      "Esse tipo de conteudo funciona melhor para quem ja pretende ir ao parque e quer organizar a experiencia com mais seguranca. Dica boa e a que evita erro pratico, melhora o ritmo do passeio e reduz desgaste desnecessario.",
    attention:
      "O problema de muitos artigos de dicas e misturar compra, hospedagem, opiniao e planejamento na mesma pagina. Aqui a proposta e manter somente o que ajuda a executar melhor a visita em si.",
    closing:
      "As dicas ficam mais uteis quando ajudam o visitante a ajustar horario, filas, pausas e conforto. O objetivo aqui deve ser melhorar o dia do parque com orientacoes simples, praticas e realmente aplicaveis.",
    bullets: [
      "chegar cedo e atacar as filas certas primeiro",
      "levar itens simples que melhoram conforto",
      "planejar refeicao e pausas do grupo",
      "alinhar expectativa antes de sair de casa",
    ],
  },
  "melhor-dia": {
    summary:
      "Escolher o melhor dia para ir a Aldeia das Aguas e uma das formas mais simples de melhorar o custo-beneficio da viagem. A mesma estrutura pode parecer muito diferente quando muda a data e o nivel de ocupacao.",
    profile:
      "O assunto ajuda especialmente quem tem alguma flexibilidade de agenda. Nesses casos, decidir bem o dia escolhido influencia fila, preco, conforto e ate a energia do grupo ao longo do passeio de um jeito muito perceptivel.",
    attention:
      "O erro e pensar apenas em calendario pessoal e esquecer o comportamento do parque. Feriado, sabado cheio e periodo de ferias escolares alteram bastante a experiencia, mesmo quando todo o resto do roteiro parece igual.",
    closing:
      "A pagina foi mantida direta para responder data e movimento. Quando o dia certo e escolhido, boa parte do custo-beneficio da visita melhora junto, sem precisar mudar todo o restante do plano.",
    bullets: [
      "dias uteis contra pico de demanda",
      "efeito da alta temporada no parque",
      "diferenca entre economizar e aproveitar melhor",
      "relacao entre horario e data escolhida",
    ],
  },
  familia: {
    summary:
      "Aldeia das Aguas com criancas e uma busca de quem precisa montar um dia seguro, leve e coerente com o ritmo da familia. O parque tem apelo forte para esse publico, mas a experiencia melhora muito quando a rotina e pensada antes.",
    profile:
      "Este tema e mais util para familias com filhos pequenos, grupos multigeracionais e pessoas que sabem que o passeio depende de pausas, ordem das atracoes e menos improviso no decorrer do dia para funcionar bem.",
    attention:
      "O principal cuidado e nao tentar fazer o parque inteiro de uma vez. Quando existe crianca na viagem, a melhor experiencia costuma vir de escolhas seletivas, espaco para descanso e expectativa realista do que cabe em um dia.",
    closing:
      "Esta pagina fica mais util quando ajuda a familia a montar um roteiro mais leve, com menos correria e mais previsibilidade. Isso costuma pesar mais do que tentar ver tudo de uma vez.",
    bullets: [
      "areas mais amigaveis para criancas",
      "pausas, troca de roupa e conforto",
      "ritmo mais leve ao longo do dia",
      "diferenca entre passeio familiar e roteiro radical",
    ],
  },
  opiniao: {
    summary:
      "Procurar opiniao sobre a Aldeia das Aguas e buscar uma leitura menos institucional do destino. A pessoa quer entender como visitantes costumam perceber estrutura, lotacao, preco e experiencia geral depois da visita.",
    profile:
      "Esse conteudo faz sentido para quem ja sabe o basico sobre o parque e agora quer validar expectativa. Em vez de buscar elogio ou critica isolada, o ideal e observar padroes repetidos nas percepcoes do publico.",
    attention:
      "A armadilha e tomar uma avaliacao extrema como verdade absoluta. Opiniao util e a que explica em que contexto a experiencia foi boa ou ruim, porque isso ajuda a comparar com a sua propria situacao.",
    closing:
      "O artigo de opiniao fica mais util quando ajuda a transformar percepcao em decisao. Em vez de procurar elogio ou critica isolada, o ideal e entender em que contexto o parque agradou mais ou menos.",
    bullets: [
      "padroes de elogio e critica que se repetem",
      "efeito da lotacao na experiencia",
      "peso da expectativa do visitante",
      "como transformar percepcao em decisao pratica",
    ],
  },
  "parques-aquaticos-rj": {
    summary:
      "Quem pesquisa por parques aquaticos no RJ geralmente quer comparar opcoes sem perder tempo com listas inchadas. A decisao costuma ficar melhor quando a comparacao olha distancia, estrutura e tipo de passeio que cada destino entrega.",
    profile:
      "Esse artigo funciona para familias, casais e grupos do proprio estado ou de regioes proximas que estao tentando decidir para onde vale dirigir em um fim de semana ou feriado curto.",
    attention:
      "O principal cuidado e nao comparar apenas tamanho ou fama. Um parque pode ser menor, mas fazer mais sentido pela rota, pela facilidade do dia ou pela adequacao ao publico que vai viajar.",
    closing:
      "Esta comparacao fica melhor quando voce olha apenas para parques que realmente disputam a mesma decisao. O foco deve ficar em distancia, estrutura, perfil do publico e facilidade para transformar a ideia em passeio real.",
    bullets: [
      "tempo de deslocamento dentro do estado",
      "perfil do parque para familia ou grupo adulto",
      "formato de day use ou fim de semana",
      "nivel de estrutura que realmente importa na pratica",
    ],
  },
  "melhores-parques-aquaticos-brasil": {
    summary:
      "Falar dos melhores parques aquaticos do Brasil sem criterio costuma gerar ranking vazio. A comparacao so fica util quando parte de clima, regiao, distancia, escala do parque e perfil real da viagem.",
    profile:
      "Esse tema combina com quem esta olhando possibilidades mais amplas e ainda nao definiu o destino. Nessa fase, a melhor resposta raramente e um unico nome; ela depende do tipo de viagem que voce quer montar.",
    attention:
      "O erro mais comum e comparar destinos muito diferentes como se todos servissem ao mesmo objetivo. Parque perto de casa, resort de fim de semana e viagem longa de ferias pedem criterios distintos.",
    closing:
      "A comparacao nacional fica mais util quando o leitor mantem o mesmo criterio do inicio ao fim. Assim a decisao deixa de ser um ranking vazio e vira uma escolha mais coerente com clima, distancia e tipo de viagem.",
    bullets: [
      "clima e epoca do ano em cada regiao",
      "peso da distancia no orcamento total",
      "escala do parque contra praticidade da viagem",
      "tipo de experiencia que o grupo realmente procura",
    ],
  },
  "o-que-fazer-barra-do-pirai": {
    summary:
      "A pergunta sobre o que fazer em Barra do Pirai aparece quando a pessoa quer entender se a cidade sustenta um roteiro ou se o passeio gira quase todo em torno da Aldeia das Aguas. A resposta costuma depender do tempo disponivel.",
    profile:
      "O conteudo ajuda especialmente visitantes que estao planejando um fim de semana e querem saber se vale dormir na regiao, encaixar outros programas leves ou concentrar a viagem quase toda no parque.",
    attention:
      "O principal cuidado e nao forcar uma programacao paralela se o objetivo real da viagem e parque aquatico. Em muitos casos, menos deslocamento e mais tempo de descanso geram um resultado melhor do que tentar encaixar tudo.",
    closing:
      "Esta pagina rende melhor quando ajuda a decidir se Barra do Pirai entra como base de apoio, passeio complementar ou simples caminho para a Aldeia das Aguas. O foco deve ficar no roteiro real da viagem.",
    bullets: [
      "quanto tempo voce tera fora do parque",
      "papel da cidade como apoio ao roteiro",
      "quando vale dormir na regiao",
      "equilibrio entre passeio principal e atividades complementares",
    ],
  },
  "parques-aquaticos-sp": {
    summary:
      "Pesquisar parques aquaticos em SP normalmente significa comparar praticidade, escala e tipo de destino. O estado oferece opcoes bem diferentes entre si, e a melhor escolha depende menos de marketing e mais de roteiro real.",
    profile:
      "Esse artigo serve para quem esta avaliando fim de semana, day use ou viagem curta saindo da capital, do interior ou do Vale do Paraiba. O criterio mais util e cruzar distancia com experiencia esperada.",
    attention:
      "O erro e escolher apenas pelo nome mais famoso sem medir deslocamento, publico predominante e custo total da escapada. Em varios casos, o melhor parque nao e o maior, e sim o que encaixa melhor no seu plano.",
    closing:
      "Essa comparacao fica melhor quando os parques sao avaliados pelo mesmo criterio: distancia, tamanho, perfil do passeio e esforco real para chegar. Isso evita que a escolha seja guiada so pela fama do destino.",
    bullets: [
      "parque de grande estrutura contra opcoes mais praticas",
      "distancia a partir da sua cidade",
      "viagem de um dia contra fim de semana",
      "relacao entre conforto, custo e tamanho do parque",
    ],
  },
  "parques-aquaticos-sc": {
    summary:
      "Parques aquaticos em Santa Catarina pedem uma comparacao que leve a sazonalidade a serio. O clima interfere mais na experiencia do que em outras regioes, e isso muda bastante a forma correta de planejar o passeio.",
    profile:
      "Esse artigo e mais util para quem quer entender se a viagem combina com a epoca do ano e com o formato do roteiro. Em alguns casos, o parque e complemento da regiao; em outros, ele precisa ser o ponto central da saida.",
    attention:
      "O problema aparece quando a pessoa compara Santa Catarina com regioes mais estaveis no clima sem ajustar expectativa. O parque pode ser excelente, mas a janela de aproveitamento muda o tipo de experiencia entregue.",
    closing:
      "Em Santa Catarina, a comparacao so fica justa quando clima, epoca do ano e formato da viagem entram na conta. Esse recorte costuma explicar melhor a experiencia do que um ranking seco de parques.",
    bullets: [
      "peso do clima no planejamento",
      "sazonalidade e calendario da viagem",
      "funcao do parque dentro do roteiro maior",
      "comparacao justa com outras regioes do pais",
    ],
  },
  "parques-aquaticos-nordeste": {
    summary:
      "Parques aquaticos no Nordeste entram em pesquisas que buscam mais previsibilidade de clima e uma viagem associada a lazer de destino. A vantagem da regiao costuma aparecer quando o visitante quer juntar parque com ferias e tempo bom.",
    profile:
      "O tema faz mais sentido para quem compara viagens mais planejadas, inclusive fora do proprio estado. Nessa fase, o parque deixa de ser apenas passeio de um dia e passa a integrar um roteiro maior.",
    attention:
      "O erro e olhar apenas para fotos bonitas sem medir custo total, deslocamento e numero de dias disponiveis. Em viagens maiores, a decisao precisa equilibrar experiencia desejada com o esforco real para chegar ate la.",
    closing:
      "No Nordeste, a leitura fica mais util quando a comparacao considera clima, deslocamento e quantidade de dias disponiveis. Isso ajuda a diferenciar um passeio isolado de uma viagem de ferias mais completa.",
    bullets: [
      "constancia do clima ao longo do ano",
      "tempo minimo de viagem para aproveitar",
      "peso do deslocamento no custo final",
      "combinacao entre parque aquatico e turismo de destino",
    ],
  },
};

function topicLabel(page: SiloPageDefinition): string {
  return page.title;
}

function cleanupEditorialText(text: string): string {
  return text
    .replaceAll(
      "Neste guia principal, a leitura faz mais sentido quando voce usa cada categoria para uma pergunta diferente. Assim a SILO fica limpa: primeiro voce entende o destino, depois aprofunda apenas na etapa que realmente precisa decidir.",
      "Neste guia principal, a leitura faz mais sentido quando voce usa cada categoria para uma pergunta diferente. Primeiro voce entende o destino e depois aprofunda apenas no assunto que ainda precisa decidir.",
    )
    .replaceAll(
      "Em uma SILO bem organizada, o artigo de ingresso deve responder compra e nada alem disso. Se a duvida continuar comercial, voce segue na mesma categoria; se mudar de natureza, a navegacao continua em outro hub, sem excesso de referencias.",
      "Em um conteudo bem organizado, o artigo de ingresso deve responder compra e nada alem disso. Se a duvida continuar comercial, voce segue comparando formatos de compra; se mudar de natureza, vale partir para o artigo certo do novo assunto.",
    )
    .replaceAll(
      "Dentro da SILO, este tema deve fechar a conta comercial com clareza. A leitura certa e entender quando o pacote economiza tempo e quando ele apenas adiciona itens que o seu grupo nem pretende usar.",
      "Neste tema, o ponto principal e entender quando o pacote economiza tempo e quando ele apenas adiciona itens que o seu grupo nem pretende usar.",
    )
    .replaceAll(
      "Organizar a SILO aqui ajuda muito: em vez de abrir dez opcoes aleatorias, voce compara somente as alternativas que pertencem a esta mesma etapa de hospedagem e chega a uma resposta mais objetiva.",
      "Organizar este tema com clareza ajuda muito: em vez de abrir dez opcoes aleatorias, voce compara somente as alternativas que realmente pertencem a esta etapa da hospedagem e chega a uma resposta mais objetiva.",
    )
    .replaceAll(
      "Com a SILO mais limpa, o artigo de localizacao serve como porta de entrada para perguntas de rota e planejamento, sem puxar comparacoes comerciais desnecessarias para dentro da mesma pagina.",
      "Com a estrutura mais clara, o artigo de localizacao serve como porta de entrada para perguntas de rota e planejamento, sem puxar comparacoes comerciais desnecessarias para dentro da mesma pagina.",
    )
    .replaceAll(
      "Em vez de abrir varios textos paralelos, a SILO organiza este tema ao lado de localizacao, endereco e horario. Assim a pessoa resolve logistica na sequencia certa e nao espalha a leitura.",
      "Em vez de abrir varios textos paralelos, este tema funciona melhor ao lado de localizacao, endereco e horario. Assim a pessoa resolve a logistica na sequencia certa e nao espalha a leitura.",
    )
    .replaceAll(
      "Com a SILO limpa, o artigo de atracoes conversa apenas com outros temas de planejamento e experiencia. Assim a pessoa entende o parque e so depois, se quiser, volta para categorias de compra ou hospedagem.",
      "O artigo de atracoes fica mais util quando ajuda o visitante a imaginar o ritmo do dia, o perfil das areas e a ordem das prioridades. Assim a expectativa fica mais alinhada com a experiencia real do parque.",
    )
    .replaceAll(
      "A SILO funciona melhor quando a pagina do Kilimanjaro fica ao lado de atracoes, dicas e avaliacoes da experiencia, sem misturar assuntos de compra que pertencem a outra camada da jornada.",
      "A pagina do Kilimanjaro rende melhor quando ajuda a medir intensidade, fila e encaixe no roteiro do dia. Isso permite decidir se a atracao sera prioridade ou apenas um extra dentro da visita.",
    )
    .replaceAll(
      "Quando a SILO fica limpa, as dicas ganham forca porque apontam apenas para temas vizinhos da mesma experiencia, como melhor dia, atracoes e avaliacoes da visita, sem poluir a leitura com atalhos aleatorios.",
      "As dicas ficam mais uteis quando ajudam o visitante a ajustar horario, filas, pausas e conforto. O objetivo aqui deve ser melhorar o dia do parque com orientacoes simples e praticas.",
    )
    .replaceAll(
      "Na SILO organizada, o artigo de opiniao ajuda a interpretar a experiencia e aponta apenas para outros textos da mesma camada editorial, como vale a pena, dicas e familia.",
      "O artigo de opiniao fica mais util quando ajuda a transformar percepcao em decisao. Em vez de procurar elogio ou critica isolada, o ideal e entender em que contexto o parque agradou mais ou menos.",
    )
    .replaceAll(
      "A organizacao da SILO aqui evita fuga de contexto. Os links do artigo levam apenas para guias do mesmo bloco comparativo, mantendo a leitura limpa e progressiva.",
      "A comparacao nacional fica mais util quando o leitor mantem o mesmo criterio do inicio ao fim. Assim a decisao deixa de ser um ranking vazio e vira uma escolha mais coerente com clima, distancia e tipo de viagem.",
    )
    .replaceAll(
      "A SILO regional foi organizada para aprofundar essa comparacao dentro do mesmo bloco. Os links internos daqui seguem apenas para guias que continuam o mesmo tipo de leitura.",
      "Essa comparacao fica melhor quando os parques sao avaliados pelo mesmo criterio: distancia, tamanho, perfil do passeio e esforco real para chegar. Isso evita que a escolha seja guiada so pela fama do destino.",
    )
    .replaceAll(
      "A organizacao da SILO regional ajuda justamente nisso: comparar destinos dentro do mesmo bloco editorial, sem transformar uma leitura de descoberta em uma pagina cheia de atalhos comerciais.",
      "No Nordeste, a leitura fica mais util quando a comparacao considera clima, deslocamento e quantidade de dias disponiveis. Isso ajuda a diferenciar um passeio isolado de uma viagem de ferias mais completa.",
    )
    .replaceAll("SILO", "conteudo")
    .replaceAll("silo", "conteudo");
}

function keywordText(page: SiloPageDefinition): string {
  return page.keyword;
}

function introTitle(page: SiloPageDefinition): string {
  if (page.type === "pillar") return "O que saber antes de planejar a visita";
  if (page.type === "top-funnel") return `Como comparar ${topicLabel(page)}`;
  return `O que saber sobre ${topicLabel(page)}`;
}

function detailTitle(page: SiloPageDefinition): string {
  if (page.type === "top-funnel") return "Criterios para comparar melhor";
  return "Informacoes que mais ajudam nesta busca";
}

function fitTitle(page: SiloPageDefinition): string {
  if (page.type === "top-funnel") return "Quando essa comparacao faz mais sentido";
  return "Quando este guia ajuda mais";
}

function cautionTitle(page: SiloPageDefinition): string {
  return "Pontos de atencao antes de decidir";
}

function linkSectionTitle(page: SiloPageDefinition): string {
  if (page.type === "pillar") return "Leituras essenciais para continuar";
  if (page.type === "top-funnel") return "Comparacoes relacionadas";
  return "Artigos relacionados a este tema";
}

function searchIntentLine(page: SiloPageDefinition): string {
  if (page.type === "commercial") {
    return "Aqui a busca costuma pedir resposta objetiva sobre compra: quanto custa, qual formato faz sentido e o que precisa ser conferido antes de pagar.";
  }
  if (page.type === "lodging") {
    return "Aqui a pergunta principal ja entrou no campo da hospedagem. O que mais ajuda e comparar conforto, deslocamento, rotina do grupo e custo real da estadia.";
  }
  if (page.type === "top-funnel") {
    return "Aqui o objetivo e comparar destinos com criterio, olhando distancia, estrutura, perfil do passeio e facilidade para encaixar a viagem na vida real.";
  }
  return "Aqui a resposta precisa ser direta e praticavel, com os detalhes que realmente ajudam a planejar a visita, evitar erro comum e decidir o proximo passo.";
}

function siblingGuidance(page: SiloPageDefinition): string {
  const group = groupForPage(page);
  if (page.type === "pillar") {
    return "No guia principal, a ideia e simples: entender o parque primeiro e aprofundar so no assunto que ainda pesa na decisao, como ingresso, hospedagem ou planejamento.";
  }
  if (page.type === "top-funnel") {
    return "Continuar nessa mesma comparacao ajuda a separar destinos parecidos antes de entrar em paginas de compra ou reserva. Isso deixa a escolha mais coerente.";
  }
  if (group) {
    return `Se a duvida continuar dentro de ${group.name}, vale seguir apenas para os temas que completam essa mesma decisao. Isso evita misturar compra, hospedagem e planejamento cedo demais.`;
  }
  return "Os proximos links foram escolhidos para manter a mesma pergunta ativa e preservar uma leitura simples.";
}

function practicalListTitle(page: SiloPageDefinition): string {
  if (page.type === "commercial") return "O que mais pesa na compra";
  if (page.type === "lodging") return "O que mais pesa na hospedagem";
  if (page.type === "top-funnel") return "O que comparar antes de escolher";
  return "O que realmente importa nesta busca";
}

function practicalListIntro(page: SiloPageDefinition): string {
  if (page.type === "commercial") {
    return `Para decidir ${topicLabel(page)} com mais seguranca, estes pontos costumam fazer mais diferenca do que qualquer oferta chamativa.`;
  }
  if (page.type === "lodging") {
    return `Antes de fechar ${topicLabel(page)}, vale olhar para os fatores que mudam conforto, deslocamento e custo total da estadia.`;
  }
  if (page.type === "top-funnel") {
    return `Antes de escolher entre as opcoes de ${topicLabel(page)}, estes criterios ajudam a comparar de forma mais justa e mais util.`;
  }
  return `Se a sua duvida principal e ${topicLabel(page)}, estes pontos costumam separar uma decisao tranquila de um planejamento corrido.`;
}

function practicalListOutro(page: SiloPageDefinition): string {
  if (page.type === "commercial") {
    return "Olhar para esses itens evita compra apressada e ajuda a perceber quando um valor menor realmente compensa e quando ele so parece vantajoso no primeiro olhar.";
  }
  if (page.type === "lodging") {
    return "Quando esses pontos ficam claros, a comparacao deixa de ser apenas diaria ou foto da acomodacao e passa a refletir a experiencia real da viagem.";
  }
  if (page.type === "top-funnel") {
    return "Esse filtro costuma evitar comparacoes injustas entre parques muito diferentes e ajuda a escolher um destino que combina de verdade com o passeio que voce quer fazer.";
  }
  return "Usar esse filtro deixa a leitura mais objetiva e ajuda a transformar informacao solta em uma decisao mais segura para o seu caso.";
}

function useCaseTitle(page: SiloPageDefinition): string {
  if (page.type === "top-funnel") return "Como comparar com mais criterio";
  return "Como usar isso no seu caso";
}

function useCaseParagraph(page: SiloPageDefinition): string {
  if (page.type === "commercial") {
    return "O jeito mais util de aplicar este conteudo e cruzar o valor com a sua data, o tamanho do grupo e o formato do passeio. Quem vai por um dia precisa de uma leitura diferente de quem esta montando fim de semana com hospedagem.";
  }
  if (page.type === "lodging") {
    return "O melhor uso deste conteudo e imaginar a rotina real da viagem: hora de chegar, necessidade de descanso, perfil das criancas e quanto tempo voce quer gastar em deslocamento entre cama e parque.";
  }
  if (page.type === "top-funnel") {
    return "A comparacao fica muito melhor quando voce define antes se quer bate-volta, fim de semana ou viagem mais completa. Esse recorte muda a importancia de distancia, estrutura e custo total.";
  }
  return `O jeito mais util de aplicar ${topicLabel(page)} e pensar no seu contexto real de visita: de onde voce sai, quem vai junto, quanto tempo voce tem e qual parte da experiencia mais importa para o grupo.`;
}

function linkParagraph(page: SiloPageDefinition): string {
  const targets = articleLinkTargets(page);
  if (targets.length === 0) return "";

  const links = targets
    .map((target) => `<a href="${target.href}">${escapeHtml(target.label)}</a>`)
    .join(", ");

  return `<p>Se depois disso ainda fizer sentido aprofundar a pesquisa, siga para ${links}.</p>`;
}

function bulletList(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function directAnswerBlock(page: SiloPageDefinition): string {
  if (page.key === "atracoes") {
    return [
      `<h2>${escapeHtml("Como olhar as atracoes da Aldeia das Aguas do jeito certo")}</h2>`,
      `<p>${escapeHtml(
        "As atracoes da Aldeia das Aguas fazem mais sentido quando voce separa o parque por tipo de experiencia: areas mais tranquilas, espacos para criancas e partes que pedem mais disposicao. Isso ajuda a montar um dia mais coerente e evita frustracao logo na chegada.",
      )}</p>`,
      `<h3>${escapeHtml("O que definir antes de montar o roteiro")}</h3>`,
      `<ul>`,
      `<li>se o grupo quer mais adrenalina ou mais descanso</li>`,
      `<li>quais areas fazem mais sentido para criancas</li>`,
      `<li>qual ordem pode reduzir fila e cansaco</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "vale-a-pena") {
    return [
      `<h2>${escapeHtml("Quando a Aldeia das Aguas vale a pena de verdade")}</h2>`,
      `<p>${escapeHtml(
        "A Aldeia das Aguas costuma valer a pena quando o visitante procura um parque com estrutura ampla, quer combinar lazer com conforto e entende o contexto da propria viagem. A resposta costuma ser melhor para quem mede expectativa, data e formato do passeio juntos, e nao cada ponto isoladamente.",
      )}</p>`,
      `<h3>${escapeHtml("Sinais de que a visita tende a compensar")}</h3>`,
      `<ul>`,
      `<li>o perfil do grupo combina com um parque de dia inteiro</li>`,
      `<li>a data escolhida ajuda a evitar lotacao excessiva</li>`,
      `<li>o custo total faz sentido para a experiencia esperada</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "dicas") {
    return [
      `<h2>${escapeHtml("Quais dicas realmente mudam o dia na Aldeia das Aguas")}</h2>`,
      `<p>${escapeHtml(
        "As melhores dicas para a Aldeia das Aguas sao as que melhoram o dia real da visita. Chegar no horario certo, escolher bem as primeiras areas e organizar pausas costuma fazer mais diferenca do que qualquer lista enorme de recomendacoes soltas.",
      )}</p>`,
      `<h3>${escapeHtml("O que costuma ajudar mais")}</h3>`,
      `<ul>`,
      `<li>entrar cedo nas areas mais concorridas</li>`,
      `<li>levar o basico que evita desconforto ao longo do dia</li>`,
      `<li>pensar em refeicao e descanso antes da correria aparecer</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "melhor-dia") {
    return [
      `<h2>${escapeHtml("Como escolher o melhor dia para ir a Aldeia das Aguas")}</h2>`,
      `<p>${escapeHtml(
        "Escolher o melhor dia para ir a Aldeia das Aguas costuma ser uma das formas mais simples de melhorar a visita. A mesma estrutura pode parecer muito melhor quando o parque esta menos cheio e a rotina do grupo encaixa com mais folga.",
      )}</p>`,
      `<h3>${escapeHtml("O que olhar antes de decidir a data")}</h3>`,
      `<ul>`,
      `<li>diferenca entre dia util, fim de semana e feriado</li>`,
      `<li>nivel de movimento esperado na epoca escolhida</li>`,
      `<li>impacto da data no conforto e no custo-beneficio</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "familia") {
    return [
      `<h2>${escapeHtml("Como aproveitar a Aldeia das Aguas com criancas")}</h2>`,
      `<p>${escapeHtml(
        "Aproveitar a Aldeia das Aguas com criancas costuma ficar mais facil quando a familia monta um ritmo mais leve. Em vez de tentar ver tudo, vale priorizar areas mais amigaveis, pausas bem pensadas e uma ordem de atracoes que respeite o cansaco do grupo.",
      )}</p>`,
      `<h3>${escapeHtml("O que costuma fazer mais diferenca")}</h3>`,
      `<ul>`,
      `<li>escolher areas adequadas para a idade das criancas</li>`,
      `<li>intercalar brincadeira, refeicao e descanso</li>`,
      `<li>evitar um roteiro radical demais para o ritmo da familia</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "desconto") {
    return [
      `<h2>${escapeHtml("Onde costuma aparecer desconto na Aldeia das Aguas")}</h2>`,
      `<p>${escapeHtml(
        "Desconto na Aldeia das Aguas costuma aparecer mais em escolha inteligente de data, antecedencia e formato da compra do que em cupom milagroso. Em muitos casos, economizar depende mais de fugir do pico do que de achar uma oferta chamativa.",
      )}</p>`,
      `<h3>${escapeHtml("O que costuma gerar economia real")}</h3>`,
      `<ul>`,
      `<li>datas com menor movimento</li>`,
      `<li>compra feita com antecedencia</li>`,
      `<li>comparacao entre ingresso simples, day use e pacote</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "day-use") {
    return [
      `<h2>${escapeHtml("Quando o day use da Aldeia das Aguas vale mais a pena")}</h2>`,
      `<p>${escapeHtml(
        "O day use da Aldeia das Aguas costuma valer mais a pena quando a pessoa mora perto, consegue sair cedo e quer aproveitar o parque sem transformar a visita em hospedagem. Nesses casos, a economia aparece com menos desgaste.",
      )}</p>`,
      `<h3>${escapeHtml("Sinais de que o day use combina com o seu plano")}</h3>`,
      `<ul>`,
      `<li>o trajeto nao e longo demais para ida e volta no mesmo dia</li>`,
      `<li>o grupo aguenta um ritmo mais concentrado</li>`,
      `<li>nao ha necessidade clara de dormir na regiao</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "onde-ficar") {
    return [
      `<h2>${escapeHtml("Como escolher onde ficar perto da Aldeia das Aguas")}</h2>`,
      `<p>${escapeHtml(
        "Escolher onde ficar perto da Aldeia das Aguas depende menos de achar a diaria mais baixa e mais de entender o tipo de viagem que voce quer fazer. Para alguns grupos, ficar no complexo resolve quase tudo; para outros, pousada, hotel externo ou aluguel trazem mais equilibrio.",
      )}</p>`,
      `<h3>${escapeHtml("Antes de escolher a hospedagem")}</h3>`,
      `<ul>`,
      `<li>defina se a prioridade e praticidade ou economia</li>`,
      `<li>meça o impacto do deslocamento no dia do parque</li>`,
      `<li>pense no tamanho do grupo e na rotina da viagem</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "airbnb") {
    return [
      `<h2>${escapeHtml("Quando vale buscar Airbnb perto da Aldeia das Aguas")}</h2>`,
      `<p>${escapeHtml(
        "Buscar Airbnb perto da Aldeia das Aguas costuma valer mais quando a viagem envolve grupo maior, mais de um quarto, cozinha ou estadia um pouco mais longa. O ganho principal aparece na autonomia e na divisao de custos.",
      )}</p>`,
      `<h3>${escapeHtml("O que comparar antes de reservar")}</h3>`,
      `<ul>`,
      `<li>distancia real ate o parque</li>`,
      `<li>vantagem de cozinhar e dividir gastos</li>`,
      `<li>quanto a logistica extra pesa no seu roteiro</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "preco") {
    return [
      `<h2>${escapeHtml("O que faz o preco da Aldeia das Aguas mudar")}</h2>`,
      `<p>${escapeHtml(
        "O preco da Aldeia das Aguas costuma variar menos por um numero isolado e mais pelo formato da visita. Data, antecedencia, perfil do grupo e escolha entre day use, ingresso simples ou pacote costumam mudar mais a conta final do que a pessoa imagina no inicio.",
      )}</p>`,
      `<h3>${escapeHtml("Antes de olhar apenas o valor")}</h3>`,
      `<ul>`,
      `<li>confira se a data escolhida tende a ter mais movimento</li>`,
      `<li>compare ingresso simples com day use e pacote</li>`,
      `<li>pense no custo total da visita, nao so no ticket de entrada</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "ingresso") {
    return [
      `<h2>${escapeHtml("Como comprar ingresso da Aldeia das Aguas com mais seguranca")}</h2>`,
      `<p>${escapeHtml(
        "Quem procura por ingresso da Aldeia das Aguas normalmente quer resolver a compra sem erro. O melhor caminho e conferir o canal, revisar a data, entender o que esta incluso e evitar pagar por um formato que nao combina com o seu plano.",
      )}</p>`,
      `<h3>${escapeHtml("Checklist rapido antes de pagar")}</h3>`,
      `<ul>`,
      `<li>confirme se o canal de compra e confiavel</li>`,
      `<li>revise regras de uso e data da visita</li>`,
      `<li>veja se vale mais ingresso, day use ou pacote</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "pacote") {
    return [
      `<h2>${escapeHtml("Quando o pacote da Aldeia das Aguas faz mais sentido")}</h2>`,
      `<p>${escapeHtml(
        "O pacote da Aldeia das Aguas costuma fazer mais sentido quando a viagem envolve estrada, pernoite ou familia com criancas. Nesses casos, juntar parque e hospedagem pode simplificar a organizacao e reduzir o desgaste do passeio.",
      )}</p>`,
      `<h3>${escapeHtml("Sinais de que o pacote pode valer mais")}</h3>`,
      `<ul>`,
      `<li>voce vem de longe e quer evitar correria</li>`,
      `<li>o grupo pretende ficar mais de um dia na regiao</li>`,
      `<li>comprar tudo separado aumenta o risco de erro ou desgaste</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "hotel") {
    return [
      `<h2>${escapeHtml("Quando o hotel da Aldeia das Aguas compensa")}</h2>`,
      `<p>${escapeHtml(
        "O hotel da Aldeia das Aguas costuma compensar mais quando o visitante quer trocar deslocamento por conforto. Para familias, casais em fim de semana e quem chega cansado de estrada, dormir no proprio complexo pode melhorar bastante o ritmo da viagem.",
      )}</p>`,
      `<h3>${escapeHtml("O que comparar com calma")}</h3>`,
      `<ul>`,
      `<li>tempo e cansaco que a hospedagem externa adiciona</li>`,
      `<li>facilidade de chegar cedo ao parque sem pressa</li>`,
      `<li>diferenca real entre diaria e praticidade total da viagem</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "telefone") {
    return [
      `<h2>${escapeHtml("Telefone da Aldeia das Aguas: numeros principais")}</h2>`,
      `<p>${escapeHtml(
        "Em 10 de maio de 2026, o site oficial do Aldeia das Aguas informava estes contatos principais para atendimento.",
      )}</p>`,
      `<ul>`,
      `<li><strong>Secretaria do Parque:</strong> (24) 3025-8180</li>`,
      `<li><strong>WhatsApp:</strong> (24) 99986-9620</li>`,
      `<li><strong>Hotel Quartzo - Central de Reservas:</strong> (24) 99870-4944</li>`,
      `<li><strong>Escritorio de Volta Redonda:</strong> (24) 3025-8185</li>`,
      `</ul>`,
      `<p>${escapeHtml(
        "Para a maior parte das duvidas gerais sobre parque, funcionamento e orientacao inicial, a Secretaria do Parque e o WhatsApp sao os contatos mais uteis. Se a busca for especificamente por hospedagem, a central do Hotel Quartzo tende a resolver mais rapido.",
      )}</p>`,
    ].join("");
  }

  if (page.key === "onde-fica") {
    return [
      `<h2>${escapeHtml("Aldeia das Aguas onde fica")}</h2>`,
      `<p>${escapeHtml(
        "A Aldeia das Aguas fica em Dorandia, distrito de Barra do Pirai, no estado do Rio de Janeiro. O parque esta na Rodovia Lucio Meira, BR-393, km 270, um ponto facil de localizar no mapa para quem sai da capital fluminense, do Sul Fluminense ou de Minas Gerais.",
      )}</p>`,
      `<h3>${escapeHtml("Distancias que ajudam no planejamento")}</h3>`,
      `<ul>`,
      `<li>Rio de Janeiro: cerca de 100 km</li>`,
      `<li>Volta Redonda e regiao: acesso mais simples para bate-volta</li>`,
      `<li>Sao Paulo: viagem mais longa, com mais chance de combinar hospedagem</li>`,
      `</ul>`,
    ].join("");
  }

  if (page.key === "como-chegar") {
    return [
      `<h2>${escapeHtml("Como chegar na Aldeia das Aguas")}</h2>`,
      `<p>${escapeHtml(
        "Para a maioria das pessoas, o caminho mais pratico para chegar na Aldeia das Aguas e de carro, usando GPS e saindo cedo nos dias mais concorridos. O parque fica na BR-393, km 270, na regiao de Dorandia, em Barra do Pirai, no interior do Rio de Janeiro.",
      )}</p>`,
      `<h3>${escapeHtml("O que conferir antes de sair")}</h3>`,
      `<ul>`,
        `<li>tempo estimado de estrada no horario real da sua saida</li>`,
        `<li>ponto correto no GPS para evitar desvio na chegada</li>`,
        `<li>necessidade de hospedagem se a viagem ficar longa demais</li>`,
      `</ul>`,
      `<p>${escapeHtml(
        "No site oficial, a orientacao para quem vem pela Rodovia Presidente Dutra a partir do estado do Rio e seguir por Pirai e Barra do Pirai ate acessar a BR-393. Para quem vem de Sao Paulo, a referencia destacada e acessar a BR-393 pela regiao de Volta Redonda.",
      )}</p>`,
    ].join("");
  }

  if (page.key === "endereco") {
    return [
      `<h2>${escapeHtml("Endereco da Aldeia das Aguas")}</h2>`,
      `<p>${escapeHtml(
        "Para quem quer colocar o ponto certo no GPS, o endereco informado pelo site oficial do Aldeia das Aguas e Rodovia Lucio Meira, BR-393, km 270, s/n, Dorandia, Barra do Pirai, RJ. Como referencia pratica, vale sempre conferir o nome completo do resort no mapa antes de iniciar a rota.",
      )}</p>`,
      `<h3>${escapeHtml("Como evitar erro de navegacao")}</h3>`,
      `<ul>`,
      `<li>confira Barra do Pirai como cidade de destino</li>`,
      `<li>prefira o nome completo do resort no aplicativo</li>`,
      `<li>revise o trajeto antes de sair, especialmente em feriados</li>`,
      `</ul>`,
    ].join("");
  }

  return "";
}

export function buildSimpleArticle(page: SiloPageDefinition): string {
  const seed = ARTICLE_SEEDS[page.key];
  if (!seed) {
    return [
      `<h2>${escapeHtml(introTitle(page))}</h2>`,
      `<p>${escapeHtml(
        `Este guia foi simplificado para responder a busca sobre ${topicLabel(page)} de forma direta, com foco no contexto certo e sem excesso de referencias internas.`,
      )}</p>`,
      `<p>${escapeHtml(searchIntentLine(page))}</p>`,
      `<h2>${escapeHtml(linkSectionTitle(page))}</h2>`,
      linkParagraph(page),
    ].join("");
  }

  return [
    `<h2>${escapeHtml(introTitle(page))}</h2>`,
    `<p>${escapeHtml(`${keywordText(page)}: ${cleanupEditorialText(seed.summary)}`)}</p>`,
    `<p>${escapeHtml(searchIntentLine(page))}</p>`,
    directAnswerBlock(page),
    `<h2>${escapeHtml(detailTitle(page))}</h2>`,
    `<p>${escapeHtml(cleanupEditorialText(seed.profile))}</p>`,
    `<h3>${escapeHtml(practicalListTitle(page))}</h3>`,
    `<p>${escapeHtml(practicalListIntro(page))}</p>`,
    bulletList(seed.bullets),
    `<p>${escapeHtml(practicalListOutro(page))}</p>`,
    `<h2>${escapeHtml(fitTitle(page))}</h2>`,
    `<p>${escapeHtml(cleanupEditorialText(seed.closing))}</p>`,
    `<p>${escapeHtml(siblingGuidance(page))}</p>`,
    `<h3>${escapeHtml(useCaseTitle(page))}</h3>`,
    `<p>${escapeHtml(useCaseParagraph(page))}</p>`,
    `<h2>${escapeHtml(cautionTitle(page))}</h2>`,
    `<p>${escapeHtml(cleanupEditorialText(seed.attention))}</p>`,
    `<p>${escapeHtml(
      `Se ainda restar duvida, normalmente vale revisar apenas o ponto que mais muda a sua decisao agora. Resolver ${topicLabel(page)} por partes costuma produzir uma resposta mais clara do que tentar fechar toda a viagem de uma vez.`,
    )}</p>`,
    `<h2>${escapeHtml(linkSectionTitle(page))}</h2>`,
    linkParagraph(page),
    `<p>${escapeHtml(
      `Os links acima servem para continuar a mesma linha de pesquisa, sem empurrar voce para um tema diferente antes da hora. Isso ajuda a manter a decisao mais organizada.`,
    )}</p>`,
  ].join("");
}
