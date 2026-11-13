/* Rumo à Praticagem — lê os JSON em /data e desenha a jornada. Sem dependências. */
(function () {
  'use strict';

  var PROVA = Date.parse('2027-11-08T00:00:00');
  var INICIO = Date.parse('2026-11-16T00:00:00');
  var COLORS = { 'Arrancada': '#5E564A', 'Base': '#2F7D6B', 'Aprofundamento': '#34508F', 'Edital e 2ª passada': '#7A4FA3', 'Reta final': '#7A5718' };
  var CHARS = { 'Arrancada': '始', 'Base': '基', 'Aprofundamento': '深', 'Edital e 2ª passada': '榜', 'Reta final': '决' };
  var FASES = [
    { name: 'Arrancada', gloss: 'COMEÇO', region: 'Baía da Arrancada', period: 'nov/2026', weeks: '1 a 2', from: 1, text: 'Entregar o TCC, montar o Anki, comprar os livros do Núcleo e agendar o Arrais-Amador. O barco sai do cais.', gate: 'TCC entregue em 18/11' },
    { name: 'Base', gloss: 'ALICERCE', region: 'Mar da Base', period: 'dez/2026 a mar/2027', weeks: '3 a 20', from: 3, text: 'Arte Naval, Navegação em Águas Restritas, Legislação e Meteorologia, em português. Vocabulário náutico em inglês todo dia.', gate: 'Arrais na mão · cursinho decidido até 31/01' },
    { name: 'Aprofundamento', gloss: 'PROFUNDO', region: 'Canal do Aprofundamento', period: 'abr a jul/2027', weeks: '21 a 33', from: 21, text: 'Manobrabilidade do Navio, a matéria mais pesada, com Comunicações e inglês falado duas vezes por semana.', gate: 'Mestre-Amador na mão · edital publicado' },
    { name: 'Edital e 2ª passada', gloss: 'EDITAL', region: 'Estreito do Edital', period: 'jul a set/2027', weeks: '34 a 46', from: 34, text: 'Comparar o edital com o plano, fazer a inscrição e passar de novo por todas as matérias, com simulados quinzenais.', gate: 'Simulados em 75% ou mais' },
    { name: 'Reta final', gloss: 'DECISÃO', region: 'Barra da Reta Final', period: 'out a nov/2027', weeks: '47 a 52', from: 47, text: 'Simulados semanais, caderno de erros e revisão. Nenhuma obra nova depois de 15/10. Sono em dia.', gate: 'Prova escrita em novembro de 2027' }
  ];
  var FAROIS = [[1, 'TCC 18/11'], [11, 'Arrais'], [25, 'Mestre-Amador'], [34, 'Edital'], [52, 'Prova']];
  var DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  var CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBF7EE" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var FAROL = '<svg width="22" height="30" viewBox="0 0 22 30" aria-hidden="true"><path d="M7 28 L9 10 H13 L15 28 Z" fill="#17130F"/><rect x="8" y="6" width="6" height="4" fill="#B8321C"/><path d="M11 1 L11 5" stroke="#B8321C" stroke-width="2"/><path d="M2 8 L8 8 M14 8 L20 8" stroke="#B8321C" stroke-width="1.5" stroke-dasharray="2 2"/></svg>';

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* armazenamento local: só conveniência deste navegador */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('rap:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('rap:' + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }
  };

  var state = {
    weeks: [], cur: 1, sel: 1,
    day: (function () { var d = new Date().getDay(); return d === 0 ? 6 : d - 1; })(),
    done: store.get('done', {}), tab: -1,
    secs: 0, running: false, timer: null
  };

  function pt(i) { var t = i / 51; return { x: 60 + 800 * t, y: 290 - 150 * Math.sin(t * Math.PI * 2.6) }; }
  function path(n) {
    var s = '', steps = Math.max(2, Math.round(n * 6));
    for (var k = 0; k <= steps; k++) { var p = pt((k / steps) * (n - 1)); s += (k ? ' L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }
    return s;
  }
  function pct(p) { return { left: (p.x / 10) + '%', top: (p.y / 5.6) + '%' }; }
  function brDate(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0].slice(2); }
  function countUp(el, to, suffix) {
    var t0 = performance.now(), dur = 1300;
    function step(t) { var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e).toLocaleString('pt-BR') + (suffix || ''); if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  function drawStatic() {
    var g = 'M0 560 L0 535';
    for (var gx = 0; gx <= 1000; gx += 7) { var h = 14 + 22 * Math.abs(Math.sin(gx * 12.9898) * Math.cos(gx * 0.37)); g += ' L' + gx + ' ' + (540 - h).toFixed(0) + ' L' + (gx + 3.5) + ' 540'; }
    $('grass').setAttribute('d', g + ' L1000 560 Z');
    $('routeAll').setAttribute('d', path(52));
    var done = $('routeDone'); done.setAttribute('d', path(Math.max(1.4, state.cur)));
    try { var L = done.getTotalLength(); done.style.strokeDasharray = L; done.style.strokeDashoffset = L; done.getBoundingClientRect(); done.style.transition = 'stroke-dashoffset 1.6s ease-out'; done.style.strokeDashoffset = 0; } catch (e) { }
    $('lighthouses').innerHTML = FAROIS.map(function (f) {
      var p = pt(f[0] - 1), up = p.y > 300, top = ((up ? p.y - 84 : p.y + 24) / 5.6) + '%';
      return '<div class="lh" style="left:' + (p.x / 10) + '%;top:' + top + '">' + FAROL + '<span>' + esc(f[1]) + '</span></div>';
    }).join('');
    var sp = pt(state.cur - 1), ship = $('ship'); ship.style.left = (sp.x / 10) + '%'; ship.style.top = ((sp.y - 30) / 5.6) + '%';
  }

  function drawBuoys() {
    $('buoys').innerHTML = state.weeks.map(function (w, i) {
      var p = pct(pt(i)), cls = 'buoy' + (w.status === 'Concluída' ? ' done' : w.status === 'Parcial' ? ' partial' : '') + (w.semana === state.sel ? ' sel' : '');
      return '<button type="button" class="' + cls + '" data-w="' + w.semana + '" style="left:' + p.left + ';top:' + p.top + ';--c:' + (COLORS[w.fase] || '#17130F') + '" aria-label="Semana ' + w.semana + ', ' + brDate(w.inicio) + ', ' + esc(w.principal) + '" aria-pressed="' + (w.semana === state.sel) + '"></button>';
    }).join('');
  }

  function drawWeek() {
    var w = state.weeks[state.sel - 1]; if (!w) return;
    var c = COLORS[w.fase];
    var ph = $('selPhase'); ph.textContent = w.fase; ph.style.color = c;
    $('selChar').textContent = CHARS[w.fase];
    $('selTitle').textContent = 'Semana ' + w.semana;
    $('selSub').textContent = 'a partir de ' + brDate(w.inicio) + ' · meta ' + w.meta_h + ' h' + (w.horas_feitas != null ? ' · feitas ' + w.horas_feitas + ' h' : '');
    $('selP').textContent = w.principal; $('selS').textContent = w.secundaria; $('selT').textContent = w.teste;
    $('selStatus').textContent = w.status || 'A fazer';
    drawBuoys(); drawMissions();
  }

  function plan(w, day) {
    var P = w.principal, S = w.secundaria;
    return [
      [['Bloco A · 1h30', P], ['Bloco B · 1h30', P + ' + 10 questões']],
      [['Bloco A · 1h30', P], ['Bloco B · 45 min', 'Inglês falado'], ['Bloco B · 45 min', S]],
      [['Bloco A · 1h30', P], ['Bloco B · 1h30', 'Questões do que foi visto na semana']],
      [['Bloco A · 1h30', P], ['Bloco B · 45 min', 'Inglês falado'], ['Bloco B · 45 min', S]],
      [['Bloco A · 1h30', 'Legislação: leitura de lei seca'], ['Bloco B · 1h', 'Revisão leve (flashcards)']],
      [['Manhã · 3h', P + ' (depois da corrida)'], ['Tarde · 2h', 'Questões ou prova antiga']],
      [['Bloco A · 2h', 'Revisão da semana'], ['Bloco B · 1h30', 'Quiz semanal + fechar a planilha']]
    ][day].concat([['Qualquer brecha · 15 min', 'Anki']]);
  }

  function drawMissions() {
    var w = state.weeks[state.sel - 1]; if (!w) return;
    $('days').innerHTML = DIAS.map(function (d, i) { return '<button type="button" data-d="' + i + '" aria-pressed="' + (i === state.day) + '">' + d + '</button>'; }).join('');
    var items = plan(w, state.day), n = 0;
    $('missions').innerHTML = items.map(function (m, i) {
      var key = state.sel + '-' + state.day + '-' + i, on = !!state.done[key]; if (on) n++;
      return '<button type="button" class="mission" data-k="' + key + '" aria-pressed="' + on + '"><span class="box">' + CHECK + '</span><span class="txt"><span class="time">' + esc(m[0]) + '</span><span>' + esc(m[1]) + '</span></span></button>';
    }).join('');
    $('missionCount').textContent = n + ' de ' + items.length + ' · +10 milhas cada';
    var total = 0; for (var k in state.done) if (state.done[k]) total++;
    $('miles').textContent = (total * 10).toLocaleString('pt-BR');
  }

  function drawPhases() {
    var curIdx = 0, cw = state.weeks[state.cur - 1];
    FASES.forEach(function (f, i) { if (cw && f.name === cw.fase) curIdx = i; });
    var tab = state.tab < 0 ? curIdx : state.tab;
    $('phaseTabs').innerHTML = FASES.map(function (f, i) {
      return '<button type="button" role="tab" class="tab" data-t="' + i + '" aria-selected="' + (i === tab) + '" style="--c:' + COLORS[f.name] + '"><span aria-hidden="true">' + CHARS[f.name] + '</span>' + esc(f.name) + '</button>';
    }).join('');
    var f = FASES[tab], panel = $('phasePanel');
    $('phChar').textContent = CHARS[f.name]; $('phChar').style.color = COLORS[f.name];
    $('phGloss').textContent = f.gloss;
    $('phMeta').textContent = f.region + ' · ' + f.period + ' · semanas ' + f.weeks;
    $('phName').textContent = f.name; $('phText').textContent = f.text; $('phGate').textContent = f.gate;
    $('phGo').dataset.w = f.from;
    panel.classList.remove('fade-in'); void panel.offsetWidth; panel.classList.add('fade-in');
  }

  function drawTimer() {
    var s = state.secs, h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60;
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    $('timerText').textContent = two(h) + ':' + two(m) + ':' + two(ss);
    $('timerBar').style.width = Math.min(100, s / 54) + '%';
    $('timerToggle').textContent = state.running ? 'Pausar' : 'Iniciar';
  }

  function drawHero() {
    var w = state.weeks[state.cur - 1];
    var feitas = state.weeks.reduce(function (a, x) { return a + (x.horas_feitas || 0); }, 0);
    var plano = state.weeks.reduce(function (a, x) { return a + x.meta_h; }, 0);
    $('weekLabel').textContent = 'SEMANA ' + state.cur + ' DE 52 · ' + w.fase.toUpperCase();
    $('hoursLabel').textContent = feitas.toLocaleString('pt-BR') + ' de ' + plano.toLocaleString('pt-BR') + ' h';
    requestAnimationFrame(function () { $('hoursBar').style.width = Math.max(0.5, feitas / plano * 100) + '%'; });
    $('weekHours').innerHTML = (w.horas_feitas || 0) + ' <span class="small muted" style="font-family:Inter">/ ' + w.meta_h + ' h</span>';
    var quiz = state.weeks.filter(function (x) { return x.quiz_pct != null; }).pop();
    var sim = state.weeks.filter(function (x) { return x.simulado_pct != null; }).pop();
    $('lastQuiz').textContent = quiz ? Math.round(quiz.quiz_pct * 100) + '%' : '—';
    $('lastSim').textContent = sim ? Math.round(sim.simulado_pct * 100) + '%' : '—';
    countUp($('daysLeft'), Math.max(0, Math.ceil((PROVA - Date.now()) / 864e5)));
    return feitas;
  }

  function drawMarcos(m, feitas) {
    $('marcos').innerHTML = m.marcos.map(function (x, i) {
      var last = i === m.marcos.length - 1;
      return '<li class="' + (x.feito ? 'done' : '') + '"' + (last ? ' style="font-weight:600"' : '') + '><span>' + esc(x.nome) + '</span><span class="mono ' + (i === 0 || last ? 'accent' : 'muted') + '">' + esc(x.quando) + '</span></li>';
    }).join('');
    var seals = m.marcos.filter(function (x) { return x.selo; }).map(function (x) { return { s: x.selo, n: x.selo_nome, on: x.feito }; })
      .concat(m.selos_extras.map(function (x) { return { s: x.selo, n: x.nome, on: x.regra === 'horas>=100' ? feitas >= 100 : !!x.feito }; }));
    $('seals').innerHTML = seals.map(function (x) { return '<div class="seal-item' + (x.on ? ' on' : '') + '"><b aria-hidden="true">' + x.s + '</b><span>' + esc(x.n) + (x.on ? '' : ' <span class="muted">· a conquistar</span>') + '</span></div>'; }).join('');
  }

  function drawTsf(t) {
    var last = t.testes[t.testes.length - 1] || {};
    var rows = [
      ['Barra fixa', last.barra_rep, t.indices.barra_rep + ' rep.', last.barra_rep != null ? Math.min(1, last.barra_rep / t.indices.barra_rep) : 0],
      ['Natação 50 m', last.natacao_50m, '< ' + t.indices.natacao_50m, last.natacao_ok ? 1 : 0],
      ['Flutuação', last.flutuacao_min != null ? last.flutuacao_min + ' min' : null, t.indices.flutuacao_min + ' min', last.flutuacao_min != null ? Math.min(1, last.flutuacao_min / t.indices.flutuacao_min) : 0],
      ['Corrida 2.400 m', last.corrida_2400m, t.indices.corrida_2400m, last.corrida_ok ? 1 : 0]
    ];
    $('tsf').innerHTML = rows.map(function (r) {
      return '<div class="t"><div class="row-between"><span>' + r[0] + '</span><span class="muted">' + esc(r[1] == null ? '—' : r[1]) + ' / ' + esc(r[2]) + '</span></div><div class="tb"><div style="width:' + (r[3] * 100) + '%"></div></div></div>';
    }).join('');
  }

  function drawNews(n) {
    var html = n.itens.map(function (x) { return '<a href="' + esc(x.fonte) + '" target="_blank" rel="noopener">' + esc(x.data) + ' · ' + esc(x.titulo) + '</a>'; }).join('');
    $('ticker').innerHTML = html + html.replace(/<a /g, '<a aria-hidden="true" tabindex="-1" ');
  }

  function bind() {
    $('buoys').addEventListener('click', function (e) { var b = e.target.closest('.buoy'); if (b) { state.sel = +b.dataset.w; drawWeek(); } });
    $('prevWeek').onclick = function () { state.sel = Math.max(1, state.sel - 1); drawWeek(); };
    $('nextWeek').onclick = function () { state.sel = Math.min(52, state.sel + 1); drawWeek(); };
    $('days').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { state.day = +b.dataset.d; drawMissions(); } });
    $('missions').addEventListener('click', function (e) {
      var b = e.target.closest('.mission'); if (!b) return;
      state.done[b.dataset.k] = !state.done[b.dataset.k]; store.set('done', state.done); drawMissions();
    });
    $('phaseTabs').addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) { state.tab = +b.dataset.t; drawPhases(); } });
    $('phaseTabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var cur = state.tab < 0 ? 0 : state.tab; state.tab = (cur + (e.key === 'ArrowRight' ? 1 : 4)) % 5; drawPhases();
      var t = $('phaseTabs').querySelector('[data-t="' + state.tab + '"]'); if (t) t.focus();
    });
    $('phGo').onclick = function () { state.sel = +this.dataset.w; drawWeek(); $('mapa').scrollIntoView({ behavior: 'smooth' }); };
    $('timerToggle').onclick = function () {
      state.running = !state.running;
      if (state.running) state.timer = setInterval(function () { state.secs++; drawTimer(); }, 1000);
      else clearInterval(state.timer);
      drawTimer();
    };
    $('timerReset').onclick = function () { state.running = false; clearInterval(state.timer); state.secs = 0; drawTimer(); };
    var links = document.querySelectorAll('.nav a');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) links.forEach(function (a) { a.classList.toggle('nav-on', a.getAttribute('href') === '#' + en.target.id); }); });
      }, { rootMargin: '-40% 0px -55% 0px' });
      ['mapa', 'missao', 'travessias', 'radio'].forEach(function (id) { io.observe($(id)); });
    }
  }

  function load(p) { return fetch(p, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(p); return r.json(); }); }

  Promise.all([load('data/semanas.json'), load('data/marcos.json'), load('data/tsf.json'), load('data/noticias.json')]).then(function (d) {
    state.weeks = d[0].semanas;
    var cur = Math.floor((Date.now() - INICIO) / (7 * 864e5)) + 1;
    state.cur = state.sel = Math.min(52, Math.max(1, cur));
    drawStatic(); drawWeek(); drawPhases(); drawTimer();
    var feitas = drawHero();
    countUp($('miles'), 0);
    drawMarcos(d[1], feitas); drawTsf(d[2]); drawNews(d[3]);
    $('updated').textContent = 'Dados atualizados em ' + brDate(d[0].atualizado_em) + ' · planilha “Controle semanal — PSCPP 2027”';
    bind(); drawMissions();
  }).catch(function (e) {
    document.querySelector('.wrap').insertAdjacentHTML('afterbegin', '<p class="card">Não consegui carregar os dados (' + esc(e.message) + '). Abre o site por um servidor (Cloudflare Pages ou <code>npx serve</code>), não direto do arquivo.</p>');
  });
})();
