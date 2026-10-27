(() => {
  'use strict';

  const Common = globalThis.YTTemporalCommon;
  const SYNC_ITEM_SOFT_LIMIT = 7500; // Margen seguro bajo QUOTA_BYTES_PER_ITEM (8192 bytes)

  function hasChromeStorage() {
    return typeof chrome !== 'undefined' && Boolean(chrome.storage && chrome.storage.local);
  }

  function storageKey(videoId) {
    return `${Common.STORAGE_PREFIX}${videoId}`;
  }

  async function rawGet(area, keys) {
    if (hasChromeStorage() && chrome.storage[area]) {
      return new Promise((resolve) => {
        chrome.storage[area].get(keys, (res) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            resolve({});
            return;
          }
          resolve(res || {});
        });
      });
    }
    try {
      if (keys === null) {
        const all = {};
        for (let i = 0; i < localStorage.length; i += 1) {
          const k = localStorage.key(i);
          if (k) {
            try {
              all[k] = JSON.parse(localStorage.getItem(k));
            } catch {
              all[k] = localStorage.getItem(k);
            }
          }
        }
        return all;
      }
      const keyList = Array.isArray(keys) ? keys : [keys];
      const out = {};
      for (const k of keyList) {
        const raw = localStorage.getItem(k);
        if (raw !== null) {
          try {
            out[k] = JSON.parse(raw);
          } catch {
            out[k] = raw;
          }
        }
      }
      return out;
    } catch {
      return {};
    }
  }

  async function rawSet(area, items) {
    if (hasChromeStorage() && chrome.storage[area]) {
      return new Promise((resolve) => {
        chrome.storage[area].set(items, () => {
          resolve(!(chrome.runtime && chrome.runtime.lastError));
        });
      });
    }
    try {
      for (const [k, v] of Object.entries(items)) {
        localStorage.setItem(k, JSON.stringify(v));
      }
      return true;
    } catch {
      return false;
    }
  }

  async function rawRemove(area, keys) {
    if (hasChromeStorage() && chrome.storage[area]) {
      return new Promise((resolve) => {
        chrome.storage[area].remove(keys, () => {
          resolve(!(chrome.runtime && chrome.runtime.lastError));
        });
      });
    }
    try {
      const list = Array.isArray(keys) ? keys : [keys];
      for (const k of list) localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  }

  async function getSettings() {
    const data = await rawGet('local', Common.SETTINGS_KEY);
    const stored = data[Common.SETTINGS_KEY];
    return {
      syncEnabled: stored && typeof stored.syncEnabled === 'boolean' ? stored.syncEnabled : true,
    };
  }

  async function saveSettings(partial) {
    const current = await getSettings();
    const next = {
      ...current,
      ...(partial && typeof partial === 'object' ? partial : {}),
    };
    await rawSet('local', { [Common.SETTINGS_KEY]: next });
    return next;
  }

  async function getIndex() {
    const data = await rawGet('local', Common.INDEX_KEY);
    const index = data[Common.INDEX_KEY];
    return index && typeof index === 'object' && !Array.isArray(index) ? index : {};
  }

  async function updateIndexEntry(videoId, comments, videoTitle = '') {
    const index = await getIndex();
    if (!comments || comments.length === 0) {
      delete index[videoId];
    } else {
      const existingTitle = index[videoId] && index[videoId].title ? index[videoId].title : '';
      const inferredTitle = videoTitle || comments.find((c) => c.videoTitle)?.videoTitle || existingTitle || `Video ${videoId}`;
      index[videoId] = {
        videoId,
        title: inferredTitle.slice(0, 200),
        count: comments.length,
        updatedAt: new Date().toISOString(),
      };
    }
    await rawSet('local', { [Common.INDEX_KEY]: index });
    return index;
  }

  async function getComments(videoId) {
    if (!videoId) return [];
    const key = storageKey(videoId);
    const localData = await rawGet('local', key);
    if (Array.isArray(localData[key])) {
      return Common.validateCommentsArray(localData[key], videoId);
    }

    const settings = await getSettings();
    if (settings.syncEnabled) {
      const syncData = await rawGet('sync', key);
      if (Array.isArray(syncData[key])) {
        const validated = Common.validateCommentsArray(syncData[key], videoId);
        await rawSet('local', { [key]: validated });
        await updateIndexEntry(videoId, validated);
        return validated;
      }
    }
    return [];
  }

  async function saveComments(videoId, comments, videoMeta = {}) {
    if (!videoId) return false;
    const key = storageKey(videoId);
    const clean = Common.validateCommentsArray(comments, videoId);

    if (clean.length === 0) {
      await rawRemove('local', key);
      await rawRemove('sync', key);
      await updateIndexEntry(videoId, []);
      return true;
    }

    const savedLocal = await rawSet('local', { [key]: clean });
    await updateIndexEntry(videoId, clean, videoMeta.title || '');

    const settings = await getSettings();
    if (settings.syncEnabled) {
      const serialized = JSON.stringify({ [key]: clean });
      if (serialized.length <= SYNC_ITEM_SOFT_LIMIT) {
        await rawSet('sync', { [key]: clean });
      }
    }
    return savedLocal;
  }

  async function getAllVideosSummary() {
    const allLocal = await rawGet('local', null);
    const index = allLocal[Common.INDEX_KEY] && typeof allLocal[Common.INDEX_KEY] === 'object'
      ? allLocal[Common.INDEX_KEY]
      : {};

    const summaries = [];
    for (const [key, val] of Object.entries(allLocal)) {
      if (!key.startsWith(Common.STORAGE_PREFIX)) continue;
      const videoId = key.slice(Common.STORAGE_PREFIX.length);
      if (!/^[\w-]{11}$/.test(videoId)) continue;
      const comments = Common.validateCommentsArray(val, videoId);
      if (comments.length === 0) continue;
      const meta = index[videoId] || {};
      const title = meta.title || comments.find((c) => c.videoTitle)?.videoTitle || `youtube.com/watch?v=${videoId}`;
      summaries.push({
        videoId,
        title,
        count: comments.length,
        updatedAt: meta.updatedAt || comments[comments.length - 1].createdAt,
        colors: Array.from(new Set(comments.map((c) => c.color))).slice(0, 5),
      });
    }

    return summaries.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  async function exportAllToJson() {
    const allLocal = await rawGet('local', null);
    const index = allLocal[Common.INDEX_KEY] || {};
    const videos = {};
    let totalComments = 0;

    for (const [key, val] of Object.entries(allLocal)) {
      if (!key.startsWith(Common.STORAGE_PREFIX)) continue;
      const videoId = key.slice(Common.STORAGE_PREFIX.length);
      if (!/^[\w-]{11}$/.test(videoId)) continue;
      const comments = Common.validateCommentsArray(val, videoId);
      if (comments.length === 0) continue;
      totalComments += comments.length;
      videos[videoId] = {
        title: index[videoId]?.title || comments.find((c) => c.videoTitle)?.videoTitle || `youtube.com/watch?v=${videoId}`,
        comments,
      };
    }

    return {
      app: 'yt-temporal-comments',
      version: 1,
      exportedAt: new Date().toISOString(),
      totalVideos: Object.keys(videos).length,
      totalComments,
      videos,
    };
  }

  async function importFromJson(jsonInput) {
    let parsed;
    try {
      parsed = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
    } catch {
      throw new Error('El archivo no contiene un JSON válido.');
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.videos || typeof parsed.videos !== 'object') {
      throw new Error('Estructura de respaldo no reconocida.');
    }

    let importedVideos = 0;
    let importedComments = 0;

    for (const [videoId, entry] of Object.entries(parsed.videos)) {
      if (!/^[\w-]{11}$/.test(videoId)) continue;
      const incomingList = Array.isArray(entry) ? entry : (entry && Array.isArray(entry.comments) ? entry.comments : []);
      const validIncoming = Common.validateCommentsArray(incomingList, videoId);
      if (validIncoming.length === 0) continue;

      const existing = await getComments(videoId);
      const mergedMap = new Map();
      for (const item of existing) mergedMap.set(item.id, item);
      for (const item of validIncoming) mergedMap.set(item.id, item);

      const merged = Array.from(mergedMap.values()).sort((a, b) => a.timestamp - b.timestamp);
      const title = entry && typeof entry.title === 'string' ? entry.title : '';
      await saveComments(videoId, merged, { title });
      importedVideos += 1;
      importedComments += validIncoming.length;
    }

    return { importedVideos, importedComments };
  }

  const api = {
    getSettings,
    saveSettings,
    getComments,
    saveComments,
    getAllVideosSummary,
    exportAllToJson,
    importFromJson,
  };

  globalThis.YTTemporalStore = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
