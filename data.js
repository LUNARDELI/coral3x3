/* ==========================================================================
   BLACKOUT 3X3 — BASE DE DADOS DO SITE
   Todo o conteúdo editável do site mora neste arquivo.
   Você pode editar aqui direto OU usar o painel em /admin e baixar um novo data.js.
   Campos vazios ("") aparecem no site como "a informar" — nada foi inventado.
   ========================================================================== */
window.BLACKOUT_DEFAULT = {
  team: {
    name: "BLACKOUT 3X3",
    tagline: "Quando as luzes apagam, o jogo começa.",
    intro: "O BLACKOUT 3X3 é um time de basquete 3x3 construído sobre velocidade, intensidade e atitude. Na meia quadra, cada posse decide o jogo — e cada quadra é o nosso palco.",
    logo: "assets/img/logo.png",
    heroImage: "",
    instagram: "",
    whatsapp: "",
    email: "",
    city: "",
    formEndpoint: ""
  },

  history: {
    intro: "",
    origin: "",
    founders: [
      { name: "", role: "", bio: "", photo: "" }
    ],
    mission: "",
    values: [
      { title: "", text: "" }
    ],
    timeline: [],
    achievements: []
  },

  games: {
    competitions: ["Competição a definir"],
    matches: [
      { competition: "Competição a definir", date: "", time: "", venue: "", opponent: "", scoreUs: "", scoreThem: "" },
      { competition: "Competição a definir", date: "", time: "", venue: "", opponent: "", scoreUs: "", scoreThem: "" }
    ],
    standings: []
  },

  players: [
    { slug: "", name: "", fullName: "", number: "", position: "", age: "", height: "", photo: "", bio: "", teams: [], competitions: [], achievements: [] },
    { slug: "", name: "", fullName: "", number: "", position: "", age: "", height: "", photo: "", bio: "", teams: [], competitions: [], achievements: [] },
    { slug: "", name: "", fullName: "", number: "", position: "", age: "", height: "", photo: "", bio: "", teams: [], competitions: [], achievements: [] },
    { slug: "", name: "", fullName: "", number: "", position: "", age: "", height: "", photo: "", bio: "", teams: [], competitions: [], achievements: [] }
  ],

  sponsors: [
    { name: "", tier: "master", logo: "", description: "", link: "" },
    { name: "", tier: "oficial", logo: "", description: "", link: "" },
    { name: "", tier: "oficial", logo: "", description: "", link: "" },
    { name: "", tier: "apoio", logo: "", description: "", link: "" },
    { name: "", tier: "apoio", logo: "", description: "", link: "" },
    { name: "", tier: "apoio", logo: "", description: "", link: "" }
  ],

  kits: [
    {
      name: "Titular",
      description: "Uniforme preto com detalhes em vermelho.",
      base: "#0a0a0a",
      accent: "#d4121f",
      front: "assets/img/uniforme-titular-frente.jpg", back: "assets/img/uniforme-titular-costas.jpg", shorts: "assets/img/uniforme-titular-shorts.jpg",
      details: ["Base preta com detalhes em vermelho", "BLACKOUT 3X3 e número em branco na frente e nas costas", "Garras vermelhas nas laterais", "Skyline da cidade na parte inferior da camisa", "Coroa no colarinho e na cintura do shorts"],
      extra: [
        { src: "assets/img/uniforme-detalhe-colarinho.jpg", caption: "Colarinho" },
        { src: "assets/img/uniforme-detalhe-garra.jpg", caption: "Garras" },
        { src: "assets/img/uniforme-detalhe-listras.jpg", caption: "Listras" },
        { src: "assets/img/uniforme-apresentacao.jpg", caption: "Apresentação completa" }
      ]
    },
    {
      name: "Reserva",
      description: "",
      base: "",
      accent: "",
      front: "", back: "", shorts: "",
      details: [],
      extra: []
    }
  ]
};
