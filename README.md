# 🖨️ 3D PRINTING BUSINESS — QUEST PLANNER

Centro de planificación gamificado para un emprendimiento de impresión 3D por encargo.
Tu plan de trabajo presentado como un **videojuego japonés de misiones**: pixel art, paneles tipo RPG, XP, niveles y *MISSION CLEAR*.

Hecho para **2 socios** y **una Bambu Lab A1 Mini**, pero todo (semanas, tareas, responsables, metas, nombre de la empresa) es **editable desde la propia interfaz**. Nada está escrito a fuego en el código.

---

## 1. ¿Qué es?

Una aplicación web **estática** (HTML + CSS + JavaScript puro, sin frameworks, sin backend, sin `npm install`) que organiza las primeras semanas del negocio:

| Sección | Para qué sirve |
|---|---|
| 🏠 **Dashboard** | Nivel, XP, progreso global, semana actual, tareas vencidas y reparto del equipo. |
| 🗺️ **Misiones** | Las semanas como *quests*: objetivo, criterio de misión cumplida, progreso y tareas. |
| ⚔️ **Tareas** | Todas las tareas con filtros por responsable, semana, prioridad, estado y búsqueda. |
| 💡 **Idea Bank** | Productos, clientes potenciales, marketing, mejoras y equipo que queremos comprar. |
| ✨ **Nombres** | Generador de nombres de marca + tu propia lista de candidatos. |
| ⚙️ **Editar Plan** | Crear, reordenar, editar y borrar semanas; mover tareas entre semanas. |
| 🎛️ **Config** | Datos de la empresa, equipo, metas, reglas de XP, respaldo y **sala multijugador**. |

Viene cargada con un **plan de 8 semanas y 76 tareas** (cimientos → marca → costos → catálogo → pedidos → lanzamiento → análisis → siguiente etapa), pero puedes ampliarlo a 10, 12 o 20 semanas desde la app.

---

## 2. Cómo funciona

- **Progreso automático.** Ningún porcentaje se escribe a mano: se calcula a partir de las tareas completadas (por tarea → por semana → global).
- **XP y niveles.** Cada tarea completada da XP según su prioridad (🟢 BAJA 10 · 🟡 MEDIA 20 · 🟠 ALTA 30 · 🔴 CRÍTICA 50) y cada misión completada da un bono (100 XP por defecto). Los valores se pueden cambiar en CONFIG.
- **MISSION CLEAR.** Una semana se declara completada cuando **todas sus tareas están hechas** *y* está marcado su **🏆 criterio de misión cumplida** (ej: *"Podemos cotizar cualquier pieza en menos de 5 minutos"*).
- **Guardado.** Todo se guarda solo en el `localStorage` del navegador. Al cerrar y volver a abrir, sigue ahí.
- **Respaldo.** `EXPORTAR DATOS` descarga un `.json` con todo; `IMPORTAR DATOS` lo restaura.
- **Sala multijugador (opcional).** Ver la sección 6: permite que los dos socios editen el mismo plan y vean los cambios **en tiempo real**.

---

## 3. Estructura de archivos

```
FINAL_GITHUB_UPLOAD/
│
├── index.html          Estructura de la app (pantalla de inicio, vistas, modal)
├── style.css           Toda la estética pixel art / manga / RPG
├── README.md           Este archivo
│
├── js/
│   ├── config.js       Reglas del juego: prioridades, estados, categorías, niveles, utilidades
│   ├── data.js         DATOS: el plan inicial de 8 semanas y el banco de palabras de nombres
│   ├── storage.js      localStorage + exportar / importar JSON
│   ├── state.js        Estado y lógica: crear, editar, borrar, calcular progreso y XP
│   ├── sync.js         Sala multijugador en tiempo real (opcional, vía Firebase)
│   ├── ui.js           Dibuja la interfaz (solo lee datos, nunca los modifica)
│   └── app.js          Eventos, modales, avisos QUEST COMPLETE / LEVEL UP, generador de nombres
│
└── assets/
    ├── images/         printer.svg (impresora pixel art) · favicon.svg
    └── icons/          quest.svg · spool.svg · level.svg
```

