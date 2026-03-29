/* =====================================================
   PROJET P3V – admin.js
   Gestion complète : Galerie & Actualités
   ===================================================== */

'use strict';

/* ============================================================
   DÉTECTION DU CONTEXTE D'EXÉCUTION
   Le fetch() vers des URLs relatives (tables/...) ne fonctionne
   que lorsque le site est servi par un serveur HTTP.
   En local (file://), on bascule sur un mode localStorage.
   ============================================================ */
const IS_LOCAL = window.location.protocol === 'file:';
const IS_ONLINE = !IS_LOCAL;

/* Clé de stockage local */
const LS_KEY_MEDIA = 'p3v_galerie_media';
const LS_KEY_ACTUS = 'p3v_actualites';

/* ===== TOAST ===== */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle'
  };
  t.innerHTML = `<i class="${icons[type] || icons.info}"></i> ${msg}`;
  t.className = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 4000);
}

/* ===== BANNIÈRE MODE LOCAL ===== */
function showLocalBanner() {
  if (!IS_LOCAL) return;
  const banner = document.createElement('div');
  banner.id = 'localModeBanner';
  banner.style.cssText = `
    position:fixed; top:0; left:0; right:0; z-index:99999;
    background:linear-gradient(135deg,#e8760a,#c85a00);
    color:#fff; padding:10px 20px; font-size:.85rem;
    display:flex; align-items:center; justify-content:space-between;
    gap:12px; box-shadow:0 4px 20px rgba(0,0,0,.3); flex-wrap:wrap;
  `;
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <i class="fas fa-exclamation-triangle" style="font-size:1.1rem"></i>
      <div>
        <strong>Mode hors-ligne (file://)</strong> — 
        Les données sont sauvegardées localement dans votre navigateur (localStorage).
        Pour utiliser la vraie base de données, publiez le site via l'onglet <strong>Publish</strong>.
      </div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,.2);border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:.82rem;flex-shrink:0">
      <i class="fas fa-times"></i> Fermer
    </button>
  `;
  document.body.prepend(banner);
  // Décaler le header admin pour ne pas être masqué
  const header = document.querySelector('.admin-header');
  if (header) header.style.marginTop = banner.offsetHeight + 'px';
}

/* ============================================================
   COUCHE D'ABSTRACTION API
   – En ligne  : fetch() vers l'API REST `tables/`
   – Hors-ligne : lecture/écriture dans localStorage
   ============================================================ */

/* Génère un UUID simple */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/* --- Lecture localStorage --- */
function lsRead(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

/* --- Écriture localStorage --- */
function lsWrite(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* --- Mapping table → clé LS --- */
function lsKey(table) {
  if (table === 'galerie_media') return LS_KEY_MEDIA;
  if (table === 'actualites') return LS_KEY_ACTUS;
  return 'p3v_' + table;
}

/* --- API GET --- */
async function apiGet(table, params = '') {
  if (IS_LOCAL) {
    const data = lsRead(lsKey(table));
    return { data, total: data.length };
  }
  const res = await fetch(`tables/${table}?${params}`);
  if (!res.ok) throw new Error(`GET ${table} failed (${res.status})`);
  return res.json();
}

/* --- API POST --- */
async function apiPost(table, data) {
  if (IS_LOCAL) {
    const items = lsRead(lsKey(table));
    const newItem = {
      ...data,
      id: uuid(),
      created_at: Date.now(),
      updated_at: Date.now()
    };
    items.unshift(newItem);
    lsWrite(lsKey(table), items);
    return newItem;
  }
  const res = await fetch(`tables/${table}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`POST ${table} failed (${res.status})`);
  return res.json();
}

/* --- API PUT --- */
async function apiPut(table, id, data) {
  if (IS_LOCAL) {
    const items = lsRead(lsKey(table));
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...data, updated_at: Date.now() };
      lsWrite(lsKey(table), items);
      return items[idx];
    }
    throw new Error('Item not found: ' + id);
  }
  const res = await fetch(`tables/${table}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PUT ${table}/${id} failed (${res.status})`);
  return res.json();
}

/* --- API DELETE --- */
async function apiDelete(table, id) {
  if (IS_LOCAL) {
    const items = lsRead(lsKey(table)).filter(i => i.id !== id);
    lsWrite(lsKey(table), items);
    return;
  }
  const res = await fetch(`tables/${table}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${table}/${id} failed (${res.status})`);
}

