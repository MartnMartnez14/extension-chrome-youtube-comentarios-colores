# YouTube Temporal Comments

**Guardá notas privadas con marcadores de color en momentos exactos de cualquier video de YouTube y encontralas desde tu propia línea de tiempo.**

Repositorio oficial: [MartnMartnez14/extension-chrome-youtube-comentarios-colores](https://github.com/MartnMartnez14/extension-chrome-youtube-comentarios-colores)

---

## Vista previa

Así se ven la línea temporal con marcadores de colores y las notas asociadas a cada momento:

![Prototipo en funcionamiento: marcadores de color y notas temporales](demo/prototipo-notas-temporales.jpg)

Al seleccionar un marcador o una nota, el reproductor salta directamente a ese instante:

![Prototipo en funcionamiento: salto a un momento marcado](demo/prototipo-salto-temporal.jpg)

---

## Estructura del Proyecto

El repositorio está organizado en dos entornos complementarios:

1. **`extension/` — Extensión para Google Chrome (Manifest V3):**
   Se inyecta directamente en `youtube.com/watch`, añadiendo una barra temporal de colores y un panel de notas privadas integrado junto al reproductor nativo de YouTube, además de un popup de gestión, sincronización (`chrome.storage.local` + `chrome.storage.sync`) y exportación/importación en JSON.
2. **`web-prototype/` — Prototipo Web Independiente (Flask):**
   Aplicación local ligera en Python/Flask que permite probar el concepto en una página independiente mediante la YouTube IFrame Player API y `localStorage`.

```text
ExtChromYoutComentColors/
├── extension/                 # Extensión de Chrome (Manifest V3)
│   ├── manifest.json
│   ├── icons/
│   └── src/
│       ├── content/           # Inyección en YouTube (Shadow DOM + control de <video>)
│       ├── popup/             # Popup de la extensión (Resumen, Sync, Exportar/Importar JSON)
│       ├── storage/           # Capa de persistencia (local, sync y respaldos JSON)
│       └── utils/             # Utilidades puras (tiempos, colores, validación, IDs)
├── web-prototype/             # Prototipo web original en Python / Flask
│   ├── app.py
│   ├── requirements.txt
│   ├── templates/index.html
│   └── static/ (app.js, styles.css)
├── demo/                      # Capturas del proyecto
├── ROADMAP.md                 # Hoja de ruta hacia la Chrome Web Store
├── ARCHITECTURE.md            # Diseño técnico y decisiones de arquitectura
├── PRIVACY_POLICY.md          # Política de privacidad (ES / EN) para Chrome Web Store
├── CHROME_STORE_CHECKLIST.md  # Guía y requisitos de publicación en la tienda
├── CONTRIBUTING.md            # Guía para colaboradores
└── CHANGELOG.md               # Historial de cambios
```

---

## Funciones Principales

- **Integración nativa en YouTube:** Funciona directamente sobre el reproductor de `youtube.com/watch` detectando la navegación dinámica (SPA) sin recargar la página.
- **Mapa visual por colores:** Creá notas en el segundo exacto y clasificálas con una paleta de 10 colores.
- **Línea de tiempo proporcional:** Visualizá todos tus marcadores sobre la barra temporal y saltá a cualquier instante con un clic.
- **Persistencia híbrida y respaldos:**
  - Guardado inmediato en `chrome.storage.local`.
  - Sincronización opcional entre dispositivos con `chrome.storage.sync`.
  - Exportación e importación completa en archivo `.json` desde el popup de la extensión.
- **Privacidad total:** Tus notas son privadas y nunca se publican como comentarios públicos en YouTube ni se envían a servidores externos.

---

## Cómo usar la Extensión de Chrome (Modo Desarrollador)

1. Cloná o descargá este repositorio:
   ```bash
   git clone https://github.com/MartnMartnez14/extension-chrome-youtube-comentarios-colores.git
   ```
2. Abrí Google Chrome y navegá a `chrome://extensions/`.
3. Activá el interruptor **Modo de desarrollador** (esquina superior derecha).
4. Hacé clic en **Cargar descomprimida** (*Load unpacked*).
5. Seleccioná la carpeta `extension/` dentro de este proyecto.
6. Abrí cualquier video en [YouTube](https://www.youtube.com) y usá el panel **YT Temporal** para guardar momentos.

---

## Cómo ejecutar el Prototipo Web (Flask)

Si querés correr el sandbox web original en local:

```bash
cd web-prototype
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

Luego abrí <http://127.0.0.1:5000> en tu navegador.

---

## Documentación del Proyecto

- [Hoja de Ruta (ROADMAP.md)](ROADMAP.md)
- [Arquitectura Técnica (ARCHITECTURE.md)](ARCHITECTURE.md)
- [Política de Privacidad (PRIVACY_POLICY.md)](PRIVACY_POLICY.md)
- [Checklist para Chrome Web Store (CHROME_STORE_CHECKLIST.md)](CHROME_STORE_CHECKLIST.md)
- [Guía de Contribución (CONTRIBUTING.md)](CONTRIBUTING.md)
- [Historial de Cambios (CHANGELOG.md)](CHANGELOG.md)

---

## Apoyar el proyecto

¿Te gustó el proyecto? Si querés colaborar voluntariamente, podés invitarme a un cafecito o mate:

- [Ko-fi](https://ko-fi.com/martinmartinezgarcia)
- [PayPal](https://www.paypal.com/paypalme/blufferedtwitch)
- [Internet satelital Starlink](https://starlink.com/?referral=RC-DF-5848974-78640-68&app_source=share&utm_source=chatgpt.com) — enlace de afiliado; puede ofrecerte el primer mes según las condiciones de Starlink.

---

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consultá el archivo [LICENSE](LICENSE).
