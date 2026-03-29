/* =====================================================
   PROJET P3V – admin.js
   Gestion complète : Galerie & Actualités
   ===================================================== */

'use strict';

/* ============================================================
   DÉTECTION DU BACKEND DISPONIBLE
   ─────────────────────────────────────────────────────────────
   L'API REST `tables/` n'est disponible QUE sur la plateforme
   Genspark (domaine genspark.ai ou sandbox genspark).
   Sur Netlify, GitHub Pages, ou en local file://, on utilise
   localStorage comme base de données côté navigateur.
   ============================================================ */

/* ── Détection de l'environnement ──────────────────────────────
   L'API tables/ est disponible UNIQUEMENT sur la plateforme Genspark.
   On la détecte de façon fiable : domaine genspark.ai ou preview
   genspark interne. Sur Netlify, GitHub Pages, file://, localhost
   ou tout autre hébergeur → localStorage.
   ─────────────────────────────────────────────────────────────── */
const IS_GENSPARK = (
  window.location.hostname.endsWith('genspark.ai') ||
  window.location.hostname.endsWith('genspark.site') ||
  window.location.hostname.includes('.genspark.')
);

const IS_FILE   = window.location.protocol === 'file:';
const USE_API   = IS_GENSPARK;          // true → API REST Genspark
const USE_LS    = !USE_API;             // true → localStorage (Netlify, local, etc.)

/* Clés localStorage */
const LS_MEDIA = 'p3v_galerie_media';
const LS_ACTUS = 'p3v_actualites';

/* ============================================================
   UTILITAIRES LOCAUX
   ============================================================ */

/** Génère un UUID v4 */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/** Lit un tableau depuis localStorage */
function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

/** Écrit un tableau dans localStorage */
function lsSet(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}

/** Résout la clé LS selon la table */
function lsKey(table) {
  if (table === 'galerie_media') return LS_MEDIA;
  if (table === 'actualites')    return LS_ACTUS;
  return 'p3v_' + table;
}

/* ============================================================
   COUCHE API ABSTRAITE
   Même interface quel que soit le backend.
   ============================================================ */

async function apiGet(table, params = '') {
  if (USE_LS) {
    const data = lsGet(lsKey(table));
    return { data, total: data.length };
  }
  const res = await fetch(`tables/${table}?${params}`);
  if (!res.ok) throw new Error(`GET ${table} failed (${res.status})`);
  return res.json();
}