/* ===== TABS ===== */
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`)?.classList.add('active');
  });
});

/* ============================================================
   GALERIE MÉDIA
   ============================================================ */

let mediaItems = [];
let editingMediaId = null;

const mediaModal = document.getElementById('mediaModal');
const mediaForm = document.getElementById('mediaForm');
const mediaGrid = document.getElementById('adminMediaGrid');
const mediaUrlInput = document.getElementById('mediaUrl');
const mediaPreview = document.getElementById('mediaPreview');

/* -- Ouvrir modal -- */
function openMediaModal(item = null) {
  editingMediaId = item ? item.id : null;
  document.getElementById('mediaModalTitle').innerHTML = item
    ? '<i class="fas fa-edit"></i> Modifier le média'
    : '<i class="fas fa-plus-circle"></i> Ajouter un média';

  mediaForm.reset();
  if (mediaPreview) mediaPreview.innerHTML = '';

  if (item) {
    document.getElementById('mediaId').value = item.id || '';
    document.getElementById('mediaTitre').value = item.titre || '';
    document.getElementById('mediaUrl').value = item.url || item.url_media || '';
    document.getElementById('mediaVignette').value = item.vignette || item.url_miniature || '';
    document.getElementById('mediaCat').value = item.categorie || '';
    document.getElementById('mediaPays').value = item.pays || '';
    document.getElementById('mediaDesc').value = item.description || '';
    const radio = mediaForm.querySelector(`input[value="${item.type_media}"]`);
    if (radio) radio.checked = true;
    updatePreview(item.url || item.url_media, item.type_media);
  }

  mediaModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/* -- Fermer modal -- */
function closeMediaModal() {
  mediaModal.classList.remove('active');
  document.body.style.overflow = '';
  editingMediaId = null;
}

document.getElementById('openMediaModal')?.addEventListener('click', () => openMediaModal());
document.getElementById('closeMediaModal')?.addEventListener('click', closeMediaModal);
document.getElementById('cancelMediaBtn')?.addEventListener('click', closeMediaModal);
mediaModal?.addEventListener('click', e => { if (e.target === mediaModal) closeMediaModal(); });

/* -- Prévisualisation URL -- */
function updatePreview(url, type) {
  if (!url || !mediaPreview) return;
  mediaPreview.innerHTML = '';
  if (type === 'video') {
    mediaPreview.innerHTML = `<video src="${url}" controls muted style="max-height:180px;max-width:100%;border-radius:8px;"></video>`;
  } else {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Aperçu';
    img.style.cssText = 'max-height:180px;max-width:100%;border-radius:8px;object-fit:contain;';
    img.onerror = () => {
      mediaPreview.innerHTML = '<p style="color:#e07b23;padding:12px;font-size:13px;background:#fff8f0;border-radius:8px;"><i class="fas fa-exclamation-triangle"></i> URL invalide ou inaccessible. Vérifiez le lien.</p>';
    };
    mediaPreview.appendChild(img);
  }
}

mediaUrlInput?.addEventListener('blur', () => {
  const type = mediaForm.querySelector('input[name="type_media"]:checked')?.value || 'image';
  updatePreview(mediaUrlInput.value, type);
});
mediaForm?.querySelectorAll('input[name="type_media"]').forEach(r => {
  r.addEventListener('change', () => updatePreview(mediaUrlInput?.value, r.value));
});

/* -- Sauvegarde média -- */
mediaForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('saveMediaBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Enregistrement...</span>';
  btn.disabled = true;

  const urlVal = document.getElementById('mediaUrl').value.trim();
  const titreVal = document.getElementById('mediaTitre').value.trim();

  if (!titreVal) {
    showToast('Le titre est obligatoire.', 'error');
    btn.innerHTML = '<i class="fas fa-save"></i> <span>Enregistrer</span>';
    btn.disabled = false;
    return;
  }
  if (!urlVal) {
    showToast('L\'URL du média est obligatoire.', 'error');
    btn.innerHTML = '<i class="fas fa-save"></i> <span>Enregistrer</span>';
    btn.disabled = false;
    return;
  }

  const payload = {
    titre: titreVal,
    url: urlVal,
    url_media: urlVal,                   // compatibilité galerie.js
    url_miniature: document.getElementById('mediaVignette').value.trim() || urlVal,
    vignette: document.getElementById('mediaVignette').value.trim() || urlVal,
    categorie: document.getElementById('mediaCat').value,
    pays: document.getElementById('mediaPays').value,
    description: document.getElementById('mediaDesc').value.trim(),
    type_media: mediaForm.querySelector('input[name="type_media"]:checked')?.value || 'image',
    date_ajout: new Date().toISOString(),
    date_prise: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  };

  try {
    if (editingMediaId) {
      await apiPut('galerie_media', editingMediaId, payload);
      showToast('✅ Média mis à jour avec succès !', 'success');
    } else {
      await apiPost('galerie_media', payload);
      showToast('✅ Média ajouté avec succès !', 'success');
    }
    closeMediaModal();
    await loadMedia();
  } catch (err) {
    console.error('[P3V Admin] Erreur enregistrement média :', err);
    showToast('❌ Erreur : ' + (err.message || 'Impossible d\'enregistrer le média.'), 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> <span>Enregistrer</span>';
    btn.disabled = false;
  }
});

/* -- Supprimer un média -- */
async function deleteMedia(id) {
  if (!confirm('Supprimer ce média définitivement ?')) return;
  try {
    await apiDelete('galerie_media', id);
    showToast('Média supprimé.', 'info');
    await loadMedia();
  } catch (err) {
    console.error('[P3V Admin] Erreur suppression :', err);
    showToast('Erreur lors de la suppression.', 'error');
  }
}

/* -- Rendu carte média admin -- */
function renderMediaCard(item) {
  const isVideo = item.type_media === 'video';
  const thumb = item.vignette || item.url_miniature || item.url || item.url_media || '';
  const safeItem = JSON.stringify(item).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  return `
    <div class="admin-media-card">
      <div class="admin-media-thumb">
        ${isVideo
      ? `<video src="${item.url || item.url_media}" muted preload="metadata" poster="${thumb}" style="width:100%;height:100%;object-fit:cover;"></video>`
      : `<img src="${thumb}" alt="${item.titre || ''}" loading="lazy"
               onerror="this.style.opacity='.3';this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'60\\'%3E%3Crect fill=\\'%23eee\\' width=\\'80\\' height=\\'60\\'/%3E%3C/svg%3E'"
             />`
    }
        <div class="admin-media-type-badge">
          <i class="fas fa-${isVideo ? 'video' : 'image'}"></i>
          ${isVideo ? 'Vidéo' : 'Image'}
        </div>
      </div>
      <div class="admin-media-info">
        <h4 title="${item.titre || ''}">${item.titre || 'Sans titre'}</h4>
        <div class="admin-media-meta">
          ${item.categorie ? `<span class="badge badge-blue">${item.categorie}</span>` : ''}
          ${item.pays ? `<span class="badge badge-green">${item.pays}</span>` : ''}
          ${item.date_prise ? `<span class="badge" style="background:#f1f5fb;color:#64748b">${item.date_prise}</span>` : ''}
        </div>
        <div class="admin-media-actions">
          <button class="btn-edit" onclick='openMediaModal(${JSON.stringify(item).replace(/'/g, "\\'")})'> 
            <i class="fas fa-pen"></i> Modifier
          </button>
          <button class="btn-danger" onclick="deleteMedia('${item.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>`;
}

