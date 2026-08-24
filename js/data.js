/* ============================================================
   data.js — DATOS INICIALES (SEMILLA DEL PLAN)
   Este archivo SOLO contiene datos, nunca lógica de interfaz.
   Se usa la primera vez que abres la app (o al pulsar
   "RESTAURAR PLAN DE 8 SEMANAS"). Después, todo lo que edites
   vive en localStorage y este archivo deja de mandar.

   Formato de una tarea semilla:
     { t: 'Nombre', p: 'critica|alta|media|baja',
       a: 'm1|m2|both', c: 'Categoría', d: 'descripción opcional' }
   ============================================================ */

window.APP = window.APP || {};

APP.SEED = {

  /* ---- CONFIGURACIÓN INICIAL DE LA EMPRESA (todo editable) ---- */
  settings: {
    companyName: '3D PRINTING BUSINESS',
    tagline: 'Nuestro camino para convertir una impresora 3D en un negocio.',
    description: 'Emprendimiento de impresión 3D por encargo. Dos socios, una Bambu Lab A1 Mini y muchas ganas de fabricar.',
    quote: 'A small machine. A big idea.',
    startDate: null,            // se calcula al crear el estado (hoy)
    currency: 'COP',
    initialGoal: 'Conseguir nuestros primeros 5 clientes reales.',
    clientGoal: 5,
    revenueGoal: 500000,
    printers: 'Bambu Lab A1 Mini',
    weekBonusXp: 100,
    sound: true,
    showBoot: true
  },

  /* ---- RESPONSABLES INICIALES ---- */
  members: [
    { id: 'm1',   name: 'SOCIO 1', emoji: '👤' },
    { id: 'm2',   name: 'SOCIO 2', emoji: '👤' },
    { id: 'both', name: 'AMBOS',   emoji: '🤝' }
  ],

  /* ---- LAS 8 MISIONES INICIALES ---- */
  weeks: [
    {
      emoji: '🧱',
      title: 'LOS CIMIENTOS',
      objective: 'Definir qué queremos construir antes de comenzar a vender.',
      description: 'Nada de imprimir por imprimir. Primero decidimos qué somos, para quién trabajamos y qué NO vamos a hacer todavía.',
      criteria: 'Podemos explicar en una sola frase qué vendemos, a quién y con qué presupuesto.',
      tasks: [
        { t: 'Definir qué tipo de impresión ofreceremos', p: 'critica', a: 'both', c: 'Estrategia', d: 'Decorativo, funcional, piezas técnicas, personalizados, prototipos... elegir el foco inicial.' },
        { t: 'Definir nuestro cliente inicial', p: 'critica', a: 'both', c: 'Estrategia', d: 'Estudiantes, makers, pequeños negocios, ingenieros, gente que necesita repuestos.' },
        { t: 'Definir qué NO fabricaremos inicialmente', p: 'alta', a: 'both', c: 'Estrategia', d: 'Piezas enormes, materiales exóticos, encargos con plazos imposibles.' },
        { t: 'Crear lluvia de ideas de 20 productos', p: 'alta', a: 'both', c: 'Producto', d: 'Cantidad antes que calidad. Después filtramos.' },
        { t: 'Investigar competidores locales', p: 'alta', a: 'm1', c: 'Análisis', d: 'Qué venden, a qué precio, cómo se comunican, qué les falta.' },
        { t: 'Pensar nombres para la empresa', p: 'media', a: 'both', c: 'Marca', d: 'Usa la sección GENERADOR DE NOMBRES de esta app.' },
        { t: 'Definir presupuesto inicial', p: 'critica', a: 'm2', c: 'Costos', d: 'Cuánto dinero podemos poner cada uno y hasta dónde llega.' },
        { t: 'Definir responsabilidades entre los dos socios', p: 'critica', a: 'both', c: 'Equipo', d: 'Quién imprime, quién vende, quién atiende clientes, quién lleva las cuentas.' }
      ]
    },
    {
      emoji: '🎨',
      title: 'MARCA + IDENTIDAD',
      objective: 'Crear una identidad para el emprendimiento.',
      description: 'Que se vea como un negocio de verdad desde el primer mensaje. Nombre, logo, colores y perfiles.',
      criteria: 'Tenemos nombre, logo, colores y perfiles publicados y listos para usar.',
      tasks: [
        { t: 'Elegir nombre definitivo', p: 'critica', a: 'both', c: 'Marca', d: 'Escoger de la lista guardada en el generador de nombres.' },
        { t: 'Revisar disponibilidad del nombre en redes', p: 'alta', a: 'm1', c: 'Marca', d: 'Instagram, TikTok, Facebook, X. Que el @ esté libre.' },
        { t: 'Revisar disponibilidad de dominio', p: 'media', a: 'm1', c: 'Marca' },
        { t: 'Definir logo', p: 'alta', a: 'm2', c: 'Marca', d: 'Simple, que se vea bien pequeño y en una sola tinta.' },
        { t: 'Definir colores de marca', p: 'media', a: 'm2', c: 'Marca' },
        { t: 'Definir tipografía', p: 'baja', a: 'm2', c: 'Marca' },
        { t: 'Crear cuenta de Instagram', p: 'alta', a: 'm1', c: 'Marketing' },
        { t: 'Crear TikTok si tiene sentido', p: 'baja', a: 'm1', c: 'Marketing', d: 'Solo si vamos a grabar el proceso de impresión.' },
        { t: 'Crear correo empresarial', p: 'media', a: 'm2', c: 'Operaciones' },
        { t: 'Definir descripción de la empresa', p: 'alta', a: 'both', c: 'Marca', d: 'Una bio de 150 caracteres que explique qué hacemos.' },
        { t: 'Definir tono de comunicación', p: 'media', a: 'both', c: 'Marca', d: 'Cercano, técnico, divertido... y ser consistentes.' }
      ]
    },
    {
      emoji: '🧮',
      title: 'SABER CUÁNTO CUESTA IMPRIMIR',
      objective: 'Conocer nuestro costo real de producción.',
      description: 'Sin esto vendemos a ciegas. El objetivo es una fórmula escrita que cualquiera de los dos pueda aplicar.',
      criteria: 'Podemos calcular el costo real y el precio de venta de cualquier pieza con una fórmula escrita.',
      tasks: [
        { t: 'Determinar precio real del filamento por gramo', p: 'critica', a: 'm2', c: 'Costos' },
        { t: 'Estimar consumo eléctrico por hora de impresión', p: 'alta', a: 'm2', c: 'Costos' },
        { t: 'Definir costo por hora de impresión', p: 'critica', a: 'm2', c: 'Costos' },
        { t: 'Considerar mantenimiento y desgaste', p: 'media', a: 'm1', c: 'Costos', d: 'Boquillas, placa, correas, lubricación, vida útil estimada.' },
        { t: 'Considerar desperdicio de material', p: 'media', a: 'm1', c: 'Costos', d: 'Purga, soportes, brim, cambios de color.' },
        { t: 'Considerar fallos de impresión', p: 'alta', a: 'm1', c: 'Costos', d: 'Un % de piezas fallidas debe estar dentro del precio.' },
        { t: 'Definir costo de mano de obra', p: 'alta', a: 'both', c: 'Costos', d: 'Modelado, preparación, post-proceso, empaque, entrega.' },
        { t: 'Crear fórmula de costo total', p: 'critica', a: 'both', c: 'Costos' },
        { t: 'Crear fórmula de precio de venta', p: 'critica', a: 'both', c: 'Costos' },
        { t: 'Definir margen mínimo aceptable', p: 'alta', a: 'both', c: 'Costos', d: 'Por debajo de este margen, simplemente no aceptamos el pedido.' }
      ]
    },
    {
      emoji: '📦',
      title: 'CATÁLOGO INICIAL',
      objective: 'Crear nuestros primeros productos reales.',
      description: 'Pasamos de la idea al objeto físico. Cada producto debe tener foto, tiempo real, costo y precio.\n\nLínea adicional a considerar: IMPRESIÓN BAJO PEDIDO, donde el cliente envía un archivo STL / 3MF / OBJ y recibe una cotización.',
      criteria: 'Tenemos entre 5 y 10 productos impresos, fotografiados, con costo y precio definidos.',
      tasks: [
        { t: 'Seleccionar 5-10 productos iniciales', p: 'critica', a: 'both', c: 'Producto' },
        { t: 'Imprimir prototipos', p: 'critica', a: 'm1', c: 'Producto' },
        { t: 'Revisar calidad de los prototipos', p: 'alta', a: 'm1', c: 'Producto', d: 'Capas, adherencia, tolerancias, acabado, resistencia.' },
        { t: 'Medir tiempos reales de impresión', p: 'alta', a: 'm1', c: 'Producto' },
        { t: 'Medir consumo real de material', p: 'alta', a: 'm1', c: 'Producto' },
        { t: 'Calcular costos con la fórmula de la semana 3', p: 'critica', a: 'm2', c: 'Costos' },
        { t: 'Definir precios de venta', p: 'critica', a: 'both', c: 'Costos' },
        { t: 'Determinar posibles personalizaciones', p: 'media', a: 'both', c: 'Producto', d: 'Colores, nombres, tamaños, logos.' },
        { t: 'Tomar fotografías de producto', p: 'alta', a: 'm2', c: 'Marketing', d: 'Fondo limpio, buena luz, misma composición para todo el catálogo.' },
        { t: 'Crear descripciones comerciales', p: 'media', a: 'm2', c: 'Marketing' },
        { t: 'Definir el servicio de IMPRESIÓN BAJO PEDIDO', p: 'alta', a: 'both', c: 'Producto', d: 'Formatos aceptados (STL/3MF/OBJ), tamaño máximo, tiempo de respuesta de la cotización.' }
      ]
    },
    {
      emoji: '🧾',
      title: 'SISTEMA DE PEDIDOS',
      objective: 'Crear nuestro proceso interno de recepción y gestión de pedidos.',
      description: 'Flujo del pedido:\nSOLICITUD → COTIZACIÓN → PAGO → PRODUCCIÓN → CONTROL DE CALIDAD → ENTREGA\n\nEstados sugeridos del pedido:\nCOTIZANDO · ESPERANDO PAGO · EN PRODUCCIÓN · CONTROL DE CALIDAD · LISTO · ENTREGADO',
      criteria: 'Podemos cotizar cualquier pieza en menos de 5 minutos y seguir un pedido de inicio a fin sin improvisar.',
      tasks: [
        { t: 'Crear formulario de pedidos', p: 'critica', a: 'm1', c: 'Operaciones', d: 'Google Forms o similar: contacto, archivo, material, color, cantidad, fecha deseada.' },
        { t: 'Crear plantilla de cotización', p: 'critica', a: 'm2', c: 'Operaciones' },
        { t: 'Crear registro de clientes', p: 'alta', a: 'm2', c: 'Operaciones' },
        { t: 'Crear registro de pedidos', p: 'critica', a: 'm2', c: 'Operaciones' },
        { t: 'Crear registro de gastos', p: 'alta', a: 'm2', c: 'Costos' },
        { t: 'Crear registro de ingresos', p: 'alta', a: 'm2', c: 'Costos' },
        { t: 'Definir los estados de pedido', p: 'media', a: 'both', c: 'Operaciones', d: 'COTIZANDO, ESPERANDO PAGO, EN PRODUCCIÓN, CONTROL DE CALIDAD, LISTO, ENTREGADO.' },
        { t: 'Definir política de anticipo y entregas', p: 'media', a: 'both', c: 'Ventas', d: '¿Se cobra por adelantado? ¿Envío o entrega en persona? ¿Qué pasa si el cliente cancela?' }
      ]
    },
    {
      emoji: '🚀',
      title: 'LANZAMIENTO',
      objective: 'Conseguir nuestros primeros clientes reales.',
      description: 'Meta inicial: conseguir 5 clientes reales.\nSalir a la calle (y a las redes) sin esperar a que todo esté perfecto.',
      criteria: 'Conseguimos 5 clientes reales y al menos 3 testimonios.',
      tasks: [
        { t: 'Publicar primeros productos', p: 'critica', a: 'm1', c: 'Marketing' },
        { t: 'Publicar fotografías reales', p: 'alta', a: 'm1', c: 'Marketing' },
        { t: 'Crear contenido mostrando la impresora', p: 'media', a: 'm1', c: 'Marketing', d: 'Timelapse de impresión: es el contenido que mejor funciona.' },
        { t: 'Crear publicación "¿Necesitas imprimir algo?"', p: 'alta', a: 'm2', c: 'Marketing' },
        { t: 'Compartir con amigos y universidad', p: 'alta', a: 'both', c: 'Ventas' },
        { t: 'Publicar en grupos relevantes', p: 'media', a: 'm2', c: 'Ventas', d: 'Grupos de makers, ingeniería, comercio local, marketplaces.' },
        { t: 'Contactar potenciales clientes directamente', p: 'alta', a: 'both', c: 'Ventas' },
        { t: 'Conseguir los primeros 5 pedidos', p: 'critica', a: 'both', c: 'Ventas' },
        { t: 'Conseguir testimonios', p: 'media', a: 'm1', c: 'Marketing', d: 'Foto del cliente con la pieza + una frase suya.' }
      ]
    },
    {
      emoji: '📊',
      title: 'ANALIZAR QUÉ FUNCIONA',
      objective: 'Determinar qué productos y clientes realmente valen la pena.',
      description: 'Ranking a construir con datos reales:\n🥇 PRODUCTO ESTRELLA\n🥈 PRODUCTO PROMETEDOR\n🥉 PRODUCTO MEDIO\n❌ PRODUCTO PARA ELIMINAR',
      criteria: 'Tenemos un ranking de productos con datos reales de tiempo, costo y margen.',
      tasks: [
        { t: 'Analizar productos más consultados', p: 'media', a: 'm1', c: 'Análisis' },
        { t: 'Analizar productos más vendidos', p: 'alta', a: 'm2', c: 'Análisis' },
        { t: 'Analizar productos con mayor margen', p: 'critica', a: 'm2', c: 'Análisis' },
        { t: 'Comparar tiempo real de producción vs. estimado', p: 'alta', a: 'm1', c: 'Análisis' },
        { t: 'Contabilizar fallos de impresión', p: 'media', a: 'm1', c: 'Análisis' },
        { t: 'Contabilizar material desperdiciado', p: 'media', a: 'm1', c: 'Análisis' },
        { t: 'Calcular ganancia por hora de impresora', p: 'critica', a: 'm2', c: 'Análisis', d: 'La métrica más importante: la impresora es el cuello de botella.' },
        { t: 'Identificar los clientes más interesantes', p: 'alta', a: 'both', c: 'Análisis' },
        { t: 'Identificar productos que consumen demasiado tiempo', p: 'alta', a: 'both', c: 'Análisis' },
        { t: 'Crear el ranking de productos', p: 'critica', a: 'both', c: 'Análisis', d: '🥇 estrella · 🥈 prometedor · 🥉 medio · ❌ eliminar.' }
      ]
    },
    {
      emoji: '🧭',
      title: 'SIGUIENTE ETAPA',
      objective: 'Decidir hacia dónde crecer.',
      description: 'Posibles decisiones a evaluar:\n· Comprar segunda impresora\n· Ampliar catálogo\n· Especializarnos en piezas funcionales\n· Entrar al mercado empresarial\n· Crear productos propios\n· Ofrecer diseño CAD + impresión\n· Expandir ventas online',
      criteria: 'Tenemos una decisión escrita sobre hacia dónde crecer en los próximos 3 meses.',
      tasks: [
        { t: 'Evaluar ingresos totales', p: 'alta', a: 'm2', c: 'Análisis' },
        { t: 'Evaluar costos totales', p: 'alta', a: 'm2', c: 'Análisis' },
        { t: 'Calcular utilidad real', p: 'critica', a: 'm2', c: 'Análisis' },
        { t: 'Revisar horas totales de impresión', p: 'media', a: 'm1', c: 'Análisis' },
        { t: 'Revisar número de clientes y ticket promedio', p: 'alta', a: 'm2', c: 'Análisis' },
        { t: 'Evaluar nuestra capacidad de producción', p: 'alta', a: 'm1', c: 'Operaciones', d: '¿Cuántos pedidos podemos aceptar por semana sin colapsar?' },
        { t: 'Decidir si compramos una segunda impresora', p: 'critica', a: 'both', c: 'Compras' },
        { t: 'Decidir la especialización de los próximos 3 meses', p: 'critica', a: 'both', c: 'Estrategia' },
        { t: 'Escribir el plan de las siguientes 8 semanas', p: 'alta', a: 'both', c: 'Estrategia', d: 'Se puede hacer directamente en esta app con "+ AGREGAR SEMANA".' }
      ]
    }
  ],

  /* ---- IDEAS DE EJEMPLO PARA ARRANCAR EL BANCO ---- */
  ideas: [
    { text: 'Llaveros personalizados con el nombre de la universidad', cat: 'Producto' },
    { text: 'Timelapse de impresión para Instagram / TikTok', cat: 'Redes sociales' },
    { text: 'Soportes y organizadores de escritorio para oficinas pequeñas', cat: 'Producto' },
    { text: 'Segunda impresora cuando la A1 Mini esté saturada', cat: 'Equipo a comprar' },
    { text: 'Servicio de repuestos: piezas que ya no se consiguen', cat: 'Servicio' }
  ]
};

