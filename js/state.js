/* ============================================================
   state.js — ESTADO + LÓGICA DE NEGOCIO
   Único lugar donde se modifican los datos. La interfaz nunca
   toca el estado directamente: llama a estas funciones y luego
   se vuelve a dibujar sola (patrón store + suscripción).
   ============================================================ */

window.APP = window.APP || {};

APP.store = (function () {

  var C = APP.CONFIG;
  var U = APP.util;

  var state = null;
  var listeners = [];
  var pendingEvents = [];

  /* ---------- CREACIÓN DEL ESTADO INICIAL ---------- */
  function createInitial() {
    var seed = APP.SEED;
    var start = U.todayISO();

    var st = {
      version: C.version,
      settings: Object.assign({}, seed.settings, { startDate: start }),
      members: JSON.parse(JSON.stringify(seed.members)),
      weeks: [],
      tasks: [],
      ideas: [],
      names: [],
      meta: { createdAt: new Date().toISOString(), lastLevel: 1, lastView: 'dashboard' }
    };

    seed.weeks.forEach(function (w, i) {
      var weekId = U.uid('w');
      st.weeks.push({
        id: weekId,
        emoji: w.emoji,
        title: w.title,
        objective: w.objective,
        description: w.description || '',
        criteria: w.criteria || '',
        criteriaDone: false,
        startDate: U.addDays(start, i * 7),
        endDate: U.addDays(start, i * 7 + 6)
      });

      (w.tasks || []).forEach(function (t, j) {
        st.tasks.push({
          id: U.uid('t'),
          weekId: weekId,
          name: t.t,
          description: t.d || '',
          notes: '',
          assignee: t.a || 'both',
          priority: t.p || 'media',
          category: t.c || 'Otro',
          status: 'pendiente',
          dueDate: U.addDays(start, i * 7 + 6),
          order: j,
          createdAt: new Date().toISOString(),
          completedAt: null
        });
      });
    });

    (seed.ideas || []).forEach(function (idea) {
      st.ideas.push({
        id: U.uid('i'), text: idea.text, category: idea.cat || 'Otro',
        done: false, createdAt: new Date().toISOString()
      });
    });

    return st;
  }

  /* ---------- NORMALIZACIÓN (datos viejos o importados) ---------- */
  function normalize(raw) {
    var st = raw || {};
    st.version = C.version;
    st.settings = Object.assign({}, APP.SEED.settings, st.settings || {});
    if (!st.settings.startDate) st.settings.startDate = U.todayISO();
    if (typeof st.settings.weekBonusXp !== 'number') st.settings.weekBonusXp = C.defaults.weekBonusXp;
    if (typeof st.settings.sound !== 'boolean') st.settings.sound = C.defaults.sound;
    if (typeof st.settings.showBoot !== 'boolean') st.settings.showBoot = C.defaults.showBoot;

    /* XP por prioridad configurable, guardado en settings */
    if (!st.settings.xpByPriority) {
      st.settings.xpByPriority = {};
      C.priorityOrder.forEach(function (p) { st.settings.xpByPriority[p] = C.priorities[p].xp; });
    }
    C.priorityOrder.forEach(function (p) {
      if (typeof st.settings.xpByPriority[p] !== 'number') st.settings.xpByPriority[p] = C.priorities[p].xp;
    });

    st.members = Array.isArray(st.members) && st.members.length
      ? st.members.map(function (m) {
          return { id: m.id || U.uid('m'), name: m.name || 'MIEMBRO', emoji: m.emoji || '👤' };
        })
      : JSON.parse(JSON.stringify(APP.SEED.members));

    st.weeks = (Array.isArray(st.weeks) ? st.weeks : []).map(function (w, i) {
      return {
        id: w.id || U.uid('w'),
        emoji: w.emoji || '⭐',
        title: w.title || ('SEMANA ' + (i + 1)),
        objective: w.objective || '',
        description: w.description || '',
        criteria: w.criteria || '',
        criteriaDone: !!w.criteriaDone,
        startDate: w.startDate || U.addDays(st.settings.startDate, i * 7),
        endDate: w.endDate || U.addDays(st.settings.startDate, i * 7 + 6)
      };
    });

    var weekIds = st.weeks.map(function (w) { return w.id; });
    var memberIds = st.members.map(function (m) { return m.id; });

    st.tasks = (Array.isArray(st.tasks) ? st.tasks : []).map(function (t, i) {
      var status = C.statuses[t.status] ? t.status : (t.done ? 'completada' : 'pendiente');
      return {
        id: t.id || U.uid('t'),
        weekId: weekIds.indexOf(t.weekId) >= 0 ? t.weekId : (weekIds[0] || null),
        name: t.name || 'Tarea sin nombre',
        description: t.description || '',
        notes: t.notes || '',
        assignee: memberIds.indexOf(t.assignee) >= 0 ? t.assignee : '',
        priority: C.priorities[t.priority] ? t.priority : 'media',
        category: t.category || 'Otro',
        status: status,
        dueDate: t.dueDate || '',
        order: typeof t.order === 'number' ? t.order : i,
        createdAt: t.createdAt || new Date().toISOString(),
        completedAt: t.completedAt || (status === 'completada' ? new Date().toISOString() : null)
      };
    }).filter(function (t) { return t.weekId; });

    st.ideas = (Array.isArray(st.ideas) ? st.ideas : []).map(function (o) {
      return {
        id: o.id || U.uid('i'), text: o.text || '', category: o.category || 'Otro',
        done: !!o.done, createdAt: o.createdAt || new Date().toISOString()
      };
    }).filter(function (o) { return o.text; });

    st.names = (Array.isArray(st.names) ? st.names : []).map(function (n) {
      return {
        id: n.id || U.uid('n'), text: n.text || '', note: n.note || '',
        fav: !!n.fav, createdAt: n.createdAt || new Date().toISOString()
      };
    }).filter(function (n) { return n.text; });

    st.meta = st.meta || {};
    if (typeof st.meta.lastLevel !== 'number') st.meta.lastLevel = 1;

    return st;
  }

  /* ---------- SELECTORES (solo leen) ---------- */
  var sel = {
    weeks: function () { return state.weeks; },

    weekIndex: function (weekId) {
      for (var i = 0; i < state.weeks.length; i++) if (state.weeks[i].id === weekId) return i;
      return -1;
    },
    week: function (weekId) {
      var i = sel.weekIndex(weekId);
      return i >= 0 ? state.weeks[i] : null;
    },
    weekNumber: function (weekId) { return sel.weekIndex(weekId) + 1; },

    task: function (id) {
      for (var i = 0; i < state.tasks.length; i++) if (state.tasks[i].id === id) return state.tasks[i];
      return null;
    },

    tasksOfWeek: function (weekId) {
      return state.tasks.filter(function (t) { return t.weekId === weekId; })
        .sort(function (a, b) { return a.order - b.order; });
    },

    isDone: function (task) { return !!(C.statuses[task.status] && C.statuses[task.status].done); },

    member: function (id) {
      for (var i = 0; i < state.members.length; i++) if (state.members[i].id === id) return state.members[i];
      return null;
    },
    memberLabel: function (id) {
      var m = sel.member(id);
      return m ? (m.emoji + ' ' + m.name) : '❔ SIN ASIGNAR';
    },

    weekProgress: function (weekId) {
      var list = sel.tasksOfWeek(weekId);
      var done = list.filter(sel.isDone).length;
      return { done: done, total: list.length, pct: U.pct(done, list.length) };
    },

    /* Una misión está CLEAR cuando todas sus tareas están hechas
       y (si tiene criterio escrito) el criterio está marcado. */
    isWeekClear: function (weekId) {
      var w = sel.week(weekId);
      if (!w) return false;
      var p = sel.weekProgress(weekId);
      if (p.total === 0) return false;
      if (p.done < p.total) return false;
      if (w.criteria && !w.criteriaDone) return false;
      return true;
    },

    clearedWeekIds: function () {
      return state.weeks.filter(function (w) { return sel.isWeekClear(w.id); }).map(function (w) { return w.id; });
    },

    globalProgress: function () {
      var done = state.tasks.filter(sel.isDone).length;
      return { done: done, total: state.tasks.length, pct: U.pct(done, state.tasks.length) };
    },

    xp: function () {
      var xpMap = state.settings.xpByPriority;
      var total = 0;
      state.tasks.forEach(function (t) {
        if (sel.isDone(t)) total += (xpMap[t.priority] || 0);
      });
      total += sel.clearedWeekIds().length * (state.settings.weekBonusXp || 0);
      return total;
    },

    levelInfo: function () {
      var xp = sel.xp();
      var levels = C.levels;
      var current = levels[0], next = null;
      for (var i = 0; i < levels.length; i++) {
        if (xp >= levels[i].xp) { current = levels[i]; next = levels[i + 1] || null; }
      }
      var floor = current.xp;
      var ceil = next ? next.xp : current.xp;
      var pct = next ? U.pct(xp - floor, ceil - floor) : 100;
      return {
        xp: xp, level: current.level, title: current.title,
        nextXp: next ? next.xp : null, pct: U.clamp(pct, 0, 100),
        isMax: !next
      };
    },

    /* Semana "actual": la primera que no está CLEAR */
    currentWeek: function () {
      for (var i = 0; i < state.weeks.length; i++) {
        if (!sel.isWeekClear(state.weeks[i].id)) return state.weeks[i];
      }
      return state.weeks[state.weeks.length - 1] || null;
    },

    counts: function () {
      var done = 0, open = 0, late = 0, today = U.todayISO();
      state.tasks.forEach(function (t) {
        if (sel.isDone(t)) { done++; return; }
        open++;
        if (t.dueDate && t.dueDate < today) late++;
      });
      return {
        tasksDone: done, tasksOpen: open, tasksLate: late,
        weeks: state.weeks.length,
        weeksClear: sel.clearedWeekIds().length,
        ideas: state.ideas.length,
        ideasDone: state.ideas.filter(function (i) { return i.done; }).length,
        names: state.names.length
      };
    },

    nextOrder: function (weekId) {
      var list = sel.tasksOfWeek(weekId);
      return list.length ? list[list.length - 1].order + 1 : 0;
    }
  };

  /* ---------- EVENTOS DE GAMIFICACIÓN ---------- */
  function snapshot() {
    return {
      level: sel.levelInfo().level,
      cleared: sel.clearedWeekIds(),
      xp: sel.xp()
    };
  }

  function diffEvents(before) {
    var after = snapshot();
    var events = [];

    after.cleared.forEach(function (id) {
      if (before.cleared.indexOf(id) < 0) {
        var w = sel.week(id);
        events.push({
          type: 'mission',
          text: 'SEMANA ' + U.pad2(sel.weekNumber(id)) + ' — ' + (w ? w.title : '') +
                ' · +' + (state.settings.weekBonusXp || 0) + ' XP'
        });
      }
    });

    if (after.level > before.level) {
      var info = sel.levelInfo();
      events.push({ type: 'level', text: 'EMPRENDIMIENTO LVL. ' + info.level + ' — ' + info.title });
    }

    return events;
  }

  /* Ejecuta una mutación y detecta misiones completadas / subidas de nivel */
  function mutate(fn) {
    var before = snapshot();
    var extra = fn() || [];
    var events = extra.concat(diffEvents(before));
    state.meta.lastLevel = sel.levelInfo().level;
    commit(events);
  }

  /* ---------- SUSCRIPCIÓN Y GUARDADO ---------- */
  var saveNow = function () { APP.storage.write(state); };
  var saveDebounced = U.debounce(saveNow, 250);

  function commit(events) {
    saveDebounced();
    pendingEvents = events || [];
    listeners.forEach(function (fn) { fn(state, pendingEvents); });
  }

  /* ============================================================
     ACCIONES PÚBLICAS
     ============================================================ */
  var api = {
    sel: sel,

    get state() { return state; },

    init: function () {
      var saved = APP.storage.read();
      state = normalize(saved || createInitial());
      if (!saved) saveNow();
      return state;
    },

    onChange: function (fn) { listeners.push(fn); },

    /* fuerza un redibujado sin cambiar datos */
    refresh: function () { commit([]); },

    save: saveNow,

    /* ---- CONFIGURACIÓN ---- */
    setSetting: function (key, value) {
      state.settings[key] = value;
      commit([]);
    },
    setXpRule: function (priority, value) {
      mutate(function () { state.settings.xpByPriority[priority] = Math.max(0, Number(value) || 0); });
    },

    /* ---- MIEMBROS ---- */
    addMember: function (name, emoji) {
      var m = { id: U.uid('m'), name: name || 'MIEMBRO', emoji: emoji || '👤' };
      state.members.push(m);
      commit([]);
      return m;
    },
    updateMember: function (id, patch) {
      var m = sel.member(id);
      if (!m) return;
      Object.assign(m, patch);
      commit([]);
    },
    removeMember: function (id) {
      state.members = state.members.filter(function (m) { return m.id !== id; });
      state.tasks.forEach(function (t) { if (t.assignee === id) t.assignee = ''; });
      commit([]);
    },

    /* ---- SEMANAS ---- */
    addWeek: function (data) {
      var last = state.weeks[state.weeks.length - 1];
      var start = last ? U.addDays(last.endDate || state.settings.startDate, 1)
                       : (state.settings.startDate || U.todayISO());
      var w = {
        id: U.uid('w'),
        emoji: (data && data.emoji) || '⭐',
        title: (data && data.title) || 'NUEVA MISIÓN',
        objective: (data && data.objective) || '',
        description: (data && data.description) || '',
        criteria: (data && data.criteria) || '',
        criteriaDone: false,
        startDate: (data && data.startDate) || start,
        endDate: (data && data.endDate) || U.addDays(start, 6)
      };
      state.weeks.push(w);
      commit([{ type: 'unlock', text: 'SEMANA ' + U.pad2(state.weeks.length) + ' — ' + w.title }]);
      return w;
    },

    updateWeek: function (id, patch) {
      mutate(function () {
        var w = sel.week(id);
        if (w) Object.assign(w, patch);
      });
    },

    toggleWeekCriteria: function (id) {
      mutate(function () {
        var w = sel.week(id);
        if (w) w.criteriaDone = !w.criteriaDone;
      });
    },

    removeWeek: function (id) {
      mutate(function () {
        state.weeks = state.weeks.filter(function (w) { return w.id !== id; });
        state.tasks = state.tasks.filter(function (t) { return t.weekId !== id; });
      });
    },

    moveWeek: function (id, dir) {
      var i = sel.weekIndex(id);
      var j = i + dir;
      if (i < 0 || j < 0 || j >= state.weeks.length) return;
      var tmp = state.weeks[i];
      state.weeks[i] = state.weeks[j];
      state.weeks[j] = tmp;
      commit([]);
    },

    /* Marca todas las tareas de una semana */
    completeWeekTasks: function (id, done) {
      mutate(function () {
        var events = [];
        sel.tasksOfWeek(id).forEach(function (t) {
          t.status = done ? 'completada' : 'pendiente';
          t.completedAt = done ? new Date().toISOString() : null;
        });
        return events;
      });
    },

    /* ---- TAREAS ---- */
    addTask: function (data) {
      var weekId = data.weekId || (state.weeks[0] && state.weeks[0].id);
      if (!weekId) return null;
      var t = {
        id: U.uid('t'),
        weekId: weekId,
        name: data.name || 'Nueva tarea',
        description: data.description || '',
        notes: data.notes || '',
        assignee: data.assignee || '',
        priority: C.priorities[data.priority] ? data.priority : 'media',
        category: data.category || 'Otro',
        status: C.statuses[data.status] ? data.status : 'pendiente',
        dueDate: data.dueDate || '',
        order: sel.nextOrder(weekId),
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      mutate(function () { state.tasks.push(t); return []; });
      return t;
    },

    updateTask: function (id, patch) {
      mutate(function () {
        var t = sel.task(id);
        if (!t) return [];
        var wasDone = sel.isDone(t);
        if (patch.weekId && patch.weekId !== t.weekId) {
          patch.order = sel.nextOrder(patch.weekId);
        }
        Object.assign(t, patch);
        var isDone = sel.isDone(t);
        if (isDone && !wasDone) {
          t.completedAt = new Date().toISOString();
          return [questEvent(t)];
        }
        if (!isDone && wasDone) t.completedAt = null;
        return [];
      });
    },

    toggleTask: function (id) {
      mutate(function () {
        var t = sel.task(id);
        if (!t) return [];
        if (sel.isDone(t)) {
          t.status = 'pendiente';
          t.completedAt = null;
          return [];
        }
        t.status = 'completada';
        t.completedAt = new Date().toISOString();
        return [questEvent(t)];
      });
    },

    duplicateTask: function (id) {
      var t = sel.task(id);
      if (!t) return;
      var copy = JSON.parse(JSON.stringify(t));
      copy.id = U.uid('t');
      copy.name = t.name + ' (copia)';
      copy.status = 'pendiente';
      copy.completedAt = null;
      copy.createdAt = new Date().toISOString();
      copy.order = sel.nextOrder(t.weekId);
      mutate(function () { state.tasks.push(copy); return []; });
      return copy;
    },

    removeTask: function (id) {
      mutate(function () {
        state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
      });
    },

    moveTask: function (id, dir) {
      var t = sel.task(id);
      if (!t) return;
      var list = sel.tasksOfWeek(t.weekId);
      var i = list.map(function (x) { return x.id; }).indexOf(id);
      var j = i + dir;
      if (j < 0 || j >= list.length) return;
      var a = list[i], b = list[j];
      var tmp = a.order; a.order = b.order; b.order = tmp;
      commit([]);
    },

    setTaskWeek: function (id, weekId) {
      api.updateTask(id, { weekId: weekId });
    },

    /* ---- IDEAS ---- */
    addIdea: function (text, category) {
      state.ideas.unshift({
        id: U.uid('i'), text: text, category: category || 'Otro',
        done: false, createdAt: new Date().toISOString()
      });
      commit([]);
    },
    updateIdea: function (id, patch) {
      state.ideas.forEach(function (i) { if (i.id === id) Object.assign(i, patch); });
      commit([]);
    },
    toggleIdea: function (id) {
      state.ideas.forEach(function (i) { if (i.id === id) i.done = !i.done; });
      commit([]);
    },
    removeIdea: function (id) {
      state.ideas = state.ideas.filter(function (i) { return i.id !== id; });
      commit([]);
    },

    /* ---- NOMBRES ---- */
    addName: function (text, note) {
      var exists = state.names.some(function (n) {
        return n.text.toLowerCase() === String(text).toLowerCase();
      });
      if (exists) return false;
      state.names.unshift({
        id: U.uid('n'), text: text, note: note || '',
        fav: false, createdAt: new Date().toISOString()
      });
      commit([]);
      return true;
    },
    toggleNameFav: function (id) {
      state.names.forEach(function (n) { if (n.id === id) n.fav = !n.fav; });
      commit([]);
    },
    removeName: function (id) {
      state.names = state.names.filter(function (n) { return n.id !== id; });
      commit([]);
    },
    useNameAsCompany: function (id) {
      var n = null;
      state.names.forEach(function (x) { if (x.id === id) n = x; });
      if (!n) return;
      state.settings.companyName = n.text;
      commit([{ type: 'info', text: 'La empresa ahora se llama ' + n.text }]);
    },

    /* ---- DATOS GLOBALES ---- */
    /* Reemplaza todo el estado. `evt` permite personalizar el aviso
       (lo usa la sala multijugador para decir quién hizo el cambio). */
    replaceState: function (raw, evt) {
      state = normalize(raw);
      saveNow();
      commit([evt || { type: 'info', text: 'Datos importados correctamente.' }]);
    },

    resetAll: function () {
      APP.storage.clear();
      state = normalize(createInitial());
      saveNow();
      commit([{ type: 'info', text: 'Partida reiniciada. Nueva aventura.' }]);
    },

    /* Reinstala las 8 semanas de fábrica conservando ideas, nombres y config */
    restoreSeedPlan: function () {
      var fresh = normalize(createInitial());
      fresh.settings = state.settings;
      fresh.members = state.members;
      fresh.ideas = state.ideas;
      fresh.names = state.names;
      state = fresh;
      saveNow();
      commit([{ type: 'info', text: 'Plan de 8 semanas restaurado.' }]);
    },

    exportData: function () { return APP.storage.exportFile(state); }
  };

  function questEvent(t) {
    var xp = state.settings.xpByPriority[t.priority] || 0;
    return { type: 'quest', text: t.name + ' · +' + xp + ' XP' };
  }

  return api;
})();