/* -- Charger médias -- */
async function loadMedia() {
  if (!mediaGrid) return;
  mediaGrid.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
  try {
    const res = await apiGet('galerie_media', 'limit=100&sort=created_at');
    mediaItems = res.data || [];

    // Mise à jour stats
    const el = (id) => document.getElementById(id);
    if (el('totalMedias')) el('totalMedias').textContent = mediaItems.length;
    if (el('totalImages')) el('totalImages').textContent = mediaItems.filter(m => m.type_media !== 'video').length;
    if (el('totalVideos')) el('totalVideos').textContent = mediaItems.filter(m => m.type_media === 'video').length;

    renderFilteredMedia();

    if (IS_LOCAL && mediaItems.length > 0) {
      showToast(`${mediaItems.length} média(s) chargé(s) depuis le stockage local.`, 'info');
    }
  } catch (err) {
    console.error('[P3V Admin] Erreur chargement médias :', err);
    mediaGrid.innerHTML = `
      <div class="admin-loading" style="color:#dc3545;flex-direction:column;gap:12px;">
        <i class="fas fa-exclamation-circle" style="font-size:2rem"></i>
        <strong>Erreur de chargement</strong>
        <p style="font-size:.82rem;color:#666;max-width:320px;text-align:center">
          ${IS_LOCAL
        ? 'Première utilisation : aucune donnée locale. Ajoutez votre premier média !'
        : 'Impossible de charger les médias. Vérifiez votre connexion.'}
        </p>
      </div>`;
    mediaItems = [];
  }
}