La separación es a propósito: **datos** (`data.js`), **lógica** (`state.js`), **interfaz** (`ui.js`) y **configuración** (`config.js`) están aparte, para poder añadir en el futuro calculadora de cotizaciones, inventario, clientes o finanzas sin reescribir nada.

> Las fuentes retro (*Press Start 2P* y *VT323*) se cargan desde Google Fonts por CDN. Si no hay internet, la app funciona igual con una fuente monoespaciada de reserva.

---

## 4. Cómo subirlo a GitHub **sin usar la terminal**

1. Entra en [github.com](https://github.com) e inicia sesión.
2. Arriba a la derecha pulsa **+ → New repository**.
3. Ponle un nombre (por ejemplo `3d-business-planner`), déjalo **Public** y **no marques** "Add a README file" (ya tienes uno).
4. Pulsa **Create repository**.
5. En la página que aparece, haz clic en el enlace **uploading an existing file**
   (o entra al repo y usa **Add file → Upload files**).
6. Abre la carpeta `FINAL_GITHUB_UPLOAD` en tu explorador de archivos y **arrastra a la ventana del navegador**:
   - el archivo `index.html`
   - el archivo `style.css`
   - el archivo `README.md`
   - la carpeta `js`
   - la carpeta `assets`

   > ⚠️ Arrastra el **contenido** de `FINAL_GITHUB_UPLOAD`, no la carpeta entera. En el repositorio, `index.html` debe quedar en la raíz.
   > Arrastrando carpetas, GitHub conserva la estructura interna automáticamente.
7. Abajo escribe un mensaje (ej: `Primera versión del planner`) y pulsa **Commit changes**.

Listo: el repositorio ya tiene el proyecto.

---

## 5. Cómo conectarlo con Vercel

1. Entra en [vercel.com](https://vercel.com) y pulsa **Sign up** / **Log in** → **Continue with GitHub**.
2. En el panel, pulsa **Add New… → Project**.
3. Busca tu repositorio (`3d-business-planner`) y pulsa **Import**.
4. Vercel detectará que es un sitio estático. **No cambies nada**:
   - Framework Preset: `Other`
   - Build Command: *(vacío)*
   - Output Directory: *(vacío)* o `.`
   - Install Command: *(vacío)*
5. Pulsa **Deploy** y espera unos segundos.
6. Te dará una URL tipo `https://3d-business-planner.vercel.app`. Ábrela: ahí está la app.

A partir de ahora, **cada vez que subas archivos nuevos a GitHub, Vercel vuelve a desplegar solo**.

---

## 6. 🌐 Sala multijugador: editar el plan entre varios, en tiempo real

Por defecto la app es local: cada navegador guarda su propia copia. Para que **los dos socios trabajen sobre el mismo plan y vean los cambios al instante**, hay que conectarla a una base de datos en tiempo real. Se hace **una sola vez**, desde la web, sin terminal.

### Crear la base de datos (5 minutos, gratis)

1. Entra en [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google.
2. **Crear un proyecto** → ponle un nombre → puedes desactivar Google Analytics → **Crear**.
3. En el menú lateral: **Compilación → Realtime Database** (⚠️ *Realtime Database*, **no** Firestore) → **Crear base de datos** → elige región → empieza en **modo de prueba**.
4. Ve a **⚙ Configuración del proyecto → Tus apps → Web `</>`**, registra la app con cualquier apodo y **copia el bloque `firebaseConfig`** completo.

### Conectar la app

1. Abre la app y pulsa el botón **🌐 LOCAL** de la barra superior (o CONFIG → **CONFIGURAR SALA**).
2. Rellena:
   - **Tu nombre en la sala** (ej: `GERMÁN`) — es el que verá tu socio cuando hagas cambios.
   - **Código de sala** — invéntalo y que sea **difícil de adivinar** (ej: `taller3d-x7k2-9f`). Los dos socios deben usar **exactamente el mismo**.
   - **Configuración de Firebase** — pega el bloque tal cual, con llaves y todo.
3. Pulsa **CONECTAR**. El botón pasará a **🟢 SALA** con el número de personas conectadas.
4. Pásale a tu socio: la **URL de Vercel**, la **misma configuración** y el **mismo código de sala**.

Desde ese momento: si alguien marca una tarea, crea una semana o cambia una prioridad, al resto le aparece sola con un aviso *"🌐 SOCIO 2 actualizó el plan"*.

### Dejar las reglas permanentes

El "modo de prueba" de Firebase **caduca a los 30 días**. Antes de que pase, ve a **Realtime Database → Reglas**, pega esto y pulsa **Publicar**:

```json
{
  "rules": {
    "rooms": {
      "$sala": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

⚠️ Con estas reglas, **cualquiera que conozca el código de sala puede leer y escribir** el plan. Para un plan de trabajo interno es aceptable; no guardes ahí datos personales de clientes. Si más adelante queréis control de acceso real, habría que añadir autenticación de Firebase (eso ya requiere más trabajo).

---

## 7. Cómo modificar tareas y semanas desde la app

**Una tarea** — en ⚔️ TAREAS o dentro de una misión:

| Quiero… | Cómo |
|---|---|
| Completarla | Clic en la casilla ✓ de la izquierda (suma XP al instante). |
| Editarla | Botón ✎ → cambia nombre, descripción, semana, responsable, prioridad, fecha, categoría, estado y notas. |
| Duplicarla | Botón ⧉ |
| Eliminarla | Botón ✖ |
| Crear una nueva | Botón **+ NUEVA TAREA** (arriba a la derecha, o dentro de cada misión). |
| Cambiarla de semana | Botón ✎ → campo *SEMANA / MISIÓN*; o en ⚙️ EDITAR PLAN con el desplegable de cada tarea. |
| Reordenarla | En ⚙️ EDITAR PLAN, botones ▲ ▼. |

**Una semana / misión** — en ⚙️ EDITAR PLAN:

- **+ AGREGAR SEMANA** para ampliar el plan (8 → 10 → 12 → 20…).
- **✎** para editar icono, nombre, objetivo, descripción, criterio de misión cumplida y fechas.
- **▲ ▼** para reordenar (se renumeran solas).
- **✖** para eliminar (borra también sus tareas, con confirmación).

**El equipo, las metas y el nombre de la empresa** están en 🎛️ CONFIG. Puedes renombrar SOCIO 1 / SOCIO 2, añadir más miembros y cambiar el XP que da cada prioridad.

---

## 8. Limitaciones de esta primera versión

- **Sin login ni usuarios.** Quien tenga la URL (y el código de sala, si la usas) entra y edita.
- **Modo local = un navegador.** Sin sala multijugador, los datos **no** viajan entre tu PC y tu móvil: usa EXPORTAR / IMPORTAR o conecta la sala.
- **Borrar los datos del navegador borra el plan.** Exporta el JSON de vez en cuando.
- **Conflictos en la sala: gana el último que escribe.** Si los dos editan *la misma tarea* en el mismo segundo, queda el cambio más reciente. Con 2-4 personas trabajando en cosas distintas no es un problema real.
- **La sala depende de Firebase.** Si no lo configuras, la app sigue funcionando perfectamente en local.
- **No incluye todavía** calculadora de cotizaciones, inventario, registro de pedidos, clientes ni finanzas. La estructura del código ya está preparada para añadirlos como secciones nuevas.
- **Sin deshacer (undo).** Las eliminaciones piden confirmación, pero no se pueden revertir.

---

## 9. Si quieres cambiar el código más adelante

- El **plan inicial** (el que se restaura con `↺ RESTAURAR PLAN DE 8 SEMANAS`) está en `js/data.js`.
- Los **niveles, títulos, prioridades, estados y categorías**, en `js/config.js`.
- Los **colores y la estética**, en las variables `:root` del principio de `style.css`.

Para editar un archivo desde la web: entra al repositorio en GitHub, abre el archivo, pulsa el lápiz ✏️, edita y pulsa **Commit changes**. Vercel lo redespliega solo.

---

*A small machine. A big idea.* 🖨️✨
