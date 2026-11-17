/* ==========================================================================
   BLACKOUT 3X3 — motor do site
   Lê os dados de data.js (ou do rascunho salvo pelo painel admin neste navegador)
   e monta cada página. Não depende de nenhuma biblioteca externa.
   ========================================================================== */
(function () {
  "use strict";
  var KEY = "blackout3x3:draft";

  /* ---------- dados ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(def, src) {
    if (Array.isArray(def)) return Array.isArray(src) ? src : def;
    if (def && typeof def === "object") {
      var out = {};
      Object.keys(def).forEach(function (k) { out[k] = merge(def[k], src && src[k]); });
      if (src && typeof src === "object") Object.keys(src).forEach(function (k) { if (!(k in out)) out[k] = src[k]; });
      return out;
    }
    return src === undefined || src === null ? def : src;
  }
  var isDraft = false, D = clone(window.BLACKOUT_DEFAULT);
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) { D = merge(window.BLACKOUT_DEFAULT, JSON.parse(raw)); isDraft = true; }
  } catch (e) {}
  window.BLACKOUT = D;

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function has(v) { return v !== undefined && v !== null && String(v).trim() !== ""; }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function slugify(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function safeUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (/^(https?:|mailto:|tel:|\.{0,2}\/|assets\/|data:image\/)/i.test(u)) return u;
    if (/^[\w.-]+\.[a-z]{2,}/i.test(u)) return "https://" + u;
    return "";
  }
  function pending(msg) { return '<div class="pending">' + esc(msg) + "</div>"; }
  function ig() {
    var v = String(D.team.instagram || "").trim();
    if (!v) return "";
    if (/^https?:/i.test(v)) return v;
    return "https://instagram.com/" + v.replace(/^@/, "").replace(/^instagram\.com\//i, "");
  }
  function igHandle() {
    var v = String(D.team.instagram || "").trim();
    if (!v) return "";
    return "@" + v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, "");
  }
  function waDigits() { return String(D.team.whatsapp || "").replace(/\D/g, ""); }

  var ICON_TROPHY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h10v6a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 15v4M8 20h8"/></svg>';
  var SILHOUETTE = '<svg class="sil" viewBox="0 0 200 260" fill="currentColor" aria-hidden="true"><circle cx="100" cy="62" r="40"/><path d="M12 260c0-62 28-106 88-106s88 44 88 106Z"/></svg>';

  /* ---------- jogos ---------- */
  function isFinished(m) { return has(m.scoreUs) && has(m.scoreThem); }
  function dateOf(m) { return has(m.date) ? new Date(m.date + "T12:00:00") : null; }
  function sortAsc(a, b) {
    var da = dateOf(a), db = dateOf(b);
    if (!da && !db) return 0; if (!da) return 1; if (!db) return -1; return da - db;
  }
  function upcoming() { return D.games.matches.filter(function (m) { return !isFinished(m); }).sort(sortAsc); }
  function finished() { return D.games.matches.filter(isFinished).sort(function (a, b) { return sortAsc(b, a); }); }
  function fmtLong(m) {
    var d = dateOf(m); if (!d) return "Data a definir";
    var s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1) + (has(m.time) ? " · " + m.time : "");
  }
  function matchCard(m) {
    var d = dateOf(m), fin = isFinished(m);
    var dateBox = d
      ? '<div class="date"><b>' + pad(d.getDate()) + "</b><span>" + d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") + "</span></div>"
      : '<div class="date tbd"><b>A<br>def.</b></div>';
    var res;
    if (fin) {
      var w = Number(m.scoreUs) > Number(m.scoreThem);
      res = '<div class="res">' + esc(m.scoreUs) + " <em style=\"font-size:.5em;color:var(--gray);font-style:normal\">x</em> " + esc(m.scoreThem) + '<small class="' + (w ? "w" : "l") + '">' + (w ? "V" : "D") + "</small></div>";
    } else res = '<div class="res soon">Em breve</div>';
    var meta = [];
    if (has(m.time) && d) meta.push(esc(m.time));
    meta.push(has(m.venue) ? esc(m.venue) : "Local a definir");
    return '<article class="match">' + dateBox +
      '<div class="info"><div class="comp">' + esc(has(m.competition) ? m.competition : "Competição") + '</div>' +
      '<div class="teams">' + esc(D.team.name) + "<em>vs</em>" + (has(m.opponent) ? esc(m.opponent) : '<span class="muted">Adversário a definir</span>') + "</div>" +
      '<div class="meta">' + meta.join(" · ") + "</div></div>" + res + "</article>";
  }

  /* ---------- atletas ---------- */
  function players() {
    return D.players.map(function (p, i) {
      var q = clone(p);
      q._i = i;
      q.slug = has(p.slug) ? slugify(p.slug) : (slugify(p.name || p.fullName) || "atleta-" + pad(i + 1));
      q._label = has(p.name) ? p.name : (has(p.fullName) ? p.fullName : "Atleta " + pad(i + 1));
      q._empty = !has(p.name) && !has(p.fullName);
      return q;
    });
  }
  function athleteCard(p) {
    var parts = has(p.name) ? String(p.name).trim().split(/\s+/) : [];
    var first = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
    var last = parts.length > 1 ? parts[parts.length - 1] : (parts[0] || "");
    var nameHtml = p._empty ? esc(p._label) : (first ? "<span>" + esc(first) + "</span>" + esc(last) : esc(last));
    return '<a class="athlete' + (p._empty ? " empty" : "") + '" href="jogador.html?p=' + encodeURIComponent(p.slug) + '">' +
      (has(p.number) ? '<div class="no" aria-hidden="true">' + esc(p.number) + "</div>" : "") +
      (has(p.photo) ? '<img class="ph" src="' + esc(safeUrl(p.photo)) + '" alt="' + esc(p._label) + '" loading="lazy">' : SILHOUETTE) +
      '<div class="cap">' + (has(p.position) ? "<small>" + esc(p.position) + "</small>" : "") + "<h3>" + nameHtml + "</h3></div></a>";
  }

  /* ---------- layout (cabeçalho e rodapé) ---------- */
  var NAV = [
    ["index.html", "Início", "home"],
    ["historia.html", "Nossa História", "history"],
    ["jogos.html", "Jogos e Competições", "games"],
    ["elenco.html", "Elenco", "roster"],
    ["patrocinadores.html", "Patrocinadores", "sponsors"],
    ["uniformes.html", "Uniformes", "kits"],
    ["contato.html", "Contato", "contact"]
  ];
  function layout(page) {
    var current = page === "player" ? "roster" : page;
    var links = NAV.map(function (n) {
      return '<li><a href="' + n[0] + '"' + (n[2] === current ? ' aria-current="page"' : "") + ">" + n[1] + "</a></li>";
    }).join("");
    var logo = esc(D.team.logo);
    var head = (isDraft ? '<div class="draft-bar">Pré-visualização do rascunho do painel admin (visível só neste navegador). <a href="#" id="discard">Descartar rascunho</a></div>' : "") +
      '<header class="site-header"><div class="wrap nav"><a class="brand" href="index.html" aria-label="' + esc(D.team.name) + ' — início"><img src="' + logo + '" alt=""><span>' + esc(D.team.name) + '</span></a>' +
      '<button class="nav-toggle" aria-label="Abrir menu" aria-expanded="false"><i></i></button><nav aria-label="Principal"><ul>' + links + "</ul></nav></div></header>";
    $("#site-header").innerHTML = head;

    var social = [];
    if (ig()) social.push('<li><a href="' + esc(ig()) + '" target="_blank" rel="noopener">Instagram ' + esc(igHandle()) + "</a></li>");
    if (waDigits()) social.push('<li><a href="https://wa.me/' + waDigits() + '" target="_blank" rel="noopener">WhatsApp</a></li>');
    if (has(D.team.email)) social.push('<li><a href="mailto:' + esc(D.team.email) + '">' + esc(D.team.email) + "</a></li>");
    if (!social.length) social.push('<li class="muted">Contatos em breve</li>');
    $("#site-footer").innerHTML = '<footer class="site-footer"><div class="wrap"><div class="foot"><div><img src="' + logo + '" alt="' + esc(D.team.name) + '"><p class="muted" style="max-width:36ch">' + esc(D.team.tagline) + '</p></div>' +
      '<div><h4>Navegação</h4><ul>' + NAV.map(function (n) { return '<li><a href="' + n[0] + '">' + n[1] + "</a></li>"; }).join("") + '</ul></div>' +
      '<div><h4>Fale com o time</h4><ul>' + social.join("") + '</ul></div></div>' +
      '<div class="legal"><span>© ' + new Date().getFullYear() + " " + esc(D.team.name) + ". Todos os direitos reservados.</span><a href=\"admin/index.html\">Área administrativa</a></div></div></footer>";

    var t = $(".nav-toggle"), ul = $(".nav ul");
    t.addEventListener("click", function () {
      var open = ul.classList.toggle("open"); t.setAttribute("aria-expanded", open);
    });
    var dis = $("#discard");
    if (dis) dis.addEventListener("click", function (e) { e.preventDefault(); localStorage.removeItem(KEY); location.reload(); });
    document.title = (document.body.dataset.title ? document.body.dataset.title + " | " : "") + D.team.name;
  }

  /* ---------- páginas ---------- */
  var P = {};

  P.home = function () {
    var up = upcoming(), next = up[0];
    var nextBar = next
      ? '<div class="hero-next"><div class="wrap"><span class="tag">Próximo jogo</span><span class="vs">' + esc(D.team.name) + " x " + (has(next.opponent) ? esc(next.opponent) : "Adversário a definir") + '</span><span class="when">' + esc(fmtLong(next)) + (has(next.venue) ? " · " + esc(next.venue) : "") + '</span><a class="btn ghost" href="jogos.html" style="font-size:1rem;padding:.6em 1.2em">Ver calendário</a></div></div>'
      : '<div class="hero-next"><div class="wrap"><span class="tag">Calendário</span><span class="vs">Próximos jogos em breve</span></div></div>';
    var court = '<svg class="hero-court" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#8b8e94" stroke-width="2" opacity=".35" aria-hidden="true">' +
      '<rect x="150" y="-10" width="900" height="720" opacity=".5"/><path d="M450 -10V300H750V-10"/><circle cx="600" cy="300" r="150" stroke-dasharray="10 12"/>' +
      '<path d="M300 -10V150C300 440 900 440 900 150V-10" /><circle cx="600" cy="20" r="26" stroke="#d4121f" stroke-width="4"/></svg>';
    var heroPhoto = has(D.team.heroImage) ? '<div class="hero-photo" style="background-image:url(\'' + esc(safeUrl(D.team.heroImage)) + '\')"></div>' : "";

    var ps = players().slice(0, 4);
    var sp = D.sponsors.filter(function (s) { return has(s.name); });
    var spHtml;
    if (sp.length) {
      spHtml = '<div class="strip">' + sp.map(function (s) {
        var inner = has(s.logo) ? '<img src="' + esc(safeUrl(s.logo)) + '" alt="' + esc(s.name) + '">' : esc(s.name);
        var u = safeUrl(s.link);
        return u ? '<a class="cell" href="' + esc(u) + '" target="_blank" rel="noopener">' + inner + "</a>" : '<div class="cell">' + inner + "</div>";
      }).join("") + "</div>";
    } else spHtml = '<div class="strip">' + [1, 2, 3, 4, 5].map(function () { return '<div class="cell">Seu logo aqui</div>'; }).join("") + "</div>";

    return '<section class="hero" id="hero"><div class="hero-bg"></div>' + heroPhoto + court + '<div class="hero-slash"></div><div class="hero-slash thin"></div><div class="hero-light"></div>' +
      '<div class="wrap hero-inner"><img class="hero-logo" src="' + esc(D.team.logo) + '" alt="' + esc(D.team.name) + '"><div class="hero-name">Time oficial de basquete 3x3</div>' +
      "<h1>" + esc(D.team.tagline) + '</h1><div class="btn-row"><a class="btn" href="jogos.html">Jogos e competições</a><a class="btn ghost" href="elenco.html">Conheça o elenco</a></div></div>' + nextBar + "</section>" +

      '<section class="section"><div class="wrap split"><div><h2 class="title">Quem somos</h2><p class="lead">' + esc(D.team.intro) + '</p><div class="btn-row" style="margin-top:28px"><a class="btn" href="historia.html">Nossa história</a><a class="btn ghost" href="uniformes.html">Uniformes</a></div></div>' +
      '<div class="rules" aria-label="Como funciona o 3x3"><div class="rule"><b>3 x 3</b><span>Três jogadores de cada lado em quadra, mais um reserva.</span></div><div class="rule"><b>10 min</b><span>Ou vence quem chegar primeiro a 21 pontos.</span></div><div class="rule"><b>12 s</b><span>Para finalizar cada posse de bola.</span></div><div class="rule"><b>1 cesta</b><span>Meia quadra, uma tabela. Dentro do arco vale 1, fora vale 2.</span></div></div></div></section>' +

      '<section class="section alt"><div class="wrap"><div class="section-head"><h2 class="title" style="margin:0">Próximos jogos</h2><a class="btn ghost" href="jogos.html">Calendário completo</a></div>' +
      (up.length ? up.slice(0, 3).map(matchCard).join("") : pending("Os próximos jogos serão divulgados aqui.")) + "</div></section>" +

      '<section class="section"><div class="wrap"><div class="section-head"><h2 class="title" style="margin:0">Os atletas</h2><a class="btn ghost" href="elenco.html">Elenco completo</a></div><div class="roster">' + ps.map(athleteCard).join("") + "</div></div></section>" +

      '<section class="section alt"><div class="wrap"><div class="section-head"><h2 class="title" style="margin:0">Patrocinadores</h2><a class="btn ghost" href="patrocinadores.html">Ver todos</a></div>' + spHtml + "</div></section>" +

      '<section class="cta-band"><div class="wrap"><h2>Quer jogar ou apoiar o time?</h2><div class="btn-row"><a class="btn" href="contato.html#jogar">Quero jogar</a><a class="btn ghost" href="contato.html#patrocinar">Quero patrocinar</a></div></div></section>';
  };

  P.history = function () {
    var H = D.history, ach = H.achievements, tl = H.timeline;
    var founders = H.founders.filter(function (f) { return has(f.name) || has(f.bio) || has(f.role); });
    var values = H.values.filter(function (v) { return has(v.title) || has(v.text); });
    var block = function (title, body) { return '<section class="section"><div class="wrap"><h2 class="title">' + title + "</h2>" + body + "</div></section>"; };
    return '<div class="page-hero"><div class="wrap"><h1>Nossa história</h1><p class="lead">' + (has(H.intro) ? esc(H.intro) : "A trajetória do " + esc(D.team.name) + ", do primeiro treino à quadra.") + "</p></div></div>" +
      block("Como tudo começou", has(H.origin) ? '<p class="prose lead" style="white-space:pre-line">' + esc(H.origin) + "</p>" : pending("Espaço reservado: conte como o time surgiu. Preencha no painel admin, em História.")) +
      '<section class="section alt"><div class="wrap"><h2 class="title">Fundadores</h2>' + (founders.length
        ? '<div class="cards">' + founders.map(function (f) {
            return '<div class="card">' + (has(f.photo) ? '<img class="avatar" src="' + esc(safeUrl(f.photo)) + '" alt="' + esc(f.name) + '" loading="lazy">' : "") + "<h3>" + esc(f.name) + '</h3><div class="role">' + esc(f.role) + "</div><p>" + esc(f.bio) + "</p></div>";
          }).join("") + "</div>"
        : pending("Espaço reservado: apresente quem fundou o time, com foto e uma breve história.")) + "</div></section>" +
      block("Objetivos e valores", (has(H.mission) ? '<p class="lead" style="margin-bottom:28px">' + esc(H.mission) + "</p>" : "") + (values.length
        ? '<div class="cards">' + values.map(function (v) { return '<div class="card"><h3>' + esc(v.title) + "</h3><p>" + esc(v.text) + "</p></div>"; }).join("") + "</div>"
        : pending("Espaço reservado: missão, objetivos e valores do time."))) +
      '<section class="section alt"><div class="wrap"><h2 class="title">Evolução da equipe</h2>' + (tl.length
        ? '<div class="tl">' + tl.map(function (t) { return '<div class="item"><div class="yr">' + esc(t.year) + "</div><h3>" + esc(t.title) + "</h3><p>" + esc(t.text) + "</p></div>"; }).join("") + "</div>"
        : pending("Espaço reservado: a linha do tempo do time (ano, marco e uma breve descrição).")) + "</div></section>" +
      block("Conquistas e momentos importantes", ach.length
        ? '<div class="cards">' + ach.map(function (a) { return '<div class="card trophy">' + ICON_TROPHY + "<div>" + (has(a.year) ? '<div class="role">' + esc(a.year) + "</div>" : "") + "<h3>" + esc(a.title) + "</h3><p>" + esc(a.text) + "</p></div></div>"; }).join("") + "</div>"
        : pending("Espaço reservado: títulos, vitórias marcantes e momentos que definiram o time."));
  };

  P.games = function () {
    var comps = D.games.competitions.filter(has);
    var all = D.games.matches;
    var html = '<div class="page-hero"><div class="wrap"><h1>Jogos e competições</h1><p class="lead">Calendário, resultados e classificação do ' + esc(D.team.name) + ".</p></div></div>" +
      '<section class="section"><div class="wrap"><div id="filters"></div><div id="perf"></div><h2 class="title">Próximos jogos</h2><div id="up"></div><h2 class="title" style="margin-top:60px">Resultados</h2><div id="done"></div>' +
      '<h2 class="title" style="margin-top:60px">Classificação</h2><div id="stand"></div></div></section>';
    setTimeout(function () {
      var sel = "";
      function draw() {
        var f = function (m) { return !sel || m.competition === sel; };
        $("#filters").innerHTML = comps.length > 1 ? '<div class="chips" role="group" aria-label="Filtrar por competição"><button class="chip" aria-pressed="' + (!sel) + '" data-c="">Todas</button>' + comps.map(function (c) { return '<button class="chip" aria-pressed="' + (sel === c) + '" data-c="' + esc(c) + '">' + esc(c) + "</button>"; }).join("") + "</div>" : "";
        var fin = finished().filter(f), v = fin.filter(function (m) { return Number(m.scoreUs) > Number(m.scoreThem); }).length;
        var pf = fin.reduce(function (a, m) { return a + Number(m.scoreUs); }, 0), pa = fin.reduce(function (a, m) { return a + Number(m.scoreThem); }, 0);
        var dash = "—";
        $("#perf").innerHTML = '<div class="stats"><div class="stat"><b>' + (fin.length || dash) + "</b><span>Jogos</span></div><div class=\"stat hot\"><b>" + (fin.length ? v : dash) + "</b><span>Vitórias</span></div><div class=\"stat\"><b>" + (fin.length ? fin.length - v : dash) + "</b><span>Derrotas</span></div><div class=\"stat\"><b>" + (fin.length ? Math.round(v / fin.length * 100) + "%" : dash) + "</b><span>Aproveitamento</span></div><div class=\"stat\"><b>" + (fin.length ? pf : dash) + "</b><span>Pontos pró</span></div><div class=\"stat\"><b>" + (fin.length ? pa : dash) + "</b><span>Pontos contra</span></div></div>";
        var up = upcoming().filter(f);
        $("#up").innerHTML = up.length ? groupByMonth(up) : pending("Nenhum jogo agendado no momento. Volte em breve.");
        $("#done").innerHTML = fin.length ? groupByMonth(fin) : pending("Os resultados aparecerão aqui depois dos primeiros jogos.");
        var st = D.games.standings.filter(function (s) { return !sel || s.competition === sel; });
        $("#stand").innerHTML = st.length ? st.map(function (s) {
          var rows = (s.rows || []).filter(function (r) { return has(r.team); });
          return '<div class="table-wrap"><table class="table"><caption>' + esc(s.competition) + "</caption><thead><tr><th>#</th><th>Equipe</th><th>J</th><th>V</th><th>D</th><th>Pts</th></tr></thead><tbody>" +
            rows.map(function (r, i) { var us = /blackout/i.test(r.team); return '<tr class="' + (us ? "us" : "") + '"><td>' + (i + 1) + "</td><td>" + esc(r.team) + "</td><td>" + esc(r.j) + "</td><td>" + esc(r.v) + "</td><td>" + esc(r.d) + "</td><td>" + esc(r.pts) + "</td></tr>"; }).join("") + "</tbody></table></div>";
        }).join("") : pending("A tabela de classificação será publicada quando a competição começar.");
        $$(".chip").forEach(function (b) { b.onclick = function () { sel = b.dataset.c; draw(); }; });
      }
      function groupByMonth(list) {
        var out = "", last = null;
        list.forEach(function (m) {
          var d = dateOf(m), k = d ? d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "Data a definir";
          if (k !== last) { out += '<div class="month">' + esc(k) + "</div>"; last = k; }
          out += matchCard(m);
        });
        return out;
      }
      draw();
    }, 0);
    return html;
  };

  P.roster = function () {
    return '<div class="page-hero"><div class="wrap"><h1>Elenco</h1><p class="lead">Os atletas que vestem a camisa do ' + esc(D.team.name) + '. Clique em um jogador para ver a trajetória completa.</p></div></div><section class="section"><div class="wrap"><div class="roster">' + players().map(athleteCard).join("") + "</div></div></section>";
  };

  P.player = function () {
    var list = players(), slug = new URLSearchParams(location.search).get("p");
    var idx = list.findIndex(function (p) { return p.slug === slug; });
    if (idx < 0) return '<section class="section"><div class="wrap"><h2 class="title">Atleta não encontrado</h2><p class="lead">Esse perfil não existe ou foi removido.</p><p style="margin-top:24px"><a class="btn" href="elenco.html">Voltar ao elenco</a></p></div></section>';
    var p = list[idx], prev = list[(idx + list.length - 1) % list.length], next = list[(idx + 1) % list.length];
    document.title = p._label + " | " + D.team.name;
    var tbd = function (v, suffix) { return has(v) ? "<b>" + esc(v) + (suffix || "") + "</b>" : '<b class="tbd">A informar</b>'; };
    var parts = has(p.name) ? String(p.name).trim().split(/\s+/) : [];
    var h1 = p._empty ? esc(p._label) : (parts.length > 1 ? "<span>" + esc(parts.slice(0, -1).join(" ")) + "</span>" + esc(parts[parts.length - 1]) : esc(parts[0] || p._label));
    var teams = (p.teams || []).filter(function (t) { return has(t.team); });
    var comps = (p.competitions || []).filter(function (t) { return has(t.name); });
    var ach = (p.achievements || []).filter(function (t) { return has(t.title); });
    var line = function (k, t, sub) { return '<div class="list-line"><div class="k">' + esc(k) + "</div><div><b>" + esc(t) + "</b>" + (has(sub) ? "<p>" + esc(sub) + "</p>" : "") + "</div></div>"; };
    return '<section class="profile-hero"><div class="wrap profile-grid"><div class="profile-text"><a class="crumb" href="elenco.html">‹ Elenco</a>' + (has(p.position) ? '<div class="pos">' + esc(p.position) + "</div>" : "") + "<h1>" + h1 + "</h1>" + (has(p.fullName) ? '<p class="lead">' + esc(p.fullName) + "</p>" : "") + "</div>" +
      '<div class="profile-photo">' + (has(p.number) ? '<div class="bignum" aria-hidden="true">' + esc(p.number) + "</div>" : "") + (has(p.photo) ? '<img src="' + esc(safeUrl(p.photo)) + '" alt="' + esc(p._label) + '">' : SILHOUETTE) + "</div></div></section>" +
      '<div class="bio-bar"><div><span>Camisa</span>' + tbd(p.number ? "#" + p.number : "") + "</div><div><span>Posição</span>" + tbd(p.position) + "</div><div><span>Idade</span>" + tbd(p.age, " anos") + "</div><div><span>Altura</span>" + tbd(p.height) + "</div></div>" +
      '<section class="section"><div class="wrap cols"><div><h2 class="title">Trajetória</h2>' + (has(p.bio) ? '<p class="prose">' + esc(p.bio) + "</p>" : pending("Espaço reservado: a história e a trajetória deste atleta no basquete.")) +
      '<h2 class="title" style="margin-top:56px">Conquistas</h2>' + (ach.length ? ach.map(function (a) { return line(a.year || "", a.title, a.type); }).join("") : pending("Espaço reservado: conquistas individuais e coletivas.")) + "</div>" +
      '<div><h2 class="title">Equipes</h2>' + (teams.length ? teams.map(function (t) { return line(t.period || "", t.team, t.notes); }).join("") : pending("Espaço reservado: equipes pelas quais o atleta passou.")) +
      '<h2 class="title" style="margin-top:56px">Competições</h2>' + (comps.length ? comps.map(function (t) { return line(t.year || "", t.name, t.notes); }).join("") : pending("Espaço reservado: competições disputadas.")) + "</div></div>" +
      '<div class="wrap"><div class="pager"><a href="jogador.html?p=' + encodeURIComponent(prev.slug) + '">‹ ' + esc(prev._label) + '</a><a href="jogador.html?p=' + encodeURIComponent(next.slug) + '">' + esc(next._label) + " ›</a></div></div></section>";
  };

  P.sponsors = function () {
    var tiers = [["master", "Patrocinador master"], ["oficial", "Patrocinadores oficiais"], ["apoio", "Apoiadores e parceiros"]];
    var out = '<div class="page-hero"><div class="wrap"><h1>Patrocinadores</h1><p class="lead">Quem acredita no ' + esc(D.team.name) + " e ajuda o time a chegar mais longe.</p></div></div><section class=\"section\"><div class=\"wrap\">";
    tiers.forEach(function (t) {
      var list = D.sponsors.filter(function (s) { return s.tier === t[0]; });
      if (!list.length) return;
      out += '<div class="tier ' + t[0] + '"><h3>' + t[1] + '</h3><div class="sp-grid">' + list.map(function (s) {
        if (!has(s.name)) return '<div class="sp slot"><div class="logo">Seu logo aqui</div><div class="body"><b>Espaço disponível</b><p>Fale com o time e apareça aqui.</p></div></div>';
        var u = safeUrl(s.link), tag = u ? "a" : "div";
        return "<" + tag + ' class="sp"' + (u ? ' href="' + esc(u) + '" target="_blank" rel="noopener"' : "") + '><div class="logo">' + (has(s.logo) ? '<img src="' + esc(safeUrl(s.logo)) + '" alt="' + esc(s.name) + '" loading="lazy">' : '<b style="font-family:var(--display);font-size:1.8rem;text-transform:uppercase">' + esc(s.name) + "</b>") + '</div><div class="body"><b>' + esc(s.name) + "</b>" + (has(s.description) ? "<p>" + esc(s.description) + "</p>" : "") + (u ? '<span class="go">Visitar página</span>' : "") + "</div></" + tag + ">";
      }).join("") + "</div></div>";
    });
    return out + '</div></section><section class="cta-band"><div class="wrap"><h2>Sua marca na quadra</h2><div class="btn-row"><a class="btn" href="contato.html#patrocinar">Quero patrocinar</a></div></div></section>';
  };

  function jersey(kind, base, accent, text, num) {
    var f = base || "#0a0a0a", a = accent || "#d4121f";
    if (kind === "shorts") {
      return '<svg viewBox="0 0 200 220" aria-hidden="true"><path d="M30 20H170L182 200H112L100 110L88 200H18Z" fill="' + f + '" stroke="' + a + '" stroke-width="3"/><path d="M30 20H170V38H30Z" fill="' + a + '"/><path d="M24 160L18 200H88L90 160Z M176 160L182 200H112L110 160Z" fill="' + a + '" opacity=".9"/></svg>';
    }
    var body = '<path d="M62 14C78 36 122 36 138 14L170 28L186 74L156 84V206H44V84L14 74L30 28Z" fill="' + f + '" stroke="' + a + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M62 14C78 36 122 36 138 14" fill="none" stroke="' + a + '" stroke-width="8"/><path d="M44 96L44 206M156 96L156 206" stroke="' + a + '" stroke-width="6"/>';
    var label = kind === "front"
      ? '<text x="100" y="104" text-anchor="middle" font-family="Impact,Arial Narrow,sans-serif" font-size="17" fill="#fff" letter-spacing="0">BLACKOUT</text><text x="100" y="152" text-anchor="middle" font-family="Impact,Arial Narrow,sans-serif" font-size="46" fill="' + a + '">3X3</text>'
      : '<text x="100" y="92" text-anchor="middle" font-family="Impact,Arial Narrow,sans-serif" font-size="15" fill="#fff" letter-spacing="2">NOME</text><text x="100" y="170" text-anchor="middle" font-family="Impact,Arial Narrow,sans-serif" font-size="84" fill="' + a + '">00</text>';
    return '<svg viewBox="0 0 200 220" aria-hidden="true">' + body + label + "</svg>";
  }

  P.kits = function () {
    var out = '<div class="page-hero"><div class="wrap"><h1>Uniformes oficiais</h1><p class="lead">A identidade do ' + esc(D.team.name) + " vestida em quadra.</p></div></div><section class=\"section\"><div class=\"wrap\">";
    D.kits.forEach(function (k) {
      var real = has(k.base);
      var shot = function (img, kind, cap, cls) {
        var inner = has(img) ? '<img src="' + esc(safeUrl(img)) + '" alt="' + esc(k.name + " — " + cap) + '" loading="lazy">' : (real ? jersey(kind, k.base, k.accent) : '<span class="muted" style="font-family:var(--display);font-size:1.3rem;letter-spacing:.1em;text-transform:uppercase;text-align:center">Foto a incluir</span>');
        return '<figure class="shot ' + (cls || "") + '">' + inner + "<figcaption>" + cap + "</figcaption></figure>";
      };
      var needIll = real && !(has(k.front) && has(k.back) && has(k.shorts));
      out += '<article class="kit"><div class="kit-info"><h2 class="title">' + esc(k.name) + "</h2>" + (has(k.description) ? '<p class="lead">' + esc(k.description) + "</p>" : "") +
        ((k.details || []).filter(has).length ? "<ul>" + k.details.filter(has).map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>" : (has(k.description) ? "" : pending("Espaço reservado: detalhes e fotos deste uniforme."))) +
        (real ? '<div class="swatches" aria-label="Cores"><i style="background:' + esc(k.base) + '"></i><i style="background:' + esc(k.accent || "#d4121f") + '"></i></div>' : "") +
        (needIll ? '<p class="note">Ilustração de referência. Adicione as fotos reais do uniforme no painel admin.</p>' : "") +
        '</div><div class="gallery">' + shot(k.front, "front", "Camisa — frente") + shot(k.back, "back", "Camisa — costas") + shot(k.shorts, "shorts", "Shorts — frente e costas", "wide") + "</div>" +
        ((k.extra || []).filter(function (x) { return has(x.src); }).length ? '<div class="detail-row"><h3>Detalhes</h3><div class="detail-grid">' + k.extra.filter(function (x) { return has(x.src); }).map(function (x) { return '<figure class="shot ' + (/apresenta/i.test(x.src) ? "wide" : "") + '"><img src="' + esc(safeUrl(x.src)) + '" alt="' + esc(k.name + " — " + x.caption) + '" loading="lazy"><figcaption>' + esc(x.caption) + "</figcaption></figure>"; }).join("") + "</div></div>" : "") + "</article>";
    });
    return out + "</div></section>";
  };

  P.contact = function () {
    var wa = waDigits(), em = D.team.email, i = ig();
    var card = function (label, val, href) {
      var t = has(val) ? "<b>" + esc(val) + "</b>" : '<b class="tbd">A informar</b>';
      return href ? '<a class="contact-card" href="' + esc(href) + '" target="_blank" rel="noopener"><span>' + label + "</span>" + t + "</a>" : '<div class="contact-card"><span>' + label + "</span>" + t + "</div>";
    };
    var waShow = wa ? D.team.whatsapp : "";
    var f = function (id, label, type, full, req) { return '<div class="field' + (full ? " full" : "") + '"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + id + '" type="' + (type || "text") + '"' + (req ? " required" : "") + "></div>"; };
    var play = '<form class="form" id="f-jogar" data-kind="Quero jogar no time" role="tabpanel">' + f("j-nome", "Nome completo", "text", false, true) + f("j-idade", "Idade", "number") + f("j-pos", "Posição em quadra") + f("j-alt", "Altura") + f("j-cidade", "Cidade") + f("j-tel", "WhatsApp", "tel", false, true) +
      '<div class="field full"><label for="j-exp">Experiência no basquete</label><textarea id="j-exp" name="j-exp" placeholder="Equipes, competições, há quanto tempo joga..."></textarea></div><div class="form-msg" hidden></div><div class="field full"><button class="btn" type="submit">Enviar candidatura</button></div></form>';
    var sponsor = '<form class="form" id="f-patrocinar" data-kind="Quero patrocinar o time" role="tabpanel" hidden>' + f("p-emp", "Empresa", "text", false, true) + f("p-nome", "Seu nome", "text", false, true) + f("p-tel", "Telefone / WhatsApp", "tel") + f("p-mail", "E-mail", "email") + f("p-site", "Site ou Instagram da empresa", "text", true) +
      '<div class="field full"><label for="p-msg">Como você quer apoiar o time?</label><textarea id="p-msg" name="p-msg"></textarea></div><div class="form-msg" hidden></div><div class="field full"><button class="btn" type="submit">Enviar proposta</button></div></form>';
    setTimeout(wire, 0);
    return '<div class="page-hero"><div class="wrap"><h1>Contato</h1><p class="lead">Fale com o ' + esc(D.team.name) + ": entre para o time ou ajude o time a crescer.</p></div></div><section class=\"section\"><div class=\"wrap\"><div class=\"contact-grid\">" +
      card("Instagram", igHandle(), i) + card("WhatsApp", waShow, wa ? "https://wa.me/" + wa : "") + card("E-mail", em, has(em) ? "mailto:" + em : "") + "</div>" +
      '<h2 class="title">Fale com a gente</h2><div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="true" data-t="jogar">Quero jogar</button><button class="tab" role="tab" aria-selected="false" data-t="patrocinar">Quero patrocinar</button></div>' + play + sponsor + "</div></section>";
  };

  function wire() {
    function show(t) {
      $$(".tab").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.t === t); });
      $("#f-jogar").hidden = t !== "jogar"; $("#f-patrocinar").hidden = t !== "patrocinar";
    }
    $$(".tab").forEach(function (b) { b.onclick = function () { show(b.dataset.t); history.replaceState(null, "", "#" + b.dataset.t); }; });
    if (location.hash === "#patrocinar") show("patrocinar");
    $$(".form").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var msg = $(".form-msg", form), lines = ["*" + form.dataset.kind + "* — " + D.team.name, ""];
        $$("input,textarea", form).forEach(function (el) {
          if (has(el.value)) lines.push(form.querySelector('label[for="' + el.id + '"]').textContent + ": " + el.value.trim());
        });
        var text = lines.join("\n"), wa = waDigits(), em = D.team.email, ep = D.team.formEndpoint;
        function say(t, ok) { msg.hidden = false; msg.className = "form-msg" + (ok ? " ok" : ""); msg.textContent = t; }
        if (has(ep)) {
          var fd = {}; $$("input,textarea", form).forEach(function (el) { fd[el.name] = el.value; }); fd.tipo = form.dataset.kind;
          fetch(ep, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(fd) })
            .then(function (r) { if (!r.ok) throw 0; say("Mensagem enviada! Entraremos em contato em breve.", true); form.reset(); })
            .catch(function () { say("Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp.", false); });
        } else if (wa) {
          window.open("https://wa.me/" + wa + "?text=" + encodeURIComponent(text), "_blank", "noopener");
          say("Abrimos o WhatsApp com a sua mensagem pronta. É só enviar.", true);
        } else if (has(em)) {
          location.href = "mailto:" + em + "?subject=" + encodeURIComponent(form.dataset.kind) + "&body=" + encodeURIComponent(text);
          say("Abrimos o seu e-mail com a mensagem pronta. É só enviar.", true);
        } else say("O time ainda não configurou um canal de contato. Volte em breve.", false);
      });
    });
  }

  /* ---------- iniciar ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.dataset.page;
    layout(page);
    var root = $("#app");
    root.innerHTML = (P[page] || function () { return ""; })();
    if (page === "home") {
      var hero = $("#hero");
      if (hero && !matchMedia("(prefers-reduced-motion: reduce)").matches && matchMedia("(hover: hover)").matches) {
        hero.addEventListener("pointermove", function (e) {
          var r = hero.getBoundingClientRect();
          hero.style.setProperty("--mx", (e.clientX - r.left) + "px");
          hero.style.setProperty("--my", (e.clientY - r.top) + "px");
        });
      }
    }
  });
})();