function renderFilteredMedia() {
  if (!mediaGrid) return;
  const cat = document.getElementById('filterCat')?.value || '';
  const pays = document.getElementById('filterPays')?.value || '';
  const search = (document.getElementById('searchMedia')?.value || '').toLowerCase();

  const filtered = mediaItems.filter(item => {
    const matchCat = !cat || item.categorie === cat;
    const matchPays = !pays || item.pays === pays;
    const matchSearch = !search || (item.titre || '').toLowerCase().includes(search);
    return matchCat && matchPays && matchSearch;
  });

  if (filtered.length === 0) {
    mediaGrid.innerHTML = `
      <div class="admin-empty" style="grid-column:1/-1;">
        <i class="fas fa-images"></i>
        <h3>Aucun média trouvé</h3>
        <p>Ajoutez votre premier média en cliquant sur "Ajouter un média".</p>
      </div>`;
    return;
  }
  mediaGrid.innerHTML = filtered.map(item => renderMediaCard(item)).join('');
}

/* Filtres */
['filterCat', 'filterPays', 'searchMedia'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', renderFilteredMedia);
  document.getElementById(id)?.addEventListener('change', renderFilteredMedia);
});

/* ============================================================
   ACTUALITÉS
   ============================================================ */

let actuItems = [];
let editingActuId = null;

const actuModal = document.getElementById('actuModal');
const actuForm = document.getElementById('actuForm');
const actuList = document.getElementById('adminActuList');

