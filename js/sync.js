/* ============================================================
   sync.js — SALA MULTIJUGADOR (SINCRONIZACIÓN EN TIEMPO REAL)

   Permite que varias personas editen el mismo plan a la vez y
   vean los cambios al instante, sin backend propio y sin
   terminal: se apoya en Firebase Realtime Database, que se
   configura desde la consola web de Firebase.

   · Si NO se configura nada, la app funciona igual que antes
     (100% local con localStorage). Este módulo queda dormido.
   · La configuración de la sala se guarda en una clave APARTE
     del localStorage, así cada dispositivo tiene la suya.
   · El documento se guarda como TEXTO JSON en:
         rooms/<sala>/doc
     y la presencia de cada persona en:
         rooms/<sala>/presence/<clienteId>
     Guardarlo como texto evita los problemas de Firebase con
     los arrays vacíos y hace que cada guardado sea atómico.

   ESTRATEGIA DE CONFLICTOS: gana el último que escribe
   (last-write-wins) sobre el documento completo. Con 2-4
   personas es suficiente; si dos tocan la MISMA tarea en el
   mismo segundo, el último cambio es el que queda.
   ============================================================ */

window.APP = window.APP || {};

APP.sync = (function () {

  var U = APP.util;

  var SDK = [
    'https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js'
  ];

  var CFG_KEY = 'p3dq_sync_v1';

  var conf = { config: null, room: '', nick: '', auto: false };
  var clientId = null;
  var app = null, db = null, docRef = null, presRef = null, myPresRef = null, connRef = null;
  var status = 'off';           /* off | connecting | online | error */
  var lastError = '';
  var peers = [];
  var applyingRemote = false;
  var seenFirstSnapshot = false;
  var lastPushedJson = '';

  /* callbacks que rellena app.js */
  var hooks = {
    onStatus: function () {},
    onRemote: function () {},
    onPeers: function () {},
    onConflict: null            /* (remoteState, decide) -> decide('remote'|'local') */
  };

  /* ---------- CONFIG LOCAL DE LA SALA ---------- */
  function loadConf() {
    try {
      var raw = localStorage.getItem(CFG_KEY);
      if (raw) conf = Object.assign(conf, JSON.parse(raw));
    } catch (e) {}
    try {
      clientId = localStorage.getItem(CFG_KEY + '_cid');
      if (!clientId) {
        clientId = U.uid('c');
        localStorage.setItem(CFG_KEY + '_cid', clientId);
      }
    } catch (e) { clientId = U.uid('c'); }
    return conf;
  }

  function saveConf() {
    try { localStorage.setItem(CFG_KEY, JSON.stringify(conf)); } catch (e) {}
  }

  /* ---------- PARSEO AMABLE DE LA CONFIG DE FIREBASE ----------
     Acepta que el usuario pegue tal cual el bloque que muestra
     la consola de Firebase (con claves sin comillas, comentarios,
     "const firebaseConfig =", punto y coma final, etc.).        */
  function parseFirebaseConfig(text) {
    if (!text) throw new Error('Pega la configuración de Firebase.');
    if (typeof text === 'object') return text;

    var s = String(text);
    /* comentarios de línea, sin romper las URLs "https://..." */
    s = s.replace(/(^|[^:])\/\/[^\n\r]*/g, '$1');
    s = s.replace(/\/\*[\s\S]*?\*\//g, '');        /* comentarios de bloque */

    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b < 0) throw new Error('No encuentro el bloque { ... } de la configuración.');
    s = s.slice(a, b + 1);

    s = s.replace(/'/g, '"');                      /* comillas simples -> dobles */
    s = s.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":');  /* claves sin comillas */
    s = s.replace(/,(\s*[}\]])/g, '$1');           /* comas colgantes */

    var obj;
    try { obj = JSON.parse(s); }
    catch (e) { throw new Error('La configuración no se pudo leer. Cópiala completa desde la consola de Firebase.'); }

    if (!obj.apiKey) throw new Error('Falta "apiKey" en la configuración.');
    if (!obj.databaseURL) {
      throw new Error('Falta "databaseURL". Debes crear una REALTIME DATABASE (no Firestore) en la consola de Firebase.');
    }
    return obj;
  }

  /* ---------- CARGA DEL SDK ---------- */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-sdk="' + src + '"]')) return resolve();
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-sdk', src);
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('No se pudo cargar el SDK de Firebase (¿sin internet?).')); };
      document.head.appendChild(s);
    });
  }

  function loadSDK() {
    if (window.firebase && window.firebase.database) return Promise.resolve();
    return loadScript(SDK[0]).then(function () { return loadScript(SDK[1]); });
  }

  /* ---------- ESTADO ---------- */
  function setStatus(next, err) {
    status = next;
    lastError = err || '';
    hooks.onStatus(status, lastError, info());
  }

  function info() {
    return {
      status: status,
      error: lastError,
      room: conf.room,
      nick: conf.nick,
      clientId: clientId,
      peers: peers.slice(),
      configured: !!(conf.config && conf.room)
    };
  }

  /* ---------- CONEXIÓN ---------- */
  function connect(options) {
    options = options || {};
    try {
      if (options.configText !== undefined) conf.config = parseFirebaseConfig(options.configText);
      if (options.room !== undefined) conf.room = String(options.room || '').trim();
      if (options.nick !== undefined) conf.nick = String(options.nick || '').trim();
    } catch (e) {
      setStatus('error', e.message);
      return Promise.reject(e);
    }

    if (!conf.config) { setStatus('error', 'Falta la configuración de Firebase.'); return Promise.reject(new Error('sin config')); }
    if (!conf.room) { setStatus('error', 'Falta el código de sala.'); return Promise.reject(new Error('sin sala')); }
    if (!conf.nick) conf.nick = 'SOCIO';

    conf.auto = true;
    saveConf();
    setStatus('connecting');

    return loadSDK().then(function () {
      var fb = window.firebase;
      if (!app) {
        app = fb.apps && fb.apps.length ? fb.app() : fb.initializeApp(conf.config);
      }
      db = fb.database(app);

      var roomPath = 'rooms/' + safeRoom(conf.room);
      docRef = db.ref(roomPath + '/doc');
      presRef = db.ref(roomPath + '/presence');
      myPresRef = presRef.child(clientId);
      connRef = db.ref('.info/connected');

      /* presencia */
      connRef.on('value', function (snap) {
        if (snap.val() === true) {
          myPresRef.onDisconnect().remove();
          myPresRef.set({ nick: conf.nick, at: Date.now() });
          setStatus('online');
        } else if (status === 'online') {
          setStatus('connecting');
        }
      });

      presRef.on('value', function (snap) {
        var v = snap.val() || {};
        peers = Object.keys(v).map(function (k) {
          return { id: k, nick: (v[k] && v[k].nick) || '?', me: k === clientId };
        });
        hooks.onPeers(peers);
      });

      /* documento compartido */
      docRef.on('value', onDocSnapshot, function (err) {
        setStatus('error', 'Firebase rechazó la lectura: ' + err.message + ' (revisa las reglas de la base de datos).');
      });

      return true;
    }).catch(function (e) {
      setStatus('error', e.message || 'Error de conexión.');
      throw e;
    });
  }

  function safeRoom(room) {
    return String(room).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'sala';
  }

  function onDocSnapshot(snap) {
    var val = snap.val();

    /* La sala está vacía: subimos nuestro plan como punto de partida */
    if (!val || !val.json) {
      seenFirstSnapshot = true;
      push(APP.store.state, true);
      return;
    }

    var remoteState;
    try { remoteState = JSON.parse(val.json); }
    catch (e) { setStatus('error', 'El documento de la sala está corrupto.'); return; }

    /* Es nuestro propio cambio rebotando: ignorar */
    if (val.by === clientId) {
      seenFirstSnapshot = true;
      setStatus('online');
      return;
    }

    if (!seenFirstSnapshot) {
      seenFirstSnapshot = true;
      /* Primera vez que entramos y la sala YA tiene datos:
         preguntamos qué plan conservar para no borrar trabajo. */
      if (hooks.onConflict) {
        hooks.onConflict(remoteState, val, function (choice) {
          if (choice === 'local') push(APP.store.state, true);
          else applyRemote(remoteState, val);
        });
        return;
      }
    }

    applyRemote(remoteState, val);
  }

  function applyRemote(remoteState, meta) {
    applyingRemote = true;
    try {
      lastPushedJson = JSON.stringify(remoteState);
      hooks.onRemote(remoteState, meta || {});
    } finally {
      setTimeout(function () { applyingRemote = false; }, 60);
    }
    setStatus('online');
  }

  /* ---------- ENVÍO ---------- */
  var pushTimer = null;

  function writeDoc(json) {
    lastPushedJson = json;
    docRef.set({
      json: json,
      by: clientId,
      byName: conf.nick,
      at: Date.now(),
      v: APP.CONFIG.version
    }).catch(function (err) {
      setStatus('error', 'No se pudo guardar en la sala: ' + err.message);
    });
  }

  /* Envía SIEMPRE la versión más reciente del estado. Si en ese
     instante estamos aplicando un cambio remoto, no se descarta:
     se reintenta poco después para no perder la edición local. */
  function flushPush() {
    pushTimer = null;
    if (!docRef || status === 'off') return;
    if (applyingRemote) { pushTimer = setTimeout(flushPush, 150); return; }
    var json = JSON.stringify(APP.store.state);
    if (json === lastPushedJson) return;
    writeDoc(json);
  }

  function push(state, immediate) {
    if (!docRef || status === 'off') return;

    if (immediate) {
      var json = JSON.stringify(state || APP.store.state);
      if (json === lastPushedJson) return;
      writeDoc(json);
      return;
    }

    /* como mucho un envío cada 500 ms, aunque se toquen 20 tareas seguidas */
    if (pushTimer) return;
    pushTimer = setTimeout(flushPush, 500);
  }

  function disconnect(forget) {
    clearTimeout(pushTimer);
    pushTimer = null;
    try {
      if (docRef) docRef.off();
      if (presRef) presRef.off();
      if (connRef) connRef.off();
      if (myPresRef) myPresRef.remove();
    } catch (e) {}
    docRef = presRef = connRef = myPresRef = null;
    peers = [];
    seenFirstSnapshot = false;
    lastPushedJson = '';
    conf.auto = false;
    if (forget) { conf.config = null; conf.room = ''; }
    saveConf();
    hooks.onPeers(peers);
    setStatus('off');
  }

  /* ---------- API ---------- */
  return {
    init: function (h) {
      Object.assign(hooks, h || {});
      loadConf();
      setStatus('off');
      if (conf.auto && conf.config && conf.room) {
        connect({}).catch(function () {});
      }
      return info();
    },
    connect: connect,
    disconnect: disconnect,
    push: push,
    info: info,
    conf: function () { return conf; },
    isBusy: function () { return applyingRemote; },
    parseFirebaseConfig: parseFirebaseConfig
  };
})();
