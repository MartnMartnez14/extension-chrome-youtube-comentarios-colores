# Arquitectura Técnica — YT Temporal Comments

Este documento describe cómo está diseñada la extensión de Chrome (**Manifest V3**) y cómo se relaciona con el prototipo web original.

---

## 1. Principios de Diseño

1. **Cero dependencias externas en producción:** HTML, CSS y JavaScript vanilla. Esto garantiza un paquete ligero, rápido de auditar por el equipo de revisión de Google Chrome Web Store y sin riesgos de cadena de suministro (*supply-chain*).
2. **Aislamiento de estilos (Shadow DOM):** YouTube tiene hojas de estilo globales complejas y cambiantes. La interfaz inyectada por nuestro Content Script se monta dentro de un `ShadowRoot` (`mode: 'open'`), asegurando que el diseño de **YT Temporal** se vea idéntico al prototipo sin afectar ni ser afectado por YouTube.
3. **Privacidad por diseño (*Privacy by Design*):** Ningún dato sale hacia servidores de terceros. Toda la información vive en `chrome.storage.local` y opcionalmente en `chrome.storage.sync` (asociado a la cuenta de Google del propio usuario).
4. **Permisos mínimos:**
   - `storage`: Para guardar y recuperar las notas temporales.
   - `host_permissions` (`*://*.youtube.com/*`): Exclusivamente para inyectar el panel de notas en páginas de videos de YouTube.

---

## 2. Componentes de la Extensión (`extension/`)

```text
extension/
├── manifest.json              # Definición MV3, permisos y declaración de content_scripts
├── icons/                     # Iconos PNG (16, 32, 48, 128px)
└── src/
    ├── utils/
    │   └── common.js          # Colores, formatTime(), extractVideoId(), validateComment()
    ├── storage/
    │   └── store.js           # API unificada sobre chrome.storage (local + sync + JSON export/import)
    ├── content/
    │   ├── content.js         # Observador de YouTube SPA, enlace al <video> y montaje UI
    │   └── content.css        # Estilos encapsulados dentro del Shadow DOM
    └── popup/
        ├── popup.html         # Interfaz del icono de la extensión
        ├── popup.css          # Estilos del popup
        └── popup.js           # Resumen de videos con notas, toggle de Sync y Exportar/Importar JSON
```

---

## 3. Integración con el Reproductor y SPA de YouTube

A diferencia de un sitio tradicional, YouTube es una **Single Page Application (SPA)** construida sobre el framework Polymer/Desktop de Google (`ytd-app`):

1. **Detección de cambio de video:**
   - Escuchamos el evento personalizado `yt-navigate-finish` en `document` y respaldamos con detección de cambios en `location.href`.
   - Extraemos el parámetro `v` cuando la ruta es `/watch` (o el ID en `/shorts/` y `/live/`).
2. **Conexión con el reproductor nativo:**
   - Localizamos el elemento `<video class="html5-main-video">` dentro de `#movie_player`.
   - Lectura de tiempo actual: `videoElement.currentTime`.
   - Lectura de duración total: `videoElement.duration`.
   - Salto temporal (*Seek*): `videoElement.currentTime = seconds; videoElement.play();`.
3. **Punto de inserción en el DOM de YouTube:**
   - El contenedor raíz `<div id="yt-temporal-comments-host">` se inserta de forma prioritaria al inicio de la columna secundaria (`#secondary-inner` o `#secondary`) en `youtube.com/watch`, o encima de `#below` cuando la vista es de una sola columna.

---

## 4. Modelo de Datos y Almacenamiento

### Clave por video
Cada video almacena su lista de notas bajo la clave:
`yt-temporal-comments:<videoId>`

### Estructura de una Nota (`Comment`)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "videoId": "dQw4w9WgXcQ",
  "videoTitle": "Título opcional del video",
  "timestamp": 83.45,
  "text": "Explicación clave sobre la arquitectura",
  "color": "#f07159",
  "createdAt": "2026-10-27T15:00:00.000Z"
}
```

### Estrategia Local + Sync + JSON
- **`chrome.storage.local`:** Almacenamiento primario rápido y amplio (hasta 10 MB por defecto).
- **`chrome.storage.sync`:** Cuando el usuario mantiene activa la opción de sincronización y el tamaño del registro respeta la cuota de Chrome (`QUOTA_BYTES_PER_ITEM = 8192`), los comentarios del video se replican en `chrome.storage.sync`.
- **Exportación / Importación JSON:** Permite descargar un archivo `.json` con esquema validado (`version: 1`) que incluye todas las notas de todos los videos, y restaurarlo fusionando sin duplicar IDs.
