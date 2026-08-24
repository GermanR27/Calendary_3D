/* ============================================================
   config.js — CONFIGURACIÓN DEL JUEGO
   Aquí viven las reglas y las listas fijas de la aplicación.
   Si quieres cambiar prioridades, estados, categorías, niveles
   o el XP base, este es el único archivo que hay que tocar.
   (El XP por prioridad también se puede editar desde CONFIG.)
   ============================================================ */

window.APP = window.APP || {};

APP.CONFIG = {
  appName: '3D PRINTING BUSINESS — QUEST PLANNER',
  version: 1,
  storageKey: 'p3dq_state_v1',

  /* ---- PRIORIDADES ---- */
  priorities: {
    critica: { id: 'critica', label: 'CRÍTICA', icon: '🔴', xp: 50, order: 0 },
    alta:    { id: 'alta',    label: 'ALTA',    icon: '🟠', xp: 30, order: 1 },
    media:   { id: 'media',   label: 'MEDIA',   icon: '🟡', xp: 20, order: 2 },
    baja:    { id: 'baja',    label: 'BAJA',    icon: '🟢', xp: 10, order: 3 }
  },
  priorityOrder: ['critica', 'alta', 'media', 'baja'],

  /* ---- ESTADOS DE TAREA ---- */
  statuses: {
    pendiente:  { id: 'pendiente',  label: 'PENDIENTE',   icon: '○', done: false },
    progreso:   { id: 'progreso',   label: 'EN PROGRESO', icon: '◐', done: false },
    bloqueada:  { id: 'bloqueada',  label: 'BLOQUEADA',   icon: '✖', done: false },
    completada: { id: 'completada', label: 'COMPLETADA',  icon: '✓', done: true }
  },
  statusOrder: ['pendiente', 'progreso', 'bloqueada', 'completada'],

  /* ---- CATEGORÍAS DE TAREA ---- */
  categories: [
    'Estrategia', 'Marca', 'Costos', 'Producto', 'Operaciones',
    'Marketing', 'Ventas', 'Análisis', 'Equipo', 'Compras', 'Otro'
  ],

  /* ---- TIPOS DE IDEA ---- */
  ideaCategories: [
    'Producto', 'Cliente potencial', 'Marketing', 'Servicio',
    'Mejora', 'Equipo a comprar', 'Redes sociales', 'Otro'
  ],

  /* ---- NIVELES DEL EMPRENDIMIENTO ---- */
  levels: [
    { level: 1,  xp: 0,    title: 'APRENDIZ DEL FILAMENTO' },
    { level: 2,  xp: 200,  title: 'MAKER NOVATO' },
    { level: 3,  xp: 450,  title: 'OPERADOR DE TALLER' },
    { level: 4,  xp: 750,  title: 'ARTESANO DIGITAL' },
    { level: 5,  xp: 1100, title: 'INGENIERO DE CAPAS' },
    { level: 6,  xp: 1500, title: 'MAESTRO DEL SLICER' },
    { level: 7,  xp: 1950, title: 'FABRICANTE INDEPENDIENTE' },
    { level: 8,  xp: 2450, title: 'JEFE DE PRODUCCIÓN' },
    { level: 9,  xp: 3000, title: 'ESTRATEGA DE TALLER' },
    { level: 10, xp: 3600, title: 'EMPRESARIO MAKER' },
    { level: 11, xp: 4300, title: 'LEYENDA DEL PLA' },
    { level: 12, xp: 5100, title: 'GRAN MAESTRO 3D' }
  ],

  /* ---- REGLAS POR DEFECTO (editables desde CONFIG) ---- */
  defaults: {
    weekBonusXp: 100,
    sound: true,
    showBoot: true
  },

  /* ---- MENSAJES DE GAMIFICACIÓN ---- */
  fx: {
    quest:   { title: '✓ QUEST COMPLETE!',  cls: 't-quest' },
    mission: { title: '★ MISSION CLEAR!',   cls: 't-mission' },
    level:   { title: '⬆ LEVEL UP!',        cls: 't-level' },
    unlock:  { title: '🔓 MISSION UNLOCKED', cls: 't-mission' },
    info:    { title: 'ℹ SISTEMA',          cls: '' },
    error:   { title: '✖ ERROR',            cls: 't-error' }
  }
};

/* Utilidades pequeñas compartidas por todos los módulos */
APP.util = {
  uid: function (prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' +
      Math.random().toString(36).slice(2, 8);
  },

  /* Escapa HTML: TODO texto escrito por el usuario pasa por aquí */
  esc: function (str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  clamp: function (n, min, max) { return Math.max(min, Math.min(max, n)); },

  pad2: function (n) { return String(n).padStart(2, '0'); },

  /* "2026-08-24" -> "24 ago" */
  shortDate: function (iso) {
    if (!iso) return '';
    var d = APP.util.parseDate(iso);
    if (!d) return '';
    var m = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return d.getDate() + ' ' + m[d.getMonth()];
  },

  parseDate: function (iso) {
    if (!iso) return null;
    var p = String(iso).split('-');
    if (p.length !== 3) return null;
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return isNaN(d.getTime()) ? null : d;
  },

  toISO: function (d) {
    return d.getFullYear() + '-' + APP.util.pad2(d.getMonth() + 1) + '-' + APP.util.pad2(d.getDate());
  },

  addDays: function (iso, days) {
    var d = APP.util.parseDate(iso) || new Date();
    d.setDate(d.getDate() + days);
    return APP.util.toISO(d);
  },

  todayISO: function () { return APP.util.toISO(new Date()); },

  /* días restantes: negativo = vencida */
  daysLeft: function (iso) {
    var d = APP.util.parseDate(iso);
    if (!d) return null;
    var t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((d - t) / 86400000);
  },

  /* barra de bloques tipo ████░░░░ */
  blocks: function (pct, total) {
    total = total || 12;
    var filled = Math.round((pct / 100) * total);
    return '█'.repeat(filled) + '░'.repeat(Math.max(0, total - filled));
  },

  pct: function (done, total) {
    if (!total) return 0;
    return Math.round((done / total) * 100);
  },

  debounce: function (fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }
};
