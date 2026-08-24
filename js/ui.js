/* ============================================================
   ui.js — CAPA DE INTERFAZ (solo dibuja)
   Lee el estado a través de APP.store.sel y genera HTML.
   Nunca modifica datos: para eso están las acciones de state.js
   que se disparan desde app.js.
   ============================================================ */

window.APP = window.APP || {};

APP.ui = (function () {

  var C = APP.CONFIG;
  var U = APP.util;
  var S = APP.store;

  var el = {};

  var uiState = {
    view: 'dashboard',
    openWeeks: {},
    gen: null,
    filters: {
      tq: '', tMember: 'all', tWeek: 'all', tPriority: 'all', tStatus: 'all',
      mMember: 'all', mStatus: 'all',
      ideaCat: 'all', ideaDone: 'all'
    }
  };

  /* ---------- HELPERS DE PLANTILLA ---------- */

  function bar(pct, cls) {
    return '<div class="bar ' + (cls || '') + '"><span class="bar-fill" style="width:' + U.clamp(pct, 0, 100) + '%"></span></div>';
  }

  function priChip(p) {
    var pr = C.priorities[p] || C.priorities.media;
    return '<span class="chip chip-' + pr.id + '">' + pr.icon + ' ' + pr.label + '</span>';
  }

  function statusChip(st) {
    var s = C.statuses[st] || C.statuses.pendiente;
    return '<span class="chip ' + (s.done ? 'chip-ok' : 'chip-soft') + '">' + s.icon + ' ' + s.label + '</span>';
  }

  function dueChip(task) {
    if (!task.dueDate) return '';
    var done = S.sel.isDone(task);
    var left = U.daysLeft(task.dueDate);
    var cls = 'chip-soft', txt = '📅 ' + U.shortDate(task.dueDate);
    if (!done && left !== null) {
      if (left < 0) { cls = 'chip-late'; txt = '⏰ VENCIDA ' + U.shortDate(task.dueDate); }
      else if (left <= 2) { cls = 'chip-alta'; txt = '📅 ' + U.shortDate(task.dueDate) + ' (' + left + 'd)'; }
    }
    return '<span class="chip ' + cls + '">' + txt + '</span>';
  }

  function memberOptions(selected, includeAll, allLabel) {
    var out = '';
    if (includeAll) out += '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>' + (allLabel || 'TODAS') + '</option>';
    else out += '<option value=""' + (!selected ? ' selected' : '') + '>❔ SIN ASIGNAR</option>';
    S.state.members.forEach(function (m) {
      out += '<option value="' + U.esc(m.id) + '"' + (m.id === selected ? ' selected' : '') + '>' +
             U.esc(m.emoji + ' ' + m.name) + '</option>';
    });
    return out;
  }

  function weekOptions(selected, includeAll) {
    var out = includeAll ? '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>TODAS</option>' : '';
    S.state.weeks.forEach(function (w, i) {
      out += '<option value="' + U.esc(w.id) + '"' + (w.id === selected ? ' selected' : '') + '>' +
             'S' + U.pad2(i + 1) + ' · ' + U.esc(w.title) + '</option>';
    });
    return out;
  }

  function priorityOptions(selected, includeAll) {
    var out = includeAll ? '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>TODAS</option>' : '';
    C.priorityOrder.forEach(function (p) {
      var pr = C.priorities[p];
      out += '<option value="' + p + '"' + (p === selected ? ' selected' : '') + '>' + pr.icon + ' ' + pr.label + '</option>';
    });
    return out;
  }

  function statusOptions(selected, includeAll) {
    var out = includeAll ? '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>TODOS</option>' : '';
    C.statusOrder.forEach(function (s) {
      var st = C.statuses[s];
      out += '<option value="' + s + '"' + (s === selected ? ' selected' : '') + '>' + st.icon + ' ' + st.label + '</option>';
    });
    return out;
  }

  function categoryOptions(selected) {
    var list = C.categories.slice();
    if (selected && list.indexOf(selected) < 0) list.push(selected);
    return list.map(function (c) {
      return '<option value="' + U.esc(c) + '"' + (c === selected ? ' selected' : '') + '>' + U.esc(c) + '</option>';
    }).join('');
  }

  function ideaCatOptions(selected, includeAll) {
    var out = includeAll ? '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>TODAS</option>' : '';
    C.ideaCategories.forEach(function (c) {
      out += '<option value="' + U.esc(c) + '"' + (c === selected ? ' selected' : '') + '>' + U.esc(c) + '</option>';
    });
    return out;
  }

  /* ---------- FILA DE TAREA (compartida por varias vistas) ---------- */
  function taskRow(t, opts) {
    opts = opts || {};
    var done = S.sel.isDone(t);
    var st = C.statuses[t.status] || C.statuses.pendiente;
    var wNum = S.sel.weekNumber(t.weekId);

    var chips = '';
    if (opts.showWeek) chips += '<span class="chip chip-soft">🗺️ S' + U.pad2(wNum) + '</span>';
    chips += '<span class="chip">' + U.esc(S.sel.memberLabel(t.assignee)) + '</span>';
    chips += priChip(t.priority);
    chips += statusChip(t.status);
    if (t.category) chips += '<span class="chip chip-soft">🏷️ ' + U.esc(t.category) + '</span>';
    chips += dueChip(t);
    chips += '<span class="chip chip-soft">+' + (S.state.settings.xpByPriority[t.priority] || 0) + ' XP</span>';

    return '' +
      '<article class="px-panel task pri-' + t.priority + (done ? ' is-done' : '') + '" data-task="' + t.id + '">' +
        '<button class="task-check" type="button" data-action="toggle-task" data-id="' + t.id + '" ' +
                'title="Marcar como completada" aria-label="Completar tarea">' + (done ? '✓' : st.icon) + '</button>' +
        '<div class="task-main">' +
          '<p class="task-name">' + U.esc(t.name) + '</p>' +
          (t.description ? '<p class="task-desc">' + U.esc(t.description) + '</p>' : '') +
          (t.notes ? '<p class="task-notes">📝 ' + U.esc(t.notes) + '</p>' : '') +
          '<div class="task-chips">' + chips + '</div>' +
        '</div>' +
        '<div class="task-tools">' +
          '<button class="px-btn px-btn-mini" type="button" data-action="edit-task" data-id="' + t.id + '" title="Editar">✎</button>' +
          '<button class="px-btn px-btn-mini" type="button" data-action="dup-task" data-id="' + t.id + '" title="Duplicar">⧉</button>' +
          '<button class="px-btn px-btn-mini px-btn-danger" type="button" data-action="del-task" data-id="' + t.id + '" title="Eliminar">✖</button>' +
        '</div>' +
      '</article>';
  }

  /* ---------- CABECERA / HUD ---------- */
  function renderHeader() {
    var s = S.state.settings;
    var info = S.sel.levelInfo();

    el.hdrName.textContent = s.companyName || '—';
    el.hdrTagline.textContent = s.tagline || '';
    el.footName.textContent = s.companyName || '—';
    document.title = (s.companyName || 'Quest Planner') + ' — Quest Planner';

    el.hudLevel.textContent = info.level;
    el.hudRank.textContent = info.title;
    el.hudXpText.textContent = info.isMax
      ? info.xp + ' XP · MAX'
      : info.xp + ' / ' + info.nextXp + ' XP';
    el.hudXpBar.style.width = info.pct + '%';

    el.btnSound.textContent = s.sound ? '🔊' : '🔇';
  }

  /* ---------- PANTALLA DE INICIO ---------- */
  function renderBoot() {
    var s = S.state.settings;
    var info = S.sel.levelInfo();
    var cw = S.sel.currentWeek();
    var counts = S.sel.counts();
    var hasProgress = counts.tasksDone > 0;

    document.getElementById('boot-name').textContent = s.companyName || '—';
    document.getElementById('boot-level').textContent = U.pad2(info.level);
    document.getElementById('boot-rank').textContent = info.title;
    document.getElementById('boot-tagline').textContent = '"' + (s.quote || s.tagline || '') + '"';
    document.getElementById('boot-mission-num').textContent = cw ? U.pad2(S.sel.weekNumber(cw.id)) : '—';
    document.getElementById('boot-mission-name').textContent = cw ? (cw.emoji + ' ' + cw.title) : 'Sin misiones. Crea la primera.';
    document.getElementById('btn-enter-label').textContent = hasProgress ? 'CONTINUAR PARTIDA' : 'ENTER BUSINESS';
    document.getElementById('boot-printers').textContent = s.printers || '—';
    document.getElementById('boot-crew').textContent = S.state.members.length + ' miembros';
  }

  /* ---------- DASHBOARD ---------- */
  function renderDashboard() {
    var s = S.state.settings;
    var info = S.sel.levelInfo();
    var g = S.sel.globalProgress();
    var c = S.sel.counts();
    var cw = S.sel.currentWeek();
    var cwNum = cw ? S.sel.weekNumber(cw.id) : 0;
    var cwProg = cw ? S.sel.weekProgress(cw.id) : { done: 0, total: 0, pct: 0 };

    var daysIn = 1;
    var d0 = U.parseDate(s.startDate);
    if (d0) {
      var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      daysIn = Math.max(1, Math.floor((hoy - d0) / 86400000) + 1);
    }

    var html = '';

    /* --- HERO --- */
    html += '<div class="px-panel dash-hero">' +
      '<div class="dash-hero-main">' +
        '<p class="dash-eyebrow">◆ PROGRESO DEL EMPRENDIMIENTO ◆</p>' +
        '<h2 class="dash-level-title">EMPRENDIMIENTO LVL. ' + info.level + '</h2>' +
        '<p class="dash-rank">' + U.esc(info.title) + ' · ' + info.xp + ' XP acumulada' +
          (info.isMax ? ' · NIVEL MÁXIMO' : ' · faltan ' + (info.nextXp - info.xp) + ' XP para el nivel ' + (info.level + 1)) + '</p>' +
        '<div class="dash-progress-label"><span>PROGRESO GENERAL</span><span>' + g.pct + '%</span></div>' +
        bar(g.pct, 'bar-lg') +
        '<p class="dash-blocks">' + U.blocks(g.pct, 16) + ' ' + g.pct + '%</p>' +
        '<div class="dash-progress-label" style="margin-top:14px"><span>BARRA DE NIVEL</span><span>' + info.pct + '%</span></div>' +
        bar(info.pct, 'bar-xp') +
      '</div>' +
      '<div class="dash-hero-side">' +
        '<div class="dash-side-row"><span>Semana actual</span><b>' + (cw ? 'S' + U.pad2(cwNum) : '—') + '</b></div>' +
        '<div class="dash-side-row"><span>Día del proyecto</span><b>' + daysIn + '</b></div>' +
        '<div class="dash-side-row"><span>Misiones</span><b>' + c.weeksClear + ' / ' + c.weeks + '</b></div>' +
        '<div class="dash-side-row"><span>Tareas hechas</span><b>' + c.tasksDone + '</b></div>' +
        '<div class="dash-side-row"><span>Tareas pendientes</span><b>' + c.tasksOpen + '</b></div>' +
        '<div class="dash-side-row"><span>Meta de clientes</span><b>' + (s.clientGoal || 0) + '</b></div>' +
        '<div class="dash-side-row"><span>Meta de ingresos</span><b>' + (Number(s.revenueGoal) || 0).toLocaleString('es') + ' ' + U.esc(s.currency || '') + '</b></div>' +
      '</div>' +
    '</div>';

    /* --- STATS --- */
    html += '<div class="stats-grid">' +
      statCard('⚔️', c.tasksOpen, 'TAREAS<br>PENDIENTES', 'is-hot') +
      statCard('✅', c.tasksDone, 'TAREAS<br>COMPLETADAS', 'is-ok') +
      statCard('★', c.weeksClear, 'MISIONES<br>COMPLETADAS', 'is-cool') +
      statCard('⏰', c.tasksLate, 'TAREAS<br>VENCIDAS', c.tasksLate ? 'is-hot' : '') +
      statCard('⚡', info.xp, 'XP<br>ACUMULADA', 'is-ok') +
      statCard('💡', c.ideas, 'IDEAS EN<br>EL BANCO', 'is-cool') +
    '</div>';

    /* --- COLUMNAS --- */
    html += '<div class="dash-cols">';

    /* Misión actual */
    html += '<div class="px-panel dash-card">' +
      '<h3 class="card-title">🎯 MISIÓN ACTUAL</h3>';
    if (cw) {
      var pending = S.sel.tasksOfWeek(cw.id).filter(function (t) { return !S.sel.isDone(t); }).slice(0, 6);
      html += '<div class="current-mission">' +
          '<h4>' + cw.emoji + ' WEEK ' + U.pad2(cwNum) + ' — ' + U.esc(cw.title) + '</h4>' +
          '<p class="goal">' + U.esc(cw.objective) + '</p>' +
          '<div class="dash-progress-label"><span>PROGRESO</span><span>' + cwProg.done + '/' + cwProg.total + ' · ' + cwProg.pct + '%</span></div>' +
          bar(cwProg.pct) +
          (cw.criteria ? '<p class="crit">🏆 <b>Criterio:</b> ' + U.esc(cw.criteria) + '</p>' : '') +
        '</div>';

      if (pending.length) {
        html += '<p class="card-note">Siguientes objetivos (toca para completar):</p>';
        pending.forEach(function (t) {
          html += '<div class="mini-task" data-action="toggle-task" data-id="' + t.id + '">' +
            '<span class="mt-box">○</span>' +
            '<span class="mt-name">' + U.esc(t.name) + '</span>' +
            priChip(t.priority) +
          '</div>';
        });
      } else {
        html += '<p class="card-note">✨ No quedan tareas pendientes en esta misión.' +
          (cw.criteria && !cw.criteriaDone ? ' Marca el criterio en MISIONES para declarar MISSION CLEAR.' : '') + '</p>';
      }
      html += '<button class="px-btn px-btn-primary" type="button" data-action="goto-mission" data-id="' + cw.id + '">IR A LA MISIÓN ▶</button>';
    } else {
      html += '<p class="card-note">Todavía no hay semanas. Ve a EDITAR PLAN y crea la primera misión.</p>';
    }
    html += '</div>';

    /* Mapa de semanas + avisos */
    html += '<div class="px-panel dash-card">' +
      '<h3 class="card-title">🗺️ MAPA DE SEMANAS</h3>' +
      '<div class="week-strip">';
    S.state.weeks.forEach(function (w, i) {
      var p = S.sel.weekProgress(w.id);
      var clear = S.sel.isWeekClear(w.id);
      var cls = clear ? ' is-clear' : (cw && cw.id === w.id ? ' is-current' : '');
      html += '<div class="week-node' + cls + '" data-action="goto-mission" data-id="' + w.id + '" title="' + U.esc(w.title) + '">' +
        '<span class="wn-num">S' + U.pad2(i + 1) + '</span>' +
        '<span class="wn-emoji">' + (clear ? '★' : w.emoji) + '</span>' +
        '<span class="wn-pct">' + p.pct + '%</span>' +
      '</div>';
    });
    html += '</div>';

    var late = S.state.tasks.filter(function (t) {
      return !S.sel.isDone(t) && t.dueDate && U.daysLeft(t.dueDate) !== null && U.daysLeft(t.dueDate) < 0;
    });
    var soon = S.state.tasks.filter(function (t) {
      var d = t.dueDate ? U.daysLeft(t.dueDate) : null;
      return !S.sel.isDone(t) && d !== null && d >= 0 && d <= 3;
    });

    html += '<h3 class="card-title" style="margin-top:22px">⏰ RADAR DE FECHAS</h3>';
    if (!late.length && !soon.length) {
      html += '<p class="card-note">Sin tareas vencidas ni fechas próximas. Todo bajo control.</p>';
    } else {
      late.slice(0, 5).forEach(function (t) {
        html += '<div class="mini-task" data-action="edit-task" data-id="' + t.id + '">' +
          '<span class="mt-box">⏰</span><span class="mt-name">' + U.esc(t.name) + '</span>' +
          '<span class="chip chip-late">VENCIDA</span></div>';
      });
      soon.slice(0, 5).forEach(function (t) {
        html += '<div class="mini-task" data-action="edit-task" data-id="' + t.id + '">' +
          '<span class="mt-box">📅</span><span class="mt-name">' + U.esc(t.name) + '</span>' +
          '<span class="chip chip-media">' + U.shortDate(t.dueDate) + '</span></div>';
      });
    }

    /* Reparto por responsable */
    html += '<h3 class="card-title" style="margin-top:22px">👥 REPARTO DEL EQUIPO</h3>';
    S.state.members.forEach(function (m) {
      var list = S.state.tasks.filter(function (t) { return t.assignee === m.id; });
      var d = list.filter(S.sel.isDone).length;
      html += '<div class="dash-side-row" style="margin-bottom:6px"><span>' + U.esc(m.emoji + ' ' + m.name) + '</span>' +
        '<b>' + d + '/' + list.length + '</b></div>' + bar(U.pct(d, list.length), 'bar-sm bar-done');
    });

    html += '</div></div>';

    el.dash.innerHTML = html;
  }

  function statCard(icon, num, label, cls) {
    return '<div class="px-panel stat-card ' + (cls || '') + '">' +
      '<div class="stat-icon">' + icon + '</div>' +
      '<div class="stat-num">' + num + '</div>' +
      '<div class="stat-label">' + label + '</div>' +
    '</div>';
  }

  /* ---------- MISIONES ---------- */
  function renderMissions() {
    var f = uiState.filters;
    var html = '';

    if (!S.state.weeks.length) {
      el.missions.innerHTML = emptyBox('SIN MISIONES', 'Ve a ⚙️ EDITAR PLAN y pulsa "+ AGREGAR SEMANA" para crear la primera.');
      return;
    }

    S.state.weeks.forEach(function (w, i) {
      var clear = S.sel.isWeekClear(w.id);
      if (f.mStatus === 'open' && clear) return;
      if (f.mStatus === 'clear' && !clear) return;

      var all = S.sel.tasksOfWeek(w.id);
      var list = f.mMember === 'all' ? all : all.filter(function (t) { return t.assignee === f.mMember; });
      if (f.mMember !== 'all' && !list.length) return;

      var p = S.sel.weekProgress(w.id);
      var open = !!uiState.openWeeks[w.id];

      html += '<section class="px-panel quest' + (open ? ' is-open' : '') + (clear ? ' is-clear' : '') + '" id="quest-' + w.id + '">' +
        '<header class="quest-head" data-action="toggle-week" data-id="' + w.id + '">' +
          '<div class="quest-badge"><small>WEEK</small><b>' + U.pad2(i + 1) + '</b></div>' +
          '<div class="quest-title">' +
            '<h3>' + w.emoji + ' ' + U.esc(w.title) + (clear ? ' <span class="chip chip-ok">★ CLEAR</span>' : '') + '</h3>' +
            '<p>🎯 ' + U.esc(w.objective) + '</p>' +
          '</div>' +
          '<div class="quest-meta">' +
            '<span class="quest-pct">' + p.done + '/' + p.total + ' · ' + p.pct + '%</span>' +
            bar(p.pct, clear ? 'bar-done' : '') +
          '</div>' +
          '<span class="quest-caret">▶</span>' +
        '</header>' +
        '<div class="quest-body">' +
          '<div class="quest-info">' +
            '<div class="qi-box"><h5>🎯 OBJETIVO PRINCIPAL</h5><p>' + U.esc(w.objective || '—') + '</p></div>' +
            (w.description ? '<div class="qi-box"><h5>📜 DETALLES</h5><p>' + U.esc(w.description) + '</p></div>' : '') +
            (w.criteria ?
              '<div class="qi-box"><h5>🏆 CRITERIO DE MISIÓN COMPLETADA</h5>' +
                '<label class="qi-crit"><input type="checkbox" data-action="toggle-criteria" data-id="' + w.id + '"' +
                  (w.criteriaDone ? ' checked' : '') + '><span>' + U.esc(w.criteria) + '</span></label></div>' : '') +
            '<div class="qi-box"><h5>📅 FECHAS</h5><p>' +
              (w.startDate ? U.shortDate(w.startDate) : '—') + ' → ' + (w.endDate ? U.shortDate(w.endDate) : '—') +
            '</p></div>' +
          '</div>' +
          (list.length ? list.map(function (t) { return taskRow(t, {}); }).join('')
                       : '<p class="empty">Sin tareas' + (f.mMember !== 'all' ? ' para este responsable' : '') + '.</p>') +
          '<div class="quest-actions">' +
            '<button class="px-btn px-btn-primary" type="button" data-action="new-task-week" data-id="' + w.id + '">+ NUEVA TAREA</button>' +
            '<button class="px-btn" type="button" data-action="edit-week" data-id="' + w.id + '">✎ EDITAR MISIÓN</button>' +
            '<button class="px-btn px-btn-ok" type="button" data-action="complete-week" data-id="' + w.id + '">✓ MARCAR TODO</button>' +
            '<button class="px-btn px-btn-ghost" type="button" data-action="uncomplete-week" data-id="' + w.id + '">↺ DESMARCAR TODO</button>' +
          '</div>' +
        '</div>' +
      '</section>';
    });

    el.missions.innerHTML = html || emptyBox('NADA QUE MOSTRAR', 'Ningún resultado con estos filtros.');
  }

  /* ---------- TAREAS ---------- */
  function renderTasks() {
    var f = uiState.filters;
    var q = f.tq.trim().toLowerCase();

    var list = S.state.tasks.filter(function (t) {
      if (f.tWeek !== 'all' && t.weekId !== f.tWeek) return false;
      if (f.tMember !== 'all' && t.assignee !== f.tMember) return false;
      if (f.tPriority !== 'all' && t.priority !== f.tPriority) return false;
      if (f.tStatus !== 'all' && t.status !== f.tStatus) return false;
      if (q) {
        var hay = (t.name + ' ' + t.description + ' ' + t.notes + ' ' + t.category).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });

    list.sort(function (a, b) {
      var wa = S.sel.weekIndex(a.weekId), wb = S.sel.weekIndex(b.weekId);
      if (wa !== wb) return wa - wb;
      return a.order - b.order;
    });

    var done = list.filter(S.sel.isDone).length;
    el.tasksSummary.innerHTML =
      '<span class="chip">📋 ' + list.length + ' TAREAS</span>' +
      '<span class="chip chip-ok">✓ ' + done + ' HECHAS</span>' +
      '<span class="chip chip-alta">○ ' + (list.length - done) + ' PENDIENTES</span>' +
      '<span class="chip chip-soft">' + U.blocks(U.pct(done, list.length), 10) + ' ' + U.pct(done, list.length) + '%</span>';

    el.tasksList.innerHTML = list.length
      ? list.map(function (t) { return taskRow(t, { showWeek: true }); }).join('')
      : emptyBox('SIN RESULTADOS', 'Prueba a cambiar los filtros o crea una tarea nueva con "+ NUEVA TAREA".');
  }

  /* ---------- IDEAS ---------- */
  function renderIdeas() {
    var f = uiState.filters;
    var list = S.state.ideas.filter(function (i) {
      if (f.ideaCat !== 'all' && i.category !== f.ideaCat) return false;
      if (f.ideaDone === 'open' && i.done) return false;
      if (f.ideaDone === 'done' && !i.done) return false;
      return true;
    });

    el.ideasList.innerHTML = list.length ? list.map(function (i) {
      return '<article class="px-panel idea' + (i.done ? ' is-done' : '') + '">' +
        '<p class="idea-text">' + (i.done ? '✅ ' : '💡 ') + U.esc(i.text) + '</p>' +
        '<div class="idea-foot">' +
          '<span class="chip chip-soft">' + U.esc(i.category) + '</span>' +
          '<span>' +
            '<button class="px-btn px-btn-mini px-btn-ok" type="button" data-action="toggle-idea" data-id="' + i.id + '" title="Marcar como realizada">✓</button>' +
            '<button class="px-btn px-btn-mini" type="button" data-action="edit-idea" data-id="' + i.id + '" title="Editar">✎</button>' +
            '<button class="px-btn px-btn-mini" type="button" data-action="idea-to-task" data-id="' + i.id + '" title="Convertir en tarea">⚔️</button>' +
            '<button class="px-btn px-btn-mini px-btn-danger" type="button" data-action="del-idea" data-id="' + i.id + '" title="Eliminar">✖</button>' +
          '</span>' +
        '</div>' +
      '</article>';
    }).join('') : emptyBox('BANCO VACÍO', 'Escribe arriba tu primera idea: un producto, un cliente potencial, una idea de contenido...');
  }

  /* ---------- NOMBRES ---------- */
  function renderNames() {
    var list = S.state.names.slice().sort(function (a, b) { return (b.fav ? 1 : 0) - (a.fav ? 1 : 0); });
    el.namesList.innerHTML = list.length ? list.map(function (n) {
      return '<article class="px-panel name-card' + (n.fav ? ' is-fav' : '') + '">' +
        '<p class="nc-name">' + (n.fav ? '★ ' : '') + U.esc(n.text) + '</p>' +
        (n.note ? '<p class="nc-note">' + U.esc(n.note) + '</p>' : '') +
        '<div class="nc-actions">' +
          '<button class="px-btn px-btn-mini" type="button" data-action="fav-name" data-id="' + n.id + '" title="Favorito">★</button>' +
          '<button class="px-btn px-btn-mini px-btn-ok" type="button" data-action="use-name" data-id="' + n.id + '" title="Usar como nombre de la empresa">USAR</button>' +
          '<button class="px-btn px-btn-mini px-btn-danger" type="button" data-action="del-name" data-id="' + n.id + '" title="Eliminar">✖</button>' +
        '</div>' +
      '</article>';
    }).join('') : emptyBox('SIN NOMBRES GUARDADOS', 'Genera sugerencias o escribe las tuyas. Después verifica marca, dominio y redes.');
  }

  /* ---------- EDITAR PLAN ---------- */
  function renderPlan() {
    var html = '';
    S.state.weeks.forEach(function (w, i) {
      var list = S.sel.tasksOfWeek(w.id);
      var p = S.sel.weekProgress(w.id);

      html += '<section class="px-panel plan-week">' +
        '<div class="pw-head">' +
          '<span class="pw-num">S' + U.pad2(i + 1) + '</span>' +
          '<span class="pw-title">' + w.emoji + ' ' + U.esc(w.title) + '</span>' +
          '<span class="chip chip-soft">' + p.done + '/' + p.total + ' · ' + p.pct + '%</span>' +
          '<span>' +
            '<button class="px-btn px-btn-mini" type="button" data-action="week-up" data-id="' + w.id + '" title="Subir">▲</button>' +
            '<button class="px-btn px-btn-mini" type="button" data-action="week-down" data-id="' + w.id + '" title="Bajar">▼</button>' +
            '<button class="px-btn px-btn-mini" type="button" data-action="edit-week" data-id="' + w.id + '" title="Editar semana">✎</button>' +
            '<button class="px-btn px-btn-mini px-btn-danger" type="button" data-action="del-week" data-id="' + w.id + '" title="Eliminar semana">✖</button>' +
          '</span>' +
        '</div>' +
        '<p class="pw-obj">🎯 ' + U.esc(w.objective || 'Sin objetivo definido') + '</p>' +
        (w.criteria ? '<p class="pw-obj">🏆 ' + U.esc(w.criteria) + '</p>' : '') +
        '<div class="pw-tasks">';

      if (!list.length) {
        html += '<p class="empty" style="padding:14px">Esta semana no tiene tareas todavía.</p>';
      }

      list.forEach(function (t) {
        html += '<div class="pw-task' + (S.sel.isDone(t) ? ' is-done' : '') + '">' +
          '<span>' + (C.priorities[t.priority] || C.priorities.media).icon + '</span>' +
          '<span class="pt-name">' + U.esc(t.name) + '</span>' +
          '<select class="px-input" style="max-width:190px" data-action="move-task-week" data-id="' + t.id + '" title="Mover a otra semana">' +
            weekOptions(t.weekId, false) +
          '</select>' +
          '<span>' +
            '<button class="px-btn px-btn-mini" type="button" data-action="task-up" data-id="' + t.id + '" title="Subir">▲</button>' +
            '<button class="px-btn px-btn-mini" type="button" data-action="task-down" data-id="' + t.id + '" title="Bajar">▼</button>' +
            '<button class="px-btn px-btn-mini" type="button" data-action="edit-task" data-id="' + t.id + '" title="Editar">✎</button>' +
            '<button class="px-btn px-btn-mini" type="button" data-action="dup-task" data-id="' + t.id + '" title="Duplicar">⧉</button>' +
            '<button class="px-btn px-btn-mini px-btn-danger" type="button" data-action="del-task" data-id="' + t.id + '" title="Eliminar">✖</button>' +
          '</span>' +
        '</div>';
      });

      html += '</div>' +
        '<div class="pw-actions">' +
          '<button class="px-btn px-btn-primary" type="button" data-action="new-task-week" data-id="' + w.id + '">+ TAREA EN ESTA SEMANA</button>' +
          '<button class="px-btn" type="button" data-action="edit-week" data-id="' + w.id + '">✎ EDITAR OBJETIVO Y CRITERIO</button>' +
        '</div>' +
      '</section>';
    });

    el.planList.innerHTML = html || emptyBox('PLAN VACÍO', 'Pulsa "+ AGREGAR SEMANA" para empezar a construir tu plan.');
  }

  /* ---------- CONFIGURACIÓN ---------- */
  function renderConfig() {
    var s = S.state.settings;

    document.querySelectorAll('[data-cfg]').forEach(function (input) {
      if (document.activeElement === input) return; /* no pisar lo que se está escribiendo */
      var key = input.getAttribute('data-cfg');
      if (input.type === 'checkbox') input.checked = !!s[key];
      else input.value = (s[key] === null || s[key] === undefined) ? '' : s[key];
    });

    /* miembros */
    el.membersList.innerHTML = S.state.members.map(function (m) {
      return '<div class="member-row">' +
        '<input class="px-input px-input-mini" type="text" value="' + U.esc(m.emoji) + '" maxlength="4" data-action="member-emoji" data-id="' + m.id + '">' +
        '<input class="px-input" type="text" value="' + U.esc(m.name) + '" data-action="member-name" data-id="' + m.id + '">' +
        '<button class="px-btn px-btn-mini px-btn-danger" type="button" data-action="del-member" data-id="' + m.id + '" title="Eliminar">✖</button>' +
      '</div>';
    }).join('');

    /* reglas de XP */
    el.xpRules.innerHTML = C.priorityOrder.map(function (p) {
      var pr = C.priorities[p];
      return '<div class="xp-rule">' +
        '<span>' + pr.icon + ' ' + pr.label + '</span>' +
        '<input class="px-input" type="number" min="0" value="' + (s.xpByPriority[p] || 0) + '" data-action="xp-rule" data-id="' + p + '"> XP' +
      '</div>';
    }).join('');

    var kb = (APP.storage.size() / 1024).toFixed(1);
    el.storageInfo.innerHTML = APP.storage.available
      ? 'Espacio usado: <b>' + kb + ' KB</b> · ' + S.state.tasks.length + ' tareas · ' + S.state.weeks.length + ' semanas · ' +
        S.state.ideas.length + ' ideas · ' + S.state.names.length + ' nombres.'
      : '⚠️ Este navegador tiene el almacenamiento bloqueado: los cambios NO se guardarán al cerrar.';
  }

  function emptyBox(title, msg) {
    return '<div class="px-panel empty"><b>' + U.esc(title) + '</b>' + U.esc(msg) + '</div>';
  }

  /* ---------- POBLAR SELECTS DE FILTRO ---------- */
  function fillFilterSelects() {
    var f = uiState.filters;
    el.tfMember.innerHTML = memberOptions(f.tMember, true, 'TODAS');
    el.mfMember.innerHTML = memberOptions(f.mMember, true, 'TODOS');
    el.tfWeek.innerHTML = weekOptions(f.tWeek, true);
    el.tfPriority.innerHTML = priorityOptions(f.tPriority, true);
    el.tfStatus.innerHTML = statusOptions(f.tStatus, true);
    el.ideaCat.innerHTML = ideaCatOptions(el.ideaCat.value || 'Producto', false);
    el.ideaFilter.innerHTML = ideaCatOptions(f.ideaCat, true);
  }

  /* ---------- CAMBIO DE VISTA ---------- */
  function setView(name) {
    uiState.view = name;
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('is-active'); });
    var v = document.getElementById('view-' + name);
    if (v) v.classList.add('is-active');
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-view') === name);
    });
    renderView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderView() {
    switch (uiState.view) {
      case 'dashboard': renderDashboard(); break;
      case 'missions': renderMissions(); break;
      case 'tasks': renderTasks(); break;
      case 'ideas': renderIdeas(); break;
      case 'names': renderNames(); break;
      case 'plan': renderPlan(); break;
      case 'config': renderConfig(); break;
    }
  }

  /* ---------- RENDER GLOBAL ---------- */
  function renderAll() {
    renderHeader();
    renderBoot();
    fillFilterSelects();
    renderView();
  }

  /* ---------- CACHE DE REFERENCIAS ---------- */
  function cacheRefs() {
    el.hdrName = document.getElementById('hdr-name');
    el.hdrTagline = document.getElementById('hdr-tagline');
    el.footName = document.getElementById('foot-name');
    el.hudLevel = document.getElementById('hud-level');
    el.hudRank = document.getElementById('hud-rank');
    el.hudXpText = document.getElementById('hud-xp-text');
    el.hudXpBar = document.getElementById('hud-xp-bar');
    el.btnSound = document.getElementById('btn-sound');
    el.dash = document.getElementById('dash-content');
    el.missions = document.getElementById('missions-list');
    el.tasksList = document.getElementById('tasks-list');
    el.tasksSummary = document.getElementById('tasks-summary');
    el.ideasList = document.getElementById('ideas-list');
    el.namesList = document.getElementById('names-list');
    el.planList = document.getElementById('plan-list');
    el.membersList = document.getElementById('members-list');
    el.xpRules = document.getElementById('xp-rules');
    el.storageInfo = document.getElementById('storage-info');
    el.tfMember = document.getElementById('tfilter-member');
    el.tfWeek = document.getElementById('tfilter-week');
    el.tfPriority = document.getElementById('tfilter-priority');
    el.tfStatus = document.getElementById('tfilter-status');
    el.mfMember = document.getElementById('mfilter-member');
    el.ideaCat = document.getElementById('idea-cat');
    el.ideaFilter = document.getElementById('idea-filter');
  }

  return {
    el: el,
    uiState: uiState,
    init: cacheRefs,
    renderAll: renderAll,
    renderView: renderView,
    renderHeader: renderHeader,
    renderConfig: renderConfig,
    setView: setView,
    bar: bar,
    emptyBox: emptyBox,
    memberOptions: memberOptions,
    weekOptions: weekOptions,
    priorityOptions: priorityOptions,
    statusOptions: statusOptions,
    categoryOptions: categoryOptions,
    ideaCatOptions: ideaCatOptions
  };
})();
