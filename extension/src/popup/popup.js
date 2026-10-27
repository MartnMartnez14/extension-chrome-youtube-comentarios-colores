(() => {
  'use strict';

  const Store = globalThis.YTTemporalStore;

  const els = {
    statVideos: document.getElementById('stat-videos'),
    statComments: document.getElementById('stat-comments'),
    syncToggle: document.getElementById('sync-toggle'),
    videosList: document.getElementById('videos-list'),
    emptyMsg: document.getElementById('empty-msg'),
    exportBtn: document.getElementById('export-btn'),
    importBtn: document.getElementById('import-btn'),
    importFile: document.getElementById('import-file'),
    statusMsg: document.getElementById('status-msg'),
  };

  function showStatus(text) {
    els.statusMsg.textContent = text;
    els.statusMsg.hidden = !text;
  }

  async function renderDashboard() {
    const [settings, summaries] = await Promise.all([
      Store.getSettings(),
      Store.getAllVideosSummary(),
    ]);

    els.syncToggle.checked = Boolean(settings.syncEnabled);

    const totalVideos = summaries.length;
    const totalComments = summaries.reduce((acc, item) => acc + item.count, 0);

    els.statVideos.textContent = String(totalVideos);
    els.statComments.textContent = String(totalComments);

    els.videosList.replaceChildren();
    if (summaries.length === 0) {
      els.emptyMsg.hidden = false;
      els.videosList.append(els.emptyMsg);
      return;
    }

    els.emptyMsg.hidden = true;
    summaries.forEach((item) => {
      const link = document.createElement('a');
      link.className = 'video-row';
      link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(item.videoId)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.title = item.title;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'video-title';
      titleSpan.textContent = item.title;

      const countSpan = document.createElement('span');
      countSpan.className = 'video-count';
      countSpan.textContent = `${item.count}`;

      link.append(titleSpan, countSpan);
      els.videosList.append(link);
    });
  }

  els.syncToggle.addEventListener('change', async () => {
    await Store.saveSettings({ syncEnabled: els.syncToggle.checked });
    showStatus(els.syncToggle.checked ? 'Sincronización activada.' : 'Sincronización desactivada.');
  });

  els.exportBtn.addEventListener('click', async () => {
    try {
      const payload = await Store.exportAllToJson();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yt-temporal-comments-backup.json';
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showStatus(`Respaldo exportado (${payload.totalComments} notas).`);
    } catch {
      showStatus('No se pudo exportar el respaldo.');
    }
  });

  els.importBtn.addEventListener('click', () => {
    els.importFile.value = '';
    els.importFile.click();
  });

  els.importFile.addEventListener('change', async () => {
    const file = els.importFile.files && els.importFile.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await Store.importFromJson(text);
      await renderDashboard();
      showStatus(`Importados ${res.importedComments} momentos en ${res.importedVideos} videos.`);
    } catch (err) {
      showStatus(err && err.message ? err.message : 'Archivo JSON inválido.');
    }
  });

  renderDashboard();
})();
