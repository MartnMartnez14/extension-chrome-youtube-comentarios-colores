# Checklist de Publicación en Chrome Web Store

Esta guía reúne todos los requisitos técnicos, legales y visuales exigidos por Google para publicar **YT Temporal Comments** en la **Chrome Web Store (CWS)** sin rechazos en la revisión.

---

## 1. Cumplimiento Técnico (Manifest V3)

- [x] `manifest_version: 3`.
- [x] **Sin código alojado remotamente (*No Remotely Hosted Code*):** No se cargan scripts ni fuentes desde CDNs externos dentro de la extensión; todo el código reside en la carpeta `extension/`.
- [x] **Permisos mínimos (*Minimum Privileges*):**
  - Solo se solicita `"storage"` en `permissions`.
  - Solo se solicita `"*://*.youtube.com/*"` en `host_permissions`.
  - No se solicitan permisos invasivos como `tabs`, `<all_urls>`, `webRequest` ni `scripting` global si no son estrictamente necesarios.
- [x] **Seguridad DOM (Anti-XSS):** Ningún texto ingresado por el usuario o leído desde JSON se inserta con `innerHTML`; se utiliza exclusivamente `textContent` y creación segura de nodos (`document.createElement`).

---

## 2. Textos para la Pestaña "Privacidad" (Privacy Tab en el Dashboard)

Cuando subas el archivo `.zip` al [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), Google te pedirá completar las siguientes justificaciones:

### Single Purpose Description (Propósito único)
> Permitir al usuario crear, visualizar y organizar notas privadas con marcadores de color vinculadas a momentos específicos (timestamps) dentro de los videos de YouTube.

### Justificación del permiso `storage`
> Se utiliza `chrome.storage.local` y `chrome.storage.sync` exclusivamente para guardar las notas privadas del usuario asociadas a cada ID de video de YouTube y sus preferencias de sincronización.

### Justificación de `host_permissions` (`*://*.youtube.com/*`)
> Se requiere acceso a las páginas de YouTube únicamente para mostrar el panel de notas temporales junto al reproductor de video, leer el segundo actual y la duración del elemento `<video>` HTML5, y permitir saltar al instante guardado cuando el usuario hace clic en un marcador.

### Uso de Datos (Data Usage Disclosures)
- **¿Recopila datos del usuario hacia servidores externos?** `No`.
- **Certificación de Uso Limitado (Limited Use):** Marcar las 3 casillas confirmando cumplimiento con las políticas de Chrome Web Store.
- **URL de la Política de Privacidad:**
  `https://github.com/MartnMartnez14/extension-chrome-youtube-comentarios-colores/blob/main/PRIVACY_POLICY.md`

---

## 3. Activos Gráficos Requeridos (Store Listing Assets)

| Activo | Dimensiones exactas | Formato | Estado |
| :--- | :--- | :--- | :--- |
| **Icono de la tienda** | `128 x 128 px` | PNG | Incluido en `extension/icons/icon128.png` |
| **Capturas de pantalla** (Mínimo 1, recomendado 3–5) | `1280 x 800 px` o `640 x 400 px` | PNG o JPEG (sin alfa) | Base disponible en `demo/` (ajustar a 1280x800 antes de subir) |
| **Imagen promocional pequeña** (*Small Promo Tile*) | `440 x 280 px` | PNG o JPEG (sin alfa) | Pendiente para el lanzamiento |

---

## 4. Ficha de la Tienda (Store Listing Copy — Libre de Keyword Spam)

- **Nombre:** YT Temporal Comments — Notas con Colores en YouTube
- **Resumen corto (máx. 132 caracteres):**
  > Guardá notas privadas con marcadores de color en momentos exactos de cualquier video de YouTube y volvé a ellos con un clic.
- **Categoría recomendada:** Productividad (*Productivity*) o Educación (*Education*).

---

## 5. Cómo generar el paquete `.zip` para subir a la tienda

Desde la raíz del proyecto, ejecutá:

```bash
cd extension && zip -r ../yt-temporal-comments-extension.zip . -x "*.DS_Store"
```

Ese archivo `yt-temporal-comments-extension.zip` es el que se sube directamente al panel de desarrollador de Google.
