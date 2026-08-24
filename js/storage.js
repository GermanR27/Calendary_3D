/* ============================================================
   storage.js — PERSISTENCIA
   Guardar / leer localStorage + exportar e importar JSON.
   No sabe nada de la interfaz ni de las reglas del juego.
   ============================================================ */

window.APP = window.APP || {};

APP.storage = {

  available: (function () {
    try {
      var k = '__p3dq_test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  })(),

  read: function () {
    if (!this.available) return null;
    try {
      var raw = window.localStorage.getItem(APP.CONFIG.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[storage] No se pudo leer el estado guardado:', e);
      return null;
    }
  },

  write: function (state) {
    if (!this.available) return false;
    try {
      window.localStorage.setItem(APP.CONFIG.storageKey, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('[storage] No se pudo guardar:', e);
      return false;
    }
  },

  clear: function () {
    if (!this.available) return;
    try { window.localStorage.removeItem(APP.CONFIG.storageKey); } catch (e) {}
  },

  /* Tamaño aproximado ocupado, para mostrarlo en CONFIG */
  size: function () {
    if (!this.available) return 0;
    var raw = window.localStorage.getItem(APP.CONFIG.storageKey);
    return raw ? raw.length : 0;
  },

  /* ---- EXPORTAR ---- */
  exportFile: function (state) {
    var payload = JSON.parse(JSON.stringify(state));
    payload._exportedAt = new Date().toISOString();
    payload._app = APP.CONFIG.appName;

    var text = JSON.stringify(payload, null, 2);
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);

    var slug = (state.settings.companyName || 'plan')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'plan';

    var a = document.createElement('a');
    a.href = url;
    a.download = slug + '-' + APP.util.todayISO() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    return a.download;
  },

  /* ---- IMPORTAR ---- */
  importFile: function (file, onOk, onError) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        if (!data || typeof data !== 'object' || !Array.isArray(data.weeks) || !Array.isArray(data.tasks)) {
          throw new Error('El archivo no tiene la estructura esperada (faltan "weeks" o "tasks").');
        }
        onOk(data);
      } catch (e) {
        onError(e.message || 'Archivo JSON inválido.');
      }
    };
    reader.onerror = function () { onError('No se pudo leer el archivo.'); };
    reader.readAsText(file);
  }
};
