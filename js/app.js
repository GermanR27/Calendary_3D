/* ============================================================
   app.js — ARRANQUE, EVENTOS Y GAMIFICACIÓN
   Conecta la interfaz (ui.js) con los datos (state.js) y con
   la sala multijugador (sync.js). Aquí viven los modales, los
   avisos de QUEST COMPLETE / MISSION CLEAR / LEVEL UP, el
   generador de nombres y la importación / exportación.
   ============================================================ */

(function () {
  'use strict';

  var C = APP.CONFIG;
  var U = APP.util;
  var S = APP.store;
  var UI = APP.ui;

  var modalSubmit = null;

  /* ============================================================
     1. ARRANQUE
     ============================================================ */
  function init() {
    S.init();
    UI.init();
    UI.renderAll();

    bindBoot();
    bindNav();
    bindGlobalClicks();
    bindFilters();
    bindForms();
    bindConfig();
    bindModal();
    bindSync();

    S.onChange(onStateChange);

    if (!S.state.settings.showBoot) enterApp(true);
    console.log('%c3D PRINTING BUSINESS — QUEST PLANNER listo.', 'color:#3ce0ff');
  }

  function onStateChange(state, events) {
    UI.renderHeader();
    UI.renderView();
    flashSave();
    (events || []).forEach(showEvent);
    if (APP.sync) APP.sync.push(state);
  }

  /* ============================================================
     2. PANTALLA DE INICIO
     ============================================================ */
  function bindBoot() {
    var boot = document.getElementById('screen-boot');
    var btn = document.getElementById('btn-enter');
    btn.addEventListener('click', function () { enterApp(); });
    document.addEventListener('keydown', function (e) {
      if (boot.classList.contains('hidden')) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterApp(); }
    });
  }

  function enterApp(instant) {
    var boot = document.getElementById('screen-boot');
    var app = document.getElementById('app');
    if (boot.classList.contains('hidden')) return;
    if (!instant) sfx('start');
    boot.classList.add('hidden');
    app.classList.remove('hidden');
    UI.renderAll();
  }

  /* ============================================================
     3. NAVEGACIÓN
     ============================================================ */
  function bindNav() {
    document.getElementById('nav').addEventListener('click', function (e) {
      var b = e.target.closest('.nav-btn');
      if (!b) return;
      sfx('click');
      UI.setView(b.getAttribute('data-view'));
    });
  }

  /* ============================================================
     4. CLICS GLOBALES (delegación por data-action)
     ============================================================ */
  function bindGlobalClicks() {
    document.addEventListener('click', function (e) {
      var node = e.target.closest('[data-action]');
      if (!node) return;
      var action = node.getAttribute('data-action');
      var id = node.getAttribute('data-id');
      if (node.tagName === 'SELECT' || node.tagName === 'INPUT') return; /* los maneja 'change' */

      switch (action) {

        /* ---- tareas ---- */
        case 'toggle-task':
          S.toggleTask(id);
          break;
        case 'edit-task':
          openTaskModal(S.sel.task(id));
          break;
        case 'dup-task':
          S.duplicateTask(id);
          toast('info', 'Tarea duplicada.');
          break;
        case 'del-task': {
          var t = S.sel.task(id);
          if (!t) break;
          confirmModal('ELIMINAR TAREA', '¿Eliminar <b>' + U.esc(t.name) + '</b>? Esta acción no se puede deshacer.', function () {
            S.removeTask(id);
            toast('info', 'Tarea eliminada.');
          });
          break;
        }
        case 'task-up': S.moveTask(id, -1); break;
        case 'task-down': S.moveTask(id, 1); break;
        case 'new-task-week': openTaskModal(null, id); break;

        /* ---- semanas ---- */
        case 'toggle-week':
          UI.uiState.openWeeks[id] = !UI.uiState.openWeeks[id];
          sfx('click');
          UI.renderView();
          break;
        /* 'toggle-criteria' es un checkbox: se maneja en el evento 'change' */
        case 'edit-week': openWeekModal(S.sel.week(id)); break;
        case 'week-up': S.moveWeek(id, -1); break;
        case 'week-down': S.moveWeek(id, 1); break;
        case 'del-week': {
          var w = S.sel.week(id);
          if (!w) break;
          var n = S.sel.tasksOfWeek(id).length;
          confirmModal('ELIMINAR SEMANA',
            '¿Eliminar la misión <b>' + U.esc(w.title) + '</b> y sus <b>' + n + '</b> tareas? No se puede deshacer.',
            function () { S.removeWeek(id); toast('info', 'Semana eliminada.'); });
          break;
        }
        case 'complete-week':
          confirmModal('MARCAR TODO', '¿Marcar como completadas todas las tareas de esta misión?', function () {
            S.completeWeekTasks(id, true);
          });
          break;
        case 'uncomplete-week':
          confirmModal('DESMARCAR TODO', '¿Devolver todas las tareas de esta misión a PENDIENTE?', function () {
            S.completeWeekTasks(id, false);
          });
          break;
        case 'goto-mission':
          UI.uiState.openWeeks[id] = true;
          UI.setView('missions');
          setTimeout(function () {
            var node2 = document.getElementById('quest-' + id);
            if (node2) node2.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
          break;

        /* ---- ideas ---- */
        case 'toggle-idea': S.toggleIdea(id); sfx('tick'); break;
        case 'del-idea':
          confirmModal('ELIMINAR IDEA', '¿Eliminar esta idea del banco?', function () { S.removeIdea(id); });
          break;
        case 'edit-idea': openIdeaModal(id); break;
        case 'idea-to-task': ideaToTask(id); break;

        /* ---- nombres ---- */
        case 'fav-name': S.toggleNameFav(id); break;
        case 'del-name': S.removeName(id); break;
        case 'use-name':
          confirmModal('USAR ESTE NOMBRE', '¿Poner este nombre como nombre de la empresa?', function () {
            S.useNameAsCompany(id);
          });
          break;

        /* ---- miembros ---- */
        case 'del-member': {
          if (S.state.members.length <= 1) { toast('error', 'Debe quedar al menos un responsable.'); break; }
          var m = S.sel.member(id);
          confirmModal('ELIMINAR MIEMBRO',
            '¿Eliminar a <b>' + U.esc(m ? m.name : '') + '</b>? Sus tareas quedarán SIN ASIGNAR.',
            function () { S.removeMember(id); });
          break;
        }
      }
    });
  }

  /* ============================================================
     5. FILTROS
     ============================================================ */
  function bindFilters() {
    var f = UI.uiState.filters;
    on('tfilter-q', 'input', function (e) { f.tq = e.target.value; UI.renderView(); });
    on('tfilter-member', 'change', function (e) { f.tMember = e.target.value; UI.renderView(); });
    on('tfilter-week', 'change', function (e) { f.tWeek = e.target.value; UI.renderView(); });
    on('tfilter-priority', 'change', function (e) { f.tPriority = e.target.value; UI.renderView(); });
    on('tfilter-status', 'change', function (e) { f.tStatus = e.target.value; UI.renderView(); });
    on('mfilter-member', 'change', function (e) { f.mMember = e.target.value; UI.renderView(); });
    on('mfilter-status', 'change', function (e) { f.mStatus = e.target.value; UI.renderView(); });
    on('idea-filter', 'change', function (e) { f.ideaCat = e.target.value; UI.renderView(); });
    on('idea-done-filter', 'change', function (e) { f.ideaDone = e.target.value; UI.renderView(); });

    on('btn-expand-all', 'click', function () {
      S.state.weeks.forEach(function (w) { UI.uiState.openWeeks[w.id] = true; });
      UI.renderView();
    });
    on('btn-collapse-all', 'click', function () {
      UI.uiState.openWeeks = {};
      UI.renderView();
    });

    /* selects incrustados en las listas */
    document.addEventListener('change', function (e) {
      var node = e.target.closest('[data-action]');
      if (!node) return;
      var action = node.getAttribute('data-action');
      var id = node.getAttribute('data-id');
      if (action === 'toggle-criteria') { S.toggleWeekCriteria(id); sfx('tick'); }
      if (action === 'move-task-week') S.setTaskWeek(id, node.value);
      if (action === 'member-name') S.updateMember(id, { name: node.value.trim() || 'MIEMBRO' });
      if (action === 'member-emoji') S.updateMember(id, { emoji: node.value.trim() || '👤' });
      if (action === 'xp-rule') S.setXpRule(id, node.value);
    });
  }

  /* ============================================================
     6. FORMULARIOS FIJOS (ideas, nombres, miembros)
     ============================================================ */
  function bindForms() {
    on('btn-new-task', 'click', function () { openTaskModal(null); });
    on('btn-add-task-plan', 'click', function () { openTaskModal(null); });
    on('btn-add-week', 'click', function () { openWeekModal(null); });

    on('idea-form', 'submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('idea-text');
      var cat = document.getElementById('idea-cat');
      var txt = input.value.trim();
      if (!txt) return;
      S.addIdea(txt, cat.value);
      input.value = '';
      sfx('tick');
      toast('info', 'Idea guardada en el banco.');
    });

    on('name-form', 'submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('name-manual');
      var txt = input.value.trim();
      if (!txt) return;
      if (S.addName(txt, 'Escrito por el equipo')) { input.value = ''; sfx('tick'); }
      else toast('error', 'Ese nombre ya está en la lista.');
    });

    on('member-form', 'submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('member-name');
      var emoji = document.getElementById('member-emoji');
      if (!name.value.trim()) return;
      S.addMember(name.value.trim().toUpperCase(), emoji.value.trim() || '👤');
      name.value = ''; emoji.value = '';
      sfx('tick');
    });

    /* generador de nombres */
    on('btn-generate', 'click', generateName);
    on('btn-save-name', 'click', function () {
      var g = UI.uiState.gen;
      if (!g) { toast('error', 'Genera un nombre primero.'); return; }
      if (S.addName(g.name, g.concept)) { sfx('tick'); toast('info', 'Nombre guardado. Verifica su disponibilidad.'); }
      else toast('error', 'Ese nombre ya estaba guardado.');
    });
    on('btn-discard-name', 'click', generateName);
  }

  /* ============================================================
     7. CONFIGURACIÓN
     ============================================================ */
  function bindConfig() {
    document.querySelectorAll('[data-cfg]').forEach(function (input) {
      var evt = (input.type === 'checkbox' || input.tagName === 'SELECT') ? 'change' : 'input';
      input.addEventListener(evt, function () {
        var key = input.getAttribute('data-cfg');
        var val;
        if (input.type === 'checkbox') val = input.checked;
        else if (input.type === 'number') val = Number(input.value) || 0;
        else val = input.value;
        S.setSetting(key, val);
      });
    });

    on('btn-sound', 'click', function () {
      S.setSetting('sound', !S.state.settings.sound);
      if (S.state.settings.sound) sfx('click');
    });

    on('btn-export', 'click', function () {
      var name = S.exportData();
      toast('info', 'Archivo descargado: ' + name);
    });

    on('btn-import', 'click', function () { document.getElementById('file-import').click(); });

    on('file-import', 'change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      APP.storage.importFile(file, function (data) {
        confirmModal('IMPORTAR DATOS',
          'Se reemplazará TODO el plan actual por el del archivo. ¿Continuar?',
          function () {
            S.replaceState(data);
            UI.renderAll();
            sfx('level');
          });
      }, function (msg) {
        toast('error', msg);
      });
      e.target.value = '';
    });

    on('btn-restore-plan', 'click', function () {
      confirmModal('RESTAURAR PLAN',
        'Se reinstalarán las 8 semanas originales y se perderán las tareas actuales.<br>Se conservan: ideas, nombres, equipo y configuración.',
        function () { S.restoreSeedPlan(); UI.renderAll(); });
    });

    on('btn-reset', 'click', function () {
      confirmModal('BORRAR TODO',
        '☠ Se borrará <b>absolutamente todo</b> (tareas, semanas, ideas, nombres y configuración) y volverás a empezar.<br><br>Exporta antes una copia si no quieres perderlo.',
        function () { S.resetAll(); UI.renderAll(); });
    });
  }

  /* ============================================================
     8. MODALES
     ============================================================ */
  function bindModal() {
    var modal = document.getElementById('modal');
    document.getElementById('modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
    });
  }

  function openModal(title, bodyHTML, footHTML, onSubmit) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-foot').innerHTML = footHTML ||
      '<button class="px-btn px-btn-ghost" type="button" data-close="1">CANCELAR</button>' +
      '<button class="px-btn px-btn-primary" type="button" id="modal-ok">GUARDAR</button>';
    document.getElementById('modal').classList.remove('hidden');
    modalSubmit = onSubmit || null;

    var ok = document.getElementById('modal-ok');
    if (ok) ok.addEventListener('click', function () { if (modalSubmit) modalSubmit(); });

    var first = document.querySelector('#modal-body input, #modal-body textarea, #modal-body select');
    if (first) setTimeout(function () { first.focus(); }, 60);
    sfx('open');
  }

  function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal-body').innerHTML = '';
    modalSubmit = null;
  }

  function confirmModal(title, msgHTML, onYes, okLabel) {
    openModal(title,
      '<p class="modal-msg">' + msgHTML + '</p>',
      '<button class="px-btn px-btn-ghost" type="button" data-close="1">CANCELAR</button>' +
      '<button class="px-btn px-btn-danger" type="button" id="modal-ok">' + (okLabel || 'CONFIRMAR') + '</button>',
      function () { closeModal(); onYes(); });
  }

  /* ---- modal de tarea ---- */
  function openTaskModal(task, presetWeekId) {
    var isNew = !task;
    var t = task || {
      name: '', description: '', notes: '',
      weekId: presetWeekId || (UI.uiState.filters.tWeek !== 'all' ? UI.uiState.filters.tWeek : (S.state.weeks[0] && S.state.weeks[0].id)),
      assignee: (S.state.members[0] || {}).id || '',
      priority: 'media', status: 'pendiente', category: 'Otro', dueDate: ''
    };

    if (!S.state.weeks.length) { toast('error', 'Crea primero una semana en EDITAR PLAN.'); return; }

    var defWeek = S.sel.week(t.weekId) || S.state.weeks[0];
    var body =
      '<div class="modal-grid">' +
        '<label class="field full"><span>NOMBRE DE LA TAREA *</span>' +
          '<input class="px-input" id="f-name" type="text" value="' + U.esc(t.name) + '" placeholder="Ej: Calcular el costo por hora de impresión"></label>' +
        '<label class="field full"><span>DESCRIPCIÓN</span>' +
          '<textarea class="px-input" id="f-desc" rows="2" placeholder="Detalles de qué hay que hacer">' + U.esc(t.description) + '</textarea></label>' +
        '<label class="field"><span>SEMANA / MISIÓN</span>' +
          '<select class="px-input" id="f-week">' + UI.weekOptions(defWeek.id, false) + '</select></label>' +
        '<label class="field"><span>RESPONSABLE</span>' +
          '<select class="px-input" id="f-assignee">' + UI.memberOptions(t.assignee, false) + '</select></label>' +
        '<label class="field"><span>PRIORIDAD</span>' +
          '<select class="px-input" id="f-priority">' + UI.priorityOptions(t.priority, false) + '</select></label>' +
        '<label class="field"><span>ESTADO</span>' +
          '<select class="px-input" id="f-status">' + UI.statusOptions(t.status, false) + '</select></label>' +
        '<label class="field"><span>FECHA LÍMITE</span>' +
          '<input class="px-input" id="f-due" type="date" value="' + U.esc(t.dueDate || '') + '"></label>' +
        '<label class="field"><span>CATEGORÍA</span>' +
          '<select class="px-input" id="f-category">' + UI.categoryOptions(t.category) + '</select></label>' +
        '<label class="field full"><span>NOTAS</span>' +
          '<textarea class="px-input" id="f-notes" rows="2" placeholder="Apuntes, enlaces, medidas, acuerdos...">' + U.esc(t.notes) + '</textarea></label>' +
      '</div>';

    openModal(isNew ? '+ NUEVA TAREA' : '✎ EDITAR TAREA', body, null, function () {
      var data = {
        name: val('f-name').trim(),
        description: val('f-desc').trim(),
        notes: val('f-notes').trim(),
        weekId: val('f-week'),
        assignee: val('f-assignee'),
        priority: val('f-priority'),
        status: val('f-status'),
        dueDate: val('f-due'),
        category: val('f-category')
      };
      if (!data.name) { toast('error', 'La tarea necesita un nombre.'); return; }
      if (isNew) {
        if (!data.dueDate) {
          var w = S.sel.week(data.weekId);
          data.dueDate = w ? w.endDate : '';
        }
        S.addTask(data);
        toast('info', 'Tarea creada.');
      } else {
        S.updateTask(task.id, data);
        toast('info', 'Tarea actualizada.');
      }
      closeModal();
    });
  }

  /* ---- modal de semana ---- */
  function openWeekModal(week) {
    var isNew = !week;
    var w = week || { emoji: '⭐', title: '', objective: '', description: '', criteria: '', startDate: '', endDate: '' };

    var body =
      '<div class="modal-grid">' +
        '<label class="field"><span>ICONO</span>' +
          '<input class="px-input" id="f-emoji" type="text" maxlength="4" value="' + U.esc(w.emoji) + '"></label>' +
        '<label class="field"><span>NOMBRE DE LA MISIÓN *</span>' +
          '<input class="px-input" id="f-title" type="text" value="' + U.esc(w.title) + '" placeholder="Ej: LOS CIMIENTOS"></label>' +
        '<label class="field full"><span>🎯 OBJETIVO PRINCIPAL</span>' +
          '<textarea class="px-input" id="f-objective" rows="2">' + U.esc(w.objective) + '</textarea></label>' +
        '<label class="field full"><span>📜 DESCRIPCIÓN / DETALLES</span>' +
          '<textarea class="px-input" id="f-description" rows="4">' + U.esc(w.description) + '</textarea></label>' +
        '<label class="field full"><span>🏆 CRITERIO DE MISIÓN COMPLETADA</span>' +
          '<textarea class="px-input" id="f-criteria" rows="2" placeholder="Ej: Podemos cotizar cualquier pieza en menos de 5 minutos.">' + U.esc(w.criteria) + '</textarea></label>' +
        '<label class="field"><span>INICIO</span>' +
          '<input class="px-input" id="f-start" type="date" value="' + U.esc(w.startDate || '') + '"></label>' +
        '<label class="field"><span>FIN</span>' +
          '<input class="px-input" id="f-end" type="date" value="' + U.esc(w.endDate || '') + '"></label>' +
      '</div>';

    openModal(isNew ? '+ AGREGAR SEMANA' : '✎ EDITAR MISIÓN', body, null, function () {
      var data = {
        emoji: val('f-emoji').trim() || '⭐',
        title: val('f-title').trim(),
        objective: val('f-objective').trim(),
        description: val('f-description').trim(),
        criteria: val('f-criteria').trim(),
        startDate: val('f-start'),
        endDate: val('f-end')
      };
      if (!data.title) { toast('error', 'La misión necesita un nombre.'); return; }
      if (isNew) {
        var nw = S.addWeek(data);
        UI.uiState.openWeeks[nw.id] = true;
        sfx('level');
      } else {
        S.updateWeek(week.id, data);
        toast('info', 'Misión actualizada.');
      }
      closeModal();
    });
  }

  /* ---- modal de idea ---- */
  function openIdeaModal(id) {
    var idea = null;
    S.state.ideas.forEach(function (i) { if (i.id === id) idea = i; });
    if (!idea) return;

    var body =
      '<label class="field"><span>IDEA</span>' +
        '<textarea class="px-input" id="f-idea" rows="3">' + U.esc(idea.text) + '</textarea></label>' +
      '<label class="field"><span>TIPO</span>' +
        '<select class="px-input" id="f-idea-cat">' + UI.ideaCatOptions(idea.category, false) + '</select></label>';

    openModal('✎ EDITAR IDEA', body, null, function () {
      var txt = val('f-idea').trim();
      if (!txt) { toast('error', 'La idea no puede quedar vacía.'); return; }
      S.updateIdea(id, { text: txt, category: val('f-idea-cat') });
      closeModal();
    });
  }

  function ideaToTask(id) {
    var idea = null;
    S.state.ideas.forEach(function (i) { if (i.id === id) idea = i; });
    if (!idea) return;
    if (!S.state.weeks.length) { toast('error', 'Crea primero una semana.'); return; }
    openTaskModal({
      name: idea.text, description: 'Idea convertida en tarea desde el IDEA BANK.',
      notes: '', weekId: (S.sel.currentWeek() || S.state.weeks[0]).id,
      assignee: (S.state.members[0] || {}).id || '', priority: 'media',
      status: 'pendiente', category: 'Producto', dueDate: ''
    });
  }

  function val(id) {
    var n = document.getElementById(id);
    return n ? n.value : '';
  }

  /* ============================================================
     9. GENERADOR DE NOMBRES
     ============================================================ */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function generateName() {
    var B = APP.NAMEBANK;
    var patterns = [
      function () { return pick(B.jp) + pick(B.make); },
      function () { return pick(B.tech) + pick(B.make); },
      function () { return pick(B.jp) + ' ' + pick(B.suffix); },
      function () { return pick(B.tech) + ' ' + pick(B.suffix); },
      function () { return pick(B.jp) + pick(B.tech); },
      function () { return pick(B.es) + ' ' + pick(B.suffix); },
      function () { return pick(B.tech) + '-' + pick(B.make); },
      function () { return pick(B.jp) + ' ' + pick(B.es); },
      function () { return pick(B.make) + ' ' + pick(B.jp); },
      function () { return pick(B.tech) + pick(B.jp) + ' 3D'; }
    ];

    var name = pick(patterns)();
    var concept = pick(APP.NAMEBANK.concepts);

    UI.uiState.gen = { name: name, concept: concept };
    var nameEl = document.getElementById('gen-name');
    nameEl.textContent = name;
    nameEl.classList.remove('is-new');
    void nameEl.offsetWidth;
    nameEl.classList.add('is-new');
    document.getElementById('gen-concept').textContent = concept;
    sfx('click');
  }

  /* ============================================================
     10. GAMIFICACIÓN: TOASTS, FX Y SONIDO
     ============================================================ */
  function showEvent(ev) {
    var meta = C.fx[ev.type] || C.fx.info;
    pushToast(meta.title, ev.text, meta.cls);
    if (ev.type === 'quest') { sfx('quest'); burst('#4be08a'); }
    if (ev.type === 'mission') { sfx('mission'); burst('#ffd23f'); }
    if (ev.type === 'level') { sfx('level'); burst('#ff3d7f'); flash(); }
    if (ev.type === 'unlock') sfx('level');
  }

  function toast(kind, text) {
    var meta = C.fx[kind] || C.fx.info;
    pushToast(meta.title, text, meta.cls);
    if (kind === 'error') sfx('error');
  }

  function pushToast(title, text, cls) {
    var layer = document.getElementById('toast-layer');
    var node = document.createElement('div');
    node.className = 'toast ' + (cls || '');
    node.innerHTML = '<b>' + U.esc(title) + '</b><span>' + U.esc(text || '') + '</span>';
    layer.appendChild(node);
    setTimeout(function () {
      node.classList.add('out');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 320);
    }, 2600);
    while (layer.children.length > 4) layer.removeChild(layer.firstChild);
  }

  function burst(color) {
    var layer = document.getElementById('fx-layer');
    var cx = window.innerWidth / 2, cy = window.innerHeight - 120;
    for (var i = 0; i < 14; i++) {
      var p = document.createElement('span');
      p.className = 'fx-pixel';
      p.style.background = color;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--dx', (Math.random() * 260 - 130).toFixed(0) + 'px');
      p.style.setProperty('--dy', (-Math.random() * 200 - 30).toFixed(0) + 'px');
      layer.appendChild(p);
      (function (node) {
        setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 850);
      })(p);
    }
  }

  function flash() {
    var f = document.createElement('div');
    f.className = 'fx-flash';
    document.getElementById('fx-layer').appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 420);
  }

  function flashSave() {
    var dot = document.getElementById('save-dot');
    if (!dot) return;
    dot.classList.add('is-saving');
    setTimeout(function () { dot.classList.remove('is-saving'); }, 380);
  }

  /* ---- sonido retro (WebAudio, sin archivos) ---- */
  var audioCtx = null;
  function sfx(kind) {
    if (!S.state || !S.state.settings.sound) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var seqs = {
        click:   [[440, .05]],
        tick:    [[660, .05]],
        open:    [[520, .05], [700, .05]],
        start:   [[440, .08], [660, .08], [880, .14]],
        quest:   [[660, .06], [880, .10]],
        mission: [[523, .08], [659, .08], [784, .16]],
        level:   [[523, .08], [659, .08], [784, .08], [1046, .22]],
        error:   [[180, .12], [130, .14]]
      };
      var seq = seqs[kind] || seqs.click;
      var t0 = audioCtx.currentTime;
      seq.forEach(function (step) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(step[0], t0);
        gain.gain.setValueAtTime(0.05, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + step[1]);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t0); osc.stop(t0 + step[1]);
        t0 += step[1];
      });
    } catch (e) { /* sin audio, sin problema */ }
  }

  /* ============================================================
     11. SALA MULTIJUGADOR
     ============================================================ */
  function bindSync() {
    if (!APP.sync) return;

    APP.sync.init({
      onStatus: renderSyncStatus,
      onPeers: renderSyncStatus,
      onRemote: function (remoteState, meta) {
        S.replaceState(remoteState, {
          type: 'info',
          text: '🌐 ' + ((meta && meta.byName) || 'Un socio') + ' actualizó el plan.'
        });
        UI.renderAll();
      },
      onConflict: function (remoteState, meta, decide) {
        var rt = (remoteState.tasks || []).length, rw = (remoteState.weeks || []).length;
        var lt = S.state.tasks.length, lw = S.state.weeks.length;
        openModal('🌐 LA SALA YA TIENE UN PLAN',
          '<p class="modal-msg">La sala <b>' + U.esc(APP.sync.info().room) + '</b> ya contiene un plan guardado' +
          (meta && meta.byName ? ' por <b>' + U.esc(meta.byName) + '</b>' : '') + '.</p>' +
          '<div class="sync-status px-panel px-inset" style="margin-top:12px">' +
            '<p><b>En la sala:</b> ' + rw + ' semanas · ' + rt + ' tareas</p>' +
            '<p><b>En este equipo:</b> ' + lw + ' semanas · ' + lt + ' tareas</p>' +
          '</div>' +
          '<p class="modal-msg" style="margin-top:12px">¿Cuál quieres conservar? El otro se perderá.</p>',
          '<button class="px-btn px-btn-ghost" type="button" id="sync-keep-local">SUBIR EL MÍO</button>' +
          '<button class="px-btn px-btn-primary" type="button" id="sync-keep-remote">USAR EL DE LA SALA</button>',
          null);
        document.getElementById('sync-keep-local').addEventListener('click', function () {
          closeModal(); decide('local'); toast('info', 'Tu plan se subió a la sala.');
        });
        document.getElementById('sync-keep-remote').addEventListener('click', function () {
          closeModal(); decide('remote');
        });
      }
    });

    on('btn-sync', 'click', openSyncModal);
    on('btn-open-sync', 'click', openSyncModal);
    on('btn-sync-help', 'click', openSyncHelp);
    renderSyncStatus();
  }

  function renderSyncStatus() {
    var info = APP.sync ? APP.sync.info() : { status: 'off', peers: [] };
    var pill = document.getElementById('btn-sync');
    var icon = document.getElementById('sync-icon');
    var text = document.getElementById('sync-text');
    if (!pill) return;

    pill.className = 'px-btn px-btn-icon sync-pill is-' + info.status;
    var labels = {
      off: ['🌐', 'LOCAL'],
      connecting: ['📡', '...'],
      online: ['🟢', 'SALA'],
      error: ['⚠️', 'ERROR']
    };
    var l = labels[info.status] || labels.off;
    icon.textContent = l[0];
    text.textContent = info.status === 'online' ? (l[1] + ' ' + info.peers.length) : l[1];
    pill.title = info.status === 'online'
      ? 'Sala "' + info.room + '" · ' + info.peers.length + ' conectados'
      : (info.error || 'Trabajando solo en este navegador');

    var box = document.getElementById('sync-status-text');
    if (box) {
      var msg = {
        off: 'Modo local (solo este navegador)',
        connecting: 'Conectando con la sala...',
        online: 'EN LÍNEA · sala "' + U.esc(info.room) + '"',
        error: '⚠️ ' + U.esc(info.error || 'Error de conexión')
      }[info.status];
      box.innerHTML = msg;

      var peersBox = document.getElementById('sync-peers-text');
      if (peersBox) {
        peersBox.innerHTML = info.peers.length
          ? '<span class="peer-list">' + info.peers.map(function (p) {
              return '<span class="peer' + (p.me ? ' is-me' : '') + '"><span class="dot"></span>' +
                     U.esc(p.nick) + (p.me ? ' (tú)' : '') + '</span>';
            }).join('') + '</span>'
          : 'Nadie más conectado.';
      }
    }

    /* refresca el modal si está abierto */
    var live = document.getElementById('sync-live-status');
    if (live) live.innerHTML = syncLiveHTML(info);
  }

  function syncLiveHTML(info) {
    var map = {
      off: '⚪ MODO LOCAL — los cambios solo se guardan en este navegador.',
      connecting: '📡 CONECTANDO...',
      online: '🟢 EN LÍNEA en la sala "' + U.esc(info.room) + '"',
      error: '⚠️ ' + U.esc(info.error || 'Error')
    };
    var html = '<p><b>Estado:</b> ' + (map[info.status] || map.off) + '</p>';
    if (info.peers && info.peers.length) {
      html += '<span class="peer-list">' + info.peers.map(function (p) {
        return '<span class="peer' + (p.me ? ' is-me' : '') + '"><span class="dot"></span>' +
               U.esc(p.nick) + (p.me ? ' (tú)' : '') + '</span>';
      }).join('') + '</span>';
    }
    return html;
  }

  function openSyncModal() {
    var info = APP.sync.info();
    var conf = APP.sync.conf();
    var cfgText = conf.config ? JSON.stringify(conf.config, null, 2) : '';

    var body =
      '<div id="sync-live-status" class="sync-status px-panel px-inset">' + syncLiveHTML(info) + '</div>' +
      '<label class="field"><span>TU NOMBRE EN LA SALA</span>' +
        '<input class="px-input" id="f-nick" type="text" placeholder="Ej: GERMÁN" value="' + U.esc(conf.nick || '') + '"></label>' +
      '<label class="field"><span>CÓDIGO DE SALA (el mismo para los dos socios)</span>' +
        '<input class="px-input" id="f-room" type="text" placeholder="Ej: taller-3d-x7k2" value="' + U.esc(conf.room || '') + '"></label>' +
      '<label class="field"><span>CONFIGURACIÓN DE FIREBASE (pégala tal cual)</span>' +
        '<textarea class="px-input" id="f-fbconfig" rows="8" placeholder=\'{ "apiKey": "...", "databaseURL": "https://....firebasedatabase.app", "projectId": "..." }\'>' + U.esc(cfgText) + '</textarea></label>' +
      '<p class="card-note">🔐 Cualquiera que tenga el código de sala y esta configuración puede ver y editar el plan. Usa un código difícil de adivinar.</p>' +
      '<p class="card-note">¿No sabes de dónde sacar esto? Pulsa <b>CÓMO SE CREA</b> en la tarjeta de CONFIG.</p>';

    var foot =
      '<button class="px-btn px-btn-ghost" type="button" data-close="1">CERRAR</button>' +
      (info.status === 'online' || info.status === 'connecting'
        ? '<button class="px-btn px-btn-danger" type="button" id="sync-disconnect">DESCONECTAR</button>'
        : '') +
      '<button class="px-btn px-btn-primary" type="button" id="sync-connect">CONECTAR</button>';

    openModal('🌐 SALA MULTIJUGADOR', body, foot, null);

    document.getElementById('sync-connect').addEventListener('click', function () {
      APP.sync.connect({
        configText: val('f-fbconfig'),
        room: val('f-room'),
        nick: val('f-nick')
      }).then(function () {
        toast('info', 'Conectado a la sala. Los cambios se sincronizan en tiempo real.');
        sfx('level');
      }).catch(function (e) {
        toast('error', e.message || 'No se pudo conectar.');
      });
    });

    var dis = document.getElementById('sync-disconnect');
    if (dis) dis.addEventListener('click', function () {
      APP.sync.disconnect(false);
      toast('info', 'Desconectado. Vuelves al modo local.');
    });
  }

  function openSyncHelp() {
    var body =
      '<div class="help-steps">' +
        '<div class="help-step"><b>1</b><div>Entra en <code>console.firebase.google.com</code> con tu cuenta de Google y pulsa <b>Crear un proyecto</b>. Ponle cualquier nombre y desactiva Analytics.</div></div>' +
        '<div class="help-step"><b>2</b><div>En el menú lateral abre <b>Compilación → Realtime Database</b> (¡no Firestore!) y pulsa <b>Crear base de datos</b>. Elige la región y arranca en <b>modo de prueba</b>.</div></div>' +
        '<div class="help-step"><b>3</b><div>Ve a <b>Configuración del proyecto (⚙) → Tus apps → Web (&lt;/&gt;)</b>, registra la app y copia el bloque <code>firebaseConfig</code> completo.</div></div>' +
        '<div class="help-step"><b>4</b><div>Vuelve aquí, pulsa <b>CONFIGURAR SALA</b>, pega ese bloque, inventa un <b>código de sala</b> difícil de adivinar y pulsa <b>CONECTAR</b>.</div></div>' +
        '<div class="help-step"><b>5</b><div>Pásale a tu socio la misma URL de la app, la misma configuración y el mismo código de sala. Listo: los cambios se ven en tiempo real.</div></div>' +
      '</div>' +
      '<p class="card-note" style="margin-top:16px">El "modo de prueba" de Firebase caduca a los 30 días. Para dejarlo permanente, en <b>Realtime Database → Reglas</b> pon algo así (y publica):</p>' +
      '<code class="code-block">{\n  "rules": {\n    "rooms": {\n      "$sala": {\n        ".read": true,\n        ".write": true\n      }\n    }\n  }\n}</code>' +
      '<p class="card-note">⚠️ Con estas reglas, quien conozca el código de sala puede leer y escribir. Para un plan de trabajo interno es aceptable; no guardes datos sensibles de clientes ahí.</p>';

    openModal('❔ CÓMO CREAR LA SALA', body,
      '<button class="px-btn px-btn-primary" type="button" data-close="1">ENTENDIDO</button>', null);
  }

  /* ============================================================
     UTILIDADES DE EVENTOS
     ============================================================ */
  function on(id, evt, fn) {
    var node = document.getElementById(id);
    if (node) node.addEventListener(evt, fn);
  }

  /* ---- arranque ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
