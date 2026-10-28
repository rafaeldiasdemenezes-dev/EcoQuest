/*
 * EcoQuest — Dados do jogo (regiões, missões, animais e conquistas).
 * Status de conservação segundo a Lista Vermelha da IUCN.
 */
(function (global) {
  'use strict';

  var categories = {
    reflorestamento: { name: 'Reflorestamento', short: 'Flora', color: '#6fd36b' },
    agua: { name: 'Águas Limpas', short: 'Água', color: '#5ab8e8' },
    fauna: { name: 'Proteção Animal', short: 'Fauna', color: '#ffcc4d' },
    reciclagem: { name: 'Reciclagem', short: 'Resíduos', color: '#c79bff' },
    ciencia: { name: 'Exploração Científica', short: 'Ciência', color: '#ff9b6b' }
  };

  var groups = {
    cobras: { name: 'Cobras', image: 'images/animals/cobras.jpg' },
    sapos: { name: 'Sapos e rãs', image: 'images/animals/sapos.jpg' },
    aves: { name: 'Aves', image: 'images/animals/aves.jpg' },
    insetos: { name: 'Insetos', image: 'images/animals/insetos.jpg' },
    mamiferos: { name: 'Mamíferos', image: 'images/animals/mamiferos.jpg' },
    aquaticos: { name: 'Animais aquáticos', image: 'images/animals/aquaticos.jpg' }
  };

  var habitats = {
    amazonia: 'Amazônia',
    pantanal: 'Pantanal',
    cerrado: 'Cerrado',
    'mata-atlantica': 'Mata Atlântica',
    litoral: 'Litoral e Manguezal',
    caatinga: 'Caatinga'
  };

  var statusLabels = {
    LC: 'Pouco preocupante',
    NT: 'Quase ameaçada',
    VU: 'Vulnerável',
    EN: 'Em perigo',
    CR: 'Criticamente em perigo',
    EW: 'Extinta na natureza',
    DD: 'Dados insuficientes',
    NE: 'Não avaliada'
  };

  var regions = [
    {
      id: 'amazonia',
      name: 'Floresta Amazônica',
      tagline: 'A maior floresta tropical do planeta',
      description: 'Rios gigantes e árvores centenárias foram atingidos pelo desmatamento e pelo lixo. Replante, limpe o rio e siga os rastros da onça.',
      fact: 'A Amazônia abriga cerca de 10% das espécies conhecidas do planeta e a maior bacia hidrográfica do mundo.',
      theme: 'amazonia',
      seed: 1337,
      unlock: { missions: 0, text: 'Disponível desde o início' },
      guide: 'Guardiã Iara'
    },
    {
      id: 'pantanal',
      name: 'Pantanal',
      tagline: 'A maior planície alagável do mundo',
      description: 'Lagoas e campos que inundam todo ano. Queimadas e resíduos afastaram as araras. Ajude a fauna a voltar.',
      fact: 'No período de cheia, a água pode cobrir grande parte da planície pantaneira, renovando a vida de peixes, aves e plantas.',
      theme: 'pantanal',
      seed: 4242,
      unlock: { missions: 2, text: 'Conclua 2 missões' },
      guide: 'Pantaneiro Seu Bento'
    },
    {
      id: 'cerrado',
      name: 'Cerrado',
      tagline: 'A savana mais rica em espécies do mundo',
      description: 'Árvores tortas, campos dourados e nascentes que abastecem grandes rios do Brasil. A estrada trouxe lixo e as veredas secaram.',
      fact: 'O Cerrado é chamado de “berço das águas”: nele nascem rios de grandes bacias brasileiras, como a do São Francisco.',
      theme: 'cerrado',
      seed: 777,
      unlock: { missions: 4, text: 'Conclua 4 missões' },
      guide: 'Bióloga Dra. Cora'
    },
    {
      id: 'mata-atlantica',
      name: 'Mata Atlântica',
      tagline: 'Floresta da costa, cheia de vida rara',
      description: 'Restam poucos fragmentos desta floresta. Conecte matas com corredores verdes e estude seus pequenos gigantes.',
      fact: 'A Mata Atlântica é um dos biomas mais ameaçados do Brasil e um hotspot mundial de biodiversidade.',
      theme: 'mata',
      seed: 2024,
      unlock: { missions: 6, text: 'Conclua 6 missões' },
      guide: 'Guarda-parque Tainá'
    },
    {
      id: 'litoral',
      name: 'Litoral e Manguezal',
      tagline: 'Onde o rio encontra o mar',
      description: 'Praias com plástico e mangues ameaçados. Proteja tartarugas, caranguejos e o peixe-boi.',
      fact: 'Manguezais funcionam como berçários: muitos peixes e crustáceos passam ali as primeiras fases da vida.',
      theme: 'litoral',
      seed: 9090,
      unlock: { missions: 9, text: 'Conclua 9 missões' },
      guide: 'Oceanógrafo Caio'
    }
  ];

  var missions = [
    /* ---------- AMAZÔNIA ---------- */
    {
      id: 'amz-1', region: 'amazonia', category: 'reflorestamento', type: 'plant',
      title: 'Mudas da Floresta',
      description: 'Uma clareira foi aberta por desmatamento ilegal. Escolha a muda nativa certa e replante a área.',
      objective: 'Escolher a espécie nativa e plantar 6 mudas (cavar, plantar e regar).',
      difficulty: 'Fácil', xp: 120, seeds: 30,
      unlocks: ['sapo-cururu', 'borboleta-morfo'],
      fact: 'A castanheira (Bertholletia excelsa) pode passar de 50 m de altura e depende de abelhas grandes para ser polinizada.',
      spot: { x: 9, y: 7 },
      config: {
        targets: 6,
        question: 'Qual destas mudas é nativa da Amazônia?',
        options: ['Castanheira', 'Eucalipto', 'Pinus'],
        answer: 0,
        explain: 'Eucalipto e pinus são árvores exóticas. A castanheira é nativa da Amazônia.'
      }
    },
    {
      id: 'amz-2', region: 'amazonia', category: 'agua', type: 'clean',
      title: 'Rio Sem Lixo',
      description: 'O rio está cheio de garrafas e sacolas. Recolha o lixo sem atrapalhar os botos e peixes.',
      objective: 'Recolher 12 itens de lixo em 45 segundos sem tocar nos animais.',
      difficulty: 'Médio', xp: 150, seeds: 40,
      unlocks: ['boto-cor-de-rosa', 'pirarucu'],
      fact: 'Plásticos podem se fragmentar em microplásticos que entram na cadeia alimentar dos peixes.',
      spot: { x: 26, y: 11 },
      config: { goal: 12, time: 45, scene: 'rio', critters: ['boto', 'peixe'] }
    },
    {
      id: 'amz-3', region: 'amazonia', category: 'fauna', type: 'explore',
      title: 'Rastros da Onça',
      description: 'Pesquisadores precisam mapear o território da onça-pintada. Ande pela floresta e encontre as pegadas.',
      objective: 'Encontrar 5 pegadas de onça espalhadas pela região.',
      difficulty: 'Médio', xp: 160, seeds: 40,
      unlocks: ['onca-pintada', 'harpia', 'sapo-ponta-de-flecha'],
      fact: 'Pegadas, fezes e armadilhas fotográficas ajudam cientistas a estimar quantas onças vivem em uma área sem precisar capturá-las.',
      spot: { x: 30, y: 22 },
      config: { count: 5, item: 'pegada', label: 'Pegada de onça' }
    },

    /* ---------- PANTANAL ---------- */
    {
      id: 'pan-1', region: 'pantanal', category: 'fauna', type: 'quiz',
      title: 'Guardião da Arara-Azul',
      description: 'Ajude o Seu Bento a treinar novos guardiões que vão proteger os ninhos de arara-azul.',
      objective: 'Acertar pelo menos 3 de 4 perguntas.',
      difficulty: 'Fácil', xp: 120, seeds: 30,
      unlocks: ['arara-azul'],
      fact: 'Ninhos artificiais instalados por projetos de conservação ajudaram a população de araras-azuis do Pantanal a crescer.',
      spot: { x: 10, y: 9 },
      config: {
        pass: 3,
        questions: [
          { q: 'Qual é o principal alimento da arara-azul-grande no Pantanal?', options: ['Castanhas das palmeiras acuri e bocaiuva', 'Peixes pequenos', 'Insetos', 'Néctar de flores'], answer: 0 },
          { q: 'Onde a arara-azul costuma fazer seus ninhos?', options: ['No chão, entre o capim', 'Em ocos de árvores como o manduvi', 'Em galhos finos de arbustos', 'Em cavernas'], answer: 1 },
          { q: 'Quais foram grandes ameaças históricas à espécie?', options: ['Frio intenso', 'Excesso de chuvas', 'Tráfico de animais e perda de habitat', 'Competição com peixes'], answer: 2 },
          { q: 'Qual atitude ajuda a proteger as araras?', options: ['Comprar araras como animal de estimação', 'Alimentá-las com pão', 'Cortar árvores velhas', 'Denunciar o tráfico e proteger as árvores de ninho'], answer: 3 }
        ]
      }
    },
    {
      id: 'pan-2', region: 'pantanal', category: 'agua', type: 'clean',
      title: 'Baía Limpa',
      description: 'Uma baía pantaneira recebeu resíduos trazidos pela cheia. Limpe a água para as ariranhas voltarem.',
      objective: 'Recolher 14 itens de lixo em 45 segundos sem tocar nos animais.',
      difficulty: 'Médio', xp: 150, seeds: 40,
      unlocks: ['ariranha', 'capivara'],
      fact: 'Ariranhas dependem de águas limpas e cheias de peixes. Elas são sensíveis à poluição e ao garimpo com mercúrio.',
      spot: { x: 28, y: 8 },
      config: { goal: 14, time: 45, scene: 'baia', critters: ['peixe', 'jacare'] }
    },
    {
      id: 'pan-3', region: 'pantanal', category: 'ciencia', type: 'explore',
      title: 'Censo do Tuiuiú',
      description: 'Participe do censo de aves: encontre e registre os ninhos de tuiuiú nas árvores altas.',
      objective: 'Registrar 5 ninhos de tuiuiú pela região.',
      difficulty: 'Médio', xp: 160, seeds: 40,
      unlocks: ['tuiuiu', 'jiboia'],
      fact: 'Contagens periódicas de ninhos mostram aos cientistas se uma população de aves está crescendo ou diminuindo.',
      spot: { x: 20, y: 22 },
      config: { count: 5, item: 'ninho', label: 'Ninho de tuiuiú' }
    },

    /* ---------- CERRADO ---------- */
    {
      id: 'cer-1', region: 'cerrado', category: 'reciclagem', type: 'sort',
      title: 'Coleta na Estrada',
      description: 'Motoristas jogaram lixo na beira da estrada. Separe cada resíduo na lixeira de cor correta.',
      objective: 'Separar 10 resíduos acertando pelo menos 8.',
      difficulty: 'Fácil', xp: 120, seeds: 30,
      unlocks: ['cascavel', 'sauva'],
      fact: 'No Brasil, a Resolução CONAMA nº 275 define as cores da coleta seletiva: azul (papel), vermelho (plástico), amarelo (metal), verde (vidro) e marrom (orgânico).',
      spot: { x: 8, y: 20 },
      config: {
        pass: 8,
        items: [
          { name: 'Jornal velho', bin: 'papel' },
          { name: 'Garrafa PET', bin: 'plastico' },
          { name: 'Lata de alumínio', bin: 'metal' },
          { name: 'Pote de vidro', bin: 'vidro' },
          { name: 'Casca de banana', bin: 'organico' },
          { name: 'Caixa de papelão', bin: 'papel' },
          { name: 'Sacola plástica', bin: 'plastico' },
          { name: 'Tampinha de metal', bin: 'metal' },
          { name: 'Garrafa de vidro', bin: 'vidro' },
          { name: 'Borra de café', bin: 'organico' }
        ]
      }
    },
    {
      id: 'cer-2', region: 'cerrado', category: 'reflorestamento', type: 'plant',
      title: 'Veredas Vivas',
      description: 'Uma nascente está secando porque a vegetação ao redor foi removida. Recupere a vereda.',
      objective: 'Escolher a espécie nativa e plantar 7 mudas ao redor da nascente.',
      difficulty: 'Médio', xp: 150, seeds: 40,
      unlocks: ['ra-pimenta', 'tucano-toco'],
      fact: 'O buriti (Mauritia flexuosa) é a palmeira típica das veredas e indica a presença de água no solo.',
      spot: { x: 30, y: 9 },
      config: {
        targets: 7,
        question: 'Qual palmeira é típica das veredas do Cerrado?',
        options: ['Palmeira-imperial', 'Buriti', 'Coqueiro-da-baía'],
        answer: 1,
        explain: 'O buriti cresce em solos úmidos e é símbolo das veredas.'
      }
    },
    {
      id: 'cer-3', region: 'cerrado', category: 'fauna', type: 'memory',
      title: 'Corredor do Lobo-Guará',
      description: 'Para criar uma passagem de fauna sob a estrada, a equipe precisa conhecer os animais locais.',
      objective: 'Encontrar todos os 6 pares de animal e característica.',
      difficulty: 'Médio', xp: 150, seeds: 40,
      unlocks: ['lobo-guara', 'tamandua-bandeira'],
      fact: 'Atropelamentos estão entre as principais ameaças ao lobo-guará e ao tamanduá-bandeira. Passagens de fauna reduzem essas mortes.',
      spot: { x: 22, y: 22 },
      config: {
        pairs: [
          ['Lobo-guará', 'Come a fruta-do-lobo'],
          ['Tamanduá-bandeira', 'Língua de até 60 cm'],
          ['Cascavel', 'Chocalho de queratina'],
          ['Tucano-toco', 'Bico ajuda a regular a temperatura'],
          ['Saúva', 'Cultiva fungos com folhas'],
          ['Rã-pimenta', 'Faz ninhos de espuma']
        ]
      }
    },

    /* ---------- MATA ATLÂNTICA ---------- */
    {
      id: 'mat-1', region: 'mata-atlantica', category: 'ciencia', type: 'quiz',
      title: 'Pequenos Gigantes',
      description: 'Os menores animais da floresta revelam muito sobre a saúde do ambiente. Teste seus conhecimentos.',
      objective: 'Acertar pelo menos 3 de 4 perguntas.',
      difficulty: 'Médio', xp: 140, seeds: 35,
      unlocks: ['pingo-de-ouro', 'vaga-lume'],
      fact: 'Anfíbios têm pele permeável e por isso são considerados bons bioindicadores da qualidade ambiental.',
      spot: { x: 9, y: 9 },
      config: {
        pass: 3,
        questions: [
          { q: 'Aproximadamente quanto mede um sapinho-pingo-de-ouro adulto?', options: ['Cerca de 1,5 a 2 cm', 'Cerca de 10 cm', 'Cerca de 30 cm', 'Cerca de 50 cm'], answer: 0 },
          { q: 'Como o vaga-lume produz luz?', options: ['Com eletricidade estática', 'Refletindo a luz da lua', 'Por uma reação química com luciferina e luciferase', 'Queimando gordura'], answer: 2 },
          { q: 'O que é verdade sobre a abelha jataí?', options: ['É uma espécie da Europa', 'Não possui ferrão funcional', 'Não produz mel', 'Vive sozinha'], answer: 1 },
          { q: 'Por que anfíbios são bons bioindicadores?', options: ['Porque vivem muito tempo', 'Porque são grandes', 'Porque não se alimentam', 'Porque a pele permeável é sensível à poluição'], answer: 3 }
        ]
      }
    },
    {
      id: 'mat-2', region: 'mata-atlantica', category: 'fauna', type: 'explore',
      title: 'Família Mico-Leão',
      description: 'Grupos de micos-leões-dourados se espalharam pelos fragmentos de mata. Localize cada grupo para o monitoramento.',
      objective: 'Localizar 4 grupos de micos-leões-dourados.',
      difficulty: 'Médio', xp: 160, seeds: 40,
      unlocks: ['mico-leao-dourado', 'coral-verdadeira'],
      fact: 'O monitoramento de grupos de micos ajuda a planejar corredores florestais que conectam fragmentos de mata.',
      spot: { x: 28, y: 20 },
      config: { count: 4, item: 'mico', label: 'Grupo de micos' }
    },
    {
      id: 'mat-3', region: 'mata-atlantica', category: 'reflorestamento', type: 'plant',
      title: 'Corredor Ecológico',
      description: 'Dois fragmentos de floresta estão isolados por um pasto. Plante um corredor verde para unir a mata.',
      objective: 'Escolher a espécie nativa e plantar 8 mudas.',
      difficulty: 'Difícil', xp: 170, seeds: 45,
      unlocks: ['jatai'],
      fact: 'A palmeira-juçara (Euterpe edulis) é nativa da Mata Atlântica e está ameaçada pelo corte ilegal do palmito.',
      spot: { x: 20, y: 6 },
      config: {
        targets: 8,
        question: 'Qual destas espécies é nativa da Mata Atlântica?',
        options: ['Pinus', 'Leucena', 'Palmeira-juçara'],
        answer: 2,
        explain: 'Pinus e leucena são exóticas e podem se tornar invasoras. A juçara é nativa.'
      }
    },

    /* ---------- LITORAL ---------- */
    {
      id: 'lit-1', region: 'litoral', category: 'agua', type: 'clean',
      title: 'Mar Sem Plástico',
      description: 'Tartarugas confundem sacolas plásticas com alimento. Limpe o mar antes que elas se alimentem.',
      objective: 'Recolher 16 itens de lixo em 45 segundos sem tocar nos animais.',
      difficulty: 'Difícil', xp: 170, seeds: 45,
      unlocks: ['tartaruga-verde'],
      fact: 'A ingestão de plástico é uma das ameaças às tartarugas marinhas; sacolas na água podem lembrar algas e águas-vivas.',
      spot: { x: 12, y: 18 },
      config: { goal: 16, time: 45, scene: 'mar', critters: ['tartaruga', 'peixe'] }
    },
    {
      id: 'lit-2', region: 'litoral', category: 'reciclagem', type: 'sort',
      title: 'Ecoponto da Praia',
      description: 'Depois do feriado, a praia ficou cheia de resíduos. Organize o ecoponto separando tudo corretamente.',
      objective: 'Separar 10 resíduos acertando pelo menos 8.',
      difficulty: 'Médio', xp: 140, seeds: 35,
      unlocks: ['caranguejo-uca', 'guara'],
      fact: 'Reciclar uma lata de alumínio economiza grande parte da energia necessária para produzir alumínio novo a partir do minério.',
      spot: { x: 28, y: 10 },
      config: {
        pass: 8,
        items: [
          { name: 'Garrafa de água', bin: 'plastico' },
          { name: 'Lata de refrigerante', bin: 'metal' },
          { name: 'Casca de coco verde', bin: 'organico' },
          { name: 'Folheto de papel', bin: 'papel' },
          { name: 'Garrafa de suco de vidro', bin: 'vidro' },
          { name: 'Copo plástico', bin: 'plastico' },
          { name: 'Lata de atum', bin: 'metal' },
          { name: 'Restos de frutas', bin: 'organico' },
          { name: 'Embalagem de papelão', bin: 'papel' },
          { name: 'Frasco de vidro', bin: 'vidro' }
        ]
      }
    },
    {
      id: 'lit-3', region: 'litoral', category: 'ciencia', type: 'quiz',
      title: 'Oceano em Questão',
      description: 'O Oceanógrafo Caio vai liberar a área de desova das tartarugas se você mostrar que conhece o litoral.',
      objective: 'Acertar pelo menos 4 de 5 perguntas.',
      difficulty: 'Difícil', xp: 180, seeds: 50,
      unlocks: ['peixe-boi-marinho', 'jararaca-ilhoa'],
      fact: 'Uma garrafa plástica pode levar centenas de anos para se degradar no ambiente.',
      spot: { x: 20, y: 6 },
      config: {
        pass: 4,
        questions: [
          { q: 'Do que se alimenta a tartaruga-verde adulta?', options: ['Principalmente de algas e capins marinhos', 'Apenas de peixes', 'De caranguejos e lulas', 'De plâncton apenas'], answer: 0 },
          { q: 'Qual projeto brasileiro é conhecido pela conservação das tartarugas marinhas?', options: ['Projeto Mamíferos', 'Projeto TAMAR', 'Projeto Arara Azul', 'Projeto Mico'], answer: 1 },
          { q: 'Quais são os parentes vivos mais próximos do peixe-boi?', options: ['Golfinhos', 'Focas', 'Elefantes', 'Baleias'], answer: 2 },
          { q: 'Por que os manguezais são importantes?', options: ['Porque não têm animais', 'Porque aceleram a erosão', 'Porque são áreas vazias', 'Porque são berçários de espécies e protegem a costa'], answer: 3 },
          { q: 'Onde vive a jararaca-ilhoa?', options: ['Somente na Ilha da Queimada Grande (SP)', 'Em toda a Amazônia', 'No Pantanal', 'No Cerrado'], answer: 0 }
        ]
      }
    }
  ];

  function a(o) { return o; }

  var animals = [
    /* COBRAS */
    a({ id: 'jiboia', name: 'Jiboia', scientific: 'Boa constrictor', group: 'cobras',
      habitats: ['amazonia', 'mata-atlantica', 'cerrado', 'caatinga', 'pantanal'], status: 'LC',
      size: 'Geralmente entre 2 e 3 metros.',
      diet: 'Roedores, aves e lagartos.',
      description: 'Serpente não peçonhenta que mata suas presas por constrição, enrolando o corpo ao redor delas. É ativa principalmente ao entardecer e à noite.',
      threats: 'Perda de habitat, atropelamentos e captura para o comércio ilegal.',
      curiosity: 'Não tem veneno: sua estratégia é a força. Ela ajuda a controlar populações de roedores.' }),
    a({ id: 'cascavel', name: 'Cascavel', scientific: 'Crotalus durissus', group: 'cobras',
      habitats: ['cerrado', 'caatinga'], status: 'LC',
      size: 'Geralmente entre 1 e 1,6 metro.',
      diet: 'Principalmente roedores.',
      description: 'Serpente peçonhenta de áreas abertas e secas. Seu veneno tem ação neurotóxica e miotóxica, por isso exige atendimento médico urgente em caso de acidente.',
      threats: 'Perda de habitat e morte por medo das pessoas.',
      curiosity: 'O chocalho é formado por anéis de queratina. Um novo anel surge a cada troca de pele, então ele não indica a idade.' }),
    a({ id: 'coral-verdadeira', name: 'Coral-verdadeira', scientific: 'Micrurus corallinus', group: 'cobras',
      habitats: ['mata-atlantica'], status: 'LC',
      size: 'Geralmente até cerca de 80 cm.',
      diet: 'Outras serpentes, anfisbenas e lagartos.',
      description: 'Serpente peçonhenta de hábitos discretos, com anéis vermelhos, pretos e brancos. Vive no folhiço da floresta.',
      threats: 'Desmatamento e fragmentação da Mata Atlântica.',
      curiosity: 'Muitas falsas-corais imitam suas cores. Só especialistas diferenciam com segurança: nunca toque em nenhuma.' }),
    a({ id: 'jararaca-ilhoa', name: 'Jararaca-ilhoa', scientific: 'Bothrops insularis', group: 'cobras',
      habitats: ['litoral', 'mata-atlantica'], status: 'CR',
      size: 'Cerca de 70 a 90 cm.',
      diet: 'Adultos comem principalmente aves migratórias; filhotes comem invertebrados e pequenos lagartos.',
      description: 'Serpente peçonhenta que existe apenas na Ilha da Queimada Grande, no litoral de São Paulo. Sem mamíferos na ilha, adaptou-se a caçar aves.',
      threats: 'Área de distribuição minúscula, captura ilegal e alterações no habitat.',
      curiosity: 'Por existir em uma única ilha, qualquer impacto no local pode ameaçar toda a espécie. O acesso à ilha é restrito.' }),

    /* SAPOS */
    a({ id: 'sapo-cururu', name: 'Sapo-cururu', scientific: 'Rhinella marina', group: 'sapos',
      habitats: ['amazonia'], status: 'LC',
      size: 'Normalmente de 10 a 15 cm.',
      diet: 'Insetos e outros invertebrados.',
      description: 'Sapo grande de pele rugosa com glândulas paratoides atrás dos olhos, que produzem toxinas para defesa.',
      threats: 'Na área nativa, poluição e perda de habitat.',
      curiosity: 'Foi levado para a Austrália em 1935 e se tornou uma espécie invasora que causa grandes problemas por lá.' }),
    a({ id: 'sapo-ponta-de-flecha', name: 'Sapo-ponta-de-flecha-tintureiro', scientific: 'Dendrobates tinctorius', group: 'sapos',
      habitats: ['amazonia'], status: 'LC',
      size: 'Cerca de 3 a 5 cm.',
      diet: 'Formigas, ácaros, cupins e pequenos invertebrados.',
      description: 'Pequeno sapo colorido do chão da floresta. As cores fortes avisam aos predadores que ele é tóxico (aposematismo).',
      threats: 'Desmatamento e coleta para o comércio ilegal de animais.',
      curiosity: 'Sua toxicidade vem da dieta: indivíduos criados em cativeiro, sem os mesmos insetos, não ficam tóxicos.' }),
    a({ id: 'pingo-de-ouro', name: 'Sapinho-pingo-de-ouro', scientific: 'Brachycephalus ephippium', group: 'sapos',
      habitats: ['mata-atlantica'], status: 'LC',
      size: 'Cerca de 1,5 a 2 cm.',
      diet: 'Pequenos invertebrados, como ácaros e colêmbolos.',
      description: 'Um dos menores vertebrados do Brasil, de cor laranja intensa. Vive no folhiço de florestas úmidas de montanha.',
      threats: 'Perda e fragmentação da Mata Atlântica.',
      curiosity: 'Não tem fase de girino: os filhotes já saem do ovo como mini-sapinhos. Seus ossos brilham sob luz ultravioleta.' }),
    a({ id: 'ra-pimenta', name: 'Rã-pimenta', scientific: 'Leptodactylus labyrinthicus', group: 'sapos',
      habitats: ['cerrado', 'caatinga', 'mata-atlantica'], status: 'LC',
      size: 'Pode passar de 15 cm.',
      diet: 'Insetos, outros anfíbios e pequenos vertebrados.',
      description: 'Uma das maiores rãs do Brasil, comum perto de brejos e poças. Os machos têm braços muito fortes na época reprodutiva.',
      threats: 'Drenagem de áreas úmidas e poluição.',
      curiosity: 'O nome vem da secreção da pele, que irrita olhos e mucosas como pimenta. Ela põe os ovos em ninhos de espuma.' }),

    /* AVES */
    a({ id: 'harpia', name: 'Harpia (gavião-real)', scientific: 'Harpia harpyja', group: 'aves',
      habitats: ['amazonia', 'mata-atlantica'], status: 'VU',
      size: 'Cerca de 1 m de comprimento e 2 m de envergadura.',
      diet: 'Preguiças, macacos e outros mamíferos das copas.',
      description: 'Uma das águias mais poderosas do mundo. Caça entre as copas das árvores mais altas da floresta.',
      threats: 'Desmatamento e caça.',
      curiosity: 'Reproduz-se devagar: o casal costuma criar um único filhote a cada 2 ou 3 anos.' }),
    a({ id: 'arara-azul', name: 'Arara-azul-grande', scientific: 'Anodorhynchus hyacinthinus', group: 'aves',
      habitats: ['pantanal', 'cerrado', 'amazonia'], status: 'VU',
      size: 'Cerca de 1 m de comprimento, incluindo a cauda.',
      diet: 'Castanhas de palmeiras como acuri e bocaiuva.',
      description: 'O maior psitacídeo (família dos papagaios) do mundo em comprimento. Seu bico forte quebra cocos muito duros.',
      threats: 'Tráfico de animais, perda de árvores de ninho e queimadas.',
      curiosity: 'No Pantanal, muitas araras nidificam em ocos do manduvi. Ninhos artificiais ajudaram a espécie a se recuperar.' }),
    a({ id: 'tuiuiu', name: 'Tuiuiú', scientific: 'Jabiru mycteria', group: 'aves',
      habitats: ['pantanal'], status: 'LC',
      size: 'Até cerca de 1,4 m de altura e 2,8 m de envergadura.',
      diet: 'Peixes, moluscos, anfíbios e pequenos animais.',
      description: 'Grande cegonha de pescoço preto e faixa vermelha. É considerada a ave-símbolo do Pantanal.',
      threats: 'Perda de áreas alagadas e poluição das águas.',
      curiosity: 'Constrói ninhos enormes no alto das árvores e costuma reutilizá-los por vários anos.' }),
    a({ id: 'tucano-toco', name: 'Tucano-toco', scientific: 'Ramphastos toco', group: 'aves',
      habitats: ['cerrado', 'pantanal', 'amazonia', 'mata-atlantica'], status: 'LC',
      size: 'Cerca de 55 a 65 cm; o bico tem cerca de 20 cm.',
      diet: 'Principalmente frutos; às vezes ovos e filhotes de outras aves.',
      description: 'O maior dos tucanos. Ao comer frutos, espalha sementes e ajuda a regenerar a vegetação.',
      threats: 'Tráfico de animais e perda de habitat.',
      curiosity: 'O bico é leve e cheio de vasos sanguíneos: ele ajuda a liberar calor e regular a temperatura do corpo.' }),
    a({ id: 'guara', name: 'Guará', scientific: 'Eudocimus ruber', group: 'aves',
      habitats: ['litoral'], status: 'LC',
      size: 'Cerca de 55 a 65 cm.',
      diet: 'Caranguejos e outros crustáceos.',
      description: 'Ave de manguezal com plumagem vermelha intensa e bico longo e curvo para procurar alimento na lama.',
      threats: 'Destruição de manguezais e caça.',
      curiosity: 'A cor vermelha vem de pigmentos carotenoides dos crustáceos que come. Os filhotes nascem escuros.' }),
    a({ id: 'ararinha-azul', name: 'Ararinha-azul', scientific: 'Cyanopsitta spixii', group: 'aves',
      habitats: ['caatinga'], status: 'EW',
      size: 'Cerca de 55 cm.',
      diet: 'Sementes de plantas da Caatinga, como pinhão e favela.',
      description: 'Pequena arara azul que vivia nas matas ciliares de caraibeiras no norte da Bahia.',
      threats: 'Tráfico de animais e destruição das matas ciliares.',
      curiosity: 'O último indivíduo selvagem desapareceu em 2000. Em 2022, aves criadas em cativeiro foram reintroduzidas na Caatinga.' }),

    /* INSETOS */
    a({ id: 'borboleta-morfo', name: 'Borboleta-azul (morfo)', scientific: 'Morpho helenor', group: 'insetos',
      habitats: ['amazonia', 'mata-atlantica'], status: 'NE',
      size: 'Envergadura de cerca de 10 a 15 cm.',
      diet: 'Adultos sugam líquidos de frutas fermentadas; lagartas comem folhas.',
      description: 'Borboleta grande de asas azuis brilhantes por cima e marrons com “olhos” por baixo, que ajudam na camuflagem.',
      threats: 'Desmatamento e uso de agrotóxicos.',
      curiosity: 'O azul não vem de pigmento: é cor estrutural, criada por nanoestruturas nas escamas que refletem a luz.' }),
    a({ id: 'sauva', name: 'Saúva (formiga-cortadeira)', scientific: 'Atta spp.', group: 'insetos',
      habitats: ['cerrado', 'amazonia', 'mata-atlantica', 'pantanal', 'caatinga'], status: 'NE',
      size: 'Operárias de tamanhos muito diferentes, de poucos milímetros a mais de 1 cm.',
      diet: 'Um fungo cultivado pela própria colônia.',
      description: 'Formigas que cortam folhas e as levam para o ninho. Os ninhos podem ter vários metros de profundidade e milhões de indivíduos.',
      threats: 'Em geral não é ameaçada; é muito abundante.',
      curiosity: 'Elas não comem as folhas: usam-nas para cultivar um fungo, numa agricultura que existe há milhões de anos.' }),
    a({ id: 'vaga-lume', name: 'Vaga-lume', scientific: 'Família Lampyridae', group: 'insetos',
      habitats: ['mata-atlantica', 'cerrado', 'amazonia', 'pantanal'], status: 'NE',
      size: 'Em geral de 0,5 a 2 cm.',
      diet: 'Larvas predam caramujos e pequenos invertebrados; muitos adultos quase não se alimentam.',
      description: 'Besouros que produzem luz para atrair parceiros. Cada espécie tem um padrão próprio de piscadas.',
      threats: 'Poluição luminosa, agrotóxicos e perda de habitat.',
      curiosity: 'A luz vem da reação da luciferina com a enzima luciferase e quase não produz calor: é a “luz fria”.' }),
    a({ id: 'jatai', name: 'Abelha jataí', scientific: 'Tetragonisca angustula', group: 'insetos',
      habitats: ['mata-atlantica', 'cerrado', 'amazonia'], status: 'NE',
      size: 'Cerca de 4 a 5 mm.',
      diet: 'Néctar e pólen.',
      description: 'Abelha nativa sem ferrão funcional. Constrói uma entrada em forma de tubo de cera, vigiada por abelhas-guardas.',
      threats: 'Desmatamento e agrotóxicos.',
      curiosity: 'É uma das abelhas nativas mais criadas no Brasil (meliponicultura) e poliniza muitas plantas.' }),

    /* MAMÍFEROS */
    a({ id: 'onca-pintada', name: 'Onça-pintada', scientific: 'Panthera onca', group: 'mamiferos',
      habitats: ['amazonia', 'pantanal', 'cerrado', 'mata-atlantica', 'caatinga'], status: 'NT',
      size: 'Geralmente de 56 a 96 kg; machos do Pantanal podem passar de 100 kg.',
      diet: 'Capivaras, queixadas, jacarés, veados e outros animais.',
      description: 'O maior felino das Américas e o terceiro maior do mundo. Excelente nadadora, vive perto de rios.',
      threats: 'Desmatamento, queimadas, caça e conflitos com criadores de gado.',
      curiosity: 'Tem uma das mordidas mais fortes entre os felinos e muitas vezes abate presas mordendo o crânio.' }),
    a({ id: 'ariranha', name: 'Ariranha', scientific: 'Pteronura brasiliensis', group: 'mamiferos',
      habitats: ['amazonia', 'pantanal'], status: 'EN',
      size: 'Até cerca de 1,8 m, incluindo a cauda.',
      diet: 'Principalmente peixes.',
      description: 'A maior lontra do mundo. Vive em grupos familiares barulhentos que defendem juntos o território.',
      threats: 'Poluição dos rios (inclusive por mercúrio), perda de habitat e caça no passado.',
      curiosity: 'As manchas claras do pescoço são únicas em cada indivíduo, como uma impressão digital.' }),
    a({ id: 'capivara', name: 'Capivara', scientific: 'Hydrochoerus hydrochaeris', group: 'mamiferos',
      habitats: ['pantanal', 'amazonia', 'cerrado', 'mata-atlantica'], status: 'LC',
      size: 'Em geral de 35 a 65 kg.',
      diet: 'Capins e plantas aquáticas.',
      description: 'O maior roedor do mundo. Vive em grupos perto da água e tem membranas entre os dedos que ajudam a nadar.',
      threats: 'Caça e perda de áreas úmidas.',
      curiosity: 'Consegue ficar alguns minutos submersa para fugir de predadores.' }),
    a({ id: 'lobo-guara', name: 'Lobo-guará', scientific: 'Chrysocyon brachyurus', group: 'mamiferos',
      habitats: ['cerrado', 'pantanal'], status: 'NT',
      size: 'Cerca de 90 cm de altura no ombro; de 20 a 30 kg.',
      diet: 'Onívoro: frutos como a fruta-do-lobo, pequenos roedores, aves e insetos.',
      description: 'O maior canídeo da América do Sul. Apesar do nome, não é lobo nem raposa: é o único representante do seu gênero.',
      threats: 'Atropelamentos, perda de habitat e doenças transmitidas por cães domésticos.',
      curiosity: 'A fruta-do-lobo pode formar grande parte de sua dieta, e ele espalha as sementes pelo Cerrado.' }),
    a({ id: 'tamandua-bandeira', name: 'Tamanduá-bandeira', scientific: 'Myrmecophaga tridactyla', group: 'mamiferos',
      habitats: ['cerrado', 'pantanal', 'amazonia'], status: 'VU',
      size: 'Até cerca de 2 m de comprimento, incluindo a cauda.',
      diet: 'Formigas e cupins.',
      description: 'Não tem dentes: usa a língua longa e pegajosa para capturar insetos. A cauda peluda parece uma bandeira.',
      threats: 'Queimadas, atropelamentos e perda de habitat.',
      curiosity: 'Sua língua pode chegar a 60 cm, e ele pode comer dezenas de milhares de insetos por dia.' }),
    a({ id: 'mico-leao-dourado', name: 'Mico-leão-dourado', scientific: 'Leontopithecus rosalia', group: 'mamiferos',
      habitats: ['mata-atlantica'], status: 'EN',
      size: 'Cerca de 600 g.',
      diet: 'Frutas, insetos, pequenos vertebrados e néctar.',
      description: 'Primata de pelagem dourada que vive em grupos familiares nas florestas de baixada do Rio de Janeiro.',
      threats: 'Fragmentação da Mata Atlântica e surtos de febre amarela.',
      curiosity: 'Nos anos 1970 restavam cerca de 200 na natureza. Reflorestamento e corredores ajudaram a população a crescer.' }),

    /* AQUÁTICOS */
    a({ id: 'boto-cor-de-rosa', name: 'Boto-cor-de-rosa', scientific: 'Inia geoffrensis', group: 'aquaticos',
      habitats: ['amazonia'], status: 'EN',
      size: 'Até cerca de 2,5 m.',
      diet: 'Peixes.',
      description: 'O maior golfinho de rio do mundo. A cor rosada se intensifica com a idade, especialmente nos machos.',
      threats: 'Captura acidental em redes, uso como isca, barragens e contaminação por mercúrio.',
      curiosity: 'As vértebras do pescoço não são fundidas, por isso ele vira a cabeça para nadar entre troncos na floresta alagada.' }),
    a({ id: 'pirarucu', name: 'Pirarucu', scientific: 'Arapaima gigas', group: 'aquaticos',
      habitats: ['amazonia'], status: 'DD',
      size: 'Pode chegar a cerca de 3 m.',
      diet: 'Peixes.',
      description: 'Um dos maiores peixes de água doce do mundo, de escamas grandes e cauda avermelhada.',
      threats: 'Pesca excessiva no passado.',
      curiosity: 'Respira ar: sobe à superfície a cada 10–20 minutos. Esse hábito permite que comunidades contem os peixes no manejo sustentável.' }),
    a({ id: 'tartaruga-verde', name: 'Tartaruga-verde', scientific: 'Chelonia mydas', group: 'aquaticos',
      habitats: ['litoral'], status: 'EN',
      size: 'Carapaça de cerca de 1 m.',
      diet: 'Adultos comem principalmente algas e capins marinhos.',
      description: 'Tartaruga marinha que desova em ilhas oceânicas brasileiras, como Trindade, Atol das Rocas e Fernando de Noronha.',
      threats: 'Ingestão de plástico, captura acidental na pesca e ocupação das praias.',
      curiosity: 'O nome não vem do casco, e sim da cor esverdeada da gordura do corpo.' }),
    a({ id: 'caranguejo-uca', name: 'Caranguejo-uçá', scientific: 'Ucides cordatus', group: 'aquaticos',
      habitats: ['litoral'], status: 'NE',
      size: 'Carapaça de cerca de 8 a 10 cm.',
      diet: 'Folhas e propágulos do mangue.',
      description: 'Caranguejo que vive em tocas na lama dos manguezais. Ao comer folhas, ajuda a reciclar nutrientes do ecossistema.',
      threats: 'Destruição de manguezais e captura excessiva.',
      curiosity: 'Na “andada”, época reprodutiva, os caranguejos saem em massa das tocas. Nesse período a captura é proibida (defeso).' }),
    a({ id: 'peixe-boi-marinho', name: 'Peixe-boi-marinho', scientific: 'Trichechus manatus', group: 'aquaticos',
      habitats: ['litoral'], status: 'VU',
      size: 'Pode ultrapassar 3 m e 400 kg.',
      diet: 'Capins marinhos, algas e folhas de mangue.',
      description: 'Mamífero aquático herbívoro e lento que vive em águas costeiras rasas e estuários. No Brasil, ocorre principalmente no Norte e Nordeste.',
      threats: 'Colisão com embarcações, redes de pesca e destruição de estuários.',
      curiosity: 'Apesar de viver na água, seus parentes vivos mais próximos são os elefantes.' })
  ];

  var achievements = [
    { id: 'primeiro-passo', name: 'Primeiro Passo', description: 'Conclua sua primeira missão.' },
    { id: 'explorador', name: 'Explorador', description: 'Visite 3 regiões diferentes.' },
    { id: 'guardiao-5', name: 'Guardião Iniciante', description: 'Conclua 5 missões.' },
    { id: 'regiao-viva', name: 'Região Viva', description: 'Restaure 100% de uma região.' },
    { id: 'sabio', name: 'Mente Brilhante', description: 'Acerte todas as perguntas de um quiz.' },
    { id: 'pesquisador', name: 'Pesquisador de Campo', description: 'Conclua todas as missões de exploração.' },
    { id: 'naturalista', name: 'Naturalista', description: 'Desbloqueie 15 fichas de animais.' },
    { id: 'nivel-5', name: 'Veterano Verde', description: 'Alcance o nível 5.' },
    { id: 'planeta-vivo', name: 'Planeta Vivo', description: 'Restaure todas as regiões. Recompensa: ficha da ararinha-azul.' },
    { id: 'enciclopedia', name: 'Enciclopédia Viva', description: 'Desbloqueie todas as fichas de animais.' }
  ];

  global.EQ = global.EQ || {};
  global.EQ.DATA = {
    categories: categories,
    groups: groups,
    habitats: habitats,
    statusLabels: statusLabels,
    regions: regions,
    missions: missions,
    animals: animals,
    achievements: achievements,
    finalReward: 'ararinha-azul',
    region: function (id) { return regions.filter(function (r) { return r.id === id; })[0]; },
    mission: function (id) { return missions.filter(function (m) { return m.id === id; })[0]; },
    animal: function (id) { return animals.filter(function (x) { return x.id === id; })[0]; },
    missionsOf: function (regionId) { return missions.filter(function (m) { return m.region === regionId; }); }
  };
})(window);