async function apiPost(table, data) {
  if (USE_LS) {
    const items = lsGet(lsKey(table));
    const newItem = { ...data, id: uuid(), created_at: Date.now(), updated_at: Date.now() };
    items.unshift(newItem);
    lsSet(lsKey(table), items);
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

async function apiPut(table, id, data) {
  if (USE_LS) {
    const items = lsGet(lsKey(table));
    const idx   = items.findIndex(i => i.id === id);
    if (idx < 0) throw new Error('Item not found: ' + id);
    items[idx] = { ...items[idx], ...data, updated_at: Date.now() };
    lsSet(lsKey(table), items);
    return items[idx];
  }
  const res = await fetch(`tables/${table}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PUT ${table}/${id} failed (${res.status})`);
  return res.json();
}

async function apiDelete(table, id) {
  if (USE_LS) {
    const items = lsGet(lsKey(table)).filter(i => i.id !== id);
    lsSet(lsKey(table), items);
    return;
  }
  const res = await fetch(`tables/${table}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${table}/${id} failed (${res.status})`);
}

/* ============================================================
   BANNIÈRE INFO MODE STOCKAGE
   ============================================================ */
function showStorageBanner() {
  if (USE_API) return; // Pas de bannière sur Genspark

  const banner = document.createElement('div');
  banner.id = 'storageBanner';
  banner.style.cssText = `
    background:linear-gradient(135deg,#003F87,#00879E);
    color:#fff; padding:10px 20px; font-size:.82rem;
    display:flex; align-items:center; justify-content:space-between;
    gap:12px; flex-wrap:wrap; position:relative; z-index:9999;
  `;
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex:1">
      <i class="fas fa-database" style="font-size:1.1rem;flex-shrink:0"></i>
      <div>
        <strong>Stockage local activé</strong> —
        Les données (médias et actualités) sont enregistrées dans le navigateur
        sur cet appareil. Elles seront visibles dans la galerie et les actualités
        du site après rechargement.
        ${IS_FILE ? ' <em style="opacity:.75">(mode fichier local détecté)</em>' : ''}
      </div>
    </div>
    <button onclick="this.closest('#storageBanner').remove()"
      style="background:rgba(255,255,255,.18);border:none;color:#fff;padding:5px 12px;
             border-radius:6px;cursor:pointer;font-size:.8rem;flex-shrink:0">
      <i class="fas fa-times"></i>
    </button>
  `;
  const main = document.querySelector('.admin-main') || document.body.firstElementChild;
  if (main) main.insertAdjacentElement('beforebegin', banner);
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  const icons = {
    success: 'fas fa-check-circle',
    error:   'fas fa-exclamation-circle',
    info:    'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle'
  };
  t.innerHTML = `<i class="${icons[type] || icons.info}"></i> ${msg}`;
  t.className = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 4500);
}

/* ============================================================
   TABS NAVIGATION
   ============================================================ */
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
   ██████  GALERIE MÉDIA
   ============================================================ */
let mediaItems    = [];
let editingMediaId = null;

const mediaModal    = document.getElementById('mediaModal');
const mediaForm     = document.getElementById('mediaForm');
const mediaGrid     = document.getElementById('adminMediaGrid');
const mediaUrlInput = document.getElementById('mediaUrl');
const mediaPreview  = document.getElementById('mediaPreview');

/* ── Ouvrir modal ── */
function openMediaModal(item = null) {
  editingMediaId = item ? item.id : null;

  document.getElementById('mediaModalTitle').innerHTML = item
    ? '<i class="fas fa-edit"></i> Modifier le média'
    : '<i class="fas fa-plus-circle"></i> Ajouter un média';

  mediaForm.reset();
  if (mediaPreview) mediaPreview.innerHTML = '';

  if (item) {
    setValue('mediaId',       item.id         || '');
    setValue('mediaTitre',    item.titre       || '');
    setValue('mediaUrl',      item.url         || item.url_media || '');
    setValue('mediaVignette', item.vignette    || item.url_miniature || '');
    setValue('mediaCat',      item.categorie   || '');
    setValue('mediaPays',     item.pays        || '');
    setValue('mediaDesc',     item.description || '');
    const radio = mediaForm.querySelector(`input[value="${item.type_media}"]`);
    if (radio) radio.checked = true;
    updatePreview(item.url || item.url_media, item.type_media);
  }

  mediaModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/* ── Fermer modal ── */
function closeMediaModal() {
  mediaModal.classList.remove('active');
  document.body.style.overflow = '';
  editingMediaId = null;
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
function getValue(id) {
  return (document.getElementById(id)?.value || '').trim();
}

/* ── Événements modal ── */
document.getElementById('openMediaModal')  ?.addEventListener('click', () => openMediaModal());
document.getElementById('closeMediaModal') ?.addEventListener('click', closeMediaModal);
document.getElementById('cancelMediaBtn')  ?.addEventListener('click', closeMediaModal);
mediaModal?.addEventListener('click', e => { if (e.target === mediaModal) closeMediaModal(); });

/* ── Prévisualisation ── */
function updatePreview(url, type) {
  if (!url || !mediaPreview) return;
  mediaPreview.innerHTML = '';
  if (type === 'video') {
    mediaPreview.innerHTML = `<video src="${url}" controls muted style="max-height:190px;max-width:100%;border-radius:8px;"></video>`;
  } else {
    const img = document.createElement('img');
    img.src   = url;
    img.alt   = 'Aperçu';
    img.style.cssText = 'max-height:190px;max-width:100%;border-radius:8px;object-fit:contain;';
    img.onerror = () => {
      mediaPreview.innerHTML = `
        <div style="padding:14px;background:#fff8f0;border-radius:8px;color:#c85a00;font-size:.82rem;border:1px solid #fcd9b0;">
          <i class="fas fa-exclamation-triangle"></i>
          URL inaccessible ou invalide — vérifiez le lien.
        </div>`;
    };
    mediaPreview.appendChild(img);
  }
}

mediaUrlInput?.addEventListener('blur', () => {
  const type = mediaForm.querySelector('input[name="type_media"]:checked')?.value || 'image';
  updatePreview(mediaUrlInput.value, type);
});
mediaForm?.querySelectorAll('input[name="type_media"]').forEach(r =>
  r.addEventListener('change', () => updatePreview(mediaUrlInput?.value, r.value))
);

/* ── Soumettre formulaire média ── */
mediaForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn    = document.getElementById('saveMediaBtn');
  const titre  = getValue('mediaTitre');
  const url    = getValue('mediaUrl');

  /* Validation */
  if (!titre) { showToast('Le titre est obligatoire.', 'error'); return; }
  if (!url)   { showToast("L'URL du média est obligatoire.", 'error'); return; }

  /* Vérifier que l'URL est valide */
  try { new URL(url); } catch {
    showToast("L'URL saisie n'est pas valide (doit commencer par https://).", 'error');
    return;
  }

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement…';
  btn.disabled  = true;

  const vignette  = getValue('mediaVignette') || url;
  const typeMedia = mediaForm.querySelector('input[name="type_media"]:checked')?.value || 'image';

  const payload = {
    titre,
    url,
    url_media:      url,
    url_miniature:  vignette,
    vignette,
    categorie:      getValue('mediaCat')  || 'Terrain',
    pays:           getValue('mediaPays') || '',
    description:    getValue('mediaDesc') || '',
    type_media:     typeMedia,
    date_ajout:     new Date().toISOString(),
    date_prise:     new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
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
    console.error('[P3V] Erreur enregistrement média :', err);
    showToast('❌ ' + (err.message || "Impossible d'enregistrer. Veuillez réessayer."), 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    btn.disabled  = false;
  }
});

/* ── Supprimer un média ── */
async function deleteMedia(id) {
  if (!confirm('Supprimer ce média définitivement ?')) return;
  try {
    await apiDelete('galerie_media', id);
    showToast('Média supprimé.', 'info');
    await loadMedia();
  } catch (err) {
    console.error('[P3V] Erreur suppression média :', err);
    showToast('Erreur lors de la suppression.', 'error');
  }
}

/* ── Rendu d'une carte média ── */
function renderMediaCard(item) {
  const isVideo = item.type_media === 'video';
  const thumb   = item.vignette || item.url_miniature || item.url || item.url_media || '';
  const src     = item.url || item.url_media || '';
  const BLANK   = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='160'%3E%3Crect fill='%23eee' width='220' height='160'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%23aaa' dominant-baseline='middle' text-anchor='middle'%3EImage%3C/text%3E%3C/svg%3E";

  return `
    <div class="admin-media-card">
      <div class="admin-media-thumb">
        ${isVideo
          ? `<video src="${src}" muted preload="metadata" poster="${thumb}"
               style="width:100%;height:100%;object-fit:cover;"></video>`
          : `<img src="${thumb}" alt="${item.titre || ''}" loading="lazy"
               onerror="this.src='${BLANK}';this.style.opacity='.5'"/>`
        }
        <div class="admin-media-type-badge">
          <i class="fas fa-${isVideo ? 'video' : 'image'}"></i>
          ${isVideo ? 'Vidéo' : 'Image'}
        </div>
      </div>
      <div class="admin-media-info">
        <h4 title="${item.titre || ''}">${item.titre || 'Sans titre'}</h4>
        <div class="admin-media-meta">
          ${item.categorie ? `<span class="badge badge-blue">${item.categorie}</span>`            : ''}
          ${item.pays      ? `<span class="badge badge-green">${item.pays}</span>`                : ''}
          ${item.date_prise? `<span class="badge" style="background:#f1f5fb;color:#64748b">${item.date_prise}</span>` : ''}
        </div>
        <div class="admin-media-actions">
          <button class="btn-edit" onclick="editMedia('${item.id}')">
            <i class="fas fa-pen"></i> Modifier
          </button>
          <button class="btn-danger" onclick="deleteMedia('${item.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>`;
}

/* Helper edit (évite JSON inline dangereux) */
window.editMedia = function(id) {
  const item = mediaItems.find(m => m.id === id);
  if (item) openMediaModal(item);
};

/* ── Charger tous les médias ── */
async function loadMedia() {
  if (!mediaGrid) return;
  mediaGrid.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Chargement…</div>';

  try {
    const res  = await apiGet('galerie_media', 'limit=200');
    mediaItems = res.data || [];

    const el = id => document.getElementById(id);
    if (el('totalMedias')) el('totalMedias').textContent = mediaItems.length;
    if (el('totalImages'))  el('totalImages').textContent  = mediaItems.filter(m => m.type_media !== 'video').length;
    if (el('totalVideos'))  el('totalVideos').textContent  = mediaItems.filter(m => m.type_media === 'video').length;

    renderFilteredMedia();
  } catch (err) {
    console.error('[P3V] Erreur chargement médias :', err);
    mediaGrid.innerHTML = `
      <div class="admin-loading" style="flex-direction:column;gap:12px;color:#dc3545;">
        <i class="fas fa-exclamation-circle" style="font-size:2.2rem"></i>
        <strong>Impossible de charger les médias</strong>
        <p style="font-size:.82rem;color:#888;text-align:center;max-width:300px">
          Ajoutez votre premier média en cliquant sur "Ajouter un média".
        </p>
      </div>`;
    mediaItems = [];
  }
}

/* ── Filtrage ── */
function renderFilteredMedia() {
  if (!mediaGrid) return;
  const cat    = document.getElementById('filterCat')   ?.value.toLowerCase() || '';
  const pays   = document.getElementById('filterPays')  ?.value.toLowerCase() || '';
  const search = (document.getElementById('searchMedia')?.value || '').toLowerCase();

  const filtered = mediaItems.filter(item => {
    const matchCat    = !cat    || (item.categorie||'').toLowerCase() === cat;
    const matchPays   = !pays   || (item.pays||'').toLowerCase()      === pays;
    const matchSearch = !search || (item.titre||'').toLowerCase().includes(search);
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
  mediaGrid.innerHTML = filtered.map(renderMediaCard).join('');
}

['filterCat','filterPays','searchMedia'].forEach(id => {
  document.getElementById(id)?.addEventListener('input',  renderFilteredMedia);
  document.getElementById(id)?.addEventListener('change', renderFilteredMedia);
});

/* ============================================================
   ███  ACTUALITÉS
   ============================================================ */
let actuItems    = [];
let editingActuId = null;

const actuModal = document.getElementById('actuModal');
const actuForm  = document.getElementById('actuForm');
const actuList  = document.getElementById('adminActuList');

/* ── Ouvrir modal ── */
function openActuModal(item = null) {
  editingActuId = item ? item.id : null;

  document.getElementById('actuModalTitle').innerHTML = item
    ? '<i class="fas fa-pen"></i> Modifier l\'actualité'
    : '<i class="fas fa-pen"></i> Nouvelle actualité';

  actuForm.reset();

  if (item) {
    setValue('actuId',      item.id              || '');
    setValue('actuTitre',   item.titre           || '');
    setValue('actuCat',     item.categorie       || '');
    setValue('actuPays',    item.pays            || '');
    setValue('actuAuteur',  item.auteur          || '');
    setValue('actuImage',   item.image_url       || '');
    setValue('actuResume',  item.resume          || '');
    setValue('actuContenu', item.contenu         || '');
    /* date : on garde la chaîne brute si déjà localisée */
    const raw = item.date_publication || '';
    const dateEl = document.getElementById('actuDate');
    if (dateEl) {
      if (raw.match(/^\d{4}-\d{2}-\d{2}/)) dateEl.value = raw.split('T')[0];
      else dateEl.value = '';
    }
  }

  actuModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/* ── Fermer modal ── */
function closeActuModal() {
  actuModal.classList.remove('active');
  document.body.style.overflow = '';
  editingActuId = null;
}

document.getElementById('openActuModal')  ?.addEventListener('click', () => openActuModal());
document.getElementById('closeActuModal') ?.addEventListener('click', closeActuModal);
document.getElementById('cancelActuBtn')  ?.addEventListener('click', closeActuModal);
actuModal?.addEventListener('click', e => { if (e.target === actuModal) closeActuModal(); });

/* ── Soumettre actualité ── */
actuForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn   = document.getElementById('saveActuBtn');
  const titre = getValue('actuTitre');
  if (!titre) { showToast('Le titre est obligatoire.', 'error'); return; }

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication…';
  btn.disabled  = true;

  /* Formater la date lisible */
  const rawDate    = getValue('actuDate');
  let dateAffichee = '';
  if (rawDate) {
    try { dateAffichee = new Date(rawDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { dateAffichee = rawDate; }
  } else {
    dateAffichee = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const payload = {
    titre,
    categorie:        getValue('actuCat')     || 'Actualité',
    pays:             getValue('actuPays')    || '',
    date_publication: dateAffichee,
    auteur:           getValue('actuAuteur')  || 'Équipe P3V',
    image_url:        getValue('actuImage')   || '',
    resume:           getValue('actuResume')  || '',
    contenu:          getValue('actuContenu') || ''
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
    console.error('[P3V] Erreur publication actu :', err);
    showToast('❌ ' + (err.message || "Impossible de publier. Réessayez."), 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> Publier';
    btn.disabled  = false;
  }
});

/* ── Supprimer une actualité ── */
async function deleteActu(id) {
  if (!confirm('Supprimer cette actualité définitivement ?')) return;
  try {
    await apiDelete('actualites', id);
    showToast('Actualité supprimée.', 'info');
    await loadActualites();
  } catch (err) {
    console.error('[P3V] Erreur suppression actu :', err);
    showToast('Erreur lors de la suppression.', 'error');
  }
}

/* ── Rendu carte actualité ── */
const CAT_COLORS = {
  'Actualité':'#003f87','Formation':'#003f87','Événement':'#e07b23',
  'Terrain':'#00879E','Publication':'#2d9b4e','Rapport':'#1a8a7a','Partenariat':'#C0392B'
};

function renderActuCard(item) {
  const color = CAT_COLORS[item.categorie] || '#003f87';
  return `
    <div class="admin-actu-card">
      ${item.image_url
        ? `<div class="admin-actu-img">
             <img src="${item.image_url}" alt="${item.titre||''}" loading="lazy"
               onerror="this.style.opacity='.3'"/>
           </div>`
        : `<div class="admin-actu-img-placeholder"><i class="fas fa-newspaper"></i></div>`
      }
      <div class="admin-actu-body">
        <div class="admin-actu-meta">
          <span class="badge" style="background:${color}18;color:${color};">${item.categorie||'Actualité'}</span>
          ${item.pays         ? `<span class="badge badge-green">${item.pays}</span>` : ''}
          ${item.date_publication ? `<span style="font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px"><i class="fas fa-calendar" style="color:#00879E"></i>${item.date_publication}</span>` : ''}
          ${item.auteur       ? `<span style="font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px"><i class="fas fa-user" style="color:#00879E"></i>${item.auteur}</span>` : ''}
        </div>
        <h3>${item.titre||'Sans titre'}</h3>
        <p>${(item.resume||item.contenu||'').substring(0,120)}…</p>
      </div>
      <div class="admin-actu-actions">
        <button class="btn-edit" onclick="editActu('${item.id}')">
          <i class="fas fa-pen"></i>
        </button>
        <button class="btn-danger" onclick="deleteActu('${item.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`;
}

/* Helper edit (évite le JSON inline dangereux) */
window.editActu = function(id) {
  const item = actuItems.find(a => a.id === id);
  if (item) openActuModal(item);
};

/* ── Charger les actualités ── */
async function loadActualites() {
  if (!actuList) return;
  actuList.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Chargement…</div>';

  try {
    const res = await apiGet('actualites', 'limit=100');
    actuItems = res.data || [];

    if (actuItems.length === 0) {
      actuList.innerHTML = `
        <div class="admin-empty">
          <i class="fas fa-newspaper"></i>
          <h3>Aucune actualité</h3>
          <p>Publiez la première actualité du projet P3V.</p>
        </div>`;
      return;
    }
    actuList.innerHTML = actuItems.map(renderActuCard).join('');
  } catch (err) {
    console.error('[P3V] Erreur chargement actualités :', err);
    actuList.innerHTML = `
      <div class="admin-loading" style="flex-direction:column;gap:12px;color:#dc3545;">
        <i class="fas fa-exclamation-circle" style="font-size:2.2rem"></i>
        <strong>Erreur de chargement</strong>
        <p style="font-size:.82rem;color:#888;text-align:center;max-width:300px">
          Publiez votre première actualité en cliquant sur "Nouvelle actualité".
        </p>
      </div>`;
    actuItems = [];
  }
}

/* ============================================================
   INITIALISATION
   ============================================================ */
(async () => {
  showStorageBanner();
  await Promise.all([loadMedia(), loadActualites()]);
})();

/* ── Expositions globales ── */
window.openMediaModal = openMediaModal;
window.deleteMedia    = deleteMedia;
window.openActuModal  = openActuModal;
window.deleteActu     = deleteActu;