/* ============================================================
   BANCOS DE PALABRAS DEL GENERADOR DE NOMBRES
   ============================================================ */
APP.NAMEBANK = {
  jp: ['Kuro', 'Hikari', 'Sora', 'Hoshi', 'Kaze', 'Ryu', 'Zen', 'Kaizen', 'Yume', 'Tsuki',
       'Sakura', 'Kage', 'Ito', 'Mono', 'Ki', 'Origami', 'Katana', 'Shiro', 'Aoi', 'Rin'],
  tech: ['Neo', 'Pixel', 'Mecha', 'Nova', 'Axis', 'Volt', 'Bit', 'Proto', 'Vector', 'Fusion',
         'Tekno', 'Micro', 'Ultra', 'Hyper', 'Orbit', 'Quantum', 'Retro', 'Nano', 'Byte', 'Flux'],
  make: ['Forge', 'Lab', 'Labs', 'Works', 'Studio', 'Factory', 'Craft', 'Makers', 'Core', 'Dojo',
         'Atelier', 'Fabrik', 'Taller', 'Prime', 'Nexus', 'Foundry', 'Garage', 'Shop', 'Line', 'Build'],
  es: ['Capa', 'Molde', 'Pieza', 'Filamento', 'Boquilla', 'Origen', 'Prisma', 'Vértice', 'Trazo', 'Cubo'],
  suffix: ['3D', 'Print', 'Print3D', 'Lab', 'Studio', 'Works', 'Makers', 'Forge', 'Co.', 'Tech'],
  concepts: [
    'Suena técnico y directo: fácil de recordar en una tarjeta.',
    'Mezcla japonesa + fabricación: encaja con la estética pixel/manga.',
    'Corto y pronunciable: bueno para un @ de Instagram.',
    'Suena a taller moderno: funciona para piezas funcionales.',
    'Aire futurista: bueno si nos enfocamos en prototipos.',
    'Tono cercano y maker: bueno para clientes jóvenes.',
    'Fácil de convertir en logo pixel art.',
    'Serio y profesional: sirve para clientes empresariales.',
    'Muy visual: funciona bien en redes sociales.',
    'Nombre corto = dominio corto (si está libre).'
  ]
};