/* -- Ouvrir modal -- */
function openActuModal(item = null) {
  editingActuId = item ? item.id : null;
  document.getElementById('actuModalTitle').innerHTML = item
    ? '<i class="fas fa-pen"></i> Modifier l\'actualité'
    : '<i class="fas fa-pen"></i> Nouvelle actualité';

  actuForm.reset();

  if (item) {
    document.getElementById('actuId').value = item.id || '';
    document.getElementById('actuTitre').value = item.titre || '';
    document.getElementById('actuCat').value = item.categorie || '';
    document.getElementById('actuPays').value = item.pays || '';
    document.getElementById('actuDate').value = item.date_publication
      ? (item.date_publication.includes('T') ? item.date_publication.split('T')[0] : '')
      : '';
    document.getElementById('actuAuteur').value = item.auteur || '';
    document.getElementById('actuImage').value = item.image_url || '';
    document.getElementById('actuResume').value = item.resume || '';
    document.getElementById('actuContenu').value = item.contenu || '';
  }

  actuModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/* -- Fermer modal -- */
function closeActuModal() {
  actuModal.classList.remove('active');
  document.body.style.overflow = '';
  editingActuId = null;
}

document.getElementById('openActuModal')?.addEventListener('click', () => openActuModal());
document.getElementById('closeActuModal')?.addEventListener('click', closeActuModal);
document.getElementById('cancelActuBtn')?.addEventListener('click', closeActuModal);
actuModal?.addEventListener('click', e => { if (e.target === actuModal) closeActuModal(); });

/* -- Sauvegarde actualité -- */
actuForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('saveActuBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Publication...</span>';
  btn.disabled = true;

  const titre = document.getElementById('actuTitre').value.trim();
  if (!titre) {
    showToast('Le titre est obligatoire.', 'error');
    btn.innerHTML = '<i class="fas fa-save"></i> <span>Publier</span>';
    btn.disabled = false;
    return;
  }

  const payload = {
    titre,
    categorie: document.getElementById('actuCat').value || 'Actualité',
    pays: document.getElementById('actuPays').value || '',
    date_publication: document.getElementById('actuDate').value
      ? new Date(document.getElementById('actuDate').value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    auteur: document.getElementById('actuAuteur').value.trim() || 'Équipe P3V',
    image_url: document.getElementById('actuImage').value.trim() || '',
    resume: document.getElementById('actuResume').value.trim() || '',
    contenu: document.getElementById('actuContenu').value.trim() || ''
  };

  try {
    if (editingActuId) {
      await apiPut('actualites', editingActuId, payload);
      showToast('✅ Actualité mise à jour !', 'success');
    } else {
      await apiPost('actualites', payload);
      showToast('✅ Actualité publiée avec succès !', 'success');
    }
    closeActuModal();
    await loadActualites();
  } catch (err) {
    console.error('[P3V Admin] Erreur publication actualité :', err);
    showToast('❌ Erreur : ' + (err.message || 'Impossible de publier l\'actualité.'), 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> <span>Publier</span>';
    btn.disabled = false;
  }
});

/* -- Supprimer actualité -- */
async function deleteActu(id) {
  if (!confirm('Supprimer cette actualité ?')) return;
  try {
    await apiDelete('actualites', id);
    showToast('Actualité supprimée.', 'info');
    await loadActualites();
  } catch (err) {
    console.error('[P3V Admin] Erreur suppression actu :', err);
    showToast('Erreur lors de la suppression.', 'error');
  }
}

/* -- Rendu carte actualité admin -- */
const catColors = {
  'Actualité': '#003f87', 'Formation': '#003f87', 'Événement': '#e07b23',
  'Terrain': '#00879E', 'Publication': '#2d9b4e', 'Rapport': '#1a8a7a',
  'Partenariat': '#C0392B'
};

function renderActuCard(item) {
  const color = catColors[item.categorie] || '#00529b';
  const dateStr = item.date_publication || '';
  return `
    <div class="admin-actu-card">
      ${item.image_url
      ? `<div class="admin-actu-img"><img src="${item.image_url}" alt="${item.titre || ''}" loading="lazy"
             onerror="this.style.opacity='.3'" /></div>`
      : `<div class="admin-actu-img-placeholder"><i class="fas fa-newspaper"></i></div>`
    }
      <div class="admin-actu-body">
        <div class="admin-actu-meta">
          <span class="badge" style="background:${color}18;color:${color};">${item.categorie || 'Actualité'}</span>
          ${item.pays ? `<span class="badge badge-green">${item.pays}</span>` : ''}
          ${dateStr ? `<span style="font-size:12px;color:#64748b;"><i class="fas fa-calendar" style="margin-right:4px;color:#00879E"></i>${dateStr}</span>` : ''}
          ${item.auteur ? `<span style="font-size:12px;color:#64748b;"><i class="fas fa-user" style="margin-right:4px;color:#00879E"></i>${item.auteur}</span>` : ''}
        </div>
        <h3>${item.titre || 'Sans titre'}</h3>
        <p>${(item.resume || item.contenu || '').substring(0, 120)}${(item.resume || '').length > 120 ? '…' : ''}</p>
      </div>
      <div class="admin-actu-actions">
        <button class="btn-edit" data-id="${item.id}" onclick="editActu('${item.id}')">
          <i class="fas fa-pen"></i>
        </button>
        <button class="btn-danger" onclick="deleteActu('${item.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`;
}

/* -- Helper edit actualité (évite les JSON inline complexes) -- */
window.editActu = function (id) {
  const item = actuItems.find(a => a.id === id);
  if (item) openActuModal(item);
};

/* -- Charger actualités -- */
async function loadActualites() {
  if (!actuList) return;
  actuList.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
  try {
    const res = await apiGet('actualites', 'limit=100&sort=created_at');
    actuItems = res.data || [];

    if (actuItems.length === 0) {
      actuList.innerHTML = `
        <div class="admin-empty">
          <i class="fas fa-newspaper"></i>
          <h3>Aucune actualité</h3>
          <p>Publiez votre première actualité du projet P3V.</p>
        </div>`;
      return;
    }
    actuList.innerHTML = actuItems.map(a => renderActuCard(a)).join('');
  } catch (err) {
    console.error('[P3V Admin] Erreur chargement actualités :', err);
    actuList.innerHTML = `
      <div class="admin-loading" style="color:#dc3545;flex-direction:column;gap:12px;">
        <i class="fas fa-exclamation-circle" style="font-size:2rem"></i>
        <strong>Erreur de chargement</strong>
        <p style="font-size:.82rem;color:#666;text-align:center;max-width:300px">
          ${IS_LOCAL
        ? 'Première utilisation : aucune donnée locale. Publiez votre première actualité !'
        : 'Impossible de charger. Vérifiez votre connexion.'}
        </p>
      </div>`;
    actuItems = [];
  }
}

/* ============================================================
   INITIALISATION
   ============================================================ */
(async () => {
  // Afficher la bannière si mode local
  showLocalBanner();

  // Charger les données
  await Promise.all([loadMedia(), loadActualites()]);
})();

/* Expose les fonctions pour les boutons inline */
window.openMediaModal = openMediaModal;
window.deleteMedia = deleteMedia;
window.openActuModal = openActuModal;
window.deleteActu = deleteActu;
