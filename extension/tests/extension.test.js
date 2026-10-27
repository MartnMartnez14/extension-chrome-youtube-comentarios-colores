'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const EXTENSION_DIR = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(EXTENSION_DIR, 'manifest.json');
const SRC_DIR = path.join(EXTENSION_DIR, 'src');

// Mock de chrome.storage (local y sync) en memoria para pruebas aisladas
function createChromeStorageMock() {
  const buckets = {
    local: new Map(),
    sync: new Map(),
  };

  function makeArea(name) {
    const map = buckets[name];
    return {
      get(keys, cb) {
        const result = {};
        if (keys === null || keys === undefined) {
          for (const [k, v] of map.entries()) {
            result[k] = structuredClone(v);
          }
        } else {
          const list = Array.isArray(keys) ? keys : [keys];
          for (const k of list) {
            if (map.has(k)) {
              result[k] = structuredClone(map.get(k));
            }
          }
        }
        cb(result);
      },
      set(items, cb) {
        for (const [k, v] of Object.entries(items)) {
          map.set(k, structuredClone(v));
        }
        if (cb) cb();
      },
      remove(keys, cb) {
        const list = Array.isArray(keys) ? keys : [keys];
        for (const k of list) {
          map.delete(k);
        }
        if (cb) cb();
      },
      clear() {
        map.clear();
      },
      _dump() {
        return Object.fromEntries(map.entries());
      },
    };
  }

  return {
    local: makeArea('local'),
    sync: makeArea('sync'),
    reset() {
      buckets.local.clear();
      buckets.sync.clear();
    },
  };
}

const storageMock = createChromeStorageMock();
globalThis.chrome = {
  runtime: { lastError: null },
  storage: {
    local: storageMock.local,
    sync: storageMock.sync,
  },
};

const Common = require('../src/utils/common.js');
const Store = require('../src/storage/store.js');

function collectFilesRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFilesRecursively(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

test('manifest.json: validez MV3, permisos mínimos y archivos existentes', () => {
  assert.ok(fs.existsSync(MANIFEST_PATH), 'Debe existir extension/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  assert.equal(manifest.manifest_version, 3, 'Debe ser Manifest V3');
  assert.ok(typeof manifest.name === 'string' && manifest.name.length > 0);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);

  assert.deepEqual(manifest.permissions, ['storage'], 'Solo debe requerir el permiso storage');
  assert.deepEqual(manifest.host_permissions, ['*://*.youtube.com/*']);

  // Verificar iconos declarados
  for (const size of ['16', '32', '48', '128']) {
    const relIcon = manifest.icons[size];
    assert.ok(relIcon, `Falta icono de tamaño ${size}`);
    const fullIcon = path.join(EXTENSION_DIR, relIcon);
    assert.ok(fs.existsSync(fullIcon), `No existe el archivo de icono: ${relIcon}`);
    assert.ok(fs.statSync(fullIcon).size > 0, `El icono ${relIcon} está vacío`);
  }

  // Verificar popup y archivos de content_scripts / web_accessible_resources
  const popupPath = path.join(EXTENSION_DIR, manifest.action.default_popup);
  assert.ok(fs.existsSync(popupPath), 'Debe existir el archivo default_popup');

  for (const cs of manifest.content_scripts) {
    for (const jsFile of cs.js) {
      assert.ok(fs.existsSync(path.join(EXTENSION_DIR, jsFile)), `No existe content script: ${jsFile}`);
    }
  }

  for (const war of manifest.web_accessible_resources) {
    for (const res of war.resources) {
      assert.ok(fs.existsSync(path.join(EXTENSION_DIR, res)), `No existe recurso web accesible: ${res}`);
    }
  }
});

test('common.js: formatTime formatea segundos y maneja bordes e inválidos', () => {
  assert.equal(Common.formatTime(0), '00:00');
  assert.equal(Common.formatTime(9), '00:09');
  assert.equal(Common.formatTime(65.9), '01:05');
  assert.equal(Common.formatTime(3661), '1:01:01');
  assert.equal(Common.formatTime(-5), '00:00');
  assert.equal(Common.formatTime(NaN), '00:00');
  assert.equal(Common.formatTime(Infinity), '00:00');
});

test('common.js: extractVideoId soporta watch, youtu.be, shorts, live, embed y rechaza inválidos', () => {
  const validId = 'dQw4w9WgXcQ';
  assert.equal(Common.extractVideoId(`https://www.youtube.com/watch?v=${validId}&t=12s`), validId);
  assert.equal(Common.extractVideoId(`https://m.youtube.com/watch?v=${validId}`), validId);
  assert.equal(Common.extractVideoId(`https://music.youtube.com/watch?v=${validId}`), validId);
  assert.equal(Common.extractVideoId(`https://youtu.be/${validId}?si=abc`), validId);
  assert.equal(Common.extractVideoId(`https://www.youtube.com/shorts/${validId}`), validId);
  assert.equal(Common.extractVideoId(`https://www.youtube.com/live/${validId}?feature=share`), validId);
  assert.equal(Common.extractVideoId(`https://www.youtube.com/embed/${validId}`), validId);

  assert.equal(Common.extractVideoId('https://www.youtube.com/feed/subscriptions'), null);
  assert.equal(Common.extractVideoId('https://www.youtube.com/watch?v=short'), null);
  assert.equal(Common.extractVideoId('https://example.com/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(Common.extractVideoId('no-es-una-url'), null);
  assert.equal(Common.extractVideoId(''), null);
  assert.equal(Common.extractVideoId(null), null);
});

test('common.js: sanitizeComment y createComment validan, normalizan y truncan entradas', () => {
  const videoId = 'dQw4w9WgXcQ';
  const created = Common.createComment({
    videoId,
    videoTitle: '  Mi Video de Prueba  ',
    timestamp: 42.678,
    text: '  Nota importante en el minuto 0:42  ',
    color: '#65c5d8',
  });

  assert.ok(created);
  assert.equal(created.videoId, videoId);
  assert.equal(created.videoTitle, 'Mi Video de Prueba');
  assert.equal(created.timestamp, 42.68);
  assert.equal(created.text, 'Nota importante en el minuto 0:42');
  assert.equal(created.color, '#65c5d8');
  assert.ok(typeof created.id === 'string' && created.id.length > 0);

  // Color inválido cae al color por defecto (Coral)
  const fallbackColor = Common.createComment({
    videoId,
    timestamp: 10,
    text: 'Color desconocido',
    color: '#000000',
  });
  assert.equal(fallbackColor.color, Common.COLORS[0].value);

  // Texto largo se trunca a MAX_COMMENT_LENGTH
  const longText = 'a'.repeat(Common.MAX_COMMENT_LENGTH + 150);
  const truncated = Common.createComment({
    videoId,
    timestamp: 1,
    text: longText,
    color: Common.COLORS[1].value,
  });
  assert.equal(truncated.text.length, Common.MAX_COMMENT_LENGTH);

  // Entradas inválidas devuelven null
  assert.equal(Common.sanitizeComment(null), null);
  assert.equal(Common.sanitizeComment({ id: '1', videoId: 'bad', timestamp: 10, text: 'hola' }), null);
  assert.equal(Common.sanitizeComment({ id: '1', videoId, timestamp: -1, text: 'hola' }), null);
  assert.equal(Common.sanitizeComment({ id: '1', videoId, timestamp: 10, text: '   ' }), null);
});

test('store.js: guardado, lectura, índice de videos, exportAllToJson e importFromJson sin duplicados', async () => {
  storageMock.reset();
  const videoA = 'dQw4w9WgXcQ';
  const videoB = '3JZ_D3ELwOQ';

  const c1 = Common.createComment({
    videoId: videoA,
    videoTitle: 'Video Alfa',
    timestamp: 90,
    text: 'Segundo comentario cronológico',
    color: '#80c783',
  });
  const c2 = Common.createComment({
    videoId: videoA,
    videoTitle: 'Video Alfa',
    timestamp: 15,
    text: 'Primer comentario cronológico',
    color: '#f07159',
  });

  const saved = await Store.saveComments(videoA, [c1, c2], { title: 'Video Alfa' });
  assert.equal(saved, true);

  // Debe devolverlos ordenados por timestamp ascendente
  const loadedA = await Store.getComments(videoA);
  assert.equal(loadedA.length, 2);
  assert.equal(loadedA[0].id, c2.id);
  assert.equal(loadedA[1].id, c1.id);

  // Resumen de videos e índice
  const summaries = await Store.getAllVideosSummary();
  assert.equal(summaries.length, 1);
  assert.equal(summaries[0].videoId, videoA);
  assert.equal(summaries[0].title, 'Video Alfa');
  assert.equal(summaries[0].count, 2);

  // Exportar todo a JSON
  const exported = await Store.exportAllToJson();
  assert.equal(exported.app, 'yt-temporal-comments');
  assert.equal(exported.totalVideos, 1);
  assert.equal(exported.totalComments, 2);
  assert.ok(exported.videos[videoA]);

  // Importar fusionando: mismo comentario c1 (no debe duplicarse) + nuevo comentario en videoA + nuevo videoB
  const c3 = Common.createComment({
    videoId: videoA,
    timestamp: 120,
    text: 'Tercer comentario importado',
    color: '#668fe8',
  });
  const cB1 = Common.createComment({
    videoId: videoB,
    timestamp: 5,
    text: 'Nota en video Beta',
    color: '#e8ca67',
  });

  const importPayload = JSON.stringify({
    app: 'yt-temporal-comments',
    version: 1,
    videos: {
      [videoA]: {
        title: 'Video Alfa Actualizado',
        comments: [c1, c3],
      },
      [videoB]: {
        title: 'Video Beta',
        comments: [cB1],
      },
    },
  });

  const importResult = await Store.importFromJson(importPayload);
  assert.equal(importResult.importedVideos, 2);
  assert.equal(importResult.importedComments, 3);

  const mergedA = await Store.getComments(videoA);
  assert.equal(mergedA.length, 3, 'No debe duplicar c1 al fusionar por ID');
  assert.deepEqual(
    mergedA.map((c) => c.timestamp),
    [15, 90, 120]
  );

  // Eliminar todos los comentarios de un video limpia su entrada
  await Store.saveComments(videoB, []);
  const afterDeleteB = await Store.getComments(videoB);
  assert.equal(afterDeleteB.length, 0);

  // Rechazo de JSON corrupto o estructura inválida
  await assert.rejects(
    () => Store.importFromJson('{json-corrupto'),
    /JSON válido/
  );
  await assert.rejects(
    () => Store.importFromJson(JSON.stringify({ foo: 'bar' })),
    /Estructura de respaldo no reconocida/
  );
});

test('seguridad estática: ningún archivo en extension/src/ usa innerHTML ni carga fuentes/scripts remotos', () => {
  const files = collectFilesRecursively(SRC_DIR);
  assert.ok(files.length > 0, 'Debe haber archivos fuente en extension/src/');

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(EXTENSION_DIR, file);

    assert.equal(
      /\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b/.test(content),
      false,
      `Uso prohibido de innerHTML/outerHTML en ${rel}`
    );
    assert.equal(
      /fonts\.googleapis\.com|fonts\.gstatic\.com/.test(content),
      false,
      `Carga remota de fuentes detectada en ${rel}`
    );
    assert.equal(
      /<script[^>]+src=["']https?:/i.test(content),
      false,
      `Carga remota de script externo detectada en ${rel}`
    );
  }
});
